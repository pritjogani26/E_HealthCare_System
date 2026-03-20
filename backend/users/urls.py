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
    AdminToggleLabStatusView,
    AdminVerifyDoctorView,
    AdminVerifyLabView,
    PendingApprovalsCountView,
    RecentActivityView,
    ReAuthVerifyView,
)
from .settings_views import (
    SettingsBloodGroupsView,
    SettingsGendersView,
    SettingsSpecializationsView,
    SettingsQualificationsView,
    SettingsVerificationTypesView,
    SettingsUserRolesView,
)
from .role_permission_views import (
    RoleListView,
    PermissionListView,
    RolePermissionsView,
    GrantPermissionView,
    RevokePermissionView,
    SyncRolePermissionsView,
)

app_name = "users"

urlpatterns = [
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

    path(
        "auth/reauth-verify/",
        ReAuthVerifyView.as_view(),
        name="reauth-verify",
    ),
    path("profile/me/", CurrentUserProfileView.as_view(), name="current-profile"),
    path(
        "profile/admin-staff/",
        AdminStaffProfileView.as_view(),
        name="admin-staff-profile",
    ),
    path("blood-groups/", BloodGroupListView.as_view(), name="blood-groups"),
    path("genders/", GenderListView.as_view(), name="genders"),
    path("qualifications/", QualificationListView.as_view(), name="qualifications"),
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
        "admin/labs/<str:user_id>/toggle-status/",
        AdminToggleLabStatusView.as_view(),
        name="admin-toggle-lab-status",
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
    path(
        "admin/download-audit-logs/",
        RecentActivityView.as_view(),
        name="recent-activity",
    ),
    

    path("settings/blood-groups/", SettingsBloodGroupsView.as_view(), name="settings-blood-groups"),
    path("settings/genders/", SettingsGendersView.as_view(), name="settings-genders"),
    path("settings/specializations/", SettingsSpecializationsView.as_view(), name="settings-specializations"),
    path("settings/qualifications/", SettingsQualificationsView.as_view(), name="settings-qualifications"),
    path("settings/verification-types/", SettingsVerificationTypesView.as_view(), name="settings-verification-types"),
    path("settings/user-roles/", SettingsUserRolesView.as_view(), name="settings-user-roles"),

    # ── RBAC (SUPERADMIN only) ────────────────────────────────────────────────
    path("rbac/roles/",                                     RoleListView.as_view(),           name="rbac-roles"),
    path("rbac/permissions/",                               PermissionListView.as_view(),      name="rbac-permissions"),
    path("rbac/roles/<int:role_id>/permissions/",           RolePermissionsView.as_view(),     name="rbac-role-permissions"),
    path("rbac/roles/<int:role_id>/permissions/grant/",     GrantPermissionView.as_view(),     name="rbac-grant"),
    path("rbac/roles/<int:role_id>/permissions/revoke/",    RevokePermissionView.as_view(),    name="rbac-revoke"),
    path("rbac/roles/<int:role_id>/permissions/sync/",      SyncRolePermissionsView.as_view(), name="rbac-sync"),
]
