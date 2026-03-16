# backend/labs/helpers/profile_helpers.py

import logging

import db.lab_queries as lq
from db.user_queries import get_user_by_id
from labs.serializers import LabProfileSerializer
from users.models import UserRole
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)


def get_profile_data_by_role(user) -> dict:
    if getattr(user, "role", None) == UserRole.LAB:
        user_id = str(user.user_id)
        lab = lq.get_lab_by_user_id(user_id)

        if lab:
            uid = str(lab["lab_id"])
            lab["operating_hours"] = lq.get_lab_operating_hours(uid)
            lab["services"] = lq.get_lab_services(uid)
            return LabProfileSerializer(lab).data

        logger.warning("Lab profile not found for user_id=%s", user_id)

    u = get_user_by_id(str(user.user_id)) or {}
    return UserSerializer(u).data