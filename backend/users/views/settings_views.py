# backend\users\views\settings_views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdminOrStaff
from users.middleware.exceptions import ValidationException
import db.settings_queries as sq
from ..services.success_response import send_success_msg


class SettingsBloodGroupsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return send_success_msg(sq.get_blood_groups(active_only))

    def post(self, request):
        value = request.data.get("blood_group_value")
        if not value:
            raise ValidationException("blood_group_value is required")
        sq.insert_blood_group(value)
        return send_success_msg(message="Blood group added successfully")


class SettingsGendersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        return send_success_msg(sq.get_genders())

    def post(self, request):
        value = request.data.get("gender_value")
        if not value:
            raise ValidationException("gender_value is required")
        sq.insert_gender(value)
        return send_success_msg(message="Gender added successfully")


class SettingsSpecializationsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return send_success_msg(sq.get_specializations(active_only))

    def post(self, request):
        name = request.data.get("specialization_name")
        desc = request.data.get("description", "")
        if not name:
            raise ValidationException("specialization_name is required")
        sq.insert_specialization(name, desc)
        return send_success_msg(message="Specialization added successfully")

    def patch(self, request):
        spec_id = request.data.get("specialization_id")
        is_active = request.data.get("is_active")
        if spec_id is None or is_active is None:
            raise ValidationException("specialization_id and is_active are required")
        sq.toggle_specialization(int(spec_id), bool(is_active))
        return send_success_msg(message="Specialization status updated")


class SettingsQualificationsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        active_only = request.query_params.get("active_only", "false").lower() == "true"
        return send_success_msg(sq.get_qualifications(active_only))

    def post(self, request):
        code = request.data.get("qualification_code")
        name = request.data.get("qualification_name")
        if not code or not name:
            raise ValidationException(
                "qualification_code and qualification_name are required"
            )
        sq.insert_qualification(code, name)
        return send_success_msg(message="Qualification added successfully")

    def patch(self, request):
        qual_id = request.data.get("qualification_id")
        is_active = request.data.get("is_active")
        if qual_id is None or is_active is None:
            raise ValidationException("qualification_id and is_active are required")
        sq.toggle_qualification(int(qual_id), bool(is_active))
        return send_success_msg(message="Qualification status updated")


class SettingsVerificationTypesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        return send_success_msg(sq.get_verification_types())

    def post(self, request):
        name = request.data.get("name")
        desc = request.data.get("description", "")
        if not name:
            raise ValidationException("name is required")
        sq.insert_verification_type(name, desc)
        return send_success_msg(message="Verification type added successfully")


class SettingsUserRolesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request):
        return send_success_msg(sq.get_user_roles())

    def post(self, request):
        role = request.data.get("role")
        desc = request.data.get("role_description", "")
        if not role:
            raise ValidationException("role is required")
        sq.insert_user_role(role, desc)
        return send_success_msg(message="User role added successfully")
