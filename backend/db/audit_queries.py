import uuid

from db.connection import fn_scalar, fn_fetchall


def insert_audit_log(
    performed_by_id: uuid,
    target_user_id: uuid,
    action: str,
    entity_type: str,
    details: str,
    status: str = "SUCCESS",
) -> None:
    import json

    fn_scalar(
        "a_insert_audit_log",
        [performed_by_id, target_user_id, action, entity_type, status, details, status],
    )


def get_recent_activity(limit: int = 50, exclude_actions: tuple = ()) -> list:
    rows = fn_fetchall("o_get_audit_logs", [limit])
    if exclude_actions:
        rows = [r for r in rows if r.get("action") not in exclude_actions]
    return rows
