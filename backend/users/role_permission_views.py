# backend/users/role_permission_views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .permissions import IsSuperAdmin
from common.exceptions import ValidationException, NotFoundException
import db.role_permission_queries as rpq


def _ok(data=None, message="Success", http_status=status.HTTP_200_OK):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)



class RoleListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, *args, **kwargs):
        roles = rpq.get_all_roles()
        # Serialise datetime fields so they are JSON-safe
        for r in roles:
            for key in ("created_at", "updated_at"):
                if r.get(key):
                    r[key] = r[key].isoformat()
        return _ok(roles)



class PermissionListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, *args, **kwargs):
        module = request.query_params.get("module") or None
        perms = rpq.get_all_permissions(module)
        for p in perms:
            for key in ("created_at", "updated_at"):
                if p.get(key):
                    p[key] = p[key].isoformat()
        return _ok(perms)



class RolePermissionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, role_id, *args, **kwargs):
        perms = rpq.get_permissions_by_role(role_id)
        for p in perms:
            if p.get("grant_at"):
                p["grant_at"] = p["grant_at"].isoformat()
        return _ok(perms)



class GrantPermissionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id, *args, **kwargs):
        permission_id = request.data.get("permission_id")
        if permission_id is None:
            raise ValidationException("permission_id is required.")
        try:
            msg = rpq.grant_permission_to_role(
                role_id=int(role_id),
                permission_id=int(permission_id),
                grant_by=str(request.user.user_id),
            )
        except Exception as exc:
            raise ValidationException(str(exc))
        return _ok(message=msg or "Permission granted.")



class RevokePermissionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id, *args, **kwargs):
        permission_id = request.data.get("permission_id")
        if permission_id is None:
            raise ValidationException("permission_id is required.")
        try:
            msg = rpq.revoke_permission_from_role(
                role_id=int(role_id),
                permission_id=int(permission_id),
            )
        except Exception as exc:
            raise ValidationException(str(exc))
        return _ok(message=msg or "Permission revoked.")



class SyncRolePermissionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id, *args, **kwargs):
        permission_ids = request.data.get("permission_ids")
        if permission_ids is None or not isinstance(permission_ids, list):
            raise ValidationException("permission_ids must be an array.")
        try:
            msg = rpq.sync_role_permissions(
                role_id=int(role_id),
                permission_ids=[int(pid) for pid in permission_ids],
                grant_by=str(request.user.user_id),
            )
        except Exception as exc:
            raise ValidationException(str(exc))
        return _ok(message=msg or "Permissions synced.")
