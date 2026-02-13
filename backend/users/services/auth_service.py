# backend/users/services/auth_service.py

from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import AccountStatus, UserTokens

User = get_user_model()


class AuthService:
    """
    Service layer for authentication-related operations.
    Handles login, logout, and account security logic.
    """

    @staticmethod
    def check_account_lockout(user):
        """
        Check if user account is locked due to failed login attempts.
        
        Args:
            user: User instance
        
        Returns:
            tuple: (is_locked: bool, message: str or None)
        """
        if user.lockout_until and user.lockout_until > timezone.now():
            lock_msg = f"Account is locked. Try again after {user.lockout_until.strftime('%Y-%m-%d %H:%M:%S')}"
            return True, lock_msg
        return False, None

    @staticmethod
    def check_account_status(user):
        """
        Check if user account is active and not suspended/deleted.
        
        Args:
            user: User instance
        
        Returns:
            tuple: (is_valid: bool, message: str or None)
        """
        if user.account_status == AccountStatus.SUSPENDED:
            return False, "Your account has been suspended. Please contact support."
        
        if user.account_status == AccountStatus.DELETED:
            return False, "This account has been deleted."
        
        if not user.is_active:
            return False, "Your account is inactive. Please contact support."
        
        return True, None

    @staticmethod
    def authenticate_user(request, email, password):
        """
        Authenticate user with email and password.
        
        Args:
            request: Django request object
            email: User email
            password: User password
        
        Returns:
            User instance if authenticated, None otherwise
        """
        return authenticate(request, email=email, password=password)

    @staticmethod
    def handle_failed_login(user):
        """
        Handle failed login attempt and account lockout logic.
        
        Args:
            user: User instance
        
        Returns:
            tuple: (should_lock: bool, message: str)
        """
        user.failed_login_attempts += 1

        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.lockout_until = timezone.now() + timedelta(minutes=30)
            user.save()
            return True, "Too many failed login attempts. Account locked for 30 minutes."

        user.save()
        return False, "Invalid credentials"

    @staticmethod
    def handle_successful_login(user):
        """
        Reset failed login attempts and update last login time.
        
        Args:
            user: User instance
        """
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.last_login_at = timezone.now()
        user.save()

    @staticmethod
    def revoke_refresh_token(refresh_token, user):
        """
        Revoke a user's refresh token.
        
        Args:
            refresh_token: Token string to revoke
            user: User instance
        
        Returns:
            bool: True if token was revoked, False if not found
        """
        try:
            token = UserTokens.objects.get(
                refresh_token=refresh_token,
                user=user
            )
            token.is_revoked = True
            token.save()
            return True
        except UserTokens.DoesNotExist:
            return False