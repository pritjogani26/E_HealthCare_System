from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.middleware.exceptions import AppException
from users.database_queries.error_logs_queries import get_error_logs, get_error_log_by_key

class ErrorLogsView(APIView):
    def get(self, request):
        if not getattr(request.user, "is_authenticated", False) or request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise AppException("Only administrators can view error logs.")

        limit = int(request.query_params.get("limit", 100))
        ref_from = request.query_params.get("ref_from", None)
        created_by = request.query_params.get("created_by", None)
        from_date = request.query_params.get("from_date", None)

        logs = get_error_logs(created_by, ref_from, from_date, limit)
        return Response({"success": True, "data": logs}, status=status.HTTP_200_OK)

class ErrorLogDetailView(APIView):
    def get(self, request, error_key):
        if not getattr(request.user, "is_authenticated", False) or request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise AppException("Only administrators can view error logs.")

        log = get_error_log_by_key(str(error_key))
        if not log:
            return Response({"success": False, "message": "Error log not found."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"success": True, "data": log}, status=status.HTTP_200_OK)
