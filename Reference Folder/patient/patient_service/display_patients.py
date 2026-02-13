# Hospital_Management\backend\patient\patient_service\display_patients.py
from rest_framework import status
from rest_framework.response import Response
from django.http import HttpRequest

from .db import fetch_one, fetch_all


def display_patients(self, request: HttpRequest):
    query = request.query_params.get("query", "") or ""
    category: str = request.query_params.get("category", "all") or "all"
    try:
        page = int(request.query_params.get("page", 1))
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = int(request.query_params.get("page_size", 5))
        if page_size < 1:
            page_size = 5
    except (ValueError, TypeError):
        page_size = 5

    offset = (page - 1) * page_size

    patients = fetch_all(
        "SELECT * from display_patients(%s, %s, %s, %s);",
        [query, category, page_size, offset],
    )

    total_res = fetch_one(
        "select * from count_display_patients(%s, %s);", [query, category]
    )
    total_count = 0
    if isinstance(total_res, dict):
        total_count = list(total_res.values())[0] if total_res else 0
    else:
        total_count = total_res or 0

    serializer = self.get_serializer(patients, many=True)
    return Response(
        {
            "count": total_count,
            "data": serializer.data,
            "page": page,
            "page_size": page_size,
        },
        status=status.HTTP_200_OK,
    )
