# backend/db/role_permission_queries.py
from db.connection import fn_fetchall, fn_fetchone, fn_scalar


# ── Roles ─────────────────────────────────────────────────────────────────────

def get_all_roles():
    return fn_fetchall("r_get_all_roles", [])


def get_role_by_id(role_id: int):
    return fn_fetchone("r_get_role_by_id", [role_id])


# ── Permissions ───────────────────────────────────────────────────────────────

def get_all_permissions(module: str = None):
    return fn_fetchall("r_get_permissions", [module])


# ── Role ↔ Permission ─────────────────────────────────────────────────────────

def get_permissions_by_role(role_id: int):
    return fn_fetchall("r_get_permissions_by_role", [role_id])


def grant_permission_to_role(role_id: int, permission_id: int, grant_by=None):
    return fn_scalar("r_grant_permission_to_role", [role_id, permission_id, grant_by])


def revoke_permission_from_role(role_id: int, permission_id: int):
    return fn_scalar("r_revoke_permission_from_role", [role_id, permission_id])


def sync_role_permissions(role_id: int, permission_ids: list, grant_by=None):
    return fn_scalar("r_sync_role_permissions", [role_id, permission_ids, grant_by])
