from rest_framework import status
from rest_framework.response import Response

from .db import fetch_one


def verify_email_service(self, request):
    token = request.query_params.get("token")
    print(f"\nToken From URL : {token}")
    if not token:
        return Response(
            {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
        )
    print(f"\n\nToken : {token}")
    try:
        res = fetch_one("SELECT verify_email(%s) AS result", [token])
        print(res)
    except Exception:
        return Response(
            {"error": "Database error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not res:
        return Response(
            {"error": "Unexpected DB response"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if res.get("result") == 1:
        return Response(
            {"message": "Email verified successfully"}, status=status.HTTP_200_OK
        )
    else:
        return Response(
            {"error": "Invalid or expired token"},
            status=status.HTTP_400_BAD_REQUEST,
        )
