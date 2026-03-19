from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdminOrStaff
from common.exceptions import ValidationException
import db.settings_queries as sq

def _ok(data=None, message="Success", http_status=status.HTTP_200_OK):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)

class SettingsBloodGroupsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return _ok(sq.get_blood_groups(active_only))

    def post(self, request, *args, **kwargs):
        value = request.data.get("blood_group_value")
        if not value:
            raise ValidationException("blood_group_value is required")
        sq.insert_blood_group(value)
        return _ok(message="Blood group added successfully")

class SettingsGendersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        return _ok(sq.get_genders())

    def post(self, request, *args, **kwargs):
        value = request.data.get("gender_value")
        if not value:
            raise ValidationException("gender_value is required")
        sq.insert_gender(value)
        return _ok(message="Gender added successfully")

class SettingsSpecializationsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return _ok(sq.get_specializations(active_only))

    def post(self, request, *args, **kwargs):
        name = request.data.get("specialization_name")
        desc = request.data.get("description", "")
        if not name:
            raise ValidationException("specialization_name is required")
        sq.insert_specialization(name, desc)
        return _ok(message="Specialization added successfully")

    def patch(self, request, *args, **kwargs):
        spec_id = request.data.get("specialization_id")
        is_active = request.data.get("is_active")
        if spec_id is None or is_active is None:
            raise ValidationException("specialization_id and is_active are required")
        sq.toggle_specialization(int(spec_id), bool(is_active))
        return _ok(message="Specialization status updated")

class SettingsQualificationsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return _ok(sq.get_qualifications(active_only))

    def post(self, request, *args, **kwargs):
        code = request.data.get("qualification_code")
        name = request.data.get("qualification_name")
        if not code or not name:
            raise ValidationException("qualification_code and qualification_name are required")
        sq.insert_qualification(code, name)
        return _ok(message="Qualification added successfully")

    def patch(self, request, *args, **kwargs):
        qual_id = request.data.get("qualification_id")
        is_active = request.data.get("is_active")
        if qual_id is None or is_active is None:
            raise ValidationException("qualification_id and is_active are required")
        sq.toggle_qualification(int(qual_id), bool(is_active))
        return _ok(message="Qualification status updated")

class SettingsVerificationTypesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        return _ok(sq.get_verification_types())

    def post(self, request, *args, **kwargs):
        name = request.data.get("name")
        desc = request.data.get("description", "")
        if not name:
            raise ValidationException("name is required")
        sq.insert_verification_type(name, desc)
        return _ok(message="Verification type added successfully")

class SettingsUserRolesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        return _ok(sq.get_user_roles())

    def post(self, request, *args, **kwargs):
        role = request.data.get("role")
        desc = request.data.get("role_description", "")
        if not role:
            raise ValidationException("role is required")
        sq.insert_user_role(role, desc)
        return _ok(message="User role added successfully")
