import logging
from django.db import connection

logger = logging.getLogger(__name__)


def execute(sql: str, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        return cursor.rowcount


def fetchone(sql: str, params=None):
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params or [])
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            if row is None:
                return None
            return dict(zip(columns, row))
    except Exception:
        logger.exception("Failed to fetch a single row")
        raise


def fetchall(sql: str, params=None):
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params or [])
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
    except Exception:
        logger.exception("Failed to fetch rows")
        raise


def fetchscalar(sql: str, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        row = cursor.fetchone()
        return row[0] if row else None


def fn_fetchone(fn_name: str, params=None):
    placeholders = ", ".join(["%s"] * len(params or []))
    sql = f"SELECT * FROM {fn_name}({placeholders})"
    return fetchone(sql, params)


def fn_fetchall(fn_name: str, params=None):
    placeholders = ", ".join(["%s"] * len(params or []))
    sql = f"SELECT * FROM {fn_name}({placeholders})"
    return fetchall(sql, params)


def fn_scalar(fn_name: str, params=None):
    placeholders = ", ".join(["%s"] * len(params or []))
    sql = f"SELECT {fn_name}({placeholders})"
    return fetchscalar(sql, params)


def fn_execute(fn_name: str, params=None):
    placeholders = ", ".join(["%s"] * len(params or []))
    sql = f"SELECT {fn_name}({placeholders})"
    return execute(sql, params)