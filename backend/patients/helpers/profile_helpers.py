# backend/labs/helpers/profile_helpers.py

import logging

import db.lab_queries as lq
from labs.serializers import LabProfileSerializer
from users.models import UserRole
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)


def get_profile_data_by_role(user):
    if getattr(user, "role", None) == UserRole.LAB:
        user_id = str(user.user_id)
        lab = lq.get_lab_by_user_id(user_id)

        if lab:
            lab["operating_hours"] = lq.get_lab_operating_hours(user_id)
            lab["services"] = lq.get_lab_services(user_id)
            return LabProfileSerializer(lab).data

        logger.warning("Lab profile not found for user_id=%s", user_id)

    return UserSerializer(user).data
