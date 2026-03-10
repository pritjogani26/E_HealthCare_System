from users.AuditLog import AuditLogger
import db.patient_queries as pq
import db.doctor_queries as dq
import db.lab_queries as lq

# BUG FIX: a_verify_doctor / a_verify_lab stored functions only accept
# 'approved' or 'rejected' (lowercase). The Python callers pass 'VERIFIED'
# or 'REJECTED' (uppercase), which always triggered INVALID_VERIFICATION_STATUS.
_VERIFY_STATUS_MAP = {
    "VERIFIED": "approved",
    "REJECTED": "rejected",
}


class AdminService:
    @staticmethod
    def toggle_patient_status(patient_id: int, admin_user, request=None):
        patient = pq.toggle_patient_is_active(patient_id)
        pq.sync_user_active_from_patient(patient_id)
        AuditLogger.patient_status_toggled(
            patient, admin_user, patient["is_active"], request=request
        )
        action = "activated" if patient["is_active"] else "deactivated"
        print("Patient %s %s by %s", patient_id, action, getattr(admin_user, "email", ""))
        return patient, action

    @staticmethod
    def toggle_doctor_status(doctor_user_id: str, admin_user, request=None):
        doctor = dq.toggle_doctor_is_active(doctor_user_id)
        AuditLogger.doctor_status_toggled(
            doctor, admin_user, doctor["is_active"], request=request
        )
        action = "activated" if doctor["is_active"] else "deactivated"
        print("Doctor %s %s by %s", doctor.get("email"), action, getattr(admin_user, "email", ""))
        return doctor, action

    @staticmethod
    def verify_doctor(doctor_user_id: str, status: str, notes: str, verified_by, request=None):
        # BUG FIX: convert uppercase status to lowercase for DB stored function
        db_status = _VERIFY_STATUS_MAP.get(status, status.lower())
        doctor = dq.update_doctor_verification(
            user_id=doctor_user_id,
            status=db_status,
            notes=notes,
            verified_by_id=str(getattr(verified_by, "user_id", verified_by)),
        )
        if status == "VERIFIED":
            AuditLogger.doctor_verified(doctor, verified_by, notes=notes, request=request)
        else:
            AuditLogger.doctor_rejected(doctor, verified_by, notes=notes, request=request)
        print("Doctor %s → %s by %s", doctor.get("email"), status, getattr(verified_by, "email", ""))
        return doctor

    @staticmethod
    def verify_lab(lab_user_id: str, status: str, notes: str, verified_by, request=None):
        # BUG FIX: convert uppercase status to lowercase for DB stored function
        db_status = _VERIFY_STATUS_MAP.get(status, status.lower())
        lab = lq.update_lab_verification(
            user_id=lab_user_id,
            status=db_status,
            notes=notes,
            verified_by_id=str(getattr(verified_by, "user_id", verified_by)),
        )
        if status == "VERIFIED":
            AuditLogger.lab_verified(lab, verified_by, notes=notes, request=request)
        else:
            AuditLogger.lab_rejected(lab, verified_by, notes=notes, request=request)
        print("Lab %s → %s by %s", lab.get("email"), status, getattr(verified_by, "email", ""))
        return lab

    @staticmethod
    def get_pending_approvals_count():
        pending_doctors = dq.get_pending_doctors_count()
        pending_labs = lq.get_pending_labs_count()
        return {
            "doctors": pending_doctors,
            "labs": pending_labs,
            "total": pending_doctors + pending_labs,
        }