from db.connection import fn_fetchone, fn_scalar
import db.patient_queries as pq
import db.doctor_queries as dq
import db.lab_queries as lq


class AdminService:
    @staticmethod
    def toggle_patient_status(
        patient_id: int, reason: str = None
    ):
        patient = pq.toggle_patient_is_active(patient_id, reason)
        action = "activated" if patient["is_active"] else "deactivated"
        return patient, action

    @staticmethod
    def toggle_doctor_status(
        doctor_user_id: str, reason: str = None
    ):
        doctor = dq.toggle_doctor_is_active(doctor_user_id, reason)
        action = "activated" if doctor["is_active"] else "deactivated"
        
        return doctor, action

    def toggle_doctor_is_active(user_id: str, reason: str) -> dict:
        fn_scalar(
            "auth_toggle_user_is_active",
            [str(user_id), reason],
        )

        return fn_fetchone("d_get_full_doctor_profile", [str(user_id)])

    @staticmethod
    def toggle_lab_status(
        lab_user_id: str, reason: str = None
    ):
        lab = lq.toggle_lab_is_active(lab_user_id, reason)
        action = "activated" if lab["is_active"] else "deactivated"
        return lab, action

    @staticmethod
    def verify_doctor(
        doctor_user_id: str, status: str, notes: str, verified_by, request=None
    ):
        doctor = dq.update_doctor_verification(
            user_id=doctor_user_id,
            status=status,
            notes=notes,
            verified_by_id=str(getattr(verified_by, "user_id", verified_by)),
        )
        print(
            "Doctor %s → %s by %s",
            doctor.get("email"),
            status,
            getattr(verified_by, "email", ""),
        )
        return doctor

    @staticmethod
    def verify_lab(
        lab_user_id: str, status: str, notes: str, verified_by, request=None
    ):
        lab = lq.update_lab_verification(
            user_id=lab_user_id,
            status=status,
            notes=notes,
            verified_by_id=str(getattr(verified_by, "user_id", verified_by)),
        )
        print(
            "Lab %s → %s by %s",
            lab.get("email"),
            status,
            getattr(verified_by, "email", ""),
        )
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
