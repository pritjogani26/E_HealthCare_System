# backend/users/permissions/__init__.py

from .role_permissions import IsAdminOrStaff, IsPatient, IsDoctor, IsLab

__all__ = [
    'IsAdminOrStaff',
    'IsPatient',
    'IsDoctor',
    'IsLab',
]
