# backend/users/views.py

import logging
from datetime import datetime
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.exceptions import (
    ValidationException,
    AuthenticationException,
    TokenExpiredException,
    PermissionException,
    NotFoundException,
    ServiceUnavailableException,
)
from doctors.serializers import DoctorListSerializer, DoctorProfileSerializer
from patients.serializers import PatientListSerializer, PatientProfileSerializer
from labs.serializers import LabListSerializer, LabProfileSerializer
from .models import UserRole, VerificationStatus
from .services import AuthService, AdminService, EmailService, password_service
from .helpers import (
    set_auth_response_with_tokens,
    get_profile_data_by_role,
    set_refresh_token_cookie,
)
from .permissions import IsAdminOrStaff
from .services import download_audit_service
from .jwt_auth import decode_refresh_token, rotate_refresh_token, UserWrapper
from .serializers import (
    AuditLogsDownload,
    LoginSerializer,
    GenderSerializer,
    BloodGroupSerializer,
    LogoutSerializer,
    UserSerializer,
    QualificationSerializer,
    ReAuthVerifySerializer,
)
import db.user_queries as uq
import db.audit_queries as aq
import db.doctor_queries as dq
import db.lab_queries as lq
import db.patient_queries as pq


def _ok(data=None, message="Success", http_status=status.HTTP_200_OK):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return Response(body, status=http_status)


class LoginView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = uq.get_user_by_email(email)
        if not user:
            raise PermissionException("Invalid credentials.")

        is_locked, lock_msg = AuthService.check_account_lockout(user)
        if is_locked:
            raise PermissionException(lock_msg)

        is_active, active_msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(active_msg)

        if not password_service.verify_password(password, user.get("password", "")):
            _, msg = AuthService.handle_failed_login(user)
            raise PermissionException(msg)

        AuthService.handle_successful_login(user["user_id"])
        user = uq.get_user_by_id(user["user_id"])
        print(f"\nUser : {user}\n")
        user_permission = uq.get_user_permission_by_id(user["role_id"])
        print("\nuser_permission :\n")
        print(user_permission)
        response_dict, refresh_token = set_auth_response_with_tokens(
            user, "Login successful.", user_permission
        )
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, refresh_token)
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request: HttpRequest, *args, **kwargs):
        response = Response({"success": True, "message": "Logged out successfully."})
        raw_token = request.COOKIES.get("refresh_token")
        if not raw_token:
            return response
        payload = decode_refresh_token(raw_token)
        print(f"\nPayload : {payload}")
        aq.insert_auth_audit(payload["user_id"], "LOGOUT", "SUCCESS")
        response.delete_cookie("refresh_token")
        return response


class RefreshTokenView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args, **kwargs):
        raw_token = request.COOKIES.get("refresh_token")
        if not raw_token:
            raise TokenExpiredException("Refresh token is required.")

        user_dict, access_token, new_refresh_token = rotate_refresh_token(raw_token)
        profile_data = get_profile_data_by_role(UserWrapper(user_dict))

        response = Response(
            {
                "success": True,
                "message": "Token refreshed successfully.",
                "data": {"access_token": access_token, "user": profile_data},
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_token_cookie(response, new_refresh_token)
        return response


class GoogleAuthView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from .services.oauth_service import OAuthService

        token = request.data.get("token")
        if not token:
            raise ValidationException("Google token is required.")

        idinfo = OAuthService.verify_google_token(token)

        email = idinfo.get("email")
        if not email:
            raise AuthenticationException("Email not found in Google token payload.")

        user = uq.get_user_by_email(email)
        if not user:
            return Response(
                {
                    "success": True,
                    "registered": False,
                    "message": "User not registered. Please complete registration.",
                    "email": email,
                    "first_name": idinfo.get("given_name", ""),
                    "last_name": idinfo.get("family_name", ""),
                    "picture": idinfo.get("picture", ""),
                    "oauth_provider": "google",
                    "oauth_provider_id": idinfo.get("sub"),
                },
                status=status.HTTP_200_OK,
            )

        is_active, msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(msg)

        if not user.get("oauth_provider"):
            uq.update_oauth_provider(user["user_id"], "google", idinfo.get("sub"))
            user = uq.get_user_by_id(user["user_id"])

        AuthService.handle_successful_login(
            user["user_id"],
        )
        user_permission = uq.get_user_permission_by_id(user["role_id"])

        response_dict, rt = set_auth_response_with_tokens(
            user, "Google login successful.", user_permission
        )
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, rt)
        return response


class VerifyEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            raise ValidationException("Verification token is required.")
        # verify_email_token raises on failure, returns None on success
        EmailService.verify_email_token(token)
        return _ok(message="Email verified successfully.")


class ResendVerificationEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            raise ValidationException("Email is required.")
        EmailService.resend_verification_email(email)
        return _ok(message="Verification email sent successfully.")


class AdminStaffProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) not in [UserRole.ADMIN, UserRole.STAFF]:
            raise PermissionException("Access denied. Admin or Staff role required.")
        user = uq.get_user_by_id(str(request.user.user_id)) or {}
        return _ok(UserSerializer(user).data)


class CurrentUserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: HttpRequest, *args, **kwargs):
        return _ok(get_profile_data_by_role(request.user))


class BloodGroupListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = BloodGroupSerializer

    def get(self, request, *args, **kwargs):
        return Response(BloodGroupSerializer(uq.get_all_blood_groups(), many=True).data)


class GenderListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        return Response(GenderSerializer(uq.get_all_genders(), many=True).data)


class QualificationListView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        try:
            return Response(
                QualificationSerializer(uq.get_all_qualifications(), many=True).data
            )
        except Exception:
            print("Failed to load qualification list")
            raise ServiceUnavailableException("Unable to load qualifications.")


class AdminPatientListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = PatientListSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=pq.get_all_patients(), many=True)
        serializer.is_valid(raise_exception=True)
        return _ok(serializer.validated_data)


class AdminDoctorListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = DoctorListSerializer

    def get(self, request, *args, **kwargs):
        data = dq.get_all_doctors()
        # print(data)
        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return _ok(data)


class AdminLabListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabListSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=lq.get_all_labs(), many=True)
        serializer.is_valid(raise_exception=True)
        return _ok(serializer.validated_data)


class AdminTogglePatientStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
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
        return _ok(serializer.validated_data, message=f"Patient {action} successfully.")


class AdminToggleDoctorStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
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
        return _ok(doctor, message=f"Doctor {action} successfully.")


class AdminToggleLabStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LabProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        if not lq.get_lab_by_user_id(user_id):
            raise NotFoundException("Lab not found.")

        reason = request.data.get("reason", "")
        lab, action = AdminService.toggle_lab_status(lab_user_id=user_id, reason=reason)
        uid = str(lab["lab_id"])
        lab["operating_hours"] = lq.get_lab_operating_hours(uid)
        lab["services"] = lq.get_lab_services(uid)
        return _ok(lab, message=f"Lab {action} successfully.")


class AdminVerifyDoctorView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id, *args, **kwargs):
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
        return _ok(doctor, message=f"Doctor {new_status.lower()} successfully.")


class AdminVerifyLabView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id, *args, **kwargs):
        from labs.serializers import LabProfileSerializer

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
        return _ok(
            LabProfileSerializer(lab).data,
            message=f"Lab {new_status.lower()} successfully.",
        )


class PendingApprovalsCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return _ok(AdminService.get_pending_approvals_count())


class RecentActivityView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    EXCLUDED_ACTIONS = ()
    serializer_class = AuditLogsDownload

    def get(self, request, *args, **kwargs):
        rows = aq.get_recent_activity(limit=100)
        data = [
            {
                "log_id": r["log_id"],
                "action": r["action"],
                "entity_type": r.get("entity_type"),
                "details": r.get("details"),
                "status": r.get("status"),
                "performed_by": r.get("performed_by_email"),
                "target_user": r.get("target_user_email"),
                "ip_address": str(r["ip_address"]) if r.get("ip_address") else None,
                "request_path": r.get("request_path"),
                "duration_ms": r.get("duration_ms"),
                "timestamp": (
                    r["created_at"].isoformat() if r.get("created_at") else None
                ),
            }
            for r in rows
        ]
        print(f"\n\nLength of Audit Logs : {len(rows)}")
        return _ok(data)

    def post(self, request):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.validated_data["status"]
        file_type = serializer.validated_data["type"]

        print(f"\n\nStatus : {status} \nType : {file_type}")

        rows = aq.get_recent_activity(limit=100)
        # print(f"Rows : {rows}")
        # for r in rows:
        #     print("Status of Row is ", end="  ")
        #     print(r.get("status"), end="\n")

        rows = [r for r in rows if r.get("status") == status or status == "ALL"]
        # print(rows)

        data = [
            {
                "log_id": str(r["log_id"]),
                "action": str(r["action"]),
                "entity_type": str(r.get("entity_type")),
                "details": str(r.get("details")),
                "status": str(r.get("status")),
                "performed_by": str(r.get("performed_by_email")),
                "target_user": str(r.get("target_user_email")),
                "ip_address": str((r["ip_address"])) if r.get("ip_address") else None,
                "request_path": str(r.get("request_path")),
                "duration_ms": str(r.get("duration_ms")),
                "timestamp": (
                    r["created_at"].isoformat() if r.get("created_at") else None
                ),
            }
            for r in rows
        ]
        print(f"\n\nLength of Audit Logs : {len(rows)}")

        filename = (
            f"audit_logs_{status.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        if file_type == "CSV":
            return download_audit_service.generate_csv(data, filename)
        elif file_type == "PDF":
            return download_audit_service.generate_pdf(data, filename)

        else:
            raise ValidationException


class ReAuthVerifyView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReAuthVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data["password"]

        user = uq.get_user_by_id(str(request.user.user_id))
        if not user:
            raise AuthenticationException("User not found.")

        is_locked, lock_msg = AuthService.check_account_lockout(user)
        if is_locked:
            raise PermissionException(lock_msg)

        is_active, active_msg = AuthService.check_account_status(user)
        if not is_active:
            raise PermissionException(active_msg)

        if not password_service.verify_password(password, user.get("password", "")):
            _, msg = AuthService.handle_failed_login(user)
            raise AuthenticationException(msg)

        AuthService.handle_successful_login(user["user_id"])
        return _ok(message="Re-authentication successful.")
