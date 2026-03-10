from db.connection import (
    fn_execute,
    fn_fetchone,
    fn_fetchall,
)

def get_patient_by_id(patient_id: str) -> dict | None:
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])

def get_patient_by_email(email: str) -> dict | None:
    return fn_fetchone("p_get_full_patient_profile", [str(email)])


def get_all_patients() -> list:
    return fn_fetchall("p_list_patients", [])


def toggle_patient_is_active(patient_id) -> dict:
    fn_execute(
        "auth_toggle_patient_is_active",
        [str(patient_id)],
    )
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])