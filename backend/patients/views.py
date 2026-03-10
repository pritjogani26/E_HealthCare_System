import traceback
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.AuditLog import AuditMixin, build_changes_dict
from users.models import UserRole
from users.services.registration_service import RegistrationService
from users.helpers import set_auth_response_with_tokens, set_refresh_token_cookie
from users.services.image_process import get_image_path
from .serializers import (
    PatientRegistrationSerializer,
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
)
from .services import ProfileService


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


class PatientRegistrationView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PatientRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return _error("Registration failed", serializer.errors)
        data = serializer.validated_data
        image_path = get_image_path(data, request, name="patients")
        try:
            user, email_sent = RegistrationService.register_patient(
                data, request=request, image_path=image_path
            )
            msg = (
                "Patient registered successfully. Please check your email to verify your account."
                if email_sent
                else "Patient registered successfully. Verification email could not be sent."
            )
            response_dict = {
                "success": True,
                "message": msg,
                "data": {
                    "user": user
                },
            }
            response_dict["email_verification_sent"] = email_sent
            response = Response(response_dict, status=status.HTTP_201_CREATED)
            return response

        except Exception as e:
            print(
                "EXCEPTION:",
                traceback.format_exc(),
                "PatientRegistrationView: exception",
            )
            error_msg = str(e).split("\n")[0] or "a server error"
            return _error(
                f"Registration failed due to {error_msg}.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PatientProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return (
            PatientProfileSerializer
            if self.request.method == "GET"
            else PatientProfileUpdateSerializer
        )

    def _require_patient(self, request):
        if getattr(request.user, "role", None) != UserRole.PATIENT:
            return None, _error(
                "Access denied. Patient role required.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        patient = ProfileService.get_patient_profile(request.user)
        if not patient:
            return None, _error(
                "Patient profile not found.", http_status=status.HTTP_404_NOT_FOUND
            )
        return patient, None

    def get(self, request, *args, **kwargs):
        patient, err = self._require_patient(request)
        if err:
            return err
        return _ok(PatientProfileSerializer(patient).data)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        patient, err = self._require_patient(request)
        if err:
            return err
        serializer = PatientProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"patient_id": patient["patient_id"]},
        )
        if not serializer.is_valid():
            return _error("Profile update failed", serializer.errors)
        try:
            image_path = get_image_path(request.data, request, name="patients")
            if image_path:
                serializer.validated_data["profile_image"] = image_path
            # build_changes_dict(patient, serializer.validated_data)
            updated_data = ProfileService.update_patient_profile(
                patient, serializer, request=request
            )
            return _ok(updated_data, message="Profile updated successfully.")
        except Exception:
            print(
                "EXCEPTION:",
                traceback.format_exc(),
                "PatientProfileView._update: exception",
            )
            return _error(
                "Profile update failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
