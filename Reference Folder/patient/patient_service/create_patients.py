# Hospital_Management\backend\patient\patient_service\create_patients.py
from rest_framework import status
from rest_framework.response import Response
from django.http import HttpRequest


from .db import fetch_one
from service_app.image_process import get_image_path


def create_patient(self, request: HttpRequest):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data

    image_path = get_image_path(data, request, name="patients")
    result = fetch_one(
        """
        SELECT create_patient(%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
        [
            data["patient_name"],
            data["dob"],
            data.get("email"),
            data.get("mobile"),
            data["gender"],
            data.get("blood_group") or None,
            data.get("address") or None,
            image_path,
            data["created_by"],
        ],
    )
    if result["create_patient"] == -1:
        return Response(
            {"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST
        )

    patient_id = result["create_patient"]

    return Response(
        {"message": "Patient created successfully", "patient_id": patient_id},
        status=status.HTTP_201_CREATED,
    )
