from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response
import bcrypt

from .db import fetch_one, execute


def change_password_service(self, request: HttpRequest, user_id: int):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    if old_password == new_password:
        return Response(
            {"error": "New Password must not same as Old Password"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Fetch user password hash
    database_password = fetch_one(
        "SELECT get_user_password_by_id(%s)",
        [user_id],
    )
    print(f"\n\n\n {database_password}")
    database_password = str(database_password["get_user_password_by_id"])
    print(f"\n\n\n {database_password}")
    if not database_password:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not bcrypt.checkpw(
        old_password.encode(),
        database_password.encode(),
    ):
        return Response(
            {"error": "Current password is incorrect"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    hashed_password = bcrypt.hashpw(
        new_password.encode(),
        bcrypt.gensalt(),
    ).decode()

    execute(
        "SELECT change_password(%s, %s)",
        [user_id, hashed_password],
    )

    return Response(
        {"message": "Password changed successfully"},
        status=status.HTTP_200_OK,
    )
