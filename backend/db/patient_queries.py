from db.connection import (
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


def toggle_patient_is_active(patient_id) -> dict:
    fn_scalar(
        "auth_toggle_patient_is_active",
        [str(patient_id)],
    )
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])


def mobile_exists(mobile: str, exclude_patient_id: str = None) -> bool:
    if exclude_patient_id:
        return (
            fetchscalar(
                "SELECT COUNT(*) FROM patients WHERE mobile=%s AND patient_id!=%s",
                [mobile, str(exclude_patient_id)],
            )
            > 0
        )
    return (
        fetchscalar("SELECT COUNT(*) FROM patients WHERE mobile=%s", [mobile]) > 0
    )


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
            fields.get("address_id"),
            fields.get("gender_id"),
            fields.get("blood_group_id"),
        ],
    )
    return get_patient_by_id(patient_id)