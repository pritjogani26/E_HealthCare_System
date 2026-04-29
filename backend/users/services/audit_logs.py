# backend\users\services\audit_logs.py
import json
import uuid
import threading
from datetime import datetime, date, time
from decimal import Decimal
from users.database_queries.connection import fn_scalar, fn_fetchall


_thread_locals = threading.local()


class AuditJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def to_json(data):
    if data is None:
        return None
    return json.dumps(data, cls=AuditJSONEncoder)


def set_request_context(ip_address=None, user_agent=None):
    _thread_locals.ip_address = ip_address
    _thread_locals.user_agent = user_agent


def reset_audit_flag():
    _thread_locals.audit_logged = False


def mark_audit_logged():
    _thread_locals.audit_logged = True


def was_audit_logged():
    return getattr(_thread_locals, "audit_logged", False)


def get_request_context():
    return {
        "ip_address": getattr(_thread_locals, "ip_address", None),
        "user_agent": getattr(_thread_locals, "user_agent", None),
    }


def insert_audit_log(
    user_id,
    action,
    status="SUCCESS",
    targeted_user_id=None,
    table_name=None,
    row_id=None,
    old_data=None,
    new_data=None,
    failure_reason=None,
    request=None,
):
    if not action:
        raise ValueError("audit action is required")

    ip_address = None
    user_agent = None

    if request:
        ip_address = get_client_ip(request)
        user_agent = get_client_user_agent(request)
    else:
        ctx = get_request_context()
        ip_address = ctx["ip_address"]
        user_agent = ctx["user_agent"]

    old_diff, new_diff = generate_diff(old_data, new_data)
    audit_id = fn_scalar(
        "a_insert_audit_log",
        [
            str(user_id),
            str(targeted_user_id) if targeted_user_id else None,
            table_name,
            str(row_id) if row_id else None,
            action,
            status,
            to_json(old_diff),
            to_json(new_diff),
            failure_reason,
            ip_address,
            user_agent,
        ],
    )
    mark_audit_logged()
    return audit_id


def get_audit_logs(
    user_id=None,
    targeted_user_id=None,
    table_name=None,
    row_id=None,
    action=None,
    status=None,
    from_date=None,
    to_date=None,
    limit=50,
    offset=0,
):
    return fn_fetchall(
        "a_get_audit_logs",
        [
            str(user_id) if user_id else None,
            str(targeted_user_id) if targeted_user_id else None,
            table_name,
            str(row_id) if row_id else None,
            action,
            status,
            from_date,
            to_date,
            limit,
            offset,
        ],
    )


def get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_client_user_agent(request):
    return request.META.get("HTTP_USER_AGENT", "unknown")


def generate_diff(old_data, new_data):
    if old_data is None and new_data is not None:
        return None, new_data
    elif old_data is not None and new_data is None:
        return old_data, None
    elif old_data is not None and new_data is not None:
        if isinstance(old_data, dict) and isinstance(new_data, dict):
            diff_old, diff_new = {}, {}
            for key in set(old_data) | set(new_data):
                if old_data.get(key) != new_data.get(key):
                    diff_old[key] = old_data.get(key)
                    diff_new[key] = new_data.get(key)
            return diff_old, diff_new
        return old_data, new_data
    return None, None