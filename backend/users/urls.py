# backend/users/urls.py

from django.urls import path
from .views import (
    LoginView,
    GoogleAuthView,
    LogoutView,
    RefreshTokenView,
    VerifyEmailView,
    ResendVerificationEmailView,
    AdminStaffProfileView,
    CurrentUserProfileView,
    BloodGroupListView,
    GenderListView,
    QualificationListView,
    AdminPatientListView,
    AdminDoctorListView,
    AdminLabListView,
    AdminTogglePatientStatusView,
    AdminToggleDoctorStatusView,
    AdminVerifyDoctorView,
    AdminVerifyLabView,
    PendingApprovalsCountView,
    RecentActivityView,
    ReAuthVerifyView,  # ── NEW
)

app_name = "users"

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/google/", GoogleAuthView.as_view(), name="google-auth"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="refresh-token"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path(
        "auth/resend-verification/",
        ResendVerificationEmailView.as_view(),
        name="resend-verification",
    ),
    # ── NEW: Inactivity timeout re-authentication (Scenario B) ────────────────
    # Called by InactivityModal when the user enters their password after
    # 5 minutes of inactivity. Verifies the password without issuing new tokens.
    # Requires: Authorization: Bearer <access_token>
    # Body:     { "password": "<plaintext>" }
    # Returns:  200 { "success": true, "message": "Re-authentication successful." }
    #       or  401 { "success": false, "message": "Incorrect password.", "errors": {"code": "invalid_password"} }
    path(
        "auth/reauth-verify/",
        ReAuthVerifyView.as_view(),
        name="reauth-verify",
    ),
    # ── Profiles ──────────────────────────────────────────────────────────────
    path("profile/me/", CurrentUserProfileView.as_view(), name="current-profile"),
    path(
        "profile/admin-staff/",
        AdminStaffProfileView.as_view(),
        name="admin-staff-profile",
    ),
    # ── Reference data ────────────────────────────────────────────────────────
    path("blood-groups/", BloodGroupListView.as_view(), name="blood-groups"),
    path("genders/", GenderListView.as_view(), name="genders"),
    path("qualifications/", QualificationListView.as_view(), name="qualifications"),
    # ── Admin ─────────────────────────────────────────────────────────────────
    path("admin/patients/", AdminPatientListView.as_view(), name="admin-patients"),
    path("admin/doctors/", AdminDoctorListView.as_view(), name="admin-doctors"),
    path("admin/labs/", AdminLabListView.as_view(), name="admin-labs"),
    path(
        "admin/patients/<uuid:user_id>/toggle-status/",
        AdminTogglePatientStatusView.as_view(),
        name="admin-toggle-patient-status",
    ),
    path(
        "admin/doctors/<str:user_id>/toggle-status/",
        AdminToggleDoctorStatusView.as_view(),
        name="admin-toggle-doctor-status",
    ),
    path(
        "admin/doctors/<str:user_id>/verify/",
        AdminVerifyDoctorView.as_view(),
        name="admin-verify-doctor",
    ),
    path(
        "admin/labs/<str:user_id>/verify/",
        AdminVerifyLabView.as_view(),
        name="admin-verify-lab",
    ),
    path(
        "admin/pending-approvals/count/",
        PendingApprovalsCountView.as_view(),
        name="pending-approvals-count",
    ),
    path(
        "admin/recent-activity/",
        RecentActivityView.as_view(),
        name="recent-activity",
    ),
]
