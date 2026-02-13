# Hospital_Management\backend\patient\patient_service\delete_patient.py
from rest_framework import status
from rest_framework.response import Response

from .db import fetch_one


def delete(patient_id: int, data):
    result = fetch_one(
        """
        SELECT soft_delete_patient(%s,%s,%s);
        """,
        [patient_id, data["reason"], data["deleteBy"]],
    )

    if result["soft_delete_patient"] == 0:
        return Response(
            {"error": "Patient not found or already inactive"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "message": "Patient deleted successfully",
            "patient_id": result["soft_delete_patient"],
        },
        status=status.HTTP_200_OK,
    )
