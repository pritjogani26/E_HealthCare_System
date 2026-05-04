# backend/users/database_queries/error_logs_queries.py

import sys
import traceback
import logging

from users.database_queries.connection import fn_fetchone

logger = logging.getLogger(__name__)

_SKIP_MESSAGES = (
    "Access token has expired.",
    "Token is expired",
)

def _should_skip(exception) -> bool:
    if exception is None:
        return False

    exc_message   = str(exception)

    if any(msg in exc_message for msg in _SKIP_MESSAGES):
        return True

    return False


def _build_description(description=None, exception=None) -> str:
    if exception is None:
        _, exc_value, _ = sys.exc_info()
        if exc_value is not None:
            exception = exc_value

    if exception is not None:
        tb_lines = traceback.format_exception(
            type(exception), exception, exception.__traceback__
        )
        return "".join(tb_lines).strip()

    if description:
        return description.strip()

    return "Unknown error (no exception or description provided)"


def log_error_to_db(request=None, description=None, exception=None):
    try:
        if _should_skip(exception):
            return

        ref_from = request.path if request else None

        created_by = None
        if request and hasattr(request, "user") and request.user:
            if getattr(request.user, "is_authenticated", False):
                created_by = (
                    getattr(request.user, "user_id", None)
                    or getattr(request.user, "id", None)
                )

        final_description = _build_description(
            description=description,
            exception=exception,
        )
        print(f"\n\nHandle in fn.")
        print(f"description : {description}")
        print(f"exception : {exception}")

        fn_fetchone("insert_error_log", [ref_from, final_description, created_by])

    except Exception as e:
        logger.error("[log_error_to_db] Failed to persist error log: %s", e, exc_info=True)


def get_error_logs(created_by=None, ref_from=None, from_date=None, limit=100) -> list:

    from django.db import connection

    parts = []
    params = []

    if created_by is not None:
        parts.append("p_created_by => %s")
        params.append(created_by)
    if ref_from is not None:
        parts.append("p_ref_from => %s")
        params.append(ref_from)
    if from_date is not None:
        parts.append("p_from => %s")
        params.append(from_date)

    parts.append("p_limit => %s")
    params.append(limit)

    sql = f"SELECT * FROM get_error_logs({', '.join(parts)})"

    from users.database_queries.connection import fetchall
    return fetchall(sql, params)


def get_error_log_by_key(error_key: str) -> dict | None:
    from users.database_queries.connection import fn_fetchone
    return fn_fetchone("get_error_log_by_key", [error_key])