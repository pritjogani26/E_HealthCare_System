from datetime import datetime, timedelta
from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings

from .db import fetch_one, execute
from .jwt_utils import decode_token, generate_tokens

COOKIE_NAME = "refresh_token"
REFRESH_DAYS = 7
ACCESS_EXPIRE_MINUTES = 15


def refresh_token_service(self, request: HttpRequest):
    refresh_token = request.COOKIES.get(COOKIE_NAME)
    if not refresh_token:
        return Response(
            {"error": "Refresh token missing"}, status=status.HTTP_401_UNAUTHORIZED
        )
    print(f"\nRefresh Token From Client : {refresh_token}")

    token_row = fetch_one("SELECT * FROM get_refresh_token(%s)", [refresh_token])

    print(f"\nRefresh Token From Database : {token_row}")

    if not token_row:
        return Response(
            {"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        user_id = decode_token(refresh_token)
    except Exception:
        execute("select revoke_token(%s)", [refresh_token])
        return Response(
            {"error": "Invalid or expired refresh token"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access, new_refresh = generate_tokens(user_id)

    try:
        execute("select revoke_token(%s)", [refresh_token])
        execute(
            """
            SELECT store_refresh_token(%s,%s,%s)
            """,
            [
                user_id,
                new_refresh,
                datetime.utcnow() + timedelta(days=7),
            ],
        )
        print(f"\n\nNow : {datetime.utcnow() + timedelta(days=7)}")
    except Exception:
        return Response(
            {"error": "Database error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    max_age = REFRESH_DAYS * 24 * 60 * 60
    secure_flag = not settings.DEBUG
    user = fetch_one("SELECT * from get_user_by_id(%s)", [user_id])
    if not user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    user_role = user["role_ids"][0]
    print("Success")
    resp = Response(
        {
            "access_token": access,
            "user": {
                "user_id": user["user_id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
                "role": user_role,
            },
        },
        status=status.HTTP_200_OK,
    )
    # resp = Response({"access_token": access}, status=status.HTTP_200_OK)
    resp.set_cookie(
        COOKIE_NAME,
        new_refresh,
        httponly=True,
        secure=secure_flag,
        samesite="Lax",
        max_age=max_age,
    )
    return resp
