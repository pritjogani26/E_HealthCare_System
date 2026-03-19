from rest_framework.permissions import BasePermission
from users.models import UserRole


class IsAdminOrStaff(BasePermission):
    message = "Access denied. Admin or Staff role required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in [UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN]


class IsSuperAdmin(BasePermission):
    message = "Access denied. Superadmin role required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) == UserRole.SUPERADMIN
