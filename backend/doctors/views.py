# backend/doctors/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.exceptions import (
    PermissionException,
    NotFoundException,
    ValidationException,
)
from users.models import UserRole
from users.services.registration_service import RegistrationService
from users.services.image_process import get_image_path
from .serializers import (
    DoctorRegistrationSerializer,
    DoctorProfileSerializer,
    DoctorProfileUpdateSerializer,
    DoctorListSerializer,
    BookAppointmentSerializer,
    DoctorAppointmentSerializer,
    AppointmentSlotSerializer,
)
from .services import ProfileService, AppointmentService
import db.doctor_queries as dq


def _ok(data=None, message="Success", http_status=status.HTTP_200_OK):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)


class DoctorRegistrationView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = DoctorRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(
            serializer.validated_data,
            request,
            name="doctors",
            image_key="profile_image",
        )

        user, email_sent = RegistrationService.register_doctor(
            serializer.validated_data, request=request, image_path=image_path
        )

        message = (
            "Doctor registered successfully. Account pending verification. Please check your email."
            if email_sent
            else "Doctor registered successfully. Account pending verification. Verification email could not be sent."
        )

        return Response(
            {
                "success": True,
                "message": message,
                "data": {"user": user},
                "email_verification_sent": email_sent,
            },
            status=status.HTTP_201_CREATED,
        )


class DoctorProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _get_doctor(self, request):
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            raise PermissionException("Access denied. Doctor role required.")
        doctor = ProfileService.get_doctor_profile(request.user)
        if not doctor:
            raise NotFoundException("Doctor profile not found.")
        return doctor

    def get(self, request, *args, **kwargs):
        doctor = self._get_doctor(request)
        return _ok(doctor)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        doctor = self._get_doctor(request)

        serializer = DoctorProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"doctor_id": str(request.user.user_id)},
        )
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(
            request.data, request, name="doctors", image_key="profile_image"
        )
        if image_path:
            serializer.validated_data["profile_image"] = image_path

        updated_data = ProfileService.update_doctor_profile(
            doctor, serializer, request=request
        )
        return _ok(updated_data, message="Profile updated successfully.")


class DoctorListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None
    serializer_class = DoctorListSerializer

    def get(self, request, *args, **kwargs):
        doctors = dq.get_verified_active_doctors()
        for doc in doctors:
            doc["specializations"] = dq.get_doctor_specializations(
                str(doc["doctor_id"])
            )
        # print(doctors)
        serializer = self.get_serializer(data=doctors, many=True)
        serializer.is_valid(raise_exception=True)
        return _ok(serializer.validated_data)
        # return doctors


class DoctorDetailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id, *args, **kwargs):
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            raise NotFoundException("Doctor not found.")

        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)

        schedule = dq.get_schedule_by_doctor(uid)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        doctor["schedule"] = schedule

        return _ok(DoctorProfileSerializer(doctor).data)


class AvailableSlotsView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id, *args, **kwargs):
        from datetime import date as date_type

        target_date = request.query_params.get("date")
        if target_date:
            try:
                target_date = date_type.fromisoformat(target_date)
            except ValueError:
                raise ValidationException("Invalid date format. Use YYYY-MM-DD.")

        slots = AppointmentService.get_available_slots(user_id, target_date)
        return _ok(AppointmentSlotSerializer(slots, many=True).data)


class GenerateSlotsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            raise PermissionException("Doctor role required.")

        days = int(request.data.get("days", 30))
        count = AppointmentService.generate_slots_for_doctor(
            str(request.user.user_id), days=days
        )
        return _ok({"slots_created": count})


class BookAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookAppointmentSerializer

    def post(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != UserRole.PATIENT:
            raise PermissionException("Only patients can book appointments.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        appointment = AppointmentService.book_appointment(
            patient_user_id=str(request.user.user_id),
            slot_id=serializer.validated_data["slot_id"],
            reason=serializer.validated_data.get("reason", ""),
            appointment_type=serializer.validated_data.get(
                "appointment_type", "in_person"
            ),
        )
        return _ok(
            DoctorAppointmentSerializer(appointment).data,
            message="Appointment booked successfully.",
            http_status=status.HTTP_201_CREATED,
        )


class CancelAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, appointment_id, *args, **kwargs):
        appointment = AppointmentService.cancel_appointment(
            appointment_id=appointment_id,
            cancelled_by_user_id=str(request.user.user_id),
            reason=request.data.get("reason", ""),
        )
        return _ok(
            DoctorAppointmentSerializer(appointment).data,
            message="Appointment cancelled successfully.",
        )


class MyAppointmentsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        role = getattr(request.user, "role", None)
        user_id = str(request.user.user_id)

        if role == UserRole.PATIENT:
            appointments = dq.get_patient_appointments(user_id)
        elif role == UserRole.DOCTOR:
            appointments = dq.get_doctor_appointments(user_id)
        else:
            raise PermissionException("Access denied.")

        return _ok(DoctorAppointmentSerializer(appointments, many=True).data)
