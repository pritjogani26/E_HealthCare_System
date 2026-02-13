# backend/users/services/registration_service.py

import logging
from django.contrib.auth import get_user_model
from ..models import Patient, Doctor, Lab
from ..serializers import (
    PatientProfileSerializer,
    DoctorProfileSerializer,
    LabProfileSerializer,
)
from .email_service import EmailService

User = get_user_model()
logger = logging.getLogger(__name__)


class RegistrationService:
    """
    Service layer for handling user registration logic.
    Provides reusable methods for patient, doctor, and lab registration.
    """

    @staticmethod
    def register_patient(serializer):
        """
        Register a new patient user and send verification email.
        
        Args:
            serializer: Validated PatientRegistrationSerializer instance
        
        Returns:
            tuple: (user, patient_data, email_sent)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        patient = Patient.objects.get(user=user)
        patient_data = PatientProfileSerializer(patient).data
        
        # Send verification email or verify if OAuth
        email_sent = False
        if user.oauth_provider:
            user.email_verified = True
            user.save()
            email_sent = True
        else:
            email_sent = EmailService.send_verification_email(user)
            if not email_sent:
                logger.warning(f"Failed to send verification email to {user.email}")
        
        return user, patient_data, email_sent

    @staticmethod
    def register_doctor(serializer):
        """
        Register a new doctor user and send verification email.
        
        Args:
            serializer: Validated DoctorRegistrationSerializer instance
        
        Returns:
            tuple: (user, doctor_data, email_sent)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        doctor = Doctor.objects.get(user=user)
        doctor_data = DoctorProfileSerializer(doctor).data
        
        # Send verification email or verify if OAuth
        email_sent = False
        if user.oauth_provider:
            user.email_verified = True
            user.save()
            email_sent = True
        else:
            email_sent = EmailService.send_verification_email(user)
            if not email_sent:
                logger.warning(f"Failed to send verification email to {user.email}")
        
        return user, doctor_data, email_sent

    @staticmethod
    def register_lab(serializer):
        """
        Register a new lab user and send verification email.
        
        Args:
            serializer: Validated LabRegistrationSerializer instance
        
        Returns:
            tuple: (user, lab_data, email_sent)
        
        Raises:
            Exception: If registration fails
        """
        user = serializer.save()
        lab = Lab.objects.get(user=user)
        lab_data = LabProfileSerializer(lab).data
        
        # Send verification email or verify if OAuth
        email_sent = False
        if user.oauth_provider:
            user.email_verified = True
            user.save()
            email_sent = True
        else:
            email_sent = EmailService.send_verification_email(user)
            if not email_sent:
                logger.warning(f"Failed to send verification email to {user.email}")
        
        return user, lab_data, email_sent
