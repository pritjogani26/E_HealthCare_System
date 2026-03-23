from django.conf import settings
from django.http import HttpResponse
from users.jwt_auth import generate_tokens


def set_auth_response_with_tokens(user, message, permissions_list):
    # print(f"\n\nUser : {user}")
    tokens = generate_tokens(user)
    response_dict = {
        "success": True,
        "message": message,
        "data": {
            "user": user,
            "access_token": tokens["access_token"],
            "token_type": tokens["token_type"],
            "expires_in": tokens["expires_in"],
        },
        "permissions": permissions_list,
    }
    return response_dict, tokens["refresh_token"]


def set_refresh_token_cookie(
    response: HttpResponse, refresh_token: str
) -> HttpResponse:
    print("\nNew Refresh token is generating.")
    refresh_days = getattr(settings, "JWT_REFRESH_EXPIRE_DAYS", 7)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=refresh_days * 24 * 60 * 60,
        secure=not settings.DEBUG,
        samesite="Lax",
    )
    return response
