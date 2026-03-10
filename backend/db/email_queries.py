"""
Email verification / password-reset token operations via stored functions.
Stored functions used:
  auth_create_verification(uuid, int, text, varchar, timestamptz)
      → returns: id bigint
  auth_verify_token(text)
      → returns: (user_id, verification_type_id, token, otp, expires_at, is_used, …)
  u_set_email_verified(uuid)
      → returns: boolean
"""

import uuid
from db.connection import fn_scalar, fn_fetchone, execute


def _get_verification_type_id(name: str) -> int:
    """Resolve a verification type name to its integer ID."""
    from db.connection import fetchscalar

    return fetchscalar(
        "SELECT id FROM verification_types WHERE name=%s LIMIT 1", [name]
    )


def create_email_verification_token(user_id: str, expires_hours: int = 24) -> str:
    """
    Create a new email-verification record.
    Delegates to auth_create_verification stored function.
    Returns the generated token string.
    """
    try:
        token = str(uuid.uuid4())
        vtype_id = _get_verification_type_id("email_verification")
        execute(
            "UPDATE email_verification_table SET is_used=TRUE WHERE user_id=%s AND is_used=FALSE",
            [str(user_id)],
        )
        print("\n\n")
        print(user_id, vtype_id, token)
        res = fn_fetchone(
            "auth_create_verification",
            [user_id, vtype_id, token, None, (expires_hours * 60)],
        )
        print(f"{res}\n")
        return token
    except Exception as e:
        print(e)
        return


def get_verification_record(token: str) -> dict | None:
    """
    Fetch a verification record by token using auth_verify_token.
    Returns the record dict if valid and unused, else None.
    """
    print("Inside get_verification_record")
    return fn_fetchone("auth_verify_token", [token])


def mark_token_used(token: str):
    execute(
        "UPDATE email_verification_table SET is_used=TRUE WHERE token=%s",
        [token],
    )


def mark_email_verified(user_id: str):
    """Calls u_set_email_verified stored function."""
    fn_scalar("u_set_email_verified", [str(user_id)])
