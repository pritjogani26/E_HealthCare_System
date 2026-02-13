# Hospital_Management\backend\users\user_service\jwt_utils.py
from datetime import datetime, timedelta
from jose import ExpiredSignatureError, JWTError, jwt
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

SECRET = settings.SECRET_KEY
ALGO = "HS256"


def generate_tokens(user_id):
    access = jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(minutes=15),
            "type": "access",
        },
        SECRET,
        algorithm=ALGO,
    )

    refresh = jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(days=7),
            "type": "refresh",
        },
        SECRET,
        algorithm=ALGO,
    )
    return access, refresh


def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])

        return payload["user_id"]

    except ExpiredSignatureError:
        raise AuthenticationFailed("Access token expired")

    except JWTError:
        raise AuthenticationFailed("Invalid access token")
