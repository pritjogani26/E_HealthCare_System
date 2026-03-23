# backend/db/verification_queries.py

import uuid
import logging

from db.connection import execute, fetchscalar, fn_fetchone, fn_scalar


def _get_verification_type_id(name: str) -> int:
    return fetchscalar(
        "SELECT id FROM verification_types WHERE name=%s LIMIT 1", [name]
    )


def create_email_verification_token(user_id: str, expires_hours: int = 24) -> str:
    token = str(uuid.uuid4())
    vtype_id = _get_verification_type_id("email_verification")

    execute(
        "UPDATE email_verification_table SET is_used=TRUE WHERE user_id=%s AND is_used=FALSE",
        [str(user_id)],
    )

    fn_fetchone(
        "auth_create_verification",
        [user_id, vtype_id, token, None, (expires_hours * 60)],
    )

    return token


def get_verification_record(token: str) -> dict | None:
    return fn_fetchone("auth_verify_token", [token])
