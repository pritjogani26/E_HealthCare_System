# backend/users/urls.py

from django.urls import path
from .views.admin_dashboard_views import PendingApprovalsCountView
from .views.admin_user_views import (
    AdminPatientListView,
    AdminDoctorListView,
    AdminLabListView,
    AdminTogglePatientStatusView,
    AdminToggleDoctorStatusView,
    AdminToggleLabStatusView,
)
from .views.admin_verification_views import (
    AdminVerifyDoctorView,
    AdminVerifyLabView,
)
from .views.audit_views import (
    RecentActivityView,
    # DownloadAuditLogsView,
)

from .views.auth_views import (
    LoginView,
    GoogleAuthView,
    LogoutView,
    RefreshTokenView,
    VerifyEmailView,
    ResendVerificationEmailView,
    ReAuthVerifyView,
    ForgotPasswordView,
    VerifyResetTokenView,
    ResetPasswordView,
)
from .views.master_data_views import (
    BloodGroupListView,
    GenderListView,
    QualificationListView,
)
from .views.profile_views import (
    AdminStaffProfileView,
    CurrentUserProfileView,
)
from .views.role_permission_views import (
    RoleListView,
    PermissionListView,
    RolePermissionsView,
    GrantPermissionView,
    RevokePermissionView,
    SyncRolePermissionsView,
)
from .views.settings_views import (
    SettingsBloodGroupsView,
    SettingsGendersView,
    SettingsSpecializationsView,
    SettingsQualificationsView,
    SettingsVerificationTypesView,
    SettingsUserRolesView,
)
from .views.patients_view import PatientRegistrationView, PatientProfileView
from .views.lab_view import LabRegistrationView, LabProfileView
from .views.lab_service_view import (
    LabTestCategoryListView,
    LabTestCategoryDetailView,
    LabTestListView,
    LabTestDetailView,
)
from .views.test_parameter_view import (
    TestParameterListView,
    TestParameterDetailView,
)
from .views.lab_test_booking import (
    LabBookingListCreateView,
    LabBookingDetailView,
    LabBookingCancelView,
    LabBookingCompleteView,
    LabOwnBookingsView,
    LabBookingReportListView,
    LabSlotListView,
    LabSlotGenerateView,
)
from .views.doctor_view import (
    DoctorRegistrationView,
    DoctorProfileView,
    DoctorListView,
    DoctorDetailView,
    AvailableSlotsView,
    GenerateSlotsView,
    BookAppointmentView,
    MyAppointmentsView,
    CancelAppointmentView,
)


app_name = "users"

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────────
    path("users/auth/login/", LoginView.as_view(), name="auth-login"),
    path("users/auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("users/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("users/auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path(
        "users/auth/verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"
    ),
    path(
        "users/auth/resend-verification/",
        ResendVerificationEmailView.as_view(),
        name="auth-resend-verification",
    ),
    path(
        "users/auth/reauth-verify/",
        ReAuthVerifyView.as_view(),
        name="auth-reauth-verify",
    ),
    path(
        "users/auth/forgot-password/",
        ForgotPasswordView.as_view(),
        name="auth-forgot-password",
    ),
    path(
        "users/auth/verify-reset-token/",
        VerifyResetTokenView.as_view(),
        name="auth-verify-reset-token",
    ),
    path(
        "users/auth/reset-password/",
        ResetPasswordView.as_view(),
        name="auth-reset-password",
    ),
    # ── Profile ───────────────────────────────────────────────────────────────
    path("users/profile/me/", CurrentUserProfileView.as_view(), name="profile-me"),
    path(
        "users/profile/admin-staff/",
        AdminStaffProfileView.as_view(),
        name="profile-admin-staff",
    ),
    # ── Master data ───────────────────────────────────────────────────────────
    path("users/blood-groups/", BloodGroupListView.as_view(), name="blood-groups"),
    path("users/genders/", GenderListView.as_view(), name="genders"),
    path(
        "users/qualifications/", QualificationListView.as_view(), name="qualifications"
    ),
    # ── Admin — user lists ────────────────────────────────────────────────────
    path(
        "users/admin/patients/",
        AdminPatientListView.as_view(),
        name="admin-patient-list",
    ),
    path(
        "users/admin/doctors/", AdminDoctorListView.as_view(), name="admin-doctor-list"
    ),
    path("users/admin/labs/", AdminLabListView.as_view(), name="admin-lab-list"),
    # ── Admin — status toggles ────────────────────────────────────────────────
    # ② All three converters are now <uuid:user_id> for consistency and automatic validation
    path(
        "users/admin/patients/<uuid:user_id>/toggle-status/",
        AdminTogglePatientStatusView.as_view(),
        name="admin-patient-toggle-status",
    ),
    path(
        "users/admin/doctors/<uuid:user_id>/toggle-status/",
        AdminToggleDoctorStatusView.as_view(),
        name="admin-doctor-toggle-status",
    ),
    path(
        "users/admin/labs/<uuid:user_id>/toggle-status/",
        AdminToggleLabStatusView.as_view(),
        name="admin-lab-toggle-status",
    ),
    # ── Admin — verification ──────────────────────────────────────────────────
    path(
        "users/admin/doctors/<uuid:user_id>/verify/",
        AdminVerifyDoctorView.as_view(),
        name="admin-doctor-verify",
    ),
    path(
        "users/admin/labs/<uuid:user_id>/verify/",
        AdminVerifyLabView.as_view(),
        name="admin-lab-verify",
    ),
    # ── Admin — dashboard & audit ─────────────────────────────────────────────
    path(
        "users/admin/pending-approvals/count/",
        PendingApprovalsCountView.as_view(),
        name="admin-pending-approvals-count",
    ),
    path(
        "users/admin/recent-activity/",
        RecentActivityView.as_view(),
        name="admin-recent-activity",
    ),
    # path(
    #     "users/admin/download-audit-logs/",
    #     DownloadAuditLogsView.as_view(),
    #     name="admin-download-audit-logs",
    # ),
    # ── Settings ──────────────────────────────────────────────────────────────
    path(
        "users/settings/blood-groups/",
        SettingsBloodGroupsView.as_view(),
        name="settings-blood-groups",
    ),
    path(
        "users/settings/genders/",
        SettingsGendersView.as_view(),
        name="settings-genders",
    ),
    path(
        "users/settings/specializations/",
        SettingsSpecializationsView.as_view(),
        name="settings-specializations",
    ),
    path(
        "users/settings/qualifications/",
        SettingsQualificationsView.as_view(),
        name="settings-qualifications",
    ),
    path(
        "users/settings/verification-types/",
        SettingsVerificationTypesView.as_view(),
        name="settings-verification-types",
    ),
    path(
        "users/settings/user-roles/",
        SettingsUserRolesView.as_view(),
        name="settings-user-roles",
    ),
    # ── RBAC (superadmin only) ────────────────────────────────────────────────
    path("users/rbac/roles/", RoleListView.as_view(), name="rbac-roles"),
    path(
        "users/rbac/permissions/", PermissionListView.as_view(), name="rbac-permissions"
    ),
    path(
        "users/rbac/roles/<int:role_id>/permissions/",
        RolePermissionsView.as_view(),
        name="rbac-role-permissions",
    ),
    path(
        "users/rbac/roles/<int:role_id>/permissions/grant/",
        GrantPermissionView.as_view(),
        name="rbac-role-permissions-grant",
    ),
    path(
        "users/rbac/roles/<int:role_id>/permissions/revoke/",
        RevokePermissionView.as_view(),
        name="rbac-role-permissions-revoke",
    ),
    path(
        "users/rbac/roles/<int:role_id>/permissions/sync/",
        SyncRolePermissionsView.as_view(),
        name="rbac-role-permissions-sync",
    ),
    # ── Patients ──────────────────────────────────────────────────────────────
    path(
        "patients/register/", PatientRegistrationView.as_view(), name="patient-register"
    ),
    path("patients/profile/", PatientProfileView.as_view(), name="patient-profile"),
    # ── Labs ──────────────────────────────────────────────────────────────────
    path("labs/register/", LabRegistrationView.as_view(), name="lab-register"),
    path("labs/profile/", LabProfileView.as_view(), name="lab-profile"),
    # ------------------------------------------------------------------------------------------
    path("labs/categories/", LabTestCategoryListView.as_view(), name="lab-categories"),
    path("labs/categories/<int:category_id>/", LabTestCategoryDetailView.as_view(), name="lab-category-detail"),
    # ------------------------------------------------------------------------------------------
    path("labs/tests/", LabTestListView.as_view(), name="lab-tests"),
    path("labs/tests/<int:test_id>/", LabTestDetailView.as_view(), name="lab-test-detail"),
    path("labs/test-parameters/", TestParameterListView.as_view(), name="lab-test-parameters"),
    path("labs/test-parameters/<int:parameter_id>/", TestParameterDetailView.as_view(), name="lab-test-parameter-detail"),
    # ── Lab Bookings ──────────────────────────────────────────────────────────
    path("labs/bookings/", LabBookingListCreateView.as_view(), name="lab-bookings"),
    path("labs/bookings/<uuid:booking_id>/", LabBookingDetailView.as_view(), name="lab-booking-detail"),
    path("labs/bookings/<uuid:booking_id>/cancel/", LabBookingCancelView.as_view(), name="lab-booking-cancel"),
    path("labs/bookings/<uuid:booking_id>/complete/", LabBookingCompleteView.as_view(), name="lab-booking-complete"),
    path("labs/my-bookings/", LabOwnBookingsView.as_view(), name="lab-own-bookings"),
    # ── Lab Reports ───────────────────────────────────────────────────────────
    path("labs/bookings/<uuid:booking_id>/reports/", LabBookingReportListView.as_view(), name="lab-booking-reports"),
    # ── Lab Slots ─────────────────────────────────────────────────────────────
    path("labs/slots/", LabSlotListView.as_view(), name="lab-slots"),
    path("labs/slots/generate/", LabSlotGenerateView.as_view(), name="lab-slots-generate"),
    # ─────────────────────────────────────────────────────────────────────────

    path("doctors/register/", DoctorRegistrationView.as_view(), name="doctor-register"),
    path("doctors/profile/", DoctorProfileView.as_view(), name="doctor-profile"),
    path("doctors/list/", DoctorListView.as_view(), name="doctor-list"),
    path(
        "doctors/slots/generate/",
        GenerateSlotsView.as_view(),
        name="doctor-slots-generate",
    ),
    path(
        "doctors/appointments/book/",
        BookAppointmentView.as_view(),
        name="doctor-appointment-book",
    ),
    path(
        "doctors/appointments/my/",
        MyAppointmentsView.as_view(),
        name="doctor-appointment-list",
    ),
    path(
        "doctors/appointments/<int:appointment_id>/cancel/",
        CancelAppointmentView.as_view(),
        name="doctor-appointment-cancel",
    ),
    # ── Doctors — dynamic paths ───────────────────────────────────────────────
    path("doctors/<uuid:user_id>/", DoctorDetailView.as_view(), name="doctor-detail"),
    path(
        "doctors/<uuid:user_id>/slots/",
        AvailableSlotsView.as_view(),
        name="doctor-slots",
    ),
]
