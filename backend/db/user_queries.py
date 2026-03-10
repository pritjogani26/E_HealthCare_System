from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import uuid
from db.connection import fn_fetchone, fn_fetchall, fn_scalar, fetchone, fetchscalar


def get_user_by_email(email: str) -> dict | None:
    return fn_fetchone("u_get_user_by_email", [email])


def get_user_by_id(user_id: str) -> dict | None:
    return fn_fetchone("u_get_user_by_id", [str(user_id)])


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


def authenticate_user(email: str, password: str) -> dict | None:
    user = get_user_by_email(email)
    if user and check_password(password, user["password"]):
        return user
    return None


def handle_failed_login(user: dict, max_attempts: int = 5, lockout_minutes: int = 30):
    attempts = (user.get("failed_login_attempts") or 0) + 1
    if attempts >= max_attempts:
        lockout_until = timezone.now() + timezone.timedelta(minutes=lockout_minutes)
        fn_scalar("u_lock_user", [str(user["user_id"]), lockout_until])
        return (
            True,
            f"Too many failed login attempts. Account locked for {lockout_minutes} minutes.",
        )
    from db.connection import execute

    execute(
        "UPDATE users SET failed_login_attempts=%s, updated_at=NOW() WHERE user_id=%s",
        [attempts, str(user["user_id"])],
    )
    remaining = max_attempts - attempts
    return (
        False,
        f"Invalid credentials. {remaining} attempt(s) remaining before lockout.",
    )


def handle_successful_login(user_id: str):
    from db.connection import execute

    execute(
        """
        UPDATE users
        SET failed_login_attempts = 0,
            lockout_until         = NULL,
            last_login_at         = NOW(),
            updated_at            = NOW()
        WHERE user_id = %s
        """,
        [str(user_id)],
    )


def update_oauth_provider(user_id: str, provider: str, provider_id: str):
    from db.connection import execute

    execute(
        "UPDATE users SET oauth_provider=%s, oauth_provider_id=%s, updated_at=NOW() WHERE user_id=%s",
        [provider, provider_id, str(user_id)],
    )


def toggle_user_status(admin_id: str, target_id: str, is_active: bool) -> bool:
    """Calls u_toggle_user_status(admin_id, target_id, is_active)."""
    return fn_scalar(
        "u_toggle_user_status",
        [str(admin_id), str(target_id), is_active],
    )


def soft_deactivate_user(user_id: str) -> bool:
    return fn_scalar("u_soft_deactivate_user", [str(user_id)])


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


def qualification_exists(qualification_id: int) -> bool:
    return (
        fetchscalar(
            "SELECT COUNT(*) FROM qualifications WHERE qualification_id=%s",
            [qualification_id],
        )
        > 0
    )


def create_address(
    address_line="", city="", state="", pincode="", latitude=None, longitude=None
) -> int:
    row = fetchone(
        """
        INSERT INTO addresses (address_line, city, state, pincode, created_at, updated_at)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        RETURNING address_id
        """,
        [address_line, city, state, pincode],
    )
    return row["address_id"]


def update_address(address_id: int, **fields):
    if not fields:
        return
    fn_scalar(
        "o_update_address",
        [
            address_id,
            fields.get("address_line"),
            fields.get("city"),
            fields.get("state"),
            fields.get("pincode"),
        ],
    )


def get_address(address_id: int) -> dict | None:
    return fetchone("SELECT * FROM addresses WHERE address_id=%s", [address_id])
