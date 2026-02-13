# users/user_service/register_service.py
from rest_framework import status
from rest_framework.response import Response
from .db import fetch_one
import bcrypt
from .email_verify import send_verification_email
import logging

logger = logging.getLogger(__name__)


def register(data, image_path):
    logger.debug("Entered In Register Function.")
    try:
        hashed_password = bcrypt.hashpw(
            data["password"].encode(), bcrypt.gensalt()
        ).decode()
    except Exception:
        logger.exception("Password hashing failed")
        return Response(
            {"error": "Password hashing failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        result = fetch_one(
            """
            SELECT register_user(
                %s::varchar,
                %s::varchar,
                %s::varchar,
                %s::varchar,
                %s::text,
                %s::varchar,
                %s::smallint
            ) AS user_id
            """,
            [
                data["first_name"],
                data["last_name"],
                data["email"],
                data.get("mobile"),
                hashed_password,
                image_path,
                data["role"],
            ],
        )
        print(f"\n\n{result}")
    except Exception:
        logger.exception("Database error during user register_user call")
        return Response(
            {"error": "Database error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    if not result or result.get("user_id") is None:
        logger.error("Unexpected DB response when creating user: %s", result)
        return Response(
            {"error": "Unexpected error creating user."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    user_id = result["user_id"]
    if user_id == -1:
        return Response(
            {"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST
        )
    if user_id == -2:
        return Response(
            {"error": "Role is Wrong..."}, status=status.HTTP_400_BAD_REQUEST
        )
    try:
        email_sent = send_verification_email(user_id, data["email"])
        if not email_sent:
            logger.warning(
                "User created but failed to send verification email for user_id=%s",
                user_id,
            )
            return Response(
                {
                    "message": "Registration successful. Verification email could not be sent; contact support or resend verification.",
                    "user_id": user_id,
                },
                status=status.HTTP_201_CREATED,
            )
    except Exception:
        logger.exception("Unexpected error while sending verification email")
        return Response(
            {"error": "Failed to send verification email"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"message": "Registration successful. Please verify your email."},
        status=status.HTTP_201_CREATED,
    )
