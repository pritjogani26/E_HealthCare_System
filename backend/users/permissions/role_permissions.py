# backend/users/permissions/role_permissions.py

from rest_framework.permissions import BasePermission
from ..models import UserRole


class IsAdminOrStaff(BasePermission):
    """
    Allows access only to users with ADMIN or STAFF role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in [UserRole.ADMIN, UserRole.STAFF]


class IsPatient(BasePermission):
    """
    Allows access only to users with PATIENT role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role == UserRole.PATIENT


class IsDoctor(BasePermission):
    """
    Allows access only to users with DOCTOR role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role == UserRole.DOCTOR


class IsLab(BasePermission):
    """
    Allows access only to users with LAB role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role == UserRole.LAB
