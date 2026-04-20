# backend\users\views\lab_test_booking.py
"""
Views for the lab test booking module.

Design principles:
  - Views are deliberately thin: they validate input, call the service layer,
    and format the response. No business logic lives here.
  - All exceptions bubble up through the custom exception handler
    (`middleware/exceptions.py`) so responses are always consistent JSON.
  - Each view class is documented with its HTTP method, expected input,
    and expected output.
"""

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


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _ensure_patient(user) -> None:
    """Raise PermissionException if the caller is not a PATIENT."""
    if getattr(user, "role", None) != UserRole.PATIENT:
        raise PermissionException("Only patients can perform this action.")


def _ensure_lab_or_admin(user) -> None:
    """Raise PermissionException if the caller is not a LAB or ADMIN."""
    if getattr(user, "role", None) not in (
        UserRole.LAB,
        UserRole.ADMIN,
        UserRole.SUPERADMIN,
    ):
        raise PermissionException("Lab or Admin role required.")


# ─────────────────────────────────────────────────────────────────────────────
#  CREATE / LIST PATIENT BOOKINGS
# ─────────────────────────────────────────────────────────────────────────────


class LabBookingListCreateView(generics.GenericAPIView):
    """
    GET  /labs/bookings/          – patient sees their own bookings.
    POST /labs/bookings/          – patient creates a new booking.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CreateBookingSerializer

    def get(self, request):
        """
        List all bookings for the authenticated patient.

        Input:  JWT token (patient role).
        Output: 200 { success, data: [BookingDetail, ...] }
        """
        _ensure_patient(request.user)

        # Fetch all bookings for this patient — no N+1: single DB call
        bookings = bq.list_patient_bookings(str(request.user.user_id))

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(bookings, many=True).data,
                "total_count": len(bookings),
            }
        )

    def post(self, request):
        """
        Create a new lab test slot booking for the authenticated patient.

        Input:
          {
            "lab_id": "<uuid>",
            "slot_id": <int>,
            "test_id": <int>,
            "collection_type": "lab_visit" | "home",
            "collection_address": { ... },  // required if collection_type="home"
            "notes": "<string>"             // optional
          }

        Output: 201 { success, data: BookingDetail, message }
        """
        _ensure_patient(request.user)
        print("\n\nReceived booking request:", request.data)
        # Step 1: Deserialise and validate input fields
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Step 2-5: Delegate all business logic to the service
        booking = LabBookingService.create_booking(
            patient_user_id=str(request.user.user_id),
            validated_data=serializer.validated_data,
        )

        # Step 6: Return 201 with full detail
        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(booking).data,
                "message": "Lab test booked successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
#  RETRIEVE / CANCEL / COMPLETE A SINGLE BOOKING
# ─────────────────────────────────────────────────────────────────────────────


class LabBookingDetailView(generics.GenericAPIView):
    """
    GET    /labs/bookings/<uuid:booking_id>/          – fetch booking detail.
    DELETE /labs/bookings/<uuid:booking_id>/cancel/   – cancel a booking.
    PATCH  /labs/bookings/<uuid:booking_id>/complete/ – mark as completed.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        """
        Retrieve a single booking by its UUID.

        Access rules:
          - Patient: own bookings only.
          - Lab / Admin: any booking.

        Input:  booking_id (URL param).
        Output: 200 { success, data: BookingDetail }
        """
        booking = bq.get_lab_booking(str(booking_id))
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        # Restrict patient access to their own bookings
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
    """
    POST /labs/bookings/<uuid:booking_id>/cancel/

    Patients cancel their own BOOKED bookings.
    Lab / Admin can cancel any booking (e.g., if slot is unavailable).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CancelBookingSerializer

    def post(self, request, booking_id):
        """
        Cancel a booking.

        Input:
          { "cancellation_reason": "<string>" }  // optional

        Output: 200 { success, data: BookingDetail, message }
        """
        # Validate the optional reason field
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles permission checks, status checks, and the atomic update
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
    """
    POST /labs/bookings/<uuid:booking_id>/complete/

    Marks a booking as COMPLETED. Only lab users or admins may call this.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CompleteBookingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, booking_id):
        """
        Transition a booking from BOOKED to COMPLETED.

        Input:  (no required body fields for this version)
        Output: 200 { success, data: BookingDetail, message }
        """
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


# ─────────────────────────────────────────────────────────────────────────────
#  LAB DASHBOARD – list bookings belonging to a lab
# ─────────────────────────────────────────────────────────────────────────────


class LabOwnBookingsView(generics.GenericAPIView):
    """
    GET /labs/my-bookings/

    Returns all bookings for the authenticated lab user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List all bookings assigned to the authenticated lab.

        Input:  JWT token (LAB role).
        Output: 200 { success, data: [BookingDetail, ...], total_count }
        """
        _ensure_lab_or_admin(request.user)

        bookings = bq.list_lab_bookings(str(request.user.user_id))
        # print(type(bookings))
        # print(f"\n\nBooking :")
        # print(json.dumps(bookings, indent=4, default=str))
        for b in bookings:
            patient = PatientProfileService.get_patient_profile(b["patient_id"])
            b["patient"] = patient
            # print(f"\nBooking : {b}")

        return Response(
            {
                "success": True,
                "data": BookingDetailSerializer(bookings, many=True).data,
                "total_count": len(bookings),
            }
        )
        # return Response(
        #     {
        #         "success": True,
        #         "data": bookings,
        #         "total_count": len(bookings),
        #     }
        # )


# ─────────────────────────────────────────────────────────────────────────────
#  REPORTS
# ─────────────────────────────────────────────────────────────────────────────


class LabBookingReportListView(generics.GenericAPIView):
    """
    GET  /labs/bookings/<uuid:booking_id>/reports/ – list all reports for a booking.
    POST /labs/bookings/<uuid:booking_id>/reports/ – upload a new report.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = LabReportSerializer

    def get(self, request, booking_id):
        """
        Retrieve all reports attached to a booking.

        Access rules:
          - Patient: own bookings only.
          - Lab / Admin: any booking.

        Input:  booking_id (URL param).
        Output: 200 { success, data: [LabReport, ...] }
        """
        # Verify booking exists and check access for patients
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
        """
        Upload a report for a booking.

        Only lab users or admins may upload reports.

        Input:
          {
            "report_file_url": "<string>",
            "report_type": "pdf" | "image" | "csv" | "other",
            "result_notes": "<string>"  // optional
          }

        Output: 201 { success, data: LabReport, message }
        """
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


# ─────────────────────────────────────────────────────────────────────────────
#  SLOTS
# ─────────────────────────────────────────────────────────────────────────────


class LabSlotListView(generics.GenericAPIView):
    """
    GET /labs/slots/

    Fetch all available slots for a lab on a specific date.
    Anyone can view available slots.
    """

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
    """
    POST /labs/slots/generate/

    Generate slots for the authenticated lab.
    """

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
