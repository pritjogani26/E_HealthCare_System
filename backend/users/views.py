import logging
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    LoginSerializer,
    GenderSerializer,
    BloodGroupSerializer,
    UserSerializer,
    QualificationSerializer,
)
from doctors.serializers import DoctorProfileSerializer
from .AuditLog import AuditMixin, AuditLogger
from .models import UserRole, VerificationStatus
from .services import AuthService, AdminService, EmailService, password_service
from .helpers import (
    set_auth_response_with_tokens,
    get_profile_data_by_role,
    set_refresh_token_cookie,
)
from .permissions import IsAdminOrStaff
from .jwt_auth import rotate_refresh_token, UserWrapper
import db.user_queries as uq
import db.audit_queries as aq
import db.doctor_queries as dq
import db.lab_queries as lq
import db.patient_queries as pq

logger = logging.getLogger(__name__)


def _error(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return Response(body, status=http_status)


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
        if not serializer.is_valid():
            return _error("Invalid input", serializer.errors)
        email    = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        user     = uq.get_user_by_email(email)
        if not user:
            return _error("Invalid credentials", http_status=status.HTTP_401_UNAUTHORIZED)

        is_locked, lock_msg = AuthService.check_account_lockout(user)
        if is_locked:
            return _error(lock_msg, http_status=status.HTTP_403_FORBIDDEN)

        is_active, active_msg = AuthService.check_account_status(user)
        if not is_active:
            return _error(active_msg, http_status=status.HTTP_403_FORBIDDEN)

        authenticated = password_service.verify_password(password, user.get("password", ""))
        if not authenticated:
            should_lock, msg = AuthService.handle_failed_login(user)
            AuditLogger.login_failed(email, reason="Invalid password", request=request)
            return _error(
                msg,
                http_status=status.HTTP_403_FORBIDDEN if should_lock else status.HTTP_401_UNAUTHORIZED,
            )

        AuthService.handle_successful_login(user["email"])
        user     = uq.get_user_by_id(user["user_id"])
        user_wrap = UserWrapper(user)
        request.user  = user_wrap
        profile_data  = get_profile_data_by_role(user_wrap)
        response_dict, refresh_token = set_auth_response_with_tokens(
            user_wrap, profile_data, "Login successful"
        )
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, refresh_token)
        AuditLogger.login_success(user_wrap, request=request)
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"success": True, "message": "Logged out successfully"})
        response.delete_cookie("refresh_token")
        AuditLogger.logout(request.user, request=request)
        return response


class RefreshTokenView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args, **kwargs):
        raw_token = request.COOKIES.get("refresh_token")
        if not raw_token:
            return _error("Refresh token is required.")
        try:
            user_dict, access_token, new_refresh_token = rotate_refresh_token(raw_token)
        except ValueError as exc:
            resp = _error(str(exc), http_status=status.HTTP_401_UNAUTHORIZED)
            resp.delete_cookie("refresh_token")
            return resp
        user_wrap    = UserWrapper(user_dict)
        profile_data = get_profile_data_by_role(user_wrap)
        response = Response(
            {
                "success": True,
                "message": "Token refreshed successfully",
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
        idinfo, error = OAuthService.verify_google_token(token)
        if error:
            return _error(error)
        email = idinfo.get("email")
        if not email:
            return _error("Google token missing email claim.")
        user = uq.get_user_by_email(email)
        if not user:
            return Response(
                {
                    "success":          True,
                    "registered":       False,
                    "message":          "User not registered. Please complete registration.",
                    "email":            email,
                    "first_name":       idinfo.get("given_name", ""),
                    "last_name":        idinfo.get("family_name", ""),
                    "picture":          idinfo.get("picture", ""),
                    "oauth_provider":   "google",
                    "oauth_provider_id": idinfo.get("sub"),
                },
                status=status.HTTP_200_OK,
            )
        is_active, msg = AuthService.check_account_status(user)
        if not is_active:
            return _error(msg, http_status=status.HTTP_403_FORBIDDEN)
        if not user.get("oauth_provider"):
            uq.update_oauth_provider(user["user_id"], "google", idinfo.get("sub"))
            user = uq.get_user_by_id(user["user_id"])
        AuthService.handle_successful_login(user["user_id"])
        user_wrap    = UserWrapper(user)
        profile_data = get_profile_data_by_role(user_wrap)
        response_dict, rt = set_auth_response_with_tokens(user_wrap, profile_data, "Google login successful")
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, rt)
        return response


class VerifyEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return _error("Verification token is required.")
        ok, err = EmailService.verify_email_token(token)
        if ok:
            return _ok(message="Email verified successfully.")
        return _error(err)


class ResendVerificationEmailView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return _error("Email is required.")
        ok, msg = EmailService.resend_verification_email(email)
        if ok:
            return _ok(message=msg)
        return _error(msg)


class AdminStaffProfileView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) not in [UserRole.ADMIN, UserRole.STAFF]:
            return _error(
                "Access denied. Admin or Staff role required.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        user = uq.get_user_by_id(str(request.user.user_id)) or {}
        return _ok(UserSerializer(user).data)


class CurrentUserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return _ok(get_profile_data_by_role(request.user))


class BloodGroupListView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = BloodGroupSerializer

    def get(self, request, *args, **kwargs):
        data = uq.get_all_blood_groups()
        return Response(BloodGroupSerializer(data, many=True).data)


class GenderListView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        return Response(GenderSerializer(uq.get_all_genders(), many=True).data)


class QualificationListView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        try:
            return Response(QualificationSerializer(uq.get_all_qualifications(), many=True).data)
        except Exception:
            logger.exception("Failed to load qualification list")
            return _error("Unable to load qualifications.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPatientListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        from patients.serializers import PatientProfileSerializer
        return _ok(PatientProfileSerializer(pq.get_all_patients(), many=True).data)


class AdminDoctorListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        try:
            rows = dq.get_all_doctors()
            for row in rows:
                # BUG FIX: use "doctor_id" (normalized), not "doctor_user_id"
                uid = str(row["doctor_id"])
                row["qualifications"]  = dq.get_doctor_qualifications(uid)
                row["specializations"] = dq.get_doctor_specializations(uid)
                sched = dq.get_schedule_by_doctor(uid)
                if sched:
                    sched["working_days"] = dq.get_working_days(sched["schedule_id"])
                row["schedule"] = sched
            return _ok(DoctorProfileSerializer(rows, many=True).data)
        except Exception:
            logger.exception("Failed to load admin doctor list")
            return _error("Unable to load doctor list.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLabListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        from labs.serializers import LabProfileSerializer
        rows = lq.get_all_labs()
        for row in rows:
            # BUG FIX: use "lab_id" (normalized), not "lab_user_id"
            uid = str(row["lab_id"])
            row["operating_hours"] = lq.get_lab_operating_hours(uid)
            row["services"]        = lq.get_lab_services(uid)
        return _ok(LabProfileSerializer(rows, many=True).data)


class AdminTogglePatientStatusView(AuditMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        from patients.serializers import PatientProfileSerializer
        patient = pq.get_patient_by_user_id(str(user_id))
        if not patient:
            return _error("Patient not found.", http_status=status.HTTP_404_NOT_FOUND)
        patient, action = AdminService.toggle_patient_status(
            patient_id=str(user_id), admin_user=request.user, request=request
        )
        return _ok(PatientProfileSerializer(patient).data, message=f"Patient {action} successfully.")


class AdminToggleDoctorStatusView(AuditMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            return _error("Doctor not found.", http_status=status.HTTP_404_NOT_FOUND)
        doctor, action = AdminService.toggle_doctor_status(
            doctor_user_id=user_id, admin_user=request.user, request=request
        )
        uid = str(doctor["doctor_id"])
        doctor["qualifications"]  = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        sched = dq.get_schedule_by_doctor(uid)
        if sched:
            sched["working_days"] = dq.get_working_days(sched["schedule_id"])
        doctor["schedule"] = sched
        return _ok(DoctorProfileSerializer(doctor).data, message=f"Doctor {action} successfully.")


class AdminVerifyDoctorView(AuditMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            return _error("Doctor not found.", http_status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        notes      = request.data.get("notes", "")
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return _error("Invalid status. Must be VERIFIED or REJECTED.")
        doctor = AdminService.verify_doctor(
            doctor_user_id=user_id, status=new_status, notes=notes,
            verified_by=request.user, request=request,
        )
        uid = str(doctor["doctor_id"])
        doctor["qualifications"]  = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        sched = dq.get_schedule_by_doctor(uid)
        if sched:
            sched["working_days"] = dq.get_working_days(sched["schedule_id"])
        doctor["schedule"] = sched
        return _ok(DoctorProfileSerializer(doctor).data, message=f"Doctor {new_status.lower()} successfully.")


class AdminVerifyLabView(AuditMixin, generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        from labs.serializers import LabProfileSerializer
        lab = lq.get_lab_by_user_id(user_id)
        if not lab:
            return _error("Lab not found.", http_status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        notes      = request.data.get("notes", "")
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return _error("Invalid status. Must be VERIFIED or REJECTED.")
        lab = AdminService.verify_lab(
            lab_user_id=user_id, status=new_status, notes=notes,
            verified_by=request.user, request=request,
        )
        uid = str(lab["lab_id"])
        lab["operating_hours"] = lq.get_lab_operating_hours(uid)
        lab["services"]        = lq.get_lab_services(uid)
        return _ok(LabProfileSerializer(lab).data, message=f"Lab {new_status.lower()} successfully.")


class PendingApprovalsCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def get(self, request, *args, **kwargs):
        return _ok(AdminService.get_pending_approvals_count())


class RecentActivityView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    _EXCLUDED_ACTIONS = ("USER_LOGIN", "USER_LOGOUT")

    def get(self, request, *args, **kwargs):
        rows = aq.get_recent_activity(limit=50, exclude_actions=self._EXCLUDED_ACTIONS)
        data = [
            {
                "log_id":       r["log_id"],
                "action":       r["action"],
                "entity_type":  r.get("entity_type"),
                "details":      r.get("details"),
                "status":       r.get("status"),
                "performed_by": r.get("performed_by_email"),
                "target_user":  r.get("target_user_email"),
                "ip_address":   str(r["ip_address"]) if r.get("ip_address") else None,
                "request_path": r.get("request_path"),
                "duration_ms":  r.get("duration_ms"),
                "timestamp":    r["created_at"].isoformat() if r.get("created_at") else None,
            }
            for r in rows
        ]
        return _ok(data)