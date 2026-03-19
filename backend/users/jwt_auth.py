# backend/users/jwt_auth.py

import uuid
import logging

import jwt
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from common.exceptions import (
    TokenExpiredException,
    AuthenticationException,
    PermissionException,
)
from db import user_queries

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"


def access_exp() -> timedelta:
    return timedelta(minutes=getattr(settings, "JWT_ACCESS_EXPIRE_MINUTES", 15))


def _refresh_exp() -> timedelta:
    return timedelta(days=getattr(settings, "JWT_REFRESH_EXPIRE_DAYS", 7))


def _secret() -> str:
    return settings.SECRET_KEY


class TokenUser:
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

    def __init__(self, user_dict: dict):
        self._d = user_dict

    def __getattr__(self, item):
        if item.startswith("_"):
            raise AttributeError(item)
        return self._d.get(item)

    def __bool__(self):
        return bool(self._d)

    def __eq__(self, other):
        if isinstance(other, UserWrapper):
            return str(self.user_id) == str(other.user_id)
        if isinstance(other, dict):
            return str(self.user_id) == str(other.get("user_id"))
        return NotImplemented

    def __hash__(self):
        return hash(str(self.user_id))

    @property
    def is_authenticated(self):
        return True

    @property
    def pk(self):
        return self._d.get("user_id")


def generate_tokens(user: dict) -> dict:
    now = timezone.now()

    access_payload = {
        "token_type": "access",
        "user_id": str(user["user_id"]),
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "iat": int(now.timestamp()),
        "exp": int((now + access_exp()).timestamp()),
    }
    refresh_payload = {
        "token_type": "refresh",
        "jti": str(uuid.uuid4()),
        "user_id": str(user["user_id"]),
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "iat": int(now.timestamp()),
        "exp": int((now + _refresh_exp()).timestamp()),
    }

    return {
        "access_token": jwt.encode(access_payload, _secret(), algorithm=ALGORITHM),
        "refresh_token": jwt.encode(refresh_payload, _secret(), algorithm=ALGORITHM),
        "token_type": "Bearer",
        "expires_in": int(access_exp().total_seconds()),
    }


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    if payload.get("token_type") != "access":
        raise jwt.InvalidTokenError("Not an access token.")
    return payload


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    if payload.get("token_type") != "refresh":
        raise jwt.InvalidTokenError("Not a refresh token.")
    return payload


def rotate_refresh_token(old_refresh_token: str) -> tuple[dict, str, str]:
    try:
        payload = decode_refresh_token(old_refresh_token)
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException("Refresh token has expired.")
    except jwt.PyJWTError:
        raise AuthenticationException("Invalid refresh token.")

    user = user_queries.get_user_by_id(payload.get("user_id"))

    if not user:
        raise AuthenticationException("User not found.")
    if not user.get("is_active"):
        raise PermissionException("Account is inactive.")

    tokens = generate_tokens(user)
    return user, tokens["access_token"], tokens["refresh_token"]


class PyJWTAuthentication(BaseAuthentication):
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
