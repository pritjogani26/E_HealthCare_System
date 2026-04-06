from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from users.models import UserRole
from users.middleware.exceptions import PermissionException
import users.database_queries.test_parameter_queries as tpq
import users.database_queries.lab_service_quries as lsq

from ..serializers.lab_test_serializers import (
    LabTestCategorySerializer,
    LabTestSerializer,
)


def ensure_lab_or_admin(user):
    if user.role not in [UserRole.LAB, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise PermissionException("Access denied. Lab or Admin role required.")


# ─────────────────────────────────────────────────────────────────────────────
#  CATEGORY
# ─────────────────────────────────────────────────────────────────────────────

class LabTestCategoryListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabTestCategorySerializer

    def get(self, request):
        search    = request.query_params.get("search")
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            is_active = is_active.lower() == "true"
        limit  = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))

        categories  = lsq.list_lab_test_categories(search, is_active, limit, offset)
        serializer  = self.get_serializer(categories, many=True)
        total_count = categories[0]["total_count"] if categories else 0

        return Response({
            "success": True,
            "data": serializer.data,
            "total_count": total_count,
        })

    def post(self, request):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        category = lsq.create_lab_test_category(
            category_name=serializer.validated_data["category_name"],
            description=serializer.validated_data.get("description", ""),
            created_by=request.user.user_id,
        )
        return Response(
            {
                "success": True,
                "data": self.get_serializer(category).data,
                "message": "Category created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LabTestCategoryDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabTestCategorySerializer

    def get(self, request, category_id):
        category = lsq.get_lab_test_category(category_id)
        return Response({
            "success": True,
            "data": self.get_serializer(category).data,
        })

    def put(self, request, category_id):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        category = lsq.update_lab_test_category(
            category_id=category_id,
            updated_by=request.user.user_id,
            category_name=serializer.validated_data.get("category_name"),
            description=serializer.validated_data.get("description"),
            is_active=serializer.validated_data.get("is_active"),
        )
        return Response({
            "success": True,
            "data": self.get_serializer(category).data,
            "message": "Category updated successfully.",
        })

    def delete(self, request, category_id):
        ensure_lab_or_admin(request.user)
        lsq.delete_lab_test_category(category_id, str(request.user.user_id))
        return Response({"success": True, "message": "Category deleted successfully."})


# ─────────────────────────────────────────────────────────────────────────────
#  LAB TEST
# ─────────────────────────────────────────────────────────────────────────────

class LabTestListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabTestSerializer

    def get(self, request):
        search      = request.query_params.get("search")
        category_id = request.query_params.get("category_id")
        if category_id:
            category_id = int(category_id)
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            is_active = is_active.lower() == "true"
        limit  = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))

        tests       = lsq.list_lab_tests(search, category_id, is_active, limit, offset)
        serializer  = self.get_serializer(tests, many=True)
        total_count = tests[0]["total_count"] if tests else 0

        return Response({
            "success": True,
            "data": serializer.data,
            "total_count": total_count,
        })

    def post(self, request):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data            = serializer.validated_data
        parameters_data = data.pop("parameters", [])

        with transaction.atomic():
            test = lsq.create_lab_test(
                category_id=data.get("category_id"),
                test_code=data["test_code"],
                test_name=data["test_name"],
                description=data.get("description", ""),
                sample_type=data["sample_type"],
                fasting_required=data.get("fasting_required", False),
                fasting_hours=data.get("fasting_hours"),
                price=data["price"],
                turnaround_hours=data.get("turnaround_hours"),
            )

            if test and "test_id" in test:
                for p in parameters_data:
                    tpq.create_test_parameter(
                        test_id=test["test_id"],
                        parameter_name=p["parameter_name"],
                        unit=p.get("unit"),
                        normal_range=p.get("normal_range"),
                    )

        return Response(
            {
                "success": True,
                "data": self.get_serializer(test).data,
                "message": "Test created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LabTestDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabTestSerializer

    def get(self, request, test_id):
        test       = lsq.get_details_lab_test(test_id)
        parameters = lsq.get_parameters_of_lab_test(test_id)

        data               = self.get_serializer(test).data
        data["parameters"] = parameters

        return Response({
            "success": True,
            "data": data,
            "message": "Test fetched successfully.",
        })

    def put(self, request, test_id):
        ensure_lab_or_admin(request.user)
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        data                = serializer.validated_data
        received_parameters = data.pop("parameters", None)

        with transaction.atomic():

            test = lsq.update_lab_test(
                test_id=test_id,
                category_id=data.get("category_id"),
                test_code=data.get("test_code"),
                test_name=data.get("test_name"),
                description=data.get("description"),
                sample_type=data.get("sample_type"),
                fasting_required=data.get("fasting_required"),
                fasting_hours=data.get("fasting_hours"),
                price=data.get("price"),
                turnaround_hours=data.get("turnaround_hours"),
                is_active=data.get("is_active"),
            )

            if received_parameters is not None:
                existing_parameters = lsq.get_parameters_of_lab_test(test_id)

                existing_ids = {p["parameter_id"] for p in existing_parameters}

                received_ids = {
                    p["parameter_id"]
                    for p in received_parameters
                    if p.get("parameter_id")
                }

                for param_id in existing_ids - received_ids:
                    tpq.delete_test_parameter(param_id)

                for p in received_parameters:
                    param_id = p.get("parameter_id")

                    if param_id and param_id in existing_ids:
                        tpq.update_test_parameter(
                            parameter_id=param_id,
                            test_id=test_id,
                            parameter_name=p.get("parameter_name"),
                            unit=p.get("unit"),
                            normal_range=p.get("normal_range"),
                        )
                    else:
                        tpq.create_test_parameter(
                            test_id=test_id,
                            parameter_name=p["parameter_name"],
                            unit=p.get("unit"),
                            normal_range=p.get("normal_range"),
                        )

        updated_parameters       = lsq.get_parameters_of_lab_test(test_id)
        response_data            = self.get_serializer(test).data
        response_data["parameters"] = updated_parameters

        return Response({
            "success": True,
            "data": response_data,
            "message": "Test updated successfully.",
        })

    def delete(self, request, test_id):
        ensure_lab_or_admin(request.user)
        lsq.delete_lab_test(test_id, str(request.user.user_id))
        return Response({"success": True, "message": "Test deleted successfully."})