# backend\users\views\profile_views.py

from django.http import HttpRequest
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.middleware.exceptions import (
    PermissionException,
)
from ..models import UserRole
from ..helpers import (
    get_profile_data_by_role,
)
from ..serializers.user_serializers import (
    UserSerializer,
)
import db.user_queries as uq
from ..services.success_response import send_success_msg


class CurrentUserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: HttpRequest):
        return send_success_msg(get_profile_data_by_role(request.user))


class AdminStaffProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        if getattr(request.user, "role", None) not in [UserRole.ADMIN, UserRole.STAFF]:
            raise PermissionException("Access denied. Admin or Staff role required.")
        user = uq.get_user_by_id(str(request.user.user_id)) or {}
        return send_success_msg(UserSerializer(user).data)
