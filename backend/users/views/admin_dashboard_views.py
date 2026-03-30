# backend\users\views\admin_dashboard_views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..services import AdminService
from ..services.success_response import send_success_msg


class PendingApprovalsCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return send_success_msg(AdminService.get_pending_approvals_count())

