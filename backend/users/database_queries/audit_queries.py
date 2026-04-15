# backend\users\database_queries\audit_queries.py
import uuid

from users.database_queries.connection import fn_scalar, fn_fetchall


def get_audit_logs(
    user_id: uuid.UUID = None,
    targeted_user_id: uuid.UUID = None,
    table_name: str = None,
    row_id: str = None,
    action: str = None,
    status: str = None,
    from_date: str = None,
    to_date: str = None,
    limit: int = 100,
    offset: int = 0,
) -> list:
    rows = fn_fetchall(
        "a_get_audit_logs",
        [
            user_id,
            targeted_user_id,
            table_name,
            row_id,
            action,
            status,
            from_date,
            to_date,
            limit,
            offset,
        ],
    )
    return rows


from users.database_queries.connection import fn_scalar


def insert_auth_audit(user_id, action, status, reason=None):
    fn_scalar(
        "a_auth_audit_fn",
        [user_id, action, status, reason],
    )
