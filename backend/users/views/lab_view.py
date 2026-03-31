# backend\users\views\lab_view.py

import json
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
from ..serializers.lab_serializers import (
    LabRegistrationSerializer,
    LabProfileSerializer,
    LabProfileUpdateSerializer,
)

from ..services.profile_service import LabProfileService
from ..services.success_response import send_success_msg


class LabRegistrationView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LabRegistrationSerializer

    def post(self, request):
        data = request.data.dict()

        for field in ("operating_hours", "services"):
            raw = data.get(field)
            if isinstance(raw, str):
                try:
                    data[field] = json.loads(raw)
                except json.JSONDecodeError:
                    raise ValidationException(f"Invalid JSON in field: {field}")

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(
            request.data, request, name="labs", image_key="lab_logo"
        )

        user, email_sent = RegistrationService.register_lab(
            serializer.validated_data, request=request, image_path=image_path
        )

        message = (
            "Lab registered successfully. Account pending verification. Please check your email."
            if email_sent
            else "Lab registered successfully. Account pending verification. Verification email could not be sent."
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


class LabProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _get_lab(self, request):
        if getattr(request.user, "role", None) != UserRole.LAB:
            raise PermissionException("Access denied. Lab role required.")
        lab = LabProfileService.get_lab_profile(request.user)
        if not lab:
            raise NotFoundException("Lab profile not found.")
        return lab

    def get(self, request):
        lab = self._get_lab(request)
        return send_success_msg(LabProfileSerializer(lab).data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        lab = self._get_lab(request)

        serializer = LabProfileUpdateSerializer(
            data=request.data,
            partial=partial,
            context={"lab_id": str(request.user.user_id)},
        )
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(
            request.data, request, name="labs", image_key="lab_logo"
        )
        if image_path:
            serializer.validated_data["lab_logo"] = image_path

        updated_data = LabProfileService.update_lab_profile(
            lab, serializer, request=request
        )
        return send_success_msg(updated_data, message="Profile updated successfully.")
