from db.connection import (
    fn_fetchone,
    fn_fetchall,
    fn_scalar,
    fetchscalar,
    fetchone,
    execute,
)

def get_patient_by_id(patient_id: str) -> dict | None:
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])


def get_all_patients() -> list:
    return fn_fetchall("p_list_patients", [])


def mobile_exists(mobile: str, exclude_patient_id=None) -> bool:
    if exclude_patient_id:
        return (
            fetchscalar(
                "SELECT COUNT(*) FROM patients WHERE mobile=%s AND user_id!=%s",
                [mobile, str(exclude_patient_id)],
            )
            > 0
        )
    return fetchscalar("SELECT COUNT(*) FROM patients WHERE mobile=%s", [mobile]) > 0


def create_patient(
    user_id: str,
    full_name: str,
    mobile: str,
    date_of_birth=None,
    gender_id: int = None,
    blood_group_id: int = None,
    address_id: int = None,
    profile_image: str = "/media/defaults/patient.png",
) -> dict:
    """
    Insert patient profile row then return the full profile via stored function.
    (The atomic registration sproc register_patient_user is preferred for full
    registration flows; this helper is used when the user row already exists.)
    """
    execute(
        """
        INSERT INTO patients
            (user_id, full_name, mobile, date_of_birth, gender_id, blood_group_id,
             address_id, profile_image, is_active, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING
        """,
        [
            str(user_id),
            full_name,
            mobile,
            date_of_birth,
            gender_id,
            blood_group_id,
            address_id,
            profile_image,
        ],
    )
    return fn_fetchone("p_get_full_patient_profile", [str(user_id)])


def update_patient(patient_id, **fields) -> dict:
    """
    Calls p_update_patient_profile stored function.
    patient_id here is the user_id UUID (passed as-is from the service layer).
    All fields are optional — COALESCE in the sproc handles partial updates.
    """
    uid = str(patient_id)
    fn_scalar(
        "p_update_patient_profile",
        [
            uid,
            fields.get("full_name"),
            fields.get("date_of_birth"),
            fields.get("mobile"),
            fields.get("emergency_contact_name"),
            fields.get("emergency_contact_phone"),
            fields.get("gender_id"),
            fields.get("blood_group_id"),
            fields.get("profile_image"),
            fields.get("address_id"),
        ],
    )
    return fn_fetchone("p_get_full_patient_profile", [uid])


def toggle_patient_is_active(patient_id) -> dict:
    """Toggle the patient's is_active flag and return the updated profile."""
    execute(
        "UPDATE patients SET is_active = NOT is_active, updated_at=NOW() WHERE user_id=%s",
        [str(patient_id)],
    )
    return fn_fetchone("p_get_full_patient_profile", [str(patient_id)])


def sync_user_active_from_patient(patient_id):
    """Sync users.is_active from patients.is_active."""
    execute(
        """
        UPDATE users u
        SET is_active = p.is_active, updated_at=NOW()
        FROM patients p
        WHERE p.user_id = %s AND u.user_id = p.user_id
        """,
        [str(patient_id)],
    )
