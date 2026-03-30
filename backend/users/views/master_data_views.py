# backend\users\views\master_data_views.py

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from users.middleware.exceptions import (
    ServiceUnavailableException,
)
from ..serializers.user_serializers import (
    GenderSerializer,
    BloodGroupSerializer,
    QualificationSerializer,
)
import db.user_queries as uq


class BloodGroupListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = BloodGroupSerializer

    def get(self, request):
        return Response(BloodGroupSerializer(uq.get_all_blood_groups(), many=True).data)


class GenderListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request):
        return Response(GenderSerializer(uq.get_all_genders(), many=True).data)


class QualificationListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request):
        try:
            return Response(
                QualificationSerializer(uq.get_all_qualifications(), many=True).data
            )
        except Exception:
            print("Failed to load qualification list")
            raise ServiceUnavailableException("Unable to load qualifications.")
