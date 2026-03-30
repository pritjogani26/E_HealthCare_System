# backend\users\views\audit_views.py
from datetime import datetime
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.middleware.exceptions import (
    ValidationException,
)
from ..services import download_audit_service
from ..serializers.user_serializers import (
    AuditLogsDownload,
)
import db.audit_queries as aq
from ..services.success_response import send_success_msg


class RecentActivityView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    EXCLUDED_ACTIONS = ()
    serializer_class = AuditLogsDownload

    def get(self, request):
        rows = aq.get_recent_activity(limit=100)
        data = [
            {
                "log_id": r["log_id"],
                "action": r["action"],
                "entity_type": r.get("entity_type"),
                "details": r.get("details"),
                "status": r.get("status"),
                "performed_by": r.get("performed_by_email"),
                "target_user": r.get("target_user_email"),
                "ip_address": str(r["ip_address"]) if r.get("ip_address") else None,
                "request_path": r.get("request_path"),
                "duration_ms": r.get("duration_ms"),
                "timestamp": (
                    r["created_at"].isoformat() if r.get("created_at") else None
                ),
            }
            for r in rows
        ]
        print(f"\n\nLength of Audit Logs : {len(rows)}")
        return send_success_msg(data)

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.validated_data["status"]
        file_type = serializer.validated_data["type"]

        print(f"\n\nStatus : {status} \nType : {file_type}")

        rows = aq.get_recent_activity(limit=100)
        # print(f"Rows : {rows}")
        # for r in rows:
        #     print("Status of Row is ", end="  ")
        #     print(r.get("status"), end="\n")

        rows = [r for r in rows if r.get("status") == status or status == "ALL"]
        # print(rows)

        data = [
            {
                "log_id": str(r["log_id"]),
                "action": str(r["action"]),
                "entity_type": str(r.get("entity_type")),
                "details": str(r.get("details")),
                "status": str(r.get("status")),
                "performed_by": str(r.get("performed_by_email")),
                "target_user": str(r.get("target_user_email")),
                "ip_address": str((r["ip_address"])) if r.get("ip_address") else None,
                "request_path": str(r.get("request_path")),
                "duration_ms": str(r.get("duration_ms")),
                "timestamp": (
                    r["created_at"].isoformat() if r.get("created_at") else None
                ),
            }
            for r in rows
        ]
        print(f"\n\nLength of Audit Logs : {len(rows)}")

        filename = (
            f"audit_logs_{status.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        if file_type == "CSV":
            return download_audit_service.generate_csv(data, filename)
        elif file_type == "PDF":
            return download_audit_service.generate_pdf(data, filename)

        else:
            raise ValidationException
