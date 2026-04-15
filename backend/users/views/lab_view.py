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
    LabOperatingHourSerializer,
)
import users.database_queries.lab_queries as lq

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


class LabOperatingHoursView(generics.GenericAPIView):
    """Dedicated endpoint for reading and replacing lab operating hours.

    GET  /labs/operating-hours/  – returns the current configured hours.
    PUT  /labs/operating-hours/  – replaces all hours, deletes stale future
                                   slots, and auto-regenerates new ones.
    """

    permission_classes = [IsAuthenticated]

    def _require_lab(self, request):
        if getattr(request.user, "role", None) != UserRole.LAB:
            raise PermissionException("Access denied. Lab role required.")
        return str(request.user.user_id)

    def get(self, request):
        lab_id = self._require_lab(request)
        hours = lq.get_lab_operating_hours(lab_id)
        return send_success_msg(
            LabOperatingHourSerializer(hours, many=True).data
        )

    def put(self, request):
        lab_id = self._require_lab(request)

        serializer = LabOperatingHourSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        # Delegate to the profile service so slot-regeneration logic runs once
        from ..services.profile_service import LabProfileService

        # Retrieve full lab dict (needed by update_lab_profile signature)
        lab = LabProfileService.get_lab_profile(request.user)
        if not lab:
            raise NotFoundException("Lab profile not found.")

        # Build a minimal serializer-shaped object carrying only operating_hours
        class _MinimalSerializer:
            validated_data = {"operating_hours": serializer.validated_data}

        LabProfileService.update_lab_profile(lab, _MinimalSerializer(), request=request)

        hours = lq.get_lab_operating_hours(lab_id)
        return send_success_msg(
            LabOperatingHourSerializer(hours, many=True).data,
            message="Operating hours updated and slots regenerated successfully.",
        )
