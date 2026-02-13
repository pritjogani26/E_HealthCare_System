# Hospital_Management\backend\patient\patient_service\display_patient_details.py
from rest_framework import status
from rest_framework.response import Response

from .db import fetch_one

def display_patient_details(self, patient_id: int):
    patient = fetch_one("SELECT * FROM display_single_patient(%s);", [patient_id])
    if patient == 0:
        print("Not Found In Database")
        return Response(
            {"error": "Patient not found of this id"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = self.get_serializer(patient)

    return Response(
        {"data": serializer.data},
        status=status.HTTP_200_OK,
    )
