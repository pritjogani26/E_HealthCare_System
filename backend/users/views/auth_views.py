# backend\users\views\auth_views.py
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from users.middleware.exceptions import (
    ValidationException,
    AuthenticationException,
    TokenExpiredException,
    PermissionException,
)
from ..services import AuthService, EmailService, password_service
from ..helpers import (
    set_auth_response_with_tokens,
    get_profile_data_by_role,
    set_refresh_token_cookie,
)
from ..jwt_auth import decode_refresh_token, rotate_refresh_token, UserWrapper
from ..serializers.user_serializers import (
    LoginSerializer,
    LogoutSerializer,
    ReAuthVerifySerializer,
)
import db.user_queries as uq
import db.audit_queries as aq
from ..services.success_response import send_success_msg


class LoginView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = uq.get_user_by_email(email)
        if not user:
            raise PermissionException("Invalid credentials.")

        is_locked, lock_msg = AuthService.check_account_lockout(user)
        if is_locked:
            raise PermissionException(lock_msg)

        is_active, active_msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(active_msg)

        if not password_service.verify_password(password, user.get("password", "")):
            _, msg = AuthService.handle_failed_login(user)
            raise PermissionException(msg)

        AuthService.handle_successful_login(user["user_id"])
        user = uq.get_user_by_id(user["user_id"])
        print(f"\nUser : {user}\n")
        user_permission = uq.get_user_permission_by_id(user["role_id"])
        print("\nuser_permission :\n")
        print(user_permission)
        response_dict, refresh_token = set_auth_response_with_tokens(
            user, "Login successful.", user_permission
        )
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, refresh_token)
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request: HttpRequest):
        response = Response({"success": True, "message": "Logged out successfully."})
        raw_token = request.COOKIES.get("refresh_token")
        if not raw_token:
            return response
        try:
            payload = decode_refresh_token(raw_token)
            aq.insert_auth_audit(payload["user_id"], "LOGOUT", "SUCCESS")
        except Exception:
            pass
        response.delete_cookie("refresh_token")
        return response


class RefreshTokenView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        raw_token = request.COOKIES.get("refresh_token")
        if not raw_token:
            raise TokenExpiredException("Refresh token is required.")

        user_dict, access_token, new_refresh_token = rotate_refresh_token(raw_token)
        profile_data = get_profile_data_by_role(UserWrapper(user_dict))

        response = Response(
            {
                "success": True,
                "message": "Token refreshed successfully.",
                "data": {"access_token": access_token, "user": profile_data},
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_token_cookie(response, new_refresh_token)
        return response


class GoogleAuthView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        from ..services.oauth_service import OAuthService

        token = request.data.get("token")
        if not token:
            raise ValidationException("Google token is required.")

        idinfo = OAuthService.verify_google_token(token)

        email = idinfo.get("email")
        if not email:
            raise AuthenticationException("Email not found in Google token payload.")

        user = uq.get_user_by_email(email)
        if not user:
            return Response(
                {
                    "success": True,
                    "registered": False,
                    "message": "User not registered. Please complete registration.",
                    "email": email,
                    "first_name": idinfo.get("given_name", ""),
                    "last_name": idinfo.get("family_name", ""),
                    "picture": idinfo.get("picture", ""),
                    "oauth_provider": "google",
                    "oauth_provider_id": idinfo.get("sub"),
                },
                status=status.HTTP_200_OK,
            )

        is_active, msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(msg)

        if not user.get("oauth_provider"):
            uq.update_oauth_provider(user["user_id"], "google", idinfo.get("sub"))
            user = uq.get_user_by_id(user["user_id"])

        AuthService.handle_successful_login(
            user["user_id"],
        )
        user_permission = uq.get_user_permission_by_id(user["role_id"])

        response_dict, rt = set_auth_response_with_tokens(
            user, "Google login successful.", user_permission
        )
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, rt)
        return response


class VerifyEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest):
        token = request.data.get("token")
        if not token:
            raise ValidationException("Verification token is required.")
        # verify_email_token raises on failure, returns None on success
        EmailService.verify_email_token(token)
        return send_success_msg(message="Email verified successfully.")


class ResendVerificationEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            raise ValidationException("Email is required.")
        EmailService.resend_verification_email(email)
        return send_success_msg(message="Verification email sent successfully.")


class ReAuthVerifyView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReAuthVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data["password"]

        user = uq.get_user_by_id(str(request.user.user_id))
        if not user:
            raise AuthenticationException("User not found.")

        is_locked, lock_msg = AuthService.check_account_lockout(user)
        if is_locked:
            raise PermissionException(lock_msg)

        is_active, active_msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(active_msg)

        if not password_service.verify_password(password, user.get("password", "")):
            _, msg = AuthService.handle_failed_login(user)
            raise AuthenticationException(msg)

        AuthService.handle_successful_login(user["user_id"])
        return send_success_msg(message="Re-authentication successful.")


class ForgotPasswordView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            raise ValidationException("Email is required.")
        user = uq.get_user_by_email(email)
        if not user:
            return send_success_msg(message="If the email exists, a password reset link has been sent.")
        
        EmailService.send_password_reset_email(user)
        return send_success_msg(message="If the email exists, a password reset link has been sent.")


class VerifyResetTokenView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            raise ValidationException("Verification token is required.")
        
        EmailService.check_password_reset_token(token)
        return send_success_msg(message="Token is valid.")


class ResetPasswordView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        if not token or not new_password:
            raise ValidationException("Token and new_password are required.")
        
        EmailService.check_password_reset_token(token)
        
        import db.email_queries as eq
        hashed_password = password_service.hash_password(new_password)
        try:
            success = eq.execute_password_reset(token, hashed_password)
            if success:
                return send_success_msg(message="Password updated successfully.")
            else:
                raise ValidationException("Could not reset password. Invalid or expired link.")
        except Exception as e:
            if str(e) == "INVALID_TOKEN":
                raise ValidationException("Invalid or expired password reset token.")
            raise