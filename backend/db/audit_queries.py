from db.connection import fn_scalar, fn_fetchall


def insert_audit_log(
    action: str,
    details: str,
    entity_type: str = None,
    entity_name: str = None,
    performed_by_id: str = None,
    target_user_id: str = None,
    status: str = "SUCCESS",
    changes: dict = None,
    ip_address: str = None,
    user_agent: str = None,
    duration_ms: int = None,
    request_path: str = None,
) -> None:
    import json

    detail_parts = [details] if details else []
    if entity_name:
        detail_parts.append(f"entity={entity_name}")
    if changes:
        detail_parts.append(f"changes={json.dumps(changes)}")
    full_details = " | ".join(detail_parts) if detail_parts else ""
    fn_scalar(
        "a_insert_audit_log",
        [
            str(performed_by_id) if performed_by_id else None,
            str(target_user_id) if target_user_id else None,
            action,
            entity_type,
            full_details,
            status,
            ip_address,
            user_agent,
            duration_ms,
            request_path,
        ],
    )


def get_recent_activity(limit: int = 50, exclude_actions: tuple = ()) -> list:
    rows = fn_fetchall("o_get_audit_logs", [limit])
    if exclude_actions:
        rows = [r for r in rows if r.get("action") not in exclude_actions]
    return rows
