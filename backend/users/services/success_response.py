# backend\users\services\success_response.py

from rest_framework import status
from rest_framework.response import Response


def send_success_msg(data=None, message="Success", http_status=status.HTTP_200_OK):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)
