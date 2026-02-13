# backend/users/helpers/profile_helpers.py

from ..models import Patient, Doctor, Lab, UserRole
from ..serializers import (
    PatientProfileSerializer,
    DoctorProfileSerializer,
    LabProfileSerializer,
    AdminStaffProfileSerializer,
    UserSerializer,
)


def get_profile_data_by_role(user):
    """
    Get profile data based on user role.
    
    Args:
        user: User instance
    
    Returns:
        Serialized profile data based on user role
    """
    if user.role == UserRole.PATIENT:
        try:
            patient = Patient.objects.get(user=user)
            return PatientProfileSerializer(patient).data
        except Patient.DoesNotExist:
            return UserSerializer(user).data

    elif user.role == UserRole.DOCTOR:
        try:
            doctor = Doctor.objects.get(user=user)
            return DoctorProfileSerializer(doctor).data
        except Doctor.DoesNotExist:
            return UserSerializer(user).data

    elif user.role == UserRole.LAB:
        try:
            lab = Lab.objects.get(user=user)
            return LabProfileSerializer(lab).data
        except Lab.DoesNotExist:
            return UserSerializer(user).data

    elif user.role in [UserRole.ADMIN, UserRole.STAFF]:
        return AdminStaffProfileSerializer(user).data

    return UserSerializer(user).data
