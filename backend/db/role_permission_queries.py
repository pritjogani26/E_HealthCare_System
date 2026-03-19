# backend/db/role_permission_queries.py
"""
DB query helpers that map directly to the SQL functions:
  r_get_all_roles, r_get_permissions, r_get_permissions_by_role,
  r_grant_permission_to_role, r_revoke_permission_from_role,
  r_sync_role_permissions
"""
from db.connection import fn_fetchall, fn_fetchone, fn_scalar


# ── Roles ─────────────────────────────────────────────────────────────────────

def get_all_roles():
    """Return all rows from user_roles ordered by role_id."""
    return fn_fetchall("r_get_all_roles", [])


def get_role_by_id(role_id: int):
    """Return a single user_roles row or None."""
    return fn_fetchone("r_get_role_by_id", [role_id])


# ── Permissions ───────────────────────────────────────────────────────────────

def get_all_permissions(module: str = None):
    """Return all permissions, optionally filtered by module."""
    return fn_fetchall("r_get_permissions", [module])


# ── Role ↔ Permission ─────────────────────────────────────────────────────────

def get_permissions_by_role(role_id: int):
    """Return all permissions assigned to a role (with grant_at)."""
    return fn_fetchall("r_get_permissions_by_role", [role_id])


def grant_permission_to_role(role_id: int, permission_id: int, grant_by=None):
    """Grant a single permission to a role."""
    return fn_scalar("r_grant_permission_to_role", [role_id, permission_id, grant_by])


def revoke_permission_from_role(role_id: int, permission_id: int):
    """Revoke a single permission from a role."""
    return fn_scalar("r_revoke_permission_from_role", [role_id, permission_id])


def sync_role_permissions(role_id: int, permission_ids: list, grant_by=None):
    """Replace the entire permission set of a role atomically."""
    return fn_scalar("r_sync_role_permissions", [role_id, permission_ids, grant_by])
