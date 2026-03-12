# backend\doctors\views.py
import traceback
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
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


def _error(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return Response(body, status=http_status)


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
        print("\n\nDone....")
        serializer = self.get_serializer(data=request.data)
        print("Data.....")
        if not serializer.is_valid():
            return _error("Registration failed", serializer.errors)
        print("Done Valid....\n\n")
        data = serializer.validated_data
        try:
            image_path = get_image_path(
                data, request, name="doctors", image_key="profile_image"
            )
            print("\n\nDone Image path.....")
            user, email_sent = RegistrationService.register_doctor(
                data, request=request, image_path=image_path
            )
            msg = (
                "Doctor registered successfully. Account pending verification. Please check your email."
                if email_sent
                else "Doctor registered successfully. Account pending verification. Verification email could not be sent."
            )

            response_dict = {
                "success": True,
                "message": msg,
                "data": {"user": user},
            }

            response_dict["email_verification_sent"] = email_sent
            response = Response(response_dict, status=status.HTTP_201_CREATED)
            return response
        except Exception as e:
            print("EXCEPTION:", traceback.format_exc())
            error_msg = str(e).split("\n")[0] or "a server error"
            return _error(
                f"Registration failed due to {error_msg}.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DoctorProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _require_doctor(self, request):
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            return None, _error(
                "Access denied. Doctor role required.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        doctor = ProfileService.get_doctor_profile(request.user)
        if not doctor:
            return None, _error(
                "Doctor profile not found.", http_status=status.HTTP_404_NOT_FOUND
            )
        return doctor, None

    def get(self, request, *args, **kwargs):
        doctor, err = self._require_doctor(request)
        if err:
            return err
        return _ok(doctor)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        doctor, err = self._require_doctor(request)
        if err:
            return err
        # BUG FIX: pass "doctor_id" (not "user_id") to match serializer context key
        serializer = DoctorProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"doctor_id": str(request.user.user_id)},
        )
        if not serializer.is_valid():
            return _error("Profile update failed", serializer.errors)
        try:
            image_path = get_image_path(
                request.data, request, name="doctors", image_key="profile_image"
            )
            if image_path:
                serializer.validated_data["profile_image"] = image_path
            updated_data = ProfileService.update_doctor_profile(
                doctor, serializer, request=request
            )
            return _ok(updated_data, message="Profile updated successfully.")
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Profile update failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DoctorListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        doctors = dq.get_verified_active_doctors()
        for doc in doctors:
            # BUG FIX: use "doctor_id" (normalized key), not "doctor_user_id"
            uid = str(doc["doctor_id"])
            doc["specializations"] = dq.get_doctor_specializations(uid)
        return _ok(DoctorListSerializer(doctors, many=True).data)


class DoctorDetailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id, *args, **kwargs):
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            return _error("Doctor not found.", http_status=status.HTTP_404_NOT_FOUND)
        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        schedule = dq.get_schedule_by_doctor(uid)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        doctor["schedule"] = schedule
        return _ok(DoctorProfileSerializer(doctor).data)


class AvailableSlotsView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id, *args, **kwargs):
        from datetime import date as date_type

        target_date = request.query_params.get("date")
        if target_date:
            try:
                target_date = date_type.fromisoformat(target_date)
            except ValueError:
                return _error("Invalid date format. Use YYYY-MM-DD.")
        slots = AppointmentService.get_available_slots(user_id, target_date)
        return _ok(AppointmentSlotSerializer(slots, many=True).data)


class GenerateSlotsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != UserRole.DOCTOR:
            return _error(
                "Doctor role required.", http_status=status.HTTP_403_FORBIDDEN
            )
        days = int(request.data.get("days", 7))
        count = AppointmentService.generate_slots_for_doctor(
            str(request.user.user_id), days=days
        )
        return _ok({"slots_created": count})


class BookAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookAppointmentSerializer

    def post(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != UserRole.PATIENT:
            return _error(
                "Only patients can book appointments.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return _error("Invalid input", serializer.errors)
        try:
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
        except ValueError as exc:
            return _error(str(exc))
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Booking failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CancelAppointmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, appointment_id, *args, **kwargs):
        reason = request.data.get("reason", "")
        try:
            appointment = AppointmentService.cancel_appointment(
                appointment_id=appointment_id,
                cancelled_by_user_id=str(request.user.user_id),
                reason=reason,
            )
            return _ok(
                DoctorAppointmentSerializer(appointment).data,
                message="Appointment cancelled successfully.",
            )
        except ValueError as exc:
            return _error(str(exc))
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Cancellation failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            return _error("Access denied.", http_status=status.HTTP_403_FORBIDDEN)
        return _ok(DoctorAppointmentSerializer(appointments, many=True).data)
