# backend/users/helpers.py

import logging

from users.models import UserRole
import db.patient_queries as pq
import db.doctor_queries as dq
import db.lab_queries as lq

logger = logging.getLogger(__name__)


def get_profile_data_by_role(user):

    user_id = str(getattr(user, "user_id", None) or user.get("user_id", ""))
    role    = getattr(user, "role", None) or user.get("role")

    if role == UserRole.PATIENT:
        return _patient_profile(user_id)

    if role == UserRole.DOCTOR:
        return _doctor_profile(user_id)

    if role == UserRole.LAB:
        return _lab_profile(user_id)

    if role in (UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN):
        return _admin_profile(user_id)

    logger.warning("get_profile_data_by_role: unrecognised role=%s for user_id=%s", role, user_id)
    return _base_user(user_id)


def _patient_profile(user_id: str) -> dict:
    from patients.serializers import PatientProfileSerializer

    patient = pq.get_patient_by_id(user_id)
    if patient:
        return PatientProfileSerializer(patient).data

    logger.warning("Patient profile not found for user_id=%s", user_id)
    return _base_user(user_id)


def _doctor_profile(user_id: str) -> dict:
    from doctors.serializers import DoctorProfileSerializer

    doctor = dq.get_doctor_by_user_id(user_id)
    if doctor:
        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        schedule = dq.get_schedule_by_doctor(uid)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        doctor["schedule"] = schedule
        return DoctorProfileSerializer(doctor).data

    logger.warning("Doctor profile not found for user_id=%s", user_id)
    return _base_user(user_id)


def _lab_profile(user_id: str) -> dict:
    from labs.serializers import LabProfileSerializer

    lab = lq.get_lab_by_user_id(user_id)
    if lab:
        uid = str(lab["lab_id"])
        lab["operating_hours"] = lq.get_lab_operating_hours(uid)
        lab["services"] = lq.get_lab_services(uid)
        return LabProfileSerializer(lab).data

    logger.warning("Lab profile not found for user_id=%s", user_id)
    return _base_user(user_id)


def _admin_profile(user_id: str) -> dict:
    from users.serializers import UserSerializer
    from db.user_queries import get_user_by_id

    user = get_user_by_id(user_id)
    if user:
        return UserSerializer(user).data

    logger.warning("Admin/Staff profile not found for user_id=%s", user_id)
    return {}


def _base_user(user_id: str) -> dict:
    from users.serializers import UserSerializer
    from db.user_queries import get_user_by_id

    user = get_user_by_id(user_id) or {}
    return UserSerializer(user).data