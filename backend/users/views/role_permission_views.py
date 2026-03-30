# backend\users\views\role_permission_views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..permissions import IsSuperAdmin
from users.middleware.exceptions import ValidationException, NotFoundException
import db.role_permission_queries as rpq
from ..services.success_response import send_success_msg


class RoleListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        roles = rpq.get_all_roles()
        # Serialise datetime fields so they are JSON-safe
        for r in roles:
            for key in ("created_at", "updated_at"):
                if r.get(key):
                    r[key] = r[key].isoformat()
        return send_success_msg(roles)


class PermissionListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        module = request.query_params.get("module") or None
        perms = rpq.get_all_permissions(module)
        for p in perms:
            for key in ("created_at", "updated_at"):
                if p.get(key):
                    p[key] = p[key].isoformat()
        return send_success_msg(perms)


class RolePermissionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, role_id):
        perms = rpq.get_permissions_by_role(role_id)
        for p in perms:
            if p.get("grant_at"):
                p["grant_at"] = p["grant_at"].isoformat()
        return send_success_msg(perms)


class GrantPermissionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id):
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
        return send_success_msg(message=msg or "Permission granted.")


class RevokePermissionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id):
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
        return send_success_msg(message=msg or "Permission revoked.")


class SyncRolePermissionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, role_id):
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
        return send_success_msg(message=msg or "Permissions synced.")
