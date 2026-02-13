# Hospital_Management\backend\patient\patient_service\update_patient.py
from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response

from service_app.image_process import get_image_path
from .db import fetch_one


def update_patient(self, request: HttpRequest, patient_id: int):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    image_path = get_image_path(data, request, name="patients")
    result = fetch_one(
        """
        SELECT update_patient(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
        """,
        [
            patient_id,
            data["patient_name"],
            data.get("dob"),
            data.get("email"),
            data.get("mobile"),
            data["gender"],
            data.get("blood_group") or None,
            data.get("address") or None,
            image_path,
            data["updated_by"],
            data["update_reason"],
        ],
    )

    status_code = result["update_patient"]

    if status_code == -1:
        return Response(
            {"error": "Patient not found or inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )
    elif status_code == -2:
        return Response(
            {"error": "Email is already in use by another patient"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Patient updated successfully", "patient_id": status_code},
        status=status.HTTP_200_OK,
    )
