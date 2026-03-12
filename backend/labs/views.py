import json
import traceback
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.models import UserRole
from users.services.registration_service import RegistrationService
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
        data = request.data.dict()
        print(f"\n\nData Before Seriliazer : {data}")

        for field in ("operating_hours", "services"):
            raw = data.get(field)
            if isinstance(raw, str):
                try:
                    data[field] = json.loads(raw)
                except json.JSONDecodeError:
                    return _error(f"Invalid JSON in field: {field}")
        serializer = self.get_serializer(data=data)

        if not serializer.is_valid():
            return _error("Registration failed", serializer.errors)

        data = serializer.validated_data

        print(f"\n\nData After Seriliazer : {data}")

        try:
            image_path = get_image_path(
                request.data, request, name="labs", image_key="lab_logo"
            )
            print(f"\nImage store success fully and Path is : {image_path}")

            user, email_sent = RegistrationService.register_lab(
                data, request=request, image_path=image_path
            )
            msg = (
                "Lab registered successfully. Account pending verification. Please check your email."
                if email_sent
                else "Lab registered successfully. Account pending verification. Verification email could not be sent."
            )
            response_dict = {
                "success": True,
                "message": msg,
                "data": {
                    "user": user,
                },
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


class LabProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _require_lab(self, request) -> tuple:
        print("Here.............................2")
        if getattr(request.user, "role", None) != UserRole.LAB:
            print("Here.............................3")
            return None, _error(
                "Access denied. Lab role required.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        print("Here.............................4")
        lab = profile_service.get_lab_profile(request.user)
        if not lab:
            return None, _error(
                "Lab profile not found.", http_status=status.HTTP_404_NOT_FOUND
            )
        return lab, None

    def get(self, request, *args, **kwargs):
        print("Here.............................1")
        lab, err = self._require_lab(request)
        if err:
            return err
        return _ok(LabProfileSerializer(lab).data)

    def put(self, request, *args, **kwargs):
        print("Here.............................put")
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        print("Here.............................patch")
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        print("Here.............................update")
        lab, err = self._require_lab(request)
        if err:
            return err
        serializer = LabProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"lab_id": str(request.user.user_id)},
        )
        print("Here.............................serializer")
        if not serializer.is_valid():
            return _error("Profile update failed", serializer.errors)
        try:
            image_path = get_image_path(
                request.data, request, name="labs", image_key="lab_logo"
            )
            if image_path:
                serializer.validated_data["lab_logo"] = image_path
            updated_data = profile_service.update_lab_profile(
                lab, serializer, request=request
            )
            return _ok(updated_data, message="Profile updated successfully.")
        except Exception:
            print("EXCEPTION:", traceback.format_exc())
            return _error(
                "Profile update failed due to a server error.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
