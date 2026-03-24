# backend\db\user_queries.py
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import uuid
from db.connection import fn_fetchone, fn_fetchall, fn_scalar, fetchone, fetchscalar


def get_user_by_email(email: str) -> dict | None:
    return fn_fetchone("u_get_user_by_email", [email])


def get_user_by_id(user_id: str) -> dict | None:
    return fn_fetchone("u_get_user_by_id", [str(user_id)])


def get_user_permission_by_id(role_id) -> dict | None:
    permissions = fn_fetchall("r_get_permissions_by_role", [role_id])
    # print(permissions)
    permissions_list = []
    for row in permissions:
        permissions_list.append(row["module"] +" : " + row["action"])
    # print(permissions_list)
    return permissions_list


def email_exists(email: str) -> bool:
    return fetchscalar("SELECT COUNT(*) FROM users WHERE email = %s", [email]) > 0


def create_user(
    email: str,
    password: str,
    role: str = "patient",
    oauth_provider: str = None,
    oauth_provider_id: str = None,
) -> dict:
    user_id = str(uuid.uuid4())
    hashed = make_password(password)
    role_id = fetchscalar(
        "SELECT role_id FROM user_roles WHERE LOWER(role) = LOWER(%s)", [role]
    )
    if role_id is None:
        raise ValueError(f"Unknown role: '{role}'")

    from db.connection import execute

    execute(
        """
        INSERT INTO users
            (user_id, email, password, role_id, oauth_provider, oauth_provider_id,
             email_verified, is_active, two_factor_enabled,
             failed_login_attempts, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, FALSE, TRUE, FALSE, 0, NOW(), NOW())
        """,
        [user_id, email.lower(), hashed, role_id, oauth_provider, oauth_provider_id],
    )
    return get_user_by_id(user_id)


def handle_failed_login(user: dict, max_attempts: int = 5, lockout_minutes: int = 15, failure_reason: str = "Invalid password") -> tuple[bool, str]:
    attempts = fn_scalar("auth_login_failed", [str(user["user_id"]), failure_reason])

    if attempts >= max_attempts:
        return (
            True,
            f"Too many failed login attempts. Account locked for {lockout_minutes} minutes.",
        )

    remaining = max_attempts - attempts
    return (
        False,
        f"Invalid credentials. {remaining} attempt(s) remaining before lockout.",
    )


def update_oauth_provider(user_id: str, provider: str, provider_id: str):
    from db.connection import execute

    execute(
        "UPDATE users SET oauth_provider=%s, oauth_provider_id=%s, updated_at=NOW() WHERE user_id=%s",
        [provider, provider_id, str(user_id)],
    )

def get_all_genders() -> list:
    return fn_fetchall("o_get_genders", [])


def get_all_blood_groups() -> list:
    return fn_fetchall("o_get_blood_groups", [])


def get_all_qualifications() -> list:
    return fn_fetchall("o_get_qualifications", [])


def gender_exists(gender_id: int) -> bool:
    return (
        fetchscalar("SELECT COUNT(*) FROM genders WHERE gender_id=%s", [gender_id]) > 0
    )


def blood_group_exists(blood_group_id: int) -> bool:
    return (
        fetchscalar(
            "SELECT COUNT(*) FROM blood_groups WHERE blood_group_id=%s",
            [blood_group_id],
        )
        > 0
    )


def get_address(address_id: int) -> dict | None:
    return fetchone("SELECT * FROM addresses WHERE address_id=%s", [address_id])


def create_address(user_id: str, address_line: str = "", city: str = "", state: str = "", pincode: str = "") -> int:
    from db.connection import fn_fetchone
    res = fn_fetchone("o_insert_address", [address_line, city, state, pincode, str(user_id)])
    return list(res.values())[0]


def update_address_by_user_id(user_id: str, address_line: str = None, city: str = None, state: str = None, pincode: str = None) -> bool:
    from db.connection import fn_scalar
    return fn_scalar("o_update_address_by_user_id", [
        str(user_id),
        address_line,
        city,
        state,
        pincode
    ])
