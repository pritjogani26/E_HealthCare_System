"""
All lab DB access via stored PostgreSQL functions.
"""

from db.connection import fn_fetchone, fn_fetchall, fn_scalar, fetchscalar, execute


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalize_lab(row: dict) -> dict:
    """Add key aliases for consistent access throughout the codebase."""
    if not row:
        return row
    d = dict(row)
    d.setdefault("lab_user_id", d.get("lab_id"))
    d.setdefault("user_id", d.get("lab_id"))
    d.setdefault("user_is_active", d.get("is_active"))
    d.setdefault("user_created_at", d.get("created_at"))
    d.setdefault("user_updated_at", d.get("updated_at"))
    d.setdefault("lab_created_at", d.get("created_at"))
    d.setdefault("lab_updated_at", d.get("updated_at"))
    d.setdefault("role", "lab_technician")
    d.setdefault("two_factor_enabled", False)
    d.setdefault("last_login_at", None)
    return d


# ---------------------------------------------------------------------------
# Profile queries
# ---------------------------------------------------------------------------

def get_lab_by_user_id(user_id: str) -> dict | None:
    row = fn_fetchone("l_get_full_lab_profile", [str(user_id)])
    return _normalize_lab(row) if row else None


def get_all_labs() -> list:
    rows = fn_fetchall("l_list_labs", [])
    return [_normalize_lab(r) for r in rows]


def license_exists(license_number: str, exclude_lab_id: str = None) -> bool:
    if not license_number:
        return False
    if exclude_lab_id:
        return (
            fetchscalar(
                "SELECT COUNT(*) FROM labs WHERE license_number=%s AND lab_id!=%s",
                [license_number, str(exclude_lab_id)],
            )
            > 0
        )
    return (
        fetchscalar("SELECT COUNT(*) FROM labs WHERE license_number=%s", [license_number]) > 0
    )


def create_lab(
    user_id: str,
    lab_name: str,
    license_number: str = None,
    address_id: int = None,
    phone_number: str = None,
    lab_logo: str = "/media/defaults/lab.png",
) -> dict:
    execute(
        """
        INSERT INTO labs
            (lab_id, lab_name, license_number, address_id, phone_number, lab_logo,
             is_active, verification_status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE, 'pending', NOW(), NOW())
        """,
        [str(user_id), lab_name, license_number, address_id, phone_number, lab_logo],
    )
    return get_lab_by_user_id(user_id)


def update_lab(user_id: str, **fields) -> dict:
    if not fields:
        return get_lab_by_user_id(user_id)
    fn_scalar(
        "l_update_lab_profile",
        [
            str(user_id),
            fields.get("lab_name"),
            fields.get("license_number"),
            fields.get("phone_number"),
            fields.get("lab_logo"),
            fields.get("address_id"),
        ],
    )
    return get_lab_by_user_id(user_id)


def toggle_lab_is_active(user_id: str) -> dict:
    execute(
        "UPDATE labs SET is_active = NOT is_active, updated_at=NOW() WHERE lab_id=%s",
        [str(user_id)],
    )
    execute(
        """
        UPDATE users u SET is_active = l.is_active, updated_at=NOW()
        FROM labs l WHERE l.lab_id=%s AND u.user_id = l.lab_id
        """,
        [str(user_id)],
    )
    return get_lab_by_user_id(user_id)


def update_lab_verification(user_id: str, status: str, notes: str, verified_by_id: str) -> dict:
    """
    Calls a_verify_lab(p_admin_id, p_lab_id, p_status, p_notes).
    NOTE: admin_id must be the FIRST argument.
    """
    fn_scalar(
        "a_verify_lab",
        [str(verified_by_id), str(user_id), status, notes],
    )
    return get_lab_by_user_id(user_id)


def get_pending_labs_count() -> int:
    return (
        fetchscalar("SELECT COUNT(*) FROM labs WHERE verification_status='pending'", [])
        or 0
    )


# ---------------------------------------------------------------------------
# Operating hours
# ---------------------------------------------------------------------------

def get_lab_operating_hours(lab_user_id: str) -> list:
    return fn_fetchall("l_get_operating_hours", [str(lab_user_id)])


def delete_lab_operating_hours(lab_user_id: str):
    execute("DELETE FROM lab_operating_hours WHERE lab_id=%s", [str(lab_user_id)])


def insert_lab_operating_hour(
    lab_user_id: str,
    day_of_week: int,
    open_time,
    close_time,
    is_closed: bool = False,
):
    fn_scalar(
        "l_upsert_operating_hours",
        [str(lab_user_id), day_of_week, open_time, close_time, is_closed],
    )


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

def get_lab_services(lab_user_id: str) -> list:
    return fn_fetchall("l_get_services", [str(lab_user_id)])


def delete_lab_services(lab_user_id: str):
    execute("DELETE FROM lab_services WHERE lab_id=%s", [str(lab_user_id)])


def insert_lab_service(
    lab_user_id: str,
    service_name: str,
    description: str = None,
    price=None,
    turnaround_hours: int = None,
):
    """
    Calls l_add_service — 5 params only (is_active is always TRUE in the DB function).
    """
    fn_scalar(
        "l_add_service",
        [str(lab_user_id), service_name, description, price, turnaround_hours],
    )