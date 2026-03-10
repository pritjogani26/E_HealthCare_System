"""
PyJWT-based token generation and authentication backend.
"""

import uuid
import jwt
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from db import user_queries


def access_exp() -> timedelta:
    # BUG FIX: was "JWTaccess_expIRE_MINUTES" (typo) → correct setting name
    return timedelta(minutes=getattr(settings, "JWT_ACCESS_EXPIRE_MINUTES", 15))


def _refresh_exp() -> timedelta:
    return timedelta(days=getattr(settings, "JWT_REFRESH_EXPIRE_DAYS", 7))


def _secret() -> str:
    return settings.SECRET_KEY


ALGORITHM = "HS256"


class TokenUser:
    """
    Lightweight object that quacks like request.user for DRF.
    Populated from JWT payload — no DB hit on every request.
    """

    def __init__(self, payload: dict):
        self.user_id = payload.get("user_id")
        self.email = payload.get("email", "")
        self.role = payload.get("role", "patient")
        self.is_active = payload.get("is_active", True)
        self.is_authenticated = True
        self._payload = payload

    def __str__(self):
        return self.email

    def __bool__(self):
        return True


class UserWrapper:
    """Wraps a raw user dict from DB to expose attribute-style access."""

    def __init__(self, user_dict: dict):
        self._d = user_dict

    def __getattr__(self, item):
        if item.startswith("_"):
            raise AttributeError(item)
        return self._d.get(item)

    def __bool__(self):
        return bool(self._d)

    @property
    def is_authenticated(self):
        return True

    @property
    def pk(self):
        return self._d.get("user_id")

    def __eq__(self, other):
        if isinstance(other, UserWrapper):
            return str(self.user_id) == str(other.user_id)
        if isinstance(other, dict):
            return str(self.user_id) == str(other.get("user_id"))
        return NotImplemented

    def __hash__(self):
        return hash(str(self.user_id))


def generate_tokens(user) -> dict:
    if isinstance(user, dict):
        user = UserWrapper(user)
    now = timezone.now()
    access_payload = {
        "token_type": "access",
        "jti": str(uuid.uuid4()),
        "user_id": str(user.user_id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "iat": int(now.timestamp()),
        "exp": int((now + access_exp()).timestamp()),
    }
    refresh_payload = {
        "token_type": "refresh",
        "jti": str(uuid.uuid4()),
        "user_id": str(user.user_id),
        "email": user.email,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + _refresh_exp()).timestamp()),
    }
    access_token = jwt.encode(access_payload, _secret(), algorithm=ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, _secret(), algorithm=ALGORITHM)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": int(access_exp().total_seconds()),
    }


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    if payload.get("token_type") != "access":
        raise jwt.InvalidTokenError("Not an access token")
    return payload


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    if payload.get("token_type") != "refresh":
        raise jwt.InvalidTokenError("Not a refresh token")
    return payload


def rotate_refresh_token(old_refresh_token: str) -> tuple[dict, str, str]:
    """
    Validate old refresh token, issue fresh access + refresh pair.
    Returns (user_dict, new_access_token, new_refresh_token).
    """
    try:
        payload = decode_refresh_token(old_refresh_token)
    except jwt.ExpiredSignatureError:
        raise ValueError("Refresh token has expired.")
    except jwt.PyJWTError:
        raise ValueError("Invalid refresh token.")

    user_id = payload.get("user_id")
    user = user_queries.get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")
    if not user.get("is_active"):
        raise ValueError("Account is inactive.")

    tokens = generate_tokens(user)
    return user, tokens["access_token"], tokens["refresh_token"]


class PyJWTAuthentication(BaseAuthentication):
    """
    Reads 'Authorization: Bearer <token>', decodes the access JWT,
    returns (TokenUser, token). No DB hit for valid tokens.
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None
        try:
            payload = decode_access_token(token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Access token has expired.")
        except jwt.PyJWTError:
            raise AuthenticationFailed("Invalid or malformed access token.")
        user = TokenUser(payload)
        if not user.is_active:
            raise AuthenticationFailed("User account is inactive.")
        return user, token

    def authenticate_header(self, request):
        return "Bearer"