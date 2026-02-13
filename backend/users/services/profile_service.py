# backend/users/services/profile_service.py

from ..models import Patient, Doctor, Lab, UserRole
from ..serializers import (
    PatientProfileSerializer,
    DoctorProfileSerializer,
    LabProfileSerializer,
)


class ProfileService:
    """
    Service layer for user profile operations.
    Handles profile retrieval and updates for different user types.
    """

    @staticmethod
    def get_patient_profile(user):
        """
        Get patient profile for a user.
        
        Args:
            user: User instance with PATIENT role
        
        Returns:
            Patient instance or None if not found
        """
        try:
            return Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            return None

    @staticmethod
    def get_doctor_profile(user):
        """
        Get doctor profile for a user.
        
        Args:
            user: User instance with DOCTOR role
        
        Returns:
            Doctor instance or None if not found
        """
        try:
            return Doctor.objects.get(user=user)
        except Doctor.DoesNotExist:
            return None

    @staticmethod
    def get_lab_profile(user):
        """
        Get lab profile for a user.
        
        Args:
            user: User instance with LAB role
        
        Returns:
            Lab instance or None if not found
        """
        try:
            return Lab.objects.get(user=user)
        except Lab.DoesNotExist:
            return None

    @staticmethod
    def validate_user_role(user, required_role):
        """
        Validate that user has the required role.
        
        Args:
            user: User instance
            required_role: Required UserRole enum value
        
        Returns:
            bool: True if user has required role, False otherwise
        """
        return user.role == required_role

    @staticmethod
    def update_patient_profile(patient, serializer):
        """
        Update patient profile.
        
        Args:
            patient: Patient instance
            serializer: Validated PatientProfileUpdateSerializer
        
        Returns:
            Updated patient data
        """
        serializer.save()
        return PatientProfileSerializer(patient).data

    @staticmethod
    def update_doctor_profile(doctor, serializer):
        """
        Update doctor profile.
        
        Args:
            doctor: Doctor instance
            serializer: Validated DoctorProfileUpdateSerializer
        
        Returns:
            Updated doctor data
        """
        serializer.save()
        return DoctorProfileSerializer(doctor).data

    @staticmethod
    def update_lab_profile(lab, serializer):
        """
        Update lab profile.
        
        Args:
            lab: Lab instance
            serializer: Validated LabProfileUpdateSerializer
        
        Returns:
            Updated lab data
        """
        serializer.save()
        return LabProfileSerializer(lab).data
