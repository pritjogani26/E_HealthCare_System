# backend\users\views\doctor_view.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from users.middleware.exceptions import (
    PermissionException,
    NotFoundException,
    ValidationException,
)
from users.models import UserRole
from users.services.registration_service import RegistrationService
from users.services.image_process import get_image_path
from ..serializers.doctor_serializers import (
    DoctorRegistrationSerializer,
    DoctorProfileSerializer,
    DoctorProfileUpdateSerializer,
    DoctorListSerializer,
    BookAppointmentSerializer,
    DoctorAppointmentSerializer,
    AppointmentSlotSerializer,
)
from ..services.profile_service import DoctorProfileService
from ..services.appointment_service import AppointmentService
from ..database_queries import doctor_queries as dq
from ..services.success_response import send_success_msg


class DoctorRegistrationView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = DoctorRegistrationSerializer

    def post(self, request):
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

        # message = (
        #     "Doctor registered successfully. Account pending verification. Please check your email."
        #     if email_sent
        #     else "Doctor registered successfully. Account pending verification. Verification email could not be sent."
        # )
        message = "Doctor registered successfully. Account pending verification. Please check your email."

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
        doctor = DoctorProfileService.get_doctor_profile(request.user)
        if not doctor:
            raise NotFoundException("Doctor profile not found.")
        return doctor

    def get(self, request):
        doctor = self._get_doctor(request)
        return send_success_msg(doctor)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
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

        updated_data = DoctorProfileService.update_doctor_profile(
            doctor, serializer, request=request
        )
        return send_success_msg(updated_data, message="Profile updated successfully.")


class DoctorListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None
    serializer_class = DoctorListSerializer

    def get(self, request):
        doctors = dq.get_verified_active_doctors()
        for doc in doctors:
            doc["specializations"] = dq.get_doctor_specializations(
                str(doc["doctor_id"])
            )
        serializer = self.get_serializer(data=doctors, many=True)
        serializer.is_valid(raise_exception=True)
        return send_success_msg(serializer.validated_data)


class DoctorDetailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id):
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

        return send_success_msg(DoctorProfileSerializer(doctor).data)


class AvailableSlotsView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        from datetime import date as date_type

        target_date = request.query_params.get("date")
        if target_date:
            try:
                target_date = date_type.fromisoformat(target_date)
            except ValueError:
                raise ValidationException("Invalid date format. Use YYYY-MM-DD.")

        slots = AppointmentService.get_available_slots(user_id, target_date)
        return send_success_msg(AppointmentSlotSerializer(slots, many=True).data)


class GenerateSlotsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            raise PermissionException("Doctor role required.")

        days = int(request.data.get("days", 30))
        count = AppointmentService.generate_slots_for_doctor(
            str(request.user.user_id), days=days
        )
        return send_success_msg({"slots_created": count})


class BookAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookAppointmentSerializer

    def post(self, request):
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

        from users.services.email_service import EmailService
        EmailService.send_doctor_appointment_confirmation(str(request.user.user_id), appointment)

        return send_success_msg(
            DoctorAppointmentSerializer(appointment).data,
            message="Appointment booked successfully.",
            http_status=status.HTTP_201_CREATED,
        )


class CancelAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, appointment_id):
        appointment = AppointmentService.cancel_appointment(
            appointment_id=appointment_id,
            cancelled_by_user_id=str(request.user.user_id),
            reason=request.data.get("reason", ""),
        )

        from users.services.email_service import EmailService
        EmailService.send_doctor_appointment_cancellation(str(appointment["patient_id"]), appointment)

        return send_success_msg(
            DoctorAppointmentSerializer(appointment).data,
            message="Appointment cancelled successfully.",
        )


class MyAppointmentsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, "role", None)
        user_id = str(request.user.user_id)

        if role == UserRole.PATIENT:
            appointments = dq.get_patient_appointments(user_id)
            # print(appointments)
        elif role == UserRole.DOCTOR:
            appointments = dq.get_doctor_appointments(user_id)
        else:
            raise PermissionException("Access denied.")

        return send_success_msg(DoctorAppointmentSerializer(appointments, many=True).data)
