from django.utils import timezone
from db.connection import execute
import db.user_queries as uq

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


class AuthService:
    @staticmethod
    def check_account_lockout(user: dict):
        lockout_until = user.get("lockout_until")
        if lockout_until and lockout_until > timezone.now():
            unlock_time = lockout_until.strftime("%Y-%m-%d %H:%M:%S UTC")
            return True, f"Account is locked. Try again after {unlock_time}."
        return False, None

    @staticmethod
    def check_account_status(user: dict):
        if not user.get("is_active", False):
            return False, "Your account is inactive. Please contact support."
        return True, None



    @staticmethod
    def handle_failed_login(user: dict):
        return uq.handle_failed_login(user, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES)

    @staticmethod
    def handle_successful_login(user_id: str):
        execute(
            """
            select auth_login_success(%s)
            """,
            [user_id],
        )