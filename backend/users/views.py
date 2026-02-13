# backend/users/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from django.conf import settings
import traceback  # <-- added to print full tracebacks

from .serializers import (
    PatientRegistrationSerializer,
    DoctorRegistrationSerializer,
    LabRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
    DoctorProfileSerializer,
    DoctorProfileUpdateSerializer,
    LabProfileSerializer,
    LabProfileUpdateSerializer,
    AdminStaffProfileSerializer,
    GenderSerializer,
    BloodGroupSerializer,
    QualificationSerializer,
)
from .models import (
    Patient,
    Doctor,
    Lab,
    UserRole,
    VerificationStatus,
    AccountStatus,
    Gender,
    BloodGroup,
    Qualification,
)
from .utils import generate_tokens, verify_access_token

User = get_user_model()


# ===================================================================================
# ============================ PERMISSIONS ==========================================
# ===================================================================================


class IsAdminOrStaff(BasePermission):
    """
    Allows access only to users with ADMIN or STAFF role.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in [UserRole.ADMIN, UserRole.STAFF]


# ===================================================================================
# ============================ REGISTRATION VIEWS ===================================
# ===================================================================================


class PatientRegistrationView(generics.GenericAPIView):
    """
    POST /api/auth/register/patient/
    Register a new patient account
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PatientRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()

                # Generate tokens
                tokens = generate_tokens(user)

                # Get patient profile
                patient = Patient.objects.get(user=user)
                patient_data = PatientProfileSerializer(patient).data
                print(
                    f"PatientRegistrationView: SUCCESS - patient created user_email={user.email} patient_id={getattr(patient,'patient_id',None)} tokens_keys={list(tokens.keys())}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Patient registered successfully",
                        "data": {"user": patient_data, "tokens": tokens},
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                print(
                    "PatientRegistrationView: EXCEPTION while saving patient registration:"
                )
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Registration failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"PatientRegistrationView: INVALID INPUT - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Registration failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class DoctorRegistrationView(generics.GenericAPIView):
    """
    POST /api/auth/register/doctor/
    Register a new doctor account
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = DoctorRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()

                # Generate tokens
                tokens = generate_tokens(user)

                # Get doctor profile
                doctor = Doctor.objects.get(user=user)
                doctor_data = DoctorProfileSerializer(doctor).data

                print(
                    f"DoctorRegistrationView: SUCCESS - doctor created user_email={user.email} doctor_id={getattr(doctor,'doctor_id',None)} tokens_keys={list(tokens.keys())}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Doctor registered successfully. Account pending verification.",
                        "data": {"user": doctor_data, "tokens": tokens},
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                print(
                    "DoctorRegistrationView: EXCEPTION while saving doctor registration:"
                )
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Registration failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"DoctorRegistrationView: INVALID INPUT - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Registration failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LabRegistrationView(generics.GenericAPIView):
    """
    POST /api/auth/register/lab/
    Register a new lab account
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LabRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()

                # Generate tokens
                tokens = generate_tokens(user)

                # Get lab profile
                lab = Lab.objects.get(user=user)
                lab_data = LabProfileSerializer(lab).data

                print(
                    f"LabRegistrationView: SUCCESS - lab created user_email={user.email} lab_id={getattr(lab,'lab_id',None)} tokens_keys={list(tokens.keys())}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Lab registered successfully. Account pending verification.",
                        "data": {"user": lab_data, "tokens": tokens},
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                print("LabRegistrationView: EXCEPTION while saving lab registration:")
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Registration failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"LabRegistrationView: INVALID INPUT - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Registration failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ===================================================================================
# ============================ LOGIN VIEWS ==========================================
# ===================================================================================


class LoginView(generics.GenericAPIView):
    """
    POST /api/auth/login/
    Login for all user types (Patient, Doctor, Lab, Admin, Staff)
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            print(
                f"\nError in LoginView : {serializer.errors} request_data={request.data}"
            )
            return Response(
                {
                    "success": False,
                    "message": "Invalid input",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as e:
            print(f"\nError in LoginView : User.DoesNotExist for email={email}")
            print(traceback.format_exc())
            return Response(
                {"success": False, "message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check account lockout
        if user.lockout_until and user.lockout_until > timezone.now():
            lock_msg = f"Account is locked. Try again after {user.lockout_until.strftime('%Y-%m-%d %H:%M:%S')}"
            print(
                f"\nLoginView: LOCKED ACCOUNT - email={email} lockout_until={user.lockout_until}"
            )
            return Response(
                {
                    "success": False,
                    "message": lock_msg,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check account status
        if user.account_status == AccountStatus.SUSPENDED:
            print(
                f"\nLoginView: SUSPENDED ACCOUNT - email={email} account_status={user.account_status}"
            )
            return Response(
                {
                    "success": False,
                    "message": "Your account has been suspended. Please contact support.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.account_status == AccountStatus.DELETED:
            print(
                f"\nLoginView: DELETED ACCOUNT - email={email} account_status={user.account_status}"
            )
            return Response(
                {"success": False, "message": "This account has been deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            print(
                f"\nLoginView: INACTIVE ACCOUNT - email={email} is_active={user.is_active}"
            )
            return Response(
                {
                    "success": False,
                    "message": "Your account is inactive. Please contact support.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Authenticate user
        authenticated_user = authenticate(request, email=email, password=password)

        if authenticated_user is None:
            # Increment failed login attempts
            user.failed_login_attempts += 1

            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.lockout_until = timezone.now() + timedelta(minutes=30)
                user.save()
                print(
                    f"\nLoginView: ACCOUNT LOCKED DUE TO FAILED ATTEMPTS - email={email} failed_attempts={user.failed_login_attempts} lockout_until={user.lockout_until}"
                )
                return Response(
                    {
                        "success": False,
                        "message": "Too many failed login attempts. Account locked for 30 minutes.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.save()
            print(
                f"\nLoginView: INVALID CREDENTIALS - email={email} failed_attempts={user.failed_login_attempts}"
            )
            return Response(
                {"success": False, "message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Reset failed login attempts on successful login
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.last_login_at = timezone.now()
        user.save()

        # Generate tokens
        tokens = generate_tokens(user)

        # Get profile data based on user role
        profile_data = self._get_profile_data(user)

        print(
            f"LoginView: SUCCESS - email={email} user_id={user.user_id} role={user.role} last_login_at={user.last_login_at}"
        )
        return Response(
            {
                "success": True,
                "message": "Login successful",
                "data": {"user": profile_data, "tokens": tokens},
            },
            status=status.HTTP_200_OK,
        )

    def _get_profile_data(self, user):
        """Get profile data based on user role"""
        if user.role == UserRole.PATIENT:
            try:
                patient = Patient.objects.get(user=user)
                return PatientProfileSerializer(patient).data
            except Patient.DoesNotExist:
                return UserSerializer(user).data

        elif user.role == UserRole.DOCTOR:
            try:
                doctor = Doctor.objects.get(user=user)
                return DoctorProfileSerializer(doctor).data
            except Doctor.DoesNotExist:
                return UserSerializer(user).data

        elif user.role == UserRole.LAB:
            try:
                lab = Lab.objects.get(user=user)
                return LabProfileSerializer(lab).data
            except Lab.DoesNotExist:
                return UserSerializer(user).data

        elif user.role in [UserRole.ADMIN, UserRole.STAFF]:
            return AdminStaffProfileSerializer(user).data

        return UserSerializer(user).data


class LogoutView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    Logout user and revoke refresh token
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Get refresh token from request
            refresh_token = request.data.get("refresh_token")

            if refresh_token:
                # Revoke the token
                from .models import UserTokens

                try:
                    token = UserTokens.objects.get(
                        refresh_token=refresh_token, user=request.user
                    )
                    token.is_revoked = True
                    token.save()
                    print(
                        f"LogoutView: revoked refresh_token for user_id={request.user.user_id}"
                    )
                except UserTokens.DoesNotExist:
                    print(
                        f"LogoutView: provided refresh_token not found for user_id={request.user.user_id} refresh_token={refresh_token}"
                    )

            print(f"LogoutView: SUCCESS - user_id={request.user.user_id}")
            return Response(
                {"success": True, "message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print("LogoutView: EXCEPTION during logout:")
            print(traceback.format_exc())
            return Response(
                {"success": False, "message": "Logout failed", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ===================================================================================
# ============================ PROFILE VIEWS ========================================
# ===================================================================================


class PatientProfileView(generics.GenericAPIView):
    """
    GET /api/profile/patient/
    PUT /api/profile/patient/
    PATCH /api/profile/patient/
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return PatientProfileSerializer
        return PatientProfileUpdateSerializer

    def get_object(self):
        try:
            return Patient.objects.get(user=self.request.user)
        except Patient.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        """Get patient profile"""
        if request.user.role != UserRole.PATIENT:
            print(
                f"PatientProfileView.GET: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Patient role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        patient = self.get_object()
        if not patient:
            print(
                f"PatientProfileView.GET: NOT FOUND - patient profile not found for user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(patient)
        print(
            f"PatientProfileView.GET: SUCCESS - returning profile for user_id={request.user.user_id} patient_id={getattr(patient,'patient_id',None)}"
        )
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def put(self, request, *args, **kwargs):
        """Full update patient profile"""
        return self._update_profile(request, partial=False)

    def patch(self, request, *args, **kwargs):
        """Partial update patient profile"""
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=False):
        if request.user.role != UserRole.PATIENT:
            print(
                f"PatientProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Patient role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        patient = self.get_object()
        if not patient:
            print(
                f"PatientProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(patient, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                serializer.save()
                # Return full profile data
                profile_serializer = PatientProfileSerializer(patient, context={"request": request})
                print(
                    f"PatientProfileView._update_profile: SUCCESS - profile updated for user_id={request.user.user_id} patient_id={getattr(patient,'patient_id',None)}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": profile_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print(
                    "PatientProfileView._update_profile: EXCEPTION while saving profile:"
                )
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"PatientProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Profile update failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class DoctorProfileView(generics.GenericAPIView):
    """
    GET /api/profile/doctor/
    PUT /api/profile/doctor/
    PATCH /api/profile/doctor/
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return DoctorProfileSerializer
        return DoctorProfileUpdateSerializer

    def get_object(self):
        try:
            return Doctor.objects.get(user=self.request.user)
        except Doctor.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        """Get doctor profile"""
        if request.user.role != UserRole.DOCTOR:
            print(
                f"DoctorProfileView.GET: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Doctor role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor = self.get_object()
        if not doctor:
            print(
                f"DoctorProfileView.GET: NOT FOUND - doctor profile not found for user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Doctor profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(doctor)
        print(
            f"DoctorProfileView.GET: SUCCESS - returning profile for user_id={request.user.user_id} doctor_id={getattr(doctor,'doctor_id',None)}"
        )
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def put(self, request, *args, **kwargs):
        """Full update doctor profile"""
        return self._update_profile(request, partial=False)

    def patch(self, request, *args, **kwargs):
        """Partial update doctor profile"""
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=False):
        if request.user.role != UserRole.DOCTOR:
            print(
                f"DoctorProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Doctor role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor = self.get_object()
        if not doctor:
            print(
                f"DoctorProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Doctor profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(doctor, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                serializer.save()
                # Return full profile data
                profile_serializer = DoctorProfileSerializer(doctor, context={"request": request})
                print(
                    f"DoctorProfileView._update_profile: SUCCESS - profile updated for user_id={request.user.user_id} doctor_id={getattr(doctor,'doctor_id',None)}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": profile_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print(
                    "DoctorProfileView._update_profile: EXCEPTION while saving profile:"
                )
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"DoctorProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Profile update failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LabProfileView(generics.GenericAPIView):
    """
    GET /api/profile/lab/
    PUT /api/profile/lab/
    PATCH /api/profile/lab/
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return LabProfileSerializer
        return LabProfileUpdateSerializer

    def get_object(self):
        try:
            return Lab.objects.get(user=self.request.user)
        except Lab.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        """Get lab profile"""
        if request.user.role != UserRole.LAB:
            print(
                f"LabProfileView.GET: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Lab role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        lab = self.get_object()
        if not lab:
            print(
                f"LabProfileView.GET: NOT FOUND - lab profile not found for user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Lab profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(lab)
        print(
            f"LabProfileView.GET: SUCCESS - returning profile for user_id={request.user.user_id} lab_id={getattr(lab,'lab_id',None)}"
        )
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def put(self, request, *args, **kwargs):
        """Full update lab profile"""
        return self._update_profile(request, partial=False)

    def patch(self, request, *args, **kwargs):
        """Partial update lab profile"""
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=False):
        if request.user.role != UserRole.LAB:
            print(
                f"LabProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {"success": False, "message": "Access denied. Lab role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        lab = self.get_object()
        if not lab:
            print(
                f"LabProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}"
            )
            return Response(
                {"success": False, "message": "Lab profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(lab, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                serializer.save()
                # Return full profile data
                profile_serializer = LabProfileSerializer(lab, context={"request": request})
                print(
                    f"LabProfileView._update_profile: SUCCESS - profile updated for user_id={request.user.user_id} lab_id={getattr(lab,'lab_id',None)}"
                )
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": profile_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print("LabProfileView._update_profile: EXCEPTION while saving profile:")
                print(traceback.format_exc())
                print(f"Request data: {request.data}")
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(
            f"LabProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors} request_data={request.data}"
        )
        return Response(
            {
                "success": False,
                "message": "Profile update failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class AdminStaffProfileView(generics.GenericAPIView):
    """
    GET /api/profile/admin-staff/
    Admin and Staff profile view
    """

    serializer_class = AdminStaffProfileSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get admin/staff profile"""
        if request.user.role not in [UserRole.ADMIN, UserRole.STAFF]:
            print(
                f"AdminStaffProfileView.GET: ACCESS DENIED - user_id={request.user.user_id} role={request.user.role}"
            )
            return Response(
                {
                    "success": False,
                    "message": "Access denied. Admin or Staff role required.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(request.user)
        print(
            f"AdminStaffProfileView.GET: SUCCESS - returning admin/staff profile for user_id={request.user.user_id}"
        )
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )


class CurrentUserProfileView(generics.GenericAPIView):
    """
    GET /api/profile/me/
    Get current user profile based on their role
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get current user's profile"""
        user = request.user

        if user.role == UserRole.PATIENT:
            try:
                patient = Patient.objects.get(user=user)
                serializer = PatientProfileSerializer(patient, context={"request": request})
                print(
                    f"CurrentUserProfileView.GET: SUCCESS - returning PATIENT profile for user_id={user.user_id}"
                )
                return Response(
                    {"success": True, "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            except Patient.DoesNotExist:
                print(
                    f"CurrentUserProfileView.GET: PATIENT profile not found for user_id={user.user_id}"
                )

        elif user.role == UserRole.DOCTOR:
            try:
                doctor = Doctor.objects.get(user=user)
                serializer = DoctorProfileSerializer(doctor, context={"request": request})
                print(
                    f"CurrentUserProfileView.GET: SUCCESS - returning DOCTOR profile for user_id={user.user_id}"
                )
                return Response(
                    {"success": True, "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            except Doctor.DoesNotExist:
                print(
                    f"CurrentUserProfileView.GET: DOCTOR profile not found for user_id={user.user_id}"
                )

        elif user.role == UserRole.LAB:
            try:
                lab = Lab.objects.get(user=user)
                serializer = LabProfileSerializer(lab, context={"request": request})
                print(
                    f"CurrentUserProfileView.GET: SUCCESS - returning LAB profile for user_id={user.user_id}"
                )
                return Response(
                    {"success": True, "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            except Lab.DoesNotExist:
                print(
                    f"CurrentUserProfileView.GET: LAB profile not found for user_id={user.user_id}"
                )

        elif user.role in [UserRole.ADMIN, UserRole.STAFF]:
            serializer = AdminStaffProfileSerializer(user, context={"request": request})
            print(
                f"CurrentUserProfileView.GET: SUCCESS - returning ADMIN/STAFF profile for user_id={user.user_id}"
            )
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )

        # Fallback to basic user serializer
        serializer = UserSerializer(user)
        print(
            f"CurrentUserProfileView.GET: FALLBACK - returning basic user serializer for user_id={user.user_id}"
        )
        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )


# ===================================================================================
# ============================ TOKEN REFRESH VIEW ===================================
# ===================================================================================


class RefreshTokenView(generics.GenericAPIView):
    """
    POST /api/auth/refresh/
    Refresh access token using refresh token
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from .models import UserTokens

        refresh_token = request.data.get("refresh_token")

        if not refresh_token:
            print("RefreshTokenView: MISSING refresh_token in request")
            return Response(
                {"success": False, "message": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify token exists and is not revoked or expired
            token_obj = UserTokens.objects.get(
                refresh_token=refresh_token,
                is_revoked=False,
                expires_at__gt=timezone.now(),
            )

            # Generate new access token
            from .utils import generate_access_token

            access_token = generate_access_token(token_obj.user)
            print(
                f"RefreshTokenView: SUCCESS - refreshed access token for user_id={token_obj.user.user_id}"
            )
            return Response(
                {
                    "success": True,
                    "message": "Token refreshed successfully",
                    "data": {"access_token": access_token},
                },
                status=status.HTTP_200_OK,
            )

        except UserTokens.DoesNotExist:
            print(
                f"RefreshTokenView: INVALID_OR_EXPIRED refresh_token provided: {refresh_token}"
            )
            return Response(
                {"success": False, "message": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            print("RefreshTokenView: EXCEPTION while refreshing token:")
            print(traceback.format_exc())
            return Response(
                {"success": False, "message": "Token refresh failed", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ===================================================================================
# ====================== SUPPORTING DATA LIST VIEWS =================================
# ===================================================================================


class BloodGroupListView(generics.ListAPIView):
    """
    GET /api/blood-groups/
    Public endpoint to fetch all blood groups.
    """

    permission_classes = [AllowAny]
    serializer_class = BloodGroupSerializer
    queryset = BloodGroup.objects.all().order_by("blood_group_value")
    pagination_class = None


class GenderListView(generics.ListAPIView):
    """
    GET /api/genders/
    Public endpoint to fetch all genders.
    """

    permission_classes = [AllowAny]
    serializer_class = GenderSerializer
    queryset = Gender.objects.all().order_by("gender_value")
    pagination_class = None


class QualificationListView(generics.ListAPIView):
    """
    GET /api/qualifications/
    Public endpoint to fetch all qualifications.
    """

    permission_classes = [AllowAny]
    serializer_class = QualificationSerializer
    queryset = Qualification.objects.all().order_by(
        "qualification_code"
    )
    pagination_class = None


# ===================================================================================
# ============================ ADMIN LIST VIEWS =====================================
# ===================================================================================


class AdminPatientListView(generics.ListAPIView):
    """
    GET /api/admin/patients/
    List all patients for admin and staff users.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = PatientProfileSerializer
    queryset = (
        Patient.objects.select_related("user", "blood_group")
        .all()
        .order_by("patient_id")
    )
    pagination_class = None


class AdminDoctorListView(generics.ListAPIView):
    """
    GET /api/admin/doctors/
    List all doctors for admin and staff users.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = DoctorProfileSerializer
    queryset = (
        Doctor.objects.select_related("user", "gender").all().order_by("full_name")
    )
    pagination_class = None


class AdminLabListView(generics.ListAPIView):
    """
    GET /api/admin/labs/
    List all labs for admin and staff users.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = LabProfileSerializer
    queryset = Lab.objects.select_related("user").all().order_by("lab_name")
    pagination_class = None


# ===================================================================================
# ============================ ADMIN ACTION VIEWS ===================================
# ===================================================================================


class AdminTogglePatientStatusView(generics.GenericAPIView):
    """
    PATCH /api/admin/patients/<patient_id>/toggle-status/
    Toggle patient active status (activate/deactivate)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = PatientProfileSerializer

    def patch(self, request, patient_id, *args, **kwargs):
        try:
            patient = Patient.objects.select_related("user", "blood_group").get(
                patient_id=patient_id
            )
        except Patient.DoesNotExist:
            print(
                f"AdminTogglePatientStatusView: NOT FOUND - patient_id={patient_id}"
            )
            return Response(
                {"success": False, "message": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Toggle the is_active status
        patient.is_active = not patient.is_active
        patient.save()

        # Also update the user's is_active status
        user = patient.user
        user.is_active = patient.is_active
        user.save()

        serializer = self.serializer_class(patient, context={"request": request})
        action = "activated" if patient.is_active else "deactivated"
        print(
            f"AdminTogglePatientStatusView: SUCCESS - patient_id={patient_id} {action}"
        )

        return Response(
            {
                "success": True,
                "message": f"Patient {action} successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminToggleDoctorStatusView(generics.GenericAPIView):
    """
    PATCH /api/admin/doctors/<user_id>/toggle-status/
    Toggle doctor active status (activate/deactivate)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        try:
            doctor = Doctor.objects.select_related("user", "gender").get(
                user__user_id=user_id
            )
        except Doctor.DoesNotExist:
            print(f"AdminToggleDoctorStatusView: NOT FOUND - user_id={user_id}")
            return Response(
                {"success": False, "message": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Toggle the is_active status
        doctor.is_active = not doctor.is_active
        doctor.save()

        # Also update the user's is_active status
        user = doctor.user
        user.is_active = doctor.is_active
        user.save()

        serializer = self.serializer_class(doctor, context={"request": request})
        action = "activated" if doctor.is_active else "deactivated"
        print(f"AdminToggleDoctorStatusView: SUCCESS - user_id={user_id} {action}")

        return Response(
            {
                "success": True,
                "message": f"Doctor {action} successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminVerifyDoctorView(generics.GenericAPIView):
    """
    PATCH /api/admin/doctors/<user_id>/verify/
    Verify or Reject a doctor account.
    Payload: { "status": "VERIFIED" | "REJECTED", "notes": "optional" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = DoctorProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        
        try:
            doctor = Doctor.objects.select_related("user").get(user__user_id=user_id)
        except Doctor.DoesNotExist:
            return Response(
                {"success": False, "message": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        notes = request.data.get("notes", "")

        # Only allow VERIFIED or REJECTED
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor.verification_status = new_status
        doctor.verification_notes = notes
        doctor.verified_by = request.user
        doctor.verified_at = timezone.now()
        
        # If verified, also activate the account
        if new_status == VerificationStatus.VERIFIED:
            doctor.is_active = True
            doctor.user.is_active = True
            doctor.user.save()
        elif new_status == VerificationStatus.REJECTED:
            doctor.is_active = False
            doctor.user.is_active = False
            doctor.user.save()
            
        doctor.save()
        
        serializer = self.get_serializer(doctor)
        return Response(
            {
                "success": True, 
                "message": f"Doctor {new_status.lower()} successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class AdminVerifyLabView(generics.GenericAPIView):
    """
    PATCH /api/admin/labs/<user_id>/verify/
    Verify or Reject a lab account.
    Payload: { "status": "VERIFIED" | "REJECTED", "notes": "optional" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    serializer_class = LabProfileSerializer

    def patch(self, request, user_id, *args, **kwargs):
        
        try:
            lab = Lab.objects.select_related("user").get(user__user_id=user_id)
        except Lab.DoesNotExist:
            return Response(
                {"success": False, "message": "Lab not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        notes = request.data.get("notes", "")

        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lab.verification_status = new_status
        lab.verification_notes = notes
        lab.verified_by = request.user
        lab.verified_at = timezone.now()
        
        # If verified, also activate the account
        if new_status == VerificationStatus.VERIFIED:
            lab.is_active = True
            lab.user.is_active = True
            lab.user.save()
        elif new_status == VerificationStatus.REJECTED:
            lab.is_active = False
            lab.user.is_active = False
            lab.user.save()

        lab.save()
        
        serializer = self.get_serializer(lab)
        return Response(
            {
                "success": True, 
                "message": f"Lab {new_status.lower()} successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class PendingApprovalsCountView(generics.GenericAPIView):
    """
    GET /api/admin/pending-approvals/count/
    Get the count of pending approvals for doctors and labs.
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request, *args, **kwargs):
        pending_doctors = Doctor.objects.filter(verification_status=VerificationStatus.PENDING).count()
        pending_labs = Lab.objects.filter(verification_status=VerificationStatus.PENDING).count()
        
        return Response(
            {
                "success": True,
                "data": {
                    "doctors": pending_doctors,
                    "labs": pending_labs,
                    "total": pending_doctors + pending_labs
                }
            },
            status=status.HTTP_200_OK
        )

