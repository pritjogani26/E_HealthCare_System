# backend\users\views\admin_verification_views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.middleware.exceptions import (
    ValidationException,
    NotFoundException,
)
from ..models import VerificationStatus
from ..services import AdminService
import db.doctor_queries as dq
import db.lab_queries as lq
from ..services.success_response import send_success_msg


class AdminVerifyDoctorView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if not dq.get_doctor_by_user_id(user_id):
            raise NotFoundException("Doctor not found.")

        new_status = request.data.get("status")
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            raise ValidationException("Invalid status. Must be VERIFIED or REJECTED.")

        doctor = AdminService.verify_doctor(
            doctor_user_id=user_id,
            status=new_status,
            notes=request.data.get("notes", ""),
            verified_by=request.user,
            request=request,
        )
        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        sched = dq.get_schedule_by_doctor(uid)
        if sched:
            sched["working_days"] = dq.get_working_days(sched["schedule_id"])
        doctor["schedule"] = sched
        return send_success_msg(
            doctor, message=f"Doctor {new_status.lower()} successfully."
        )


class AdminVerifyLabView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        from ..serializers.lab_serializers import LabProfileSerializer

        if not lq.get_lab_by_user_id(user_id):
            raise NotFoundException("Lab not found.")

        new_status = request.data.get("status")
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            raise ValidationException("Invalid status. Must be VERIFIED or REJECTED.")

        lab = AdminService.verify_lab(
            lab_user_id=user_id,
            status=new_status,
            notes=request.data.get("notes", ""),
            verified_by=request.user,
            request=request,
        )
        uid = str(lab["lab_id"])
        lab["operating_hours"] = lq.get_lab_operating_hours(uid)
        lab["services"] = lq.get_lab_services(uid)
        return send_success_msg(
            LabProfileSerializer(lab).data,
            message=f"Lab {new_status.lower()} successfully.",
        )
