from users.models import UserRole
import db.patient_queries as pq
import db.doctor_queries as dq
import db.lab_queries as lq


def get_profile_data_by_role(user):
    role = getattr(user, "role", None)
    user_id = str(getattr(user, "user_id", ""))

    try:
        if role == UserRole.PATIENT:
            patient = pq.get_patient_by_id(user_id)
            if patient:
                return patient

        elif role == UserRole.DOCTOR:
            from doctors.serializers import DoctorProfileSerializer
            print("\n\nThis is Doctor...............................")
            doctor = dq.get_doctor_by_user_id(user_id)
            print(f"\n\nDoctor : {doctor}")
            if doctor:
                doctor["qualifications"] = dq.get_doctor_qualifications(user_id)
                doctor["specializations"] = dq.get_doctor_specializations(user_id)
                schedule = dq.get_schedule_by_doctor(user_id)
                if schedule:
                    schedule["working_days"] = dq.get_working_days(
                        schedule["schedule_id"]
                    )
                doctor["schedule"] = schedule
                print(f"\n\nDoctor : {doctor}")
                return doctor

        elif role == UserRole.LAB:
            from labs.serializers import LabProfileSerializer

            lab = lq.get_lab_by_user_id(user_id)
            if lab:
                lab["operating_hours"] = lq.get_lab_operating_hours(user_id)
                lab["services"] = lq.get_lab_services(user_id)
                return LabProfileSerializer(lab).data

        elif role in (UserRole.ADMIN, UserRole.STAFF):
            # BUG FIX: AdminStaffProfileSerializer doesn't exist — use UserSerializer
            from users.serializers import UserSerializer
            from db.user_queries import get_user_by_id

            u = get_user_by_id(user_id)
            if u:
                return UserSerializer(u).data

    except Exception as exc:
        print(
            "get_profile_data_by_role: could not load role profile for %s: %s",
            user_id,
            exc,
        )

    # Fallback to bare user data
    from users.serializers import UserSerializer
    from db.user_queries import get_user_by_id

    u = get_user_by_id(user_id) or {}
    return UserSerializer(u).data
