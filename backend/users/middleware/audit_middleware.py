# backend\users\middleware\audit_middleware.py
from users.services.audit_logs import (
    set_request_context,
    insert_audit_log,
    reset_audit_flag,
    was_audit_logged,
)

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        reset_audit_flag()
        set_request_context(
            ip_address=self._get_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        response = self.get_response(request)
        self._log_mutation_audit(request, response)
        return response

    def _get_ip(self, request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")

    def _log_mutation_audit(self, request, response):
        if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
            return

        if was_audit_logged():
            return

        user = getattr(request, "user", None)
        user_id = getattr(user, "user_id", None) if user and user.is_authenticated else None
        if not user_id:
            return

        action = self._build_action(request)
        target_id = self._extract_target_id(request)
        status = "SUCCESS" if getattr(response, "status_code", 500) < 400 else "FAILURE"
        failure_reason = self._extract_failure_reason(response) if status == "FAILURE" else None
        request_payload = self._safe_request_data(request)
        response_payload = self._safe_response_data(response)

        insert_audit_log(
            user_id=user_id,
            targeted_user_id=target_id,
            row_id=target_id,
            table_name=self._guess_table_name(request),
            action=action,
            status=status,
            old_data=request_payload if request.method in ("PUT", "PATCH", "DELETE") else None,
            new_data=response_payload if request.method in ("POST", "PUT", "PATCH") else None,
            failure_reason=failure_reason,
        )

    def _build_action(self, request):
        resolver = getattr(request, "resolver_match", None)
        if resolver and resolver.url_name:
            base = resolver.url_name.replace("-", "_").upper()
            return f"{request.method}_{base}"
        path_action = request.path.strip("/").replace("/", "_").replace("-", "_").upper()
        return f"{request.method}_{path_action}"

    def _guess_table_name(self, request):
        parts = [p for p in request.path.strip("/").split("/") if p and p != "api"]
        return parts[0] if parts else "unknown"

    def _extract_target_id(self, request):
        resolver = getattr(request, "resolver_match", None)
        kwargs = resolver.kwargs if resolver else {}
        for key in ("user_id", "patient_id", "doctor_id", "lab_id", "booking_id", "id"):
            value = kwargs.get(key)
            if value:
                return str(value)
        return None

    def _safe_request_data(self, request):
        try:
            data = request.data
            if hasattr(data, "dict"):
                return data.dict()
            return data
        except Exception:
            return None

    def _safe_response_data(self, response):
        data = getattr(response, "data", None)
        if isinstance(data, dict) and "data" in data:
            return data.get("data")
        return data

    def _extract_failure_reason(self, response):
        data = getattr(response, "data", None)
        if isinstance(data, dict):
            return data.get("message") or data.get("detail")
        return None