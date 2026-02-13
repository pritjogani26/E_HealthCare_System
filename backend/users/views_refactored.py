# backend/users/views_refactored.py
# REFACTORED VERSION - Uses service layer for better code organization

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import traceback

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
    Gender,
    BloodGroup,
    Qualification,
    UserTokens,
)
from .services import AuthService, ProfileService, RegistrationService, AdminService
from .helpers import set_auth_response_with_tokens, get_profile_data_by_role, set_refresh_token_cookie
from .permissions import IsAdminOrStaff
from .utils import generate_access_token, generate_refresh_token

User = get_user_model()


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
                # Use RegistrationService to handle registration logic
                user, patient_data = RegistrationService.register_patient(serializer)

                # Prepare response with tokens
                response_dict, refresh_token = set_auth_response_with_tokens(
                    user=user,
                    user_data=patient_data,
                    message="Patient registered successfully"
                )

                # Create response and set refresh token in HttpOnly cookie
                response = Response(response_dict, status=status.HTTP_201_CREATED)
                set_refresh_token_cookie(response, refresh_token)

                print(f"PatientRegistrationView: SUCCESS - patient created user_email={user.email}")
                return response
                
            except Exception as e:
                print("PatientRegistrationView: EXCEPTION while saving patient registration:")
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

        print(f"PatientRegistrationView: INVALID INPUT - errors={serializer.errors}")
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
                # Use RegistrationService to handle registration logic
                user, doctor_data = RegistrationService.register_doctor(serializer)

                # Prepare response with tokens
                response_dict, refresh_token = set_auth_response_with_tokens(
                    user=user,
                    user_data=doctor_data,
                    message="Doctor registered successfully. Account pending verification."
                )

                # Create response and set refresh token in HttpOnly cookie
                response = Response(response_dict, status=status.HTTP_201_CREATED)
                set_refresh_token_cookie(response, refresh_token)

                print(f"DoctorRegistrationView: SUCCESS - doctor created user_email={user.email}")
                return response
                
            except Exception as e:
                print("DoctorRegistrationView: EXCEPTION while saving doctor registration:")
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

        print(f"DoctorRegistrationView: INVALID INPUT - errors={serializer.errors}")
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
                # Use RegistrationService to handle registration logic
                user, lab_data = RegistrationService.register_lab(serializer)

                # Prepare response with tokens
                response_dict, refresh_token = set_auth_response_with_tokens(
                    user=user,
                    user_data=lab_data,
                    message="Lab registered successfully. Account pending verification."
                )

                # Create response and set refresh token in HttpOnly cookie
                response = Response(response_dict, status=status.HTTP_201_CREATED)
                set_refresh_token_cookie(response, refresh_token)

                print(f"LabRegistrationView: SUCCESS - lab created user_email={user.email}")
                return response
                
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

        print(f"LabRegistrationView: INVALID INPUT - errors={serializer.errors}")
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
            print(f"\\nError in LoginView : {serializer.errors}")
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
        except User.DoesNotExist:
            print(f"\\nError in LoginView : User.DoesNotExist for email={email}")
            return Response(
                {"success": False, "message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Use AuthService to check account lockout
        is_locked, lock_message = AuthService.check_account_lockout(user)
        if is_locked:
            print(f"\\nLoginView: LOCKED ACCOUNT - email={email}")
            return Response(
                {"success": False, "message": lock_message},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Use AuthService to check account status
        is_valid, status_message = AuthService.check_account_status(user)
        if not is_valid:
            print(f"\\nLoginView: INVALID ACCOUNT STATUS - email={email}")
            return Response(
                {"success": False, "message": status_message},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Authenticate user using AuthService
        authenticated_user = AuthService.authenticate_user(request, email, password)

        if authenticated_user is None:
            # Handle failed login using AuthService
            should_lock, message = AuthService.handle_failed_login(user)
            print(f"\\nLoginView: INVALID CREDENTIALS - email={email}")
            
            if should_lock:
                return Response(
                    {"success": False, "message": message},
                    status=status.HTTP_403_FORBIDDEN,
                )
            
            return Response(
                {"success": False, "message": message},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Handle successful login using AuthService
        AuthService.handle_successful_login(user)

        # Get profile data using helper
        profile_data = get_profile_data_by_role(user)

        # Prepare response with tokens
        response_dict, refresh_token = set_auth_response_with_tokens(
            user=user,
            user_data=profile_data,
            message="Login successful"
        )

        # Create response and set refresh token in HttpOnly cookie
        response = Response(response_dict, status=status.HTTP_200_OK)
        set_refresh_token_cookie(response, refresh_token)

        print(f"LoginView: SUCCESS - email={email} user_id={user.user_id} role={user.role}")
        return response


class LogoutView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    Logout user and revoke refresh token
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh_token")

            response = Response(
                {"success": True, "message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )
            response.delete_cookie('refresh_token')

            if refresh_token:
                # Use AuthService to revoke token
                revoked = AuthService.revoke_refresh_token(refresh_token, request.user)
                if revoked:
                    print(f"LogoutView: revoked refresh_token for user_id={request.user.user_id}")
                else:
                    print(f"LogoutView: refresh_token not found for user_id={request.user.user_id}")

            print(f"LogoutView: SUCCESS - user_id={request.user.user_id}")
            return response

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
        return ProfileService.get_patient_profile(self.request.user)

    def get(self, request, *args, **kwargs):
        """Get patient profile"""
        if not ProfileService.validate_user_role(request.user, UserRole.PATIENT):
            print(f"PatientProfileView.GET: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Patient role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        patient = self.get_object()
        if not patient:
            print(f"PatientProfileView.GET: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(patient)
        print(f"PatientProfileView.GET: SUCCESS - user_id={request.user.user_id}")
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
        if not ProfileService.validate_user_role(request.user, UserRole.PATIENT):
            print(f"PatientProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Patient role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        patient = self.get_object()
        if not patient:
            print(f"PatientProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(patient, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                # Use ProfileService to update profile
                updated_data = ProfileService.update_patient_profile(patient, serializer)
                print(f"PatientProfileView._update_profile: SUCCESS - user_id={request.user.user_id}")
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": updated_data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print("PatientProfileView._update_profile: EXCEPTION while saving profile:")
                print(traceback.format_exc())
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(f"PatientProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors}")
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
        return ProfileService.get_doctor_profile(self.request.user)

    def get(self, request, *args, **kwargs):
        """Get doctor profile"""
        if not ProfileService.validate_user_role(request.user, UserRole.DOCTOR):
            print(f"DoctorProfileView.GET: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Doctor role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor = self.get_object()
        if not doctor:
            print(f"DoctorProfileView.GET: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Doctor profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(doctor)
        print(f"DoctorProfileView.GET: SUCCESS - user_id={request.user.user_id}")
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
        if not ProfileService.validate_user_role(request.user, UserRole.DOCTOR):
            print(f"DoctorProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Doctor role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor = self.get_object()
        if not doctor:
            print(f"DoctorProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Doctor profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(doctor, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                # Use ProfileService to update profile
                updated_data = ProfileService.update_doctor_profile(doctor, serializer)
                print(f"DoctorProfileView._update_profile: SUCCESS - user_id={request.user.user_id}")
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": updated_data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print("DoctorProfileView._update_profile: EXCEPTION while saving profile:")
                print(traceback.format_exc())
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(f"DoctorProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors}")
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
        return ProfileService.get_lab_profile(self.request.user)

    def get(self, request, *args, **kwargs):
        """Get lab profile"""
        if not ProfileService.validate_user_role(request.user, UserRole.LAB):
            print(f"LabProfileView.GET: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Lab role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        lab = self.get_object()
        if not lab:
            print(f"LabProfileView.GET: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Lab profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(lab)
        print(f"LabProfileView.GET: SUCCESS - user_id={request.user.user_id}")
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
        if not ProfileService.validate_user_role(request.user, UserRole.LAB):
            print(f"LabProfileView._update_profile: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Access denied. Lab role required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        lab = self.get_object()
        if not lab:
            print(f"LabProfileView._update_profile: NOT FOUND - user_id={request.user.user_id}")
            return Response(
                {"success": False, "message": "Lab profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(lab, data=request.data, partial=partial)

        if serializer.is_valid():
            try:
                # Use ProfileService to update profile
                updated_data = ProfileService.update_lab_profile(lab, serializer)
                print(f"LabProfileView._update_profile: SUCCESS - user_id={request.user.user_id}")
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": updated_data,
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print("LabProfileView._update_profile: EXCEPTION while saving profile:")
                print(traceback.format_exc())
                return Response(
                    {
                        "success": False,
                        "message": "Profile update failed",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        print(f"LabProfileView._update_profile: VALIDATION FAILED - errors={serializer.errors}")
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
            print(f"AdminStaffProfileView.GET: ACCESS DENIED - user_id={request.user.user_id}")
            return Response(
                {
                    "success": False,
                    "message": "Access denied. Admin or Staff role required.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(request.user)
        print(f"AdminStaffProfileView.GET: SUCCESS - user_id={request.user.user_id}")
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
        
        # Use helper to get profile data by role
        profile_data = get_profile_data_by_role(user)
        
        print(f"CurrentUserProfileView.GET: SUCCESS - user_id={user.user_id} role={user.role}")
        return Response(
            {"success": True, "data": profile_data}, status=status.HTTP_200_OK
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
        # Read refresh token from HttpOnly cookie
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            print("RefreshTokenView: MISSING refresh_token cookie")
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
            access_token = generate_access_token(token_obj.user)

            # Token rotation - revoke old refresh token
            token_obj.is_revoked = True
            token_obj.save()

            # Generate new refresh token
            new_refresh_token = generate_refresh_token(token_obj.user)

            # Prepare response
            response = Response(
                {
                    "success": True,
                    "message": "Token refreshed successfully",
                    "data": {"access_token": access_token},
                },
                status=status.HTTP_200_OK,
            )

            # Update refresh token cookie with new token
            set_refresh_token_cookie(response, new_refresh_token)

            print(f"RefreshTokenView: SUCCESS - user_id={token_obj.user.user_id}")
            return response

        except UserTokens.DoesNotExist:
            print("RefreshTokenView: INVALID_OR_EXPIRED refresh_token cookie")
            # Clear invalid cookie
            response = Response(
                {"success": False, "message": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            response.delete_cookie('refresh_token')
            return response
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
    queryset = Qualification.objects.all().order_by("qualification_code")
    pagination_class = None


# ==================================================================================
# ============================ ADMIN LIST VIEWS ====================================
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
            print(f"AdminTogglePatientStatusView: NOT FOUND - patient_id={patient_id}")
            return Response(
                {"success": False, "message": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Use AdminService to toggle status
        patient, action = AdminService.toggle_patient_status(patient)

        serializer = self.serializer_class(patient, context={"request": request})
        print(f"AdminTogglePatientStatusView: SUCCESS - patient_id={patient_id} {action}")

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

        # Use AdminService to toggle status
        doctor, action = AdminService.toggle_doctor_status(doctor)

        serializer = self.serializer_class(doctor, context={"request": request})
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

        # Validate status
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use AdminService to verify doctor
        doctor = AdminService.verify_doctor(doctor, new_status, notes, request.user)

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

        # Validate status
        if new_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
            return Response(
                {"success": False, "message": "Invalid status. Must be VERIFIED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use AdminService to verify lab
        lab = AdminService.verify_lab(lab, new_status, notes, request.user)

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
        # Use AdminService to get pending approvals count
        count_data = AdminService.get_pending_approvals_count()

        return Response(
            {"success": True, "data": count_data},
            status=status.HTTP_200_OK
        )
