# backend/db/verification_queries.py

import uuid
import logging

from users.database_queries.connection import execute, fetchscalar, fn_fetchone, fn_scalar


def _get_verification_type_id(name: str) -> int:
    return fetchscalar(
        "SELECT id FROM verification_types WHERE name=%s LIMIT 1", [name]
    )


def create_email_verification_token(user_id: str, expires_hours: int = 24) -> str:
    token = str(uuid.uuid4())
    vtype_id = _get_verification_type_id("email_verification")

    execute(
        "UPDATE email_verification_table SET is_used=TRUE WHERE user_id=%s AND is_used=FALSE AND verification_type_id=%s",
        [str(user_id), vtype_id],
    )

    fn_fetchone(
        "auth_create_verification",
        [user_id, vtype_id, token, None, (expires_hours * 60)],
    )

    return token


def get_verification_record(token: str) -> dict | None:
    return fn_fetchone("auth_verify_token", [token])


def create_password_reset_token(user_id: str, expires_minutes: int = 60) -> str:
    token = str(uuid.uuid4())
    vtype_id = _get_verification_type_id("password_reset")

    execute(
        "UPDATE email_verification_table SET is_used=TRUE WHERE user_id=%s AND is_used=FALSE AND verification_type_id=%s",
        [str(user_id), vtype_id],
    )

    fn_fetchone(
        "auth_create_verification",
        [user_id, vtype_id, token, None, expires_minutes],
    )

    return token


def check_password_reset_token_validity(token: str) -> bool:
    count = fetchscalar('''
        SELECT count(*)
        FROM email_verification_table evt
        JOIN verification_types vt ON vt.id = evt.verification_type_id
        WHERE vt.name = 'password_reset'
          AND evt.token = %s
          AND evt.is_used = FALSE
          AND evt.expires_at > NOW()
    ''', [token])
    return count > 0


def execute_password_reset(token: str, new_password_hashed: str) -> bool:
    return fn_scalar("auth_reset_password", [token, new_password_hashed])

