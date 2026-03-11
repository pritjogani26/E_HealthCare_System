# backend/doctors/helpers/profile_helpers.py
from db.doctor_queries import get_doctor_by_user_id
from ..serializers import DoctorProfileSerializer
from users.models import UserRole
from users.serializers import UserSerializer


def get_profile_data_by_role(user):
    if user.role == UserRole.DOCTOR:
        try:
            doctor = get_doctor_by_user_id(user_id=user["user_id"])
            return DoctorProfileSerializer(doctor).data
        except Exception as e:
            return UserSerializer(user).data
    return UserSerializer(user).data
