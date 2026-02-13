# backend/users/urls.py

from django.urls import path
from .views import (
    # Registration
    PatientRegistrationView,
    DoctorRegistrationView,
    LabRegistrationView,

    # Authentication
    LoginView,
    GoogleAuthView,
    LogoutView,
    RefreshTokenView,
    VerifyEmailView,
    ResendVerificationEmailView,

    # Profiles
    PatientProfileView,
    DoctorProfileView,
    LabProfileView,
    AdminStaffProfileView,
    CurrentUserProfileView,

    # Supporting data
    BloodGroupListView,
    GenderListView,
    QualificationListView,

    # Admin lists
    AdminPatientListView,
    AdminDoctorListView,
    AdminLabListView,

    # Admin actions
    AdminTogglePatientStatusView,
    AdminToggleDoctorStatusView,
    AdminVerifyDoctorView,
    AdminVerifyLabView,
    PendingApprovalsCountView,
)

app_name = 'users'

urlpatterns = [
    # ============ REGISTRATION ENDPOINTS ============
    path('auth/register/patient/', PatientRegistrationView.as_view(), name='register-patient'),
    path('auth/register/doctor/', DoctorRegistrationView.as_view(), name='register-doctor'),
    path('auth/register/lab/', LabRegistrationView.as_view(), name='register-lab'),
    
    # ============ AUTHENTICATION ENDPOINTS ============
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh-token'),
    
    # ============ EMAIL VERIFICATION ENDPOINTS ============
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    
    # ============ PROFILE ENDPOINTS ============
    path('profile/me/', CurrentUserProfileView.as_view(), name='current-profile'),
    path('profile/patient/', PatientProfileView.as_view(), name='patient-profile'),
    path('profile/doctor/', DoctorProfileView.as_view(), name='doctor-profile'),
    path('profile/lab/', LabProfileView.as_view(), name='lab-profile'),
    path('profile/admin-staff/', AdminStaffProfileView.as_view(), name='admin-staff-profile'),

    # ============ SUPPORTING DATA ENDPOINTS ============
    path('blood-groups/', BloodGroupListView.as_view(), name='blood-groups'),
    path('genders/', GenderListView.as_view(), name='genders'),
    path('qualifications/', QualificationListView.as_view(), name='qualifications'),

    # ============ ADMIN LIST ENDPOINTS ============
    path('admin/patients/', AdminPatientListView.as_view(), name='admin-patients'),
    path('admin/doctors/', AdminDoctorListView.as_view(), name='admin-doctors'),
    path('admin/labs/', AdminLabListView.as_view(), name='admin-labs'),

    # ============ ADMIN ACTION ENDPOINTS ============
    path('admin/patients/<int:patient_id>/toggle-status/', AdminTogglePatientStatusView.as_view(), name='admin-toggle-patient-status'),
    path('admin/doctors/<str:user_id>/toggle-status/', AdminToggleDoctorStatusView.as_view(), name='admin-toggle-doctor-status'),
    path('admin/doctors/<str:user_id>/verify/', AdminVerifyDoctorView.as_view(), name='admin-verify-doctor'),
    path('admin/labs/<str:user_id>/verify/', AdminVerifyLabView.as_view(), name='admin-verify-lab'),
    
    # ============ ADMIN DATA ENDPOINTS ============
    path('admin/pending-approvals/count/', PendingApprovalsCountView.as_view(), name='pending-approvals-count'),
]