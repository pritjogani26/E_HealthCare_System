from db.connection import (
    fn_fetchone,
    fn_fetchall,
    fn_scalar,
    fetchscalar,
    execute,
)
from .change_data_query import generate_difference


def get_patient_by_id(patient_id: str) -> dict | None:
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])


def get_all_patients() -> list:
    return fn_fetchall("p_list_patients", [])


def toggle_patient_is_active(patient_id, reason: str) -> dict:
    fn_scalar(
        "auth_toggle_user_is_active",
        [str(patient_id), reason],
    )
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])


def update_patient(patient_id: str, **fields) -> dict:
    old_patient_data = get_patient_by_id(patient_id)
    if not fields:
        return get_patient_by_id(patient_id)
    fn_scalar(
        "p_update_patient_profile",
        [
            str(patient_id),
            fields.get("full_name"),
            fields.get("date_of_birth"),
            fields.get("mobile"),
            fields.get("emergency_contact_name"),
            fields.get("emergency_contact_phone"),
            fields.get("profile_image"),
            fields.get("gender_id"),
            fields.get("blood_group_id"),
        ],
    )
    new_patient_data = get_patient_by_id(patient_id)
    generate_difference(old_patient_data, new_patient_data)
    return new_patient_data