# backend/users/user_service/oauth_service.py
import requests
from datetime import datetime, timedelta

from django.conf import settings

from .db import fetch_one, execute
from .jwt_utils import generate_tokens

GOOGLE_CLIENT_ID = getattr(settings, "GOOGLE_CLIENT_ID", None)
TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"

def verify_with_google_lib(id_token_str):
    print("\n\nReached in _verify_with_google_lib Done.")
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        return idinfo
    except Exception:
        return None


def verify_with_tokeninfo_endpoint(id_token_str):
    print("\n\n_verify_with_tokeninfo_endpoint...")
    try:
        resp = requests.get(
            TOKENINFO_ENDPOINT, params={"id_token": id_token_str}, timeout=5
        )
        print(f"Resp : {resp}")
        if resp.status_code != 200:
            return None
        data = resp.json()
        print(f"Data : {data}")
        if GOOGLE_CLIENT_ID and data.get("aud") != GOOGLE_CLIENT_ID:
            print("Error from GOOGLE_CLIENT_ID")
            return None
        if data.get("iss") not in (
            "accounts.google.com",
            "https://accounts.google.com",
        ):
            print("Error in Issue.")
            return None
        return data
    except Exception:
        return None


def google_login(id_token_str):
    print("\n\nReached in Google Login Service.")
    if not id_token_str:
        return {"status": "error", "error": "Missing id_token"}

    print(f"id Token : {id_token_str}")

    idinfo = verify_with_google_lib(id_token_str)
    if idinfo is None:
        idinfo = verify_with_tokeninfo_endpoint(id_token_str)

    if not idinfo:
        return {"status": "error", "error": "Invalid Google token"}

    email = idinfo.get("email")
    email_verified = idinfo.get("email_verified") in (True, "true", "True", "1")
    first_name = idinfo.get("given_name") or ""
    last_name = idinfo.get("family_name") or ""
    picture = idinfo.get("picture")
    provider_user_id = idinfo.get("sub") or email
    auth_provider = idinfo.get("iss") or "https://accounts.google.com"

    if not email or not email_verified:
        return {"status": "error", "error": "Google account email not verified"}

    try:
        user = fetch_one("SELECT * FROM login_user(%s)", [email])
    except Exception as e:
        print(f"Database error checking user: {e}")
        return {"status": "error", "error": "Database error checking user"}

    if user:
        user_id = user.get("user_id")
        print(f"Existing user found. user_id: {user_id}")
    else:
        DEFAULT_ROLE = 2
        try:
            res = fetch_one(
                """
                SELECT register_user_auth_provider(
                    %s::varchar,  -- first_name
                    %s::varchar,  -- last_name
                    %s::varchar,  -- email
                    %s::varchar,  -- mobile (nullable)
                    %s::text,     -- profile_image (nullable)
                    %s::int,      -- role_id (nullable)
                    %s::varchar,  -- auth_provider
                    %s::varchar   -- provider_user_id
                ) AS user_id
                """,
                [
                    first_name,
                    last_name,
                    email,
                    None,
                    picture,
                    DEFAULT_ROLE,
                    auth_provider,
                    provider_user_id,
                ],
            )
        except Exception as e:
            print(f"Database error creating user: {e}")
            return {"status": "error", "error": "Database error creating user"}

        if not res or res.get("user_id") is None:
            return {"status": "error", "error": "Unexpected DB response creating user"}

        user_id = res["user_id"]

    try:
        access_token, refresh_token = generate_tokens(user_id)
    except Exception as e:
        print(f"Token generation failed: {e}")
        return {"status": "error", "error": "Failed to generate tokens"}

    try:
        execute(
            "SELECT store_refresh_token(%s,%s,%s)",
            [user_id, refresh_token, datetime.utcnow() + timedelta(days=7)],
        )
    except Exception as e:
        print(f"Failed to store refresh token: {e}")
        return {"status": "error", "error": "Failed to store refresh token"}

    try:
        user_row = fetch_one("SELECT * from get_user_by_id(%s)", [user_id])
    except Exception as e:
        print(f"Failed to fetch user after create/login: {e}")
        return {"status": "error", "error": "Failed to fetch user after create/login"}

    user_role = (
        user_row.get("role_ids")[0]
        if user_row.get("role_ids")
        else user_row.get("role")
    )
    response_user = {
        "user_id": user_row["user_id"],
        "first_name": user_row.get("first_name", ""),
        "last_name": user_row.get("last_name", ""),
        "email": user_row.get("email"),
        "role": user_role,
    }

    return {
        "status": "ok",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": response_user,
    }