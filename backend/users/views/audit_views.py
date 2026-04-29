# backend\users\views\audit_views.py
from datetime import datetime
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
import json

from users.middleware.exceptions import (
    ValidationException,
)
from ..services import download_audit_service
from ..serializers.user_serializers import (
    AuditLogsDownload,
)
import users.database_queries.audit_queries as aq
from ..services.success_response import send_success_msg


class AuditLogsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    EXCLUDED_ACTIONS = ()
    serializer_class = AuditLogsDownload

    def get(self, request):
        is_admin = request.user.role in ["ADMIN", "SUPERADMIN", "STAFF"]
        user_id = None if is_admin else request.user.user_id

        rows = aq.get_audit_logs(user_id=user_id, limit=100)
        data = [
            {
                "audit_id":          r["audit_id"],
                "user_id":           str(r["user_id"]),
                "user_email":        r.get("user_email"),
                "targeted_user_id":  str(r["targeted_user_id"]) if r.get("targeted_user_id") else None,
                "targeted_user_email": r.get("targeted_user_email"),
                "table_name":        r.get("table_name"),
                "row_id":            r.get("row_id"),
                "action":            r["action"],
                "status":            r["status"],
                "old_data":          json.loads(r["old_data"]) if r.get("old_data") else None,
                "new_data":          json.loads(r["new_data"]) if r.get("new_data") else None,
                "failure_reason":    r.get("failure_reason"),
                "ip_address":        str(r["ip_address"]) if r.get("ip_address") else None,
                "user_agent":        r.get("user_agent"),
                "created_at":        r["created_at"].isoformat() if r.get("created_at") else None,
            }
            for r in rows
        ]
        return send_success_msg(data)


    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.validated_data["status"]
        file_type = serializer.validated_data["type"]

        is_admin = request.user.role in ["ADMIN", "SUPERADMIN", "STAFF"]
        user_id = None if is_admin else request.user.user_id

        rows = aq.get_audit_logs(
            user_id=user_id,
            status=None if status == "ALL" else status,
            limit=100,
        )
        data = [
            {
                "audit_id": str(r["audit_id"]),
                "user_id": str(r["user_id"]) if r.get("user_id") else None,
                "user_email": r.get("user_email"),
                "targeted_user_id": str(r["targeted_user_id"]) if r.get("targeted_user_id") else None,
                "targeted_user_email": r.get("targeted_user_email"),
                "table_name": r.get("table_name"),
                "row_id": r.get("row_id"),
                "action": r.get("action"),
                "status": r.get("status"),
                "old_data": r.get("old_data"),
                "new_data": r.get("new_data"),
                "failure_reason": r.get("failure_reason"),
                "ip_address": str((r["ip_address"])) if r.get("ip_address") else None,
                "user_agent": r.get("user_agent"),
                "created_at": (
                    r["created_at"].isoformat() if r.get("created_at") else None
                ),
            }
            for r in rows
        ]

        filename = (
            f"audit_logs_{status.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        if file_type == "CSV":
            return download_audit_service.generate_csv(data, filename)
        elif file_type == "PDF":
            return download_audit_service.generate_pdf(data, filename)

        else:
            raise ValidationException
