# backend/doctors/helpers/profile_helpers.py

import logging

from db.doctor_queries import get_doctor_by_user_id
from users.models import UserRole
from users.serializers import UserSerializer
from ..serializers import DoctorProfileSerializer

logger = logging.getLogger(__name__)


def get_profile_data_by_role(user):
    if user.role == UserRole.DOCTOR:
        doctor = get_doctor_by_user_id(user_id=str(user.user_id))
        if doctor:
            return DoctorProfileSerializer(doctor).data
        logger.warning("Doctor profile not found for user_id=%s", user.user_id)

    return UserSerializer(user).data