# """
# Audit logging helpers — no Django ORM, writes via db.audit_queries.
# """

# import time
# import traceback
# from .models import AuditAction, AuditStatus, AuditEntityType
# from db.audit_queries import insert_audit_log


# def _get_client_ip(request) -> str | None:
#     if not request:
#         return None
#     xff = request.META.get("HTTP_X_FORWARDED_FOR")
#     if xff:
#         return xff.split(",")[0].strip()
#     return request.META.get("REMOTE_ADDR")


# def _get_user_agent(request) -> str | None:
#     if not request:
#         return None
#     return request.META.get("HTTP_USER_AGENT", "")[:500]


# def _user_id(user) -> str | None:
#     if user is None:
#         return None
#     if isinstance(user, dict):
#         return str(user.get("user_id")) if user.get("user_id") else None
#     uid = getattr(user, "user_id", None)
#     return str(uid) if uid else None


# def log_event(
#     *,
#     action: str,
#     details: str,
#     entity_type: str = None,
#     entity_name: str = None,
#     performed_by=None,
#     target_user=None,
#     request=None,
#     status: str = AuditStatus.SUCCESS,
#     changes: dict = None,
#     start_time: float = None,
# ) -> None:
#     try:
#         if performed_by is None and request:
#             u = getattr(request, "user", None)
#             if u and getattr(u, "is_authenticated", False):
#                 performed_by = u
#         duration_ms = int((time.time() - start_time) * 1000) if start_time else None
#         insert_audit_log(
#             action=action,
#             details=details,
#             entity_type=entity_type,
#             entity_name=entity_name,
#             performed_by_id=_user_id(performed_by),
#             target_user_id=_user_id(target_user),
#             status=status,
#             changes=changes,
#             ip_address=_get_client_ip(request),
#             user_agent=_get_user_agent(request),
#             duration_ms=duration_ms,
#             request_path=request.path if request else None,
#         )
#     except Exception:
#         print(
#             "EXCEPTION:", traceback.format_exc(), "AuditLog.log_event failed silently"
#         )


# class AuditLogger:
#     @staticmethod
#     def patient_registered(patient: dict, request=None):
#         log_event(
#             action=AuditAction.PATIENT_REGISTERED,
#             entity_type=AuditEntityType.PATIENT,
#             entity_name=patient.get("full_name"),
#             details=f"{patient.get('full_name')} registered as a new patient (email: {patient.get('email')})",
#             target_user=patient,
#             request=request,
#         )

#     @staticmethod
#     def doctor_registered(doctor: dict, request=None):
#         log_event(
#             action=AuditAction.DOCTOR_REGISTERED,
#             entity_type=AuditEntityType.DOCTOR,
#             entity_name=doctor.get("full_name"),
#             details=(
#                 f"{doctor.get('full_name')} registered as a new doctor "
#                 f"(email: {doctor.get('email')}, reg#: {doctor.get('registration_number')})"
#             ),
#             target_user=doctor,
#             request=request,
#         )

#     @staticmethod
#     def lab_registered(lab: dict, request=None):
#         log_event(
#             action=AuditAction.LAB_REGISTERED,
#             entity_type=AuditEntityType.LAB,
#             entity_name=lab.get("lab_name"),
#             details=(
#                 f"{lab.get('lab_name')} registered as a new lab "
#                 f"(email: {lab.get('email')}, license: {lab.get('license_number') or 'N/A'})"
#             ),
#             target_user=lab,
#             request=request,
#         )

#     @staticmethod
#     def patient_profile_updated(patient: dict, changes=None, request=None):
#         performed_by = getattr(request, "user", None) if request else None
#         log_event(
#             action=AuditAction.PATIENT_PROFILE_UPDATED,
#             entity_type=AuditEntityType.PATIENT,
#             entity_name=patient.get("full_name"),
#             details=f"{patient.get('full_name')}'s patient profile was updated",
#             performed_by=performed_by or patient,
#             target_user=patient,
#             changes=changes,
#             request=request,
#         )

#     @staticmethod
#     def doctor_profile_updated(doctor: dict, changes=None, request=None):
#         performed_by = getattr(request, "user", None) if request else None
#         log_event(
#             action=AuditAction.DOCTOR_PROFILE_UPDATED,
#             entity_type=AuditEntityType.DOCTOR,
#             entity_name=doctor.get("full_name"),
#             details=f"{doctor.get('full_name')}'s profile was updated",
#             performed_by=performed_by or doctor,
#             target_user=doctor,
#             changes=changes,
#             request=request,
#         )

#     @staticmethod
#     def lab_profile_updated(lab: dict, changes=None, request=None):
#         performed_by = getattr(request, "user", None) if request else None
#         log_event(
#             action=AuditAction.LAB_PROFILE_UPDATED,
#             entity_type=AuditEntityType.LAB,
#             entity_name=lab.get("lab_name"),
#             details=f"{lab.get('lab_name')}'s lab profile was updated",
#             performed_by=performed_by or lab,
#             target_user=lab,
#             changes=changes,
#             request=request,
#         )

#     @staticmethod
#     def doctor_verified(doctor: dict, admin_user, notes="", request=None):
#         log_event(
#             action=AuditAction.DOCTOR_VERIFIED,
#             entity_type=AuditEntityType.DOCTOR,
#             entity_name=doctor.get("full_name"),
#             details=(
#                 f"{doctor.get('full_name')} was verified by {getattr(admin_user, 'email', '')}"
#                 + (f" — Notes: {notes}" if notes else "")
#             ),
#             performed_by=admin_user,
#             target_user=doctor,
#             request=request,
#         )

#     @staticmethod
#     def doctor_rejected(doctor: dict, admin_user, notes="", request=None):
#         log_event(
#             action=AuditAction.DOCTOR_REJECTED,
#             entity_type=AuditEntityType.DOCTOR,
#             entity_name=doctor.get("full_name"),
#             details=(
#                 f"{doctor.get('full_name')}'s verification was rejected by {getattr(admin_user, 'email', '')}"
#                 + (f" — Notes: {notes}" if notes else "")
#             ),
#             performed_by=admin_user,
#             target_user=doctor,
#             request=request,
#             status=AuditStatus.FAILURE,
#         )

#     @staticmethod
#     def lab_verified(lab: dict, admin_user, notes="", request=None):
#         log_event(
#             action=AuditAction.LAB_VERIFIED,
#             entity_type=AuditEntityType.LAB,
#             entity_name=lab.get("lab_name"),
#             details=(
#                 f"{lab.get('lab_name')} was verified by {getattr(admin_user, 'email', '')}"
#                 + (f" — Notes: {notes}" if notes else "")
#             ),
#             performed_by=admin_user,
#             target_user=lab,
#             request=request,
#         )

#     @staticmethod
#     def lab_rejected(lab: dict, admin_user, notes="", request=None):
#         log_event(
#             action=AuditAction.LAB_REJECTED,
#             entity_type=AuditEntityType.LAB,
#             entity_name=lab.get("lab_name"),
#             details=(
#                 f"{lab.get('lab_name')}'s verification was rejected by {getattr(admin_user, 'email', '')}"
#                 + (f" — Notes: {notes}" if notes else "")
#             ),
#             performed_by=admin_user,
#             target_user=lab,
#             request=request,
#             status=AuditStatus.FAILURE,
#         )

#     @staticmethod
#     def patient_status_toggled(
#         patient: dict, admin_user, is_active: bool, request=None
#     ):
#         action = (
#             AuditAction.PATIENT_ACTIVATED
#             if is_active
#             else AuditAction.PATIENT_DEACTIVATED
#         )
#         verb = "activated" if is_active else "deactivated"
#         log_event(
#             action=action,
#             entity_type=AuditEntityType.PATIENT,
#             entity_name=patient.get("full_name"),
#             details=f"{patient.get('full_name')} was {verb} by {getattr(admin_user, 'email', '')}",
#             performed_by=admin_user,
#             target_user=patient,
#             request=request,
#         )

#     @staticmethod
#     def doctor_status_toggled(doctor: dict, admin_user, is_active: bool, request=None):
#         action = (
#             AuditAction.DOCTOR_ACTIVATED
#             if is_active
#             else AuditAction.DOCTOR_DEACTIVATED
#         )
#         verb = "activated" if is_active else "deactivated"
#         log_event(
#             action=action,
#             entity_type=AuditEntityType.DOCTOR,
#             entity_name=doctor.get("full_name"),
#             details=f"{doctor.get('full_name')} was {verb} by {getattr(admin_user, 'email', '')}",
#             performed_by=admin_user,
#             target_user=doctor,
#             request=request,
#         )

#     @staticmethod
#     def lab_status_toggled(lab: dict, admin_user, is_active: bool, request=None):
#         action = AuditAction.LAB_ACTIVATED if is_active else AuditAction.LAB_DEACTIVATED
#         verb = "activated" if is_active else "deactivated"
#         log_event(
#             action=action,
#             entity_type=AuditEntityType.LAB,
#             entity_name=lab.get("lab_name"),
#             details=f"{lab.get('lab_name')} was {verb} by {getattr(admin_user, 'email', '')}",
#             performed_by=admin_user,
#             target_user=lab,
#             request=request,
#         )

#     @staticmethod
#     def login_success(user, request=None):
#         email = getattr(
#             user, "email", user.get("email") if isinstance(user, dict) else ""
#         )
#         log_event(
#             action=AuditAction.USER_LOGIN,
#             entity_type=AuditEntityType.USER,
#             entity_name=email,
#             details=f"{email} logged in successfully",
#             performed_by=user,
#             target_user=user,
#             request=request,
#         )

#     @staticmethod
#     def login_failed(email: str, reason: str, request=None):
#         log_event(
#             action=AuditAction.USER_LOGIN_FAILED,
#             entity_type=AuditEntityType.USER,
#             entity_name=email,
#             details=f"Failed login attempt for {email} — {reason}",
#             status=AuditStatus.FAILURE,
#             request=request,
#         )

#     @staticmethod
#     def logout(user, request=None):
#         email = getattr(user, "email", "")
#         log_event(
#             action=AuditAction.USER_LOGOUT,
#             entity_type=AuditEntityType.USER,
#             entity_name=email,
#             details=f"{email} logged out",
#             performed_by=user,
#             target_user=user,
#             request=request,
#         )

#     @staticmethod
#     def email_verified(user, request=None):
#         email = getattr(user, "email", "")
#         log_event(
#             action=AuditAction.EMAIL_VERIFIED,
#             entity_type=AuditEntityType.USER,
#             entity_name=email,
#             details=f"{email} verified their email address",
#             performed_by=user,
#             target_user=user,
#             request=request,
#         )


# # BUG FIX: removed "joining_date" — not a column in any DB table
# _SAFE_FIELDS = {
#     "full_name",
#     "lab_name",
#     "phone_number",
#     "email",
#     "date_of_birth",
#     "gender_id",
#     "blood_group_id",
#     "mobile",
#     "experience_years",
#     "consultation_fee",
#     "registration_number",
#     "license_number",
#     "emergency_contact_name",
#     "emergency_contact_phone",
#     "is_active",
#     "verification_status",
# }


# def build_changes_dict(old_dict: dict, new_data: dict) -> dict:
#     changes = {}
#     for field, new_value in new_data.items():
#         if field not in _SAFE_FIELDS:
#             continue
#         old_value = old_dict.get(field)
#         if str(old_value) != str(new_value):
#             changes[field] = {"before": str(old_value), "after": str(new_value)}
#     return changes or None


# class AuditMixin:
#     def dispatch(self, request, *args, **kwargs):
#         start = time.time()
#         try:
#             return super().dispatch(request, *args, **kwargs)
#         except Exception as exc:
#             log_event(
#                 action=AuditAction.SYSTEM_ERROR,
#                 entity_type=AuditEntityType.SYSTEM,
#                 entity_name=self.__class__.__name__,
#                 details=f"Unhandled exception in {self.__class__.__name__}: {exc}",
#                 request=request,
#                 status=AuditStatus.FAILURE,
#                 start_time=start,
#             )
#             raise
