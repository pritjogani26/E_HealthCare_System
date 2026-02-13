from rest_framework import status
from rest_framework.response import Response

from .db import fetch_one


def fetch_user_profile(self, user_id: int):
    user = fetch_one("select * from get_user_by_id(%s)", [user_id])
    print(f"\n\nUser: {user}")
    
    if not user:
        print("User Not Found In Database")
        return Response(
            {"error": "User not found of this id"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = self.get_serializer(user)

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK,
    )