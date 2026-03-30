# backend\users\views\admin_user_views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.middleware.exceptions import (
    NotFoundException,
)
from ..serializers.doctor_serializers import (
    DoctorListSerializer,
    DoctorProfileSerializer,
)
from ..serializers.patient_serializers import (
    PatientListSerializer,
    PatientProfileSerializer,
)
from ..serializers.lab_serializers import LabListSerializer, LabProfileSerializer
from ..services import AdminService
import db.audit_queries as aq
import db.doctor_queries as dq
import db.lab_queries as lq
import db.patient_queries as pq
from ..services.success_response import send_success_msg


class AdminPatientListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = PatientListSerializer

    def get(self, request):
        serializer = self.get_serializer(data=pq.get_all_patients(), many=True)
        serializer.is_valid(raise_exception=True)
        return send_success_msg(serializer.validated_data)


class AdminDoctorListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = DoctorListSerializer

    def get(self, request):
        data = dq.get_all_doctors()
        # print(data)
        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return send_success_msg(data)


class AdminLabListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabListSerializer

    def get(self, request):
        serializer = self.get_serializer(data=lq.get_all_labs(), many=True)
        serializer.is_valid(raise_exception=True)
        return send_success_msg(serializer.validated_data)


class AdminTogglePatientStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientProfileSerializer

    def patch(self, request, user_id):
        if not pq.get_patient_by_id(str(user_id)):
            raise NotFoundException("Patient not found.")

        reason = request.data.get("reason", "")
        print(request.data)
        patient, action = AdminService.toggle_patient_status(
            patient_id=str(user_id),
            reason=reason,
        )
        aq.insert_patient_audit(
            request.user.user_id, f"USER_{action.upper()}", "SUCCESS", user_id
        )
        serializer = self.get_serializer(data=patient)
        serializer.is_valid(raise_exception=True)
        return send_success_msg(
            serializer.validated_data, message=f"Patient {action} successfully."
        )


class AdminToggleDoctorStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id):
        if not dq.get_doctor_by_user_id(user_id):
            raise NotFoundException("Doctor not found.")

        reason = request.data.get("reason", "")
        doctor, action = AdminService.toggle_doctor_status(
            doctor_user_id=user_id,
            reason=reason,
        )
        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        sched = dq.get_schedule_by_doctor(uid)
        if sched:
            sched["working_days"] = dq.get_working_days(sched["schedule_id"])
        doctor["schedule"] = sched
        return send_success_msg(doctor, message=f"Doctor {action} successfully.")


class AdminToggleLabStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabProfileSerializer

    def patch(self, request, user_id):
        if not lq.get_lab_by_user_id(user_id):
            raise NotFoundException("Lab not found.")

        reason = request.data.get("reason", "")
        lab, action = AdminService.toggle_lab_status(lab_user_id=user_id, reason=reason)
        uid = str(lab["lab_id"])
        lab["operating_hours"] = lq.get_lab_operating_hours(uid)
        lab["services"] = lq.get_lab_services(uid)
        return send_success_msg(lab, message=f"Lab {action} successfully.")
