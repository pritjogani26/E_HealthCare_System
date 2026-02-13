# backend/users/services/registration_service.py

from django.contrib.auth import get_user_model
from ..models import Patient, Doctor, Lab
from ..serializers import (
    PatientProfileSerializer,
    DoctorProfileSerializer,
    LabProfileSerializer,
)

User = get_user_model()


class RegistrationService:
    """
    Service layer for handling user registration logic.
    Provides reusable methods for patient, doctor, and lab registration.
    """

    @staticmethod
    def register_patient(serializer):
        """
        Register a new patient user.
        
        Args:
            serializer: Validated PatientRegistrationSerializer instance
        
        Returns:
            tuple: (user, patient_data)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        patient = Patient.objects.get(user=user)
        patient_data = PatientProfileSerializer(patient).data
        return user, patient_data

    @staticmethod
    def register_doctor(serializer):
        """
        Register a new doctor user.
        
        Args:
            serializer: Validated DoctorRegistrationSerializer instance
        
        Returns:
            tuple: (user, doctor_data)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        doctor = Doctor.objects.get(user=user)
        doctor_data = DoctorProfileSerializer(doctor).data
        return user, doctor_data

    @staticmethod
    def register_lab(serializer):
        """
        Register a new lab user.
        
        Args:
            serializer: Validated LabRegistrationSerializer instance
        
        Returns:
            tuple: (user, lab_data)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        lab = Lab.objects.get(user=user)
        lab_data = LabProfileSerializer(lab).data
        return user, lab_data
