# backend/users/views/payment_views.py

import hashlib
import hmac
import json

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.middleware.exceptions import PermissionException
from users.models import UserRole
from users.services.success_response import send_success_msg
from users.services.payment_service import PaymentService, _execute

from ..serializers.payment_serializers import (
    CreateOrderSerializer,
    VerifyPaymentSerializer,
    RefundPaymentSerializer,
    PaymentHistoryQuerySerializer,
)


def _ensure_patient(request) -> None:
    if getattr(request.user, "role", None) != UserRole.PATIENT:
        raise PermissionException("Access denied. Patient role required.")


class CreateOrderView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CreateOrderSerializer

    def post(self, request):
        _ensure_patient(request)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_data = PaymentService.create_order(
            serializer.validated_data,
            patient_id=request.user.user_id,
        )
        return send_success_msg(
            order_data,
            message="Order created successfully.",
            http_status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VerifyPaymentSerializer

    def post(self, request):
        _ensure_patient(request)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verified_data = PaymentService.verify_payment(
            serializer.validated_data,
            patient_id=request.user.user_id,
        )
        return send_success_msg(
            verified_data,
            message="Payment verified successfully. Booking confirmed.",
        )


class RefundPaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RefundPaymentSerializer

    def post(self, request):
        _ensure_patient(request)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund_data = PaymentService.refund_payment(
            serializer.validated_data,
            patient_id=request.user.user_id,
        )
        return send_success_msg(
            refund_data,
            message="Refund initiated successfully.",
        )


class PaymentHistoryView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentHistoryQuerySerializer

    def get(self, request):
        _ensure_patient(request)

        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        history = PaymentService.get_payment_history(
            patient_id=request.user.user_id,
            filters=serializer.validated_data,
        )
        return send_success_msg(history)


@method_decorator(csrf_exempt, name="dispatch")
class RazorpayWebhookView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not webhook_secret:
            return Response(
                {"detail": "Webhook secret not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        received_sig = request.headers.get("X-Razorpay-Signature", "")

        digest = hmac.new(
            webhook_secret.encode(),
            request.body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(digest, received_sig):
            return Response(
                {"detail": "Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event = payload.get("event")
        if event == "payment.captured":
            self._handle_captured(payload)
        elif event == "payment.failed":
            self._handle_failed(payload)

        return Response({"status": "ok"})

    def _handle_captured(self, payload):
        p = payload["payload"]["payment"]["entity"]
        order_id = p.get("order_id")
        payment = _execute(
            "SELECT * FROM payments WHERE order_id = %s",
            [order_id],
            fetch="one",
        )
        if not payment or payment["status"] == "SUCCESS":
            return

        _execute(
            """
            UPDATE payments
               SET status         = 'SUCCESS',
                   transaction_id = %s,
                   updated_at     = NOW()
             WHERE order_id = %s
            """,
            [p["id"], order_id],
        )

        if payment["payment_for"] == "APPOINTMENT":
            _execute(
                """
                UPDATE doctor_appointments
                   SET status = 'confirmed', updated_at = NOW()
                 WHERE appointment_id = %s
                """,
                [payment["reference_id"]],
            )
        else:
            _execute(
                """
                UPDATE lab_test_slot_bookings
                   SET booking_status = 'BOOKED', updated_at = NOW()
                 WHERE booking_id = %s
                """,
                [payment["reference_id"]],
            )

    def _handle_failed(self, payload):
        p = payload["payload"]["payment"]["entity"]
        _execute(
            """
            UPDATE payments
               SET status         = 'FAILED',
                   failure_reason = %s,
                   updated_at     = NOW()
             WHERE order_id = %s
            """,
            [p.get("error_description", ""), p.get("order_id")],
        )