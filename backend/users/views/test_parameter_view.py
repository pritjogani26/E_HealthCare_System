from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from users.models import UserRole
from users.middleware.exceptions import PermissionException, NotFoundException

from ..serializers.test_parameter_serializers import TestParameterSerializer, TestParameterUpdateSerializer
import users.database_queries.test_parameter_queries as tpq

def ensure_lab_or_admin(user):
    if user.role not in [UserRole.LAB, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise PermissionException("Access denied. Lab or Admin role required.")

class TestParameterListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TestParameterSerializer

    def get(self, request):
        test_id = request.query_params.get("test_id")
        if test_id:
            test_id = int(test_id)
            
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))

        parameters = tpq.list_test_parameters(test_id, limit, offset)
        serializer = self.get_serializer(parameters, many=True)
        total_count = parameters[0]['total_count'] if parameters else 0
        return Response({
            "success": True,
            "data": serializer.data,
            "total_count": total_count
        })

    def post(self, request):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        parameter = tpq.create_test_parameter(
            test_id=data["test_id"],
            parameter_name=data["parameter_name"],
            unit=data.get("unit", ""),
            normal_range=data.get("normal_range", "")
        )
        return Response({
            "success": True,
            "data": self.get_serializer(parameter).data,
            "message": "Test parameter created successfully."
        }, status=status.HTTP_201_CREATED)

class TestParameterDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TestParameterUpdateSerializer

    def get(self, request, parameter_id):
        parameter = tpq.get_test_parameter(parameter_id)
        if not parameter:
            raise NotFoundException("Test parameter not found.")
        serializer = TestParameterSerializer(parameter)
        return Response({
            "success": True,
            "data": serializer.data
        })

    def put(self, request, parameter_id):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        parameter = tpq.update_test_parameter(
            parameter_id=parameter_id,
            test_id=data.get("test_id"),
            parameter_name=data.get("parameter_name"),
            unit=data.get("unit"),
            normal_range=data.get("normal_range")
        )
        return Response({
            "success": True,
            "data": TestParameterSerializer(parameter).data,
            "message": "Test parameter updated successfully."
        })

    def delete(self, request, parameter_id):
        ensure_lab_or_admin(request.user)
        tpq.delete_test_parameter(parameter_id)
        return Response({
            "success": True,
            "message": "Test parameter deleted successfully."
        })
