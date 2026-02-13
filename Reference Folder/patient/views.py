# Hospital_Management\backend\patient\views.py
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.authentication import JWTAuthentication
from .patient_service.serializers import (
    PatientInsertSerializer,
    PatientDisplaySerializer,
    PatientUpdateSerializer,
    PatientListSerializer,
    DeleteSerializer,
)
from .patient_service.db import fetch_one, fetch_all
import os
from django.conf import settings


from service_app.image_process import get_image_path
from .patient_service.create_patients import create_patient
from .patient_service.display_patients import display_patients
from .patient_service.display_patient_details import display_patient_details
from .patient_service.update_patient import update_patient
from .patient_service.delete_patient import delete


class AddPatient(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return []

    serializer_class = PatientInsertSerializer

    def post(self, request: HttpRequest):
        res: Response = create_patient(self, request)
        return res


class DisplayPatients(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return []

    serializer_class = PatientListSerializer

    def get(self, request):
        res: Response = display_patients(self, request)
        return res


class DisplayPatientDetails(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return []

    serializer_class = PatientDisplaySerializer

    def get(self, request, patient_id):
        res: Response = display_patient_details(self, patient_id)
        return res


class UpdatePatient(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return []

    serializer_class = PatientUpdateSerializer

    def put(self, request, patient_id):
        res: Response = update_patient(self, request, patient_id)
        return res


class DeletePatient(generics.GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = DeleteSerializer

    def get_queryset(self):
        return []

    def delete(self, request, patient_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        print(f"\n Patirnt Id : {patient_id}\n")
        print("\n\n")
        print(data)
        print("\n\n")
        res: Response = delete(patient_id, data)
        return res
