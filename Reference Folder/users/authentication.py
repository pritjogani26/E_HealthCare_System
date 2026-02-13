# Hospital_Management\backend\users\authentication.py
from django.http import HttpRequest
from rest_framework import authentication, exceptions
from .user_service.jwt_utils import decode_token
from rest_framework.exceptions import AuthenticationFailed


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication class for DRF.
    Extracts JWT token from Authorization header and validates it.
    """

    def authenticate(self, request: HttpRequest):

        if hasattr(request, "user_id"):
            user_id = request.user_id
            token = request.token
            print("Get User_Id from request.")
        else:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return None  # no auth attempted

            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                raise AuthenticationFailed("Invalid Authorization header format")

            token = parts[1]

            try:
                # Decode and validate token
                user_id = decode_token(token)
            except AuthenticationFailed:
                print("\n\nExpired Token\n\n")
                raise
            except Exception:
                raise AuthenticationFailed("Invalid token")

        class AuthenticatedUser:
            def __init__(self, user_id):
                self.id = user_id
                self.user_id = user_id
                self.is_authenticated = True
                self.is_anonymous = False

            def get_username(self):
                return str(self.user_id)

        user = AuthenticatedUser(user_id)
        return (user, token)

    def authenticate_header(self, request):
        return "Bearer"
