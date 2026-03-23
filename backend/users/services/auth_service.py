# backend\users\services\auth_service.py
from django.utils import timezone
from db.audit_queries import insert_auth_audit
from db.connection import fn_scalar
import db.user_queries as uq

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class AuthService:
    @staticmethod
    def check_account_lockout(user: dict):
        lockout_until = user.get("lockout_until")
        if lockout_until and lockout_until > timezone.now():
            unlock_time = lockout_until.strftime("%Y-%m-%d %H:%M:%S UTC")
            insert_auth_audit(
                user_id=user["user_id"],
                action="USER_LOGIN",
                status="FAILURE",
                reason="User Account is locked.",
            )
            return True, f"Account is locked. Try again after {unlock_time}."
        return False, None

    @staticmethod
    def check_account_status(user: dict):
        if not user.get("is_active", False):
            insert_auth_audit(
                user_id=user["user_id"],
                action="USER_LOGIN",
                status="FAILURE",
                reason="User Account is inactive",
            )
            return False, "Your account is inactive. Please contact support."
        return True, None

    @staticmethod
    def handle_failed_login(user: dict, failure_reason: str = "Invalid password"):
        return uq.handle_failed_login(
            user,
            max_attempts=MAX_FAILED_ATTEMPTS,
            lockout_minutes=LOCKOUT_MINUTES,
            failure_reason=failure_reason,
        )

    @staticmethod
    def handle_successful_login(user_id: str):
        fn_scalar("auth_login_success", [str(user_id)])
