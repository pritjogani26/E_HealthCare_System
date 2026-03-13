# backend/users/views.py

import logging
from django.http import HttpRequest
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import SimpleRateThrottle
from .serializers import (
    LoginSerializer,
    GenderSerializer,
    BloodGroupSerializer,
    UserSerializer,
    QualificationSerializer,
    ReAuthVerifySerializer,  # already in serializers.py
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
from .jwt_auth import rotate_refresh_token, UserWrapper
import db.user_queries as uq
import db.audit_queries as aq
import db.doctor_queries as dq
import db.lab_queries as lq
import db.patient_queries as pq

logger = logging.getLogger(__name__)


# ── Response helpers ──────────────────────────────────────────────────────────


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


# ── Throttle for re-auth endpoint ─────────────────────────────────────────────


class ReAuthRateThrottle(SimpleRateThrottle):
    """
    5 attempts per minute, keyed on the authenticated user's ID.
    Prevents brute-forcing the inactivity-modal password prompt.
    Using user ID (not IP) because healthcare apps often sit behind proxies.

    Register the scope in settings.py:
        REST_FRAMEWORK = {
            ...
            "DEFAULT_THROTTLE_RATES": {
                "reauth": "5/min",
            },
        }
    """

    scope = "reauth"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = str(request.user.user_id)
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


# ── Existing views (unchanged) ────────────────────────────────────────────────


class LoginView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return _error("Invalid input", serializer.errors)
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            print(f"\n\nEmail : {email}, and Password : {password}\n")
            user = uq.get_user_by_email(email)
            if not user:
                return _error(
                    "Invalid credentials", http_status=status.HTTP_401_UNAUTHORIZED
                )

            is_locked, lock_msg = AuthService.check_account_lockout(user)
            if is_locked:
                return _error(lock_msg, http_status=status.HTTP_403_FORBIDDEN)

            is_active, active_msg = AuthService.check_account_status(user)
            if not is_active:
                return _error(active_msg, http_status=status.HTTP_403_FORBIDDEN)

            authenticated = password_service.verify_password(
                password, user.get("password", "")
            )

            if not authenticated:
                should_lock, msg = AuthService.handle_failed_login(user)
                return _error(
                    msg,
                    http_status=(
                        status.HTTP_403_FORBIDDEN
                        if should_lock
                        else status.HTTP_403_FORBIDDEN
                    ),
                )
            print("\n\nsuccess..................................................")
            AuthService.handle_successful_login(user["user_id"])
            user = uq.get_user_by_id(user["user_id"])

            user_dict = user

            response_dict, refresh_token = set_auth_response_with_tokens(
                user_dict, "Login successful"
            )
            response = Response(response_dict, status=status.HTTP_200_OK)
            set_refresh_token_cookie(response, refresh_token)
            return response
        except Exception as e:
            print(f"Error : {e}")


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"success": True, "message": "Logged out successfully"})
        response.delete_cookie("refresh_token")
        return response


class RefreshTokenView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request: HttpRequest, *args, **kwargs):
        raw_token = request.COOKIES.get("refresh_token")
        print(f"\n\nRow Refresh Token  : {raw_token}")
        if not raw_token:
            return _error("Refresh token is required.")
        try:
            user_dict, access_token, new_refresh_token = rotate_refresh_token(raw_token)
        except ValueError as exc:
            resp = _error(str(exc), http_status=status.HTTP_401_UNAUTHORIZED)
            resp.delete_cookie("refresh_token")
            return resp
        user_wrap = UserWrapper(user_dict)
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
        print("\n========== GOOGLE AUTH FLOW STARTED ==========\n")

        from .services.oauth_service import OAuthService

        token = request.data.get("token")
        print(f"[STEP 1] Token received from frontend: {token}")

        if not token:
            print("[ERROR] No token received from request.")
            return _error("Google token not provided")

        print("[STEP 2] Verifying Google token with OAuthService...")
        idinfo, error = OAuthService.verify_google_token(token)

        print(f"[STEP 2 RESULT] idinfo: {idinfo}")
        print(f"[STEP 2 RESULT] error: {error}")

        if error:
            print("[ERROR] Google token verification failed.")
            return _error(error)

        email = idinfo.get("email")
        print(f"[STEP 3] Extracted email from Google token: {email}")

        if not email:
            print("[ERROR] Email not found in Google token payload.")
            return _error("Google token missing email claim.")

        print(f"[STEP 4] Checking if user exists with email: {email}")
        user = uq.get_user_by_email(email)

        print(f"[STEP 4 RESULT] User fetched from DB: {user}")

        if not user:
            print("[STEP 5] User not registered. Returning registration details.")

            response_data = {
                "success": True,
                "registered": False,
                "message": "User not registered. Please complete registration.",
                "email": email,
                "first_name": idinfo.get("given_name", ""),
                "last_name": idinfo.get("family_name", ""),
                "picture": idinfo.get("picture", ""),
                "oauth_provider": "google",
                "oauth_provider_id": idinfo.get("sub"),
            }

            print(f"[STEP 5 RESPONSE] {response_data}")

            return Response(response_data, status=status.HTTP_200_OK)

        print("[STEP 6] Checking account status...")
        is_active, msg = AuthService.check_account_status(user)

        print(f"[STEP 6 RESULT] is_active: {is_active}, message: {msg}")

        if not is_active:
            print("[ERROR] User account inactive or blocked.")
            return _error(msg, http_status=status.HTTP_403_FORBIDDEN)

        print("[STEP 7] Checking OAuth provider linkage...")
        if not user.get("oauth_provider"):
            print("[STEP 7] OAuth provider not set. Updating provider to Google.")

            uq.update_oauth_provider(user["user_id"], "google", idinfo.get("sub"))

            print("[STEP 7] OAuth provider updated successfully.")

            user = uq.get_user_by_id(user["user_id"])
            print(f"[STEP 7 RESULT] Updated user record: {user}")

        print("[STEP 8] Handling successful login (update last login etc.)")
        AuthService.handle_successful_login(user["user_id"])

        print("[STEP 9] Wrapping user object...")

        print(f"\n\nUser : {user}")

        print("[STEP 10] Fetching profile data by role...")
        profile_data = get_profile_data_by_role(user)

        print(f"[STEP 10 RESULT] Profile Data: {profile_data}")

        print("[STEP 11] Generating auth response with tokens...")
        response_dict, rt = set_auth_response_with_tokens(
            user, "Google login successful"
        )

        print(f"[STEP 11 RESULT] Response Dict: {response_dict}")
        print(f"[STEP 11 RESULT] Refresh Token: {rt}")

        print("[STEP 12] Creating HTTP response...")
        response = Response(response_dict, status=status.HTTP_200_OK)

        print("[STEP 13] Setting refresh token cookie...")
        set_refresh_token_cookie(response, rt)

        print("\n========== GOOGLE AUTH FLOW COMPLETED ==========\n")

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

    def get(self, request: HttpRequest, *args, **kwargs):
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
            return Response(
                QualificationSerializer(uq.get_all_qualifications(), many=True).data
            )
        except Exception:
            logger.exception("Failed to load qualification list")
            return _error(
                "Unable to load qualifications.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminPatientListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    pagination_class = None
    serializer_class = PatientListSerializer

    def get(self, request, *args, **kwargs):
        try:
            all_patients = pq.get_all_patients()
            serializer = self.get_serializer(data=all_patients, many=True)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            return _ok(data)
        except Exception as e:
            print(f"Error : {e}")


class AdminDoctorListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    pagination_class = None
    serializer_class = DoctorListSerializer

    def get(self, request, *args, **kwargs):
        try:
            rows = dq.get_all_doctors()
            print(f"\n\nDoctors List : {rows}")
            serializer = self.get_serializer(data=rows, many=True)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            return _ok(data)
        except Exception:
            logger.exception("Failed to load admin doctor list")
            return _error(
                "Unable to load doctor list.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminLabListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = LabListSerializer

    def get(self, request, *args, **kwargs):
        try:
            rows = lq.get_all_labs()
            serializer = self.get_serializer(data=rows, many=True)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            return _ok(data)
        except Exception as e:
            print(e)


class AdminTogglePatientStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = PatientProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):

        patient = pq.get_patient_by_id(str(user_id))
        if not patient:
            return _error("Patient not found.", http_status=status.HTTP_404_NOT_FOUND)
        patient, action = AdminService.toggle_patient_status(
            patient_id=str(user_id), admin_user=request.user, request=request
        )
        serializer = self.get_serializer(data=patient)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        return _ok(
            patient,
            message=f"Patient {action} successfully.",
        )


class AdminToggleDoctorStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            return _error("Doctor not found.", http_status=status.HTTP_404_NOT_FOUND)
        doctor, action = AdminService.toggle_doctor_status(
            doctor_user_id=user_id, admin_user=request.user, request=request
        )
        uid = str(doctor["doctor_id"])
        doctor["qualifications"] = dq.get_doctor_qualifications(uid)
        doctor["specializations"] = dq.get_doctor_specializations(uid)
        sched = dq.get_schedule_by_doctor(uid)
        if sched:
            sched["working_days"] = dq.get_working_days(sched["schedule_id"])
        doctor["schedule"] = sched
        return _ok(doctor, message=f"Doctor {action} successfully.")


class AdminVerifyDoctorView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        try:
            doctor = dq.get_doctor_by_user_id(user_id)
            if not doctor:
                return _error(
                    "Doctor not found.", http_status=status.HTTP_404_NOT_FOUND
                )
            new_status = request.data.get("status")
            notes = request.data.get("notes", "")
            if new_status not in [
                VerificationStatus.VERIFIED,
                VerificationStatus.REJECTED,
            ]:
                return _error("Invalid status. Must be VERIFIED or REJECTED.")
            doctor = AdminService.verify_doctor(
                doctor_user_id=user_id,
                status=new_status,
                notes=notes,
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
            return _ok(
                doctor,
                message=f"Doctor {new_status.lower()} successfully.",
            )
        except Exception as e:
            print("Errro : ", e)
            return _error(msg=f"Errro : {e}", http_status=500)


class AdminVerifyLabView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def patch(self, request, user_id, *args, **kwargs):
        from labs.serializers import LabProfileSerializer

        lab = lq.get_lab_by_user_id(user_id)
        if not lab:
            return _error("Lab not found.", http_status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        notes = request.data.get("notes", "")
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return _error("Invalid status. Must be VERIFIED or REJECTED.")
        lab = AdminService.verify_lab(
            lab_user_id=user_id,
            status=new_status,
            notes=notes,
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
        return _ok(data)


class ReAuthVerifyView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = ReAuthVerifySerializer

    def post(self, request, *args, **kwargs):
        try:
            print(f"\nRequest :  {request.data}")
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return _error("Invalid request.", serializer.errors)

            password = serializer.validated_data["password"]

            user = uq.get_user_by_id(str(request.user.user_id))
            print(f"\n\nUser is  : {user}")
            if not user:
                return _error(
                    "Invalid credentials", http_status=status.HTTP_401_UNAUTHORIZED
                )

            is_locked, lock_msg = AuthService.check_account_lockout(user)
            if is_locked:
                return _error(lock_msg, http_status=status.HTTP_403_FORBIDDEN)

            is_active, active_msg = AuthService.check_account_status(user)
            if not is_active:
                return _error(active_msg, http_status=status.HTTP_403_FORBIDDEN)

            authenticated = password_service.verify_password(
                password, user.get("password", "")
            )

            if not authenticated:
                should_lock, msg = AuthService.handle_failed_login(user)
                return _error(
                    msg,
                    http_status=(
                        status.HTTP_403_FORBIDDEN
                        if should_lock
                        else status.HTTP_401_UNAUTHORIZED
                    ),
                )
            print("\n\nsuccess..................................................")
            AuthService.handle_successful_login(user["user_id"])

            print(
                "reauth-verify: success for user_id=%s",
                request.user.user_id,
            )
            return _ok(message="Re-authentication successful.")

        except Exception as e:
            print(e)
            return _error("Error", str(e), 400)
