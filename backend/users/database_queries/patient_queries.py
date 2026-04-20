from users.database_queries.connection import (
    fn_fetchone,
    fn_fetchall,
    fn_scalar,
    fetchscalar,
    execute,
)


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
    return new_patient_data

get_full_patient_profile = get_patient_by_id
