# backend/users/services/oauth_service.py

import logging

import requests
from django.conf import settings
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from common.exceptions import AuthenticationException, ServiceUnavailableException

logger = logging.getLogger(__name__)

_VALID_ISSUERS = frozenset(["accounts.google.com", "https://accounts.google.com"])
_TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"


class OAuthService:
    GOOGLE_CLIENT_ID = getattr(settings, "GOOGLE_CLIENT_ID", None)

    @staticmethod
    def verify_google_token(id_token_str: str) -> dict:
        if not id_token_str:
            raise AuthenticationException("Google ID token is required.")

        idinfo = OAuthService._verify_with_library(id_token_str)

        if not idinfo:
            idinfo = OAuthService._verify_with_tokeninfo(id_token_str)

        if not idinfo:
            raise AuthenticationException("Google token verification failed.")

        return idinfo

    @staticmethod
    def _verify_with_library(id_token_str: str) -> dict | None:
        try:
            return google_id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                OAuthService.GOOGLE_CLIENT_ID,
            )
        except Exception:
            logger.warning("Google library token verification failed — trying tokeninfo fallback.")
            return None

    @staticmethod
    def _verify_with_tokeninfo(id_token_str: str) -> dict | None:
        try:
            response = requests.get(
                _TOKENINFO_ENDPOINT,
                params={"id_token": id_token_str},
                timeout=5,
            )
        except requests.RequestException:
            logger.exception("tokeninfo endpoint unreachable.")
            raise ServiceUnavailableException("Google authentication service is currently unavailable.")

        if response.status_code != 200:
            logger.warning("tokeninfo returned status=%s", response.status_code)
            return None

        data = response.json()

        if OAuthService.GOOGLE_CLIENT_ID and data.get("aud") != OAuthService.GOOGLE_CLIENT_ID:
            raise AuthenticationException("Google token client ID mismatch.")

        if data.get("iss") not in _VALID_ISSUERS:
            raise AuthenticationException("Google token has an invalid issuer.")

        return data