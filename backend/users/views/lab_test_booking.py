# backend\users\views\lab_test_booking.py
import json
import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response

from users.services.profile_service import PatientProfileService
from users.middleware.exceptions import (
    NotFoundException,
    PermissionException,
    ValidationException,
)
from users.models import UserRole
from users.services.lab_booking_service import LabBookingService
import users.database_queries.lab_booking_queries as bq

from ..serializers.lab_booking_serializers import (
    BookingDetailSerializer,
    CancelBookingSerializer,
    CompleteBookingSerializer,
    CreateBookingSerializer,
    LabReportSerializer,
    LabSlotSerializer,
)

logger = logging.getLogger(__name__)


def _ensure_patient(user) -> None:
    if getattr(user, "role", None) != UserRole.PATIENT:
        raise PermissionException("Only patients can perform this action.")


def _ensure_lab_or_admin(user) -> None:
    if getattr(user, "role", None) not in (
        UserRole.LAB,
        UserRole.ADMIN,
        UserRole.SUPERADMIN,
    ):
        raise PermissionException("Lab or Admin role required.")

class LabBookingListCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CreateBookingSerializer

    def get(self, request):
        _ensure_patient(request.user)

        bookings = bq.list_patient_bookings(str(request.user.user_id))

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(bookings, many=True).data,
                "total_count": len(bookings),
            }
        )

    def post(self, request):
        _ensure_patient(request.user)
        print("\n\nReceived booking request:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking = LabBookingService.create_booking(
            patient_user_id=str(request.user.user_id),
            validated_data=serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(booking).data,
                "message": "Lab test booked successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LabBookingDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        booking = bq.get_lab_booking(str(booking_id))
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        role = getattr(request.user, "role", None)
        if role == UserRole.PATIENT:
            if str(booking["patient_id"]) != str(request.user.user_id):
                raise PermissionException(
                    "You are not authorised to view this booking."
                )

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(booking).data,
            }
        )


class LabBookingCancelView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CancelBookingSerializer

    def post(self, request, booking_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking = LabBookingService.cancel_booking(
            booking_id=str(booking_id),
            requesting_user_id=str(request.user.user_id),
            requesting_user_role=getattr(request.user, "role", None),
            cancellation_reason=serializer.validated_data.get("cancellation_reason"),
        )

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(booking).data,
                "message": "Booking cancelled successfully.",
            }
        )


class LabBookingCompleteView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CompleteBookingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, booking_id):
        _ensure_lab_or_admin(request.user)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking, _report = LabBookingService.complete_booking_with_report(
            booking_id=str(booking_id),
            uploaded_by=str(request.user.user_id),
            report_file=serializer.validated_data.get("report_file"),
            report_type=serializer.validated_data.get("report_type", "pdf"),
            result_notes=serializer.validated_data.get("result_notes"),
            parameter_results=serializer.validated_data.get("parameter_results"),
        )

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(booking).data,
                "message": "Booking marked as completed and report uploaded.",
            }
        )


class LabOwnBookingsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _ensure_lab_or_admin(request.user)

        bookings = bq.list_lab_bookings(str(request.user.user_id))
        for b in bookings:
            patient = PatientProfileService.get_patient_profile(b["patient_id"])
            b["patient"] = patient

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(bookings, many=True).data,
                "total_count": len(bookings),
            }
        )

class LabBookingReportListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabReportSerializer

    def get(self, request, booking_id):
        booking = bq.get_lab_booking(str(booking_id))
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        role = getattr(request.user, "role", None)
        if role == UserRole.PATIENT:
            if str(booking["patient_id"]) != str(request.user.user_id):
                raise PermissionException(
                    "You are not authorised to view reports for this booking."
                )

        reports = bq.get_booking_reports(str(booking_id))

        return Response(
            {
                "success": True,
                "data": LabReportSerializer(reports, many=True).data,
            }
        )

    def post(self, request, booking_id):
        _ensure_lab_or_admin(request.user)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = LabBookingService.upload_report(
            booking_id=str(booking_id),
            report_file_url=serializer.validated_data["report_file_url"],
            report_type=serializer.validated_data.get("report_type", "pdf"),
            result_notes=serializer.validated_data.get("result_notes"),
            uploaded_by=str(request.user.user_id),
        )

        return Response(
            {
                "success": True,
                "data": LabReportSerializer(report).data,
                "message": "Report uploaded successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LabSlotListView(generics.GenericAPIView):

    authentication_classes = []
    permission_classes = []
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        lab_id = request.query_params.get("lab_id")
        date = request.query_params.get("date")
        print(f"\n\nFetching slots for lab_id={lab_id} on date={date}")

        if not lab_id:
            raise ValidationException("lab_id is required.")

        slots = LabBookingService.get_available_slots(lab_id, date)
        return Response(
            {"success": True, "data": LabSlotSerializer(slots, many=True).data}
        )


class LabSlotGenerateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != UserRole.LAB:
            raise PermissionException("Only labs can generate their slots.")

        days = int(request.data.get("days", 30))
        print(
            f"\n\nGenerating slots for lab {request.user.user_id} for next {days} days"
        )

        try:
            count = LabBookingService.generate_slots_for_lab(
                str(request.user.user_id), days=days
            )
            return Response(
                {
                    "success": True,
                    "data": {"slots_created": count},
                    "message": f"Successfully generated {count} slots.",
                }
            )
        except ValueError as e:
            return Response({"success": False, "message": str(e)}, status=400)
        except Exception as e:
            logger.error(
                "Error generating slots for lab %s: %s", request.user.user_id, str(e)
            )
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred while generating slots.",
                },
                status=500,
            )