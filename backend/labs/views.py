import traceback
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import UserRole
from users.services.registration_service import RegistrationService
from users.helpers import set_auth_response_with_tokens, set_refresh_token_cookie
from users.services.image_process import get_image_path
from .serializers import (
    LabRegistrationSerializer,
    LabProfileSerializer,
    LabProfileUpdateSerializer,
)
from .services import profile_service


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


class LabRegistrationView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LabRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return _error("Registration failed", serializer.errors)
        try:
            image_path = get_image_path(
                request.data, request, name="labs", image_key="lab_logo"
            )
            user, lab_data, email_sent = RegistrationService.register_lab(
                serializer.validated_data, request=request, image_path=image_path
            )
            msg = (
                "Lab registered successfully. Account pending verification. Please check your email."
                if email_sent
                else "Lab registered successfully. Account pending verification. Verification email could not be sent."
            )
            response_dict, refresh_token = set_auth_response_with_tokens(
                user, LabProfileSerializer(lab_data).data, msg
            )
            response_dict["email_verification_sent"] = email_sent
            response = Response(response_dict, status=status.HTTP_201_CREATED)
            set_refresh_token_cookie(response, refresh_token)
            return response
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Registration failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LabProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _require_lab(self, request) -> tuple:
        """
        BUG FIX: was returning None (not a tuple), causing TypeError on unpack.
        Now correctly returns (lab, None) or (None, error_response).
        """
        if getattr(request.user, "role", None) != UserRole.LAB:
            return None, _error(
                "Access denied. Lab role required.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        lab = profile_service.get_lab_profile(request.user)
        if not lab:
            return None, _error(
                "Lab profile not found.", http_status=status.HTTP_404_NOT_FOUND
            )
        return lab, None

    def get(self, request, *args, **kwargs):
        lab, err = self._require_lab(request)
        if err:
            return err
        return _ok(LabProfileSerializer(lab).data)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        lab, err = self._require_lab(request)
        if err:
            return err
        serializer = LabProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"lab_id": str(request.user.user_id)},
        )
        if not serializer.is_valid():
            return _error("Profile update failed", serializer.errors)
        try:
            image_path = get_image_path(
                request.data, request, name="labs", image_key="lab_logo"
            )
            if image_path:
                serializer.validated_data["lab_logo"] = image_path
            updated_data = profile_service.update_lab_profile(lab, serializer, request=request)
            return _ok(updated_data, message="Profile updated successfully.")
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Profile update failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )