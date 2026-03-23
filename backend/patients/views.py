# backend/patients/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.exceptions import PermissionException, NotFoundException
from users.models import UserRole
from users.services.registration_service import RegistrationService
from users.services.image_process import get_image_path
from .serializers import (
    PatientRegistrationSerializer,
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
)
from .services import ProfileService


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
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(serializer.validated_data, request, name="patients")

        user, email_sent = RegistrationService.register_patient(
            serializer.validated_data, request=request, image_path=image_path
        )

        message = (
            "Patient registered successfully. Please check your email to verify your account."
            if email_sent
            else "Patient registered successfully. Verification email could not be sent."
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


class PatientProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def _get_patient(self, request):
        if getattr(request.user, "role", None) != UserRole.PATIENT:
            raise PermissionException("Access denied. Patient role required.")
        patient = ProfileService.get_patient_profile(request.user)
        if not patient:
            raise NotFoundException("Patient profile not found.")
        return patient

    def get(self, request, *args, **kwargs):
        patient = self._get_patient(request)
        return _ok(PatientProfileSerializer(patient).data)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        patient = self._get_patient(request)
        print(f"\nPatient for Update : {request.data}")
        address = request.data["address"]
        print(f"\nAddress : {address}")
        
        serializer = PatientProfileUpdateSerializer(
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)

        image_path = get_image_path(request.data, request, name="patients")
        if image_path:
            serializer.validated_data["profile_image"] = image_path

        updated_data = ProfileService.update_patient_profile(
            patient, serializer, request=request
        )
        return _ok(updated_data, message="Profile updated successfully.")
