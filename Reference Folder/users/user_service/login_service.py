# Hospital_Management\backend\users\user_service\login_service.py
from .db import fetch_one, execute
import bcrypt
from .jwt_utils import generate_tokens
from datetime import datetime, timedelta


def login(data):
    user = fetch_one(
        "SELECT * from login_user(%s)",
        [data["email"]],
    )
    print(user)
    if not user:
        print("\n\nWrong in Email\n\n")
        return {"error": "Invalid credentials (Email)", "status": "error"}

    if not user["email_verified"]:
        print("\n\nWrong in Email\n\n")
        return {
            "error": "Email not verified. Please verify your email before logging in.",
            "status": "error",
        }
    
    if not bcrypt.checkpw(data["password"].encode(), user["password_hash"].encode()):
        print("\n\nWrong in Password\n\n")
        return {"error": "Invalid credentials (Password)", "status": "error"}

    access, refresh = generate_tokens(user["user_id"])

    execute(
        """
        SELECT store_refresh_token(%s,%s,%s)
        """,
        [
            user["user_id"],
            refresh,
            datetime.utcnow() + timedelta(days=7),
        ],
    )
    print(f"\n\n{user}")
    user_role = user["role_ids"][0]
    # print(f"Role :  {user_role[0]}")
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": {
            "user_id": user["user_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "role": user_role,
        },
        "status": "ok",
    }
