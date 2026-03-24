# doctors/services/profile_service.py
import logging

import db.doctor_queries as dq
import db.user_queries as uq
from common.exceptions import ValidationException
from doctors.serializers import DoctorProfileSerializer
from users.services.base_profile_service import BaseProfileService

logger = logging.getLogger(__name__)


class ProfileService(BaseProfileService):

    @staticmethod
    def get_doctor_profile(user) -> dict | None:
        user_id = str(getattr(user, "user_id", ""))
        doctor = dq.get_doctor_by_user_id(user_id)
        if not doctor:
            return None
        doctor["qualifications"] = dq.get_doctor_qualifications(user_id)
        doctor["specializations"] = dq.get_doctor_specializations(user_id)
        schedule = dq.get_schedule_by_doctor(user_id)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        doctor["schedule"] = schedule
        return doctor

    @staticmethod
    def update_doctor_profile(doctor_dict: dict, serializer, request=None) -> dict:
        user_id = str(doctor_dict.get("doctor_id") or doctor_dict.get("doctor_user_id"))
        data = serializer.validated_data

        addr = data.get("address") or {}
        address_fields = {k: addr.get(k) if k in addr else data.get(k) for k in ("address_line", "city", "state", "pincode")}
        if any(v is not None for v in address_fields.values()):
            if doctor_dict.get("address_line"):
                uq.update_address_by_user_id(user_id, **{k: v for k, v in address_fields.items() if v is not None})
            else:
                uq.create_address(
                    user_id=user_id,
                    address_line=address_fields.get("address_line", ""),
                    city=address_fields.get("city", ""),
                    state=address_fields.get("state", ""),
                    pincode=address_fields.get("pincode", ""),
                )

        profile_fields = {
            k: data[k]
            for k in ("full_name", "experience_years", "phone_number",
                      "consultation_fee", "registration_number", "profile_image", "gender_id")
            if k in data
        }
        pass
        if profile_fields:
            dq.update_doctor(user_id, **profile_fields)

        if "qualifications" in data:
            dq.delete_doctor_qualifications(user_id)
            for q in data["qualifications"]:
                dq.insert_doctor_qualification(
                    user_id, q["qualification_id"],
                    q.get("institution"), q.get("year_of_completion"),
                )

        if "specializations" in data:
            dq.delete_doctor_specializations(user_id)
            for s in data["specializations"]:
                dq.insert_doctor_specialization(
                    user_id, s["specialization_id"],
                    s.get("is_primary", False), s.get("years_in_specialty"),
                )

        if "schedule" in data:
            sched_data = data["schedule"]
            dq.upsert_schedule(
                user_id,
                sched_data.get("consultation_duration_min", 30),
                sched_data.get("appointment_contact"),
            )
            schedule = dq.get_schedule_by_doctor(user_id)

            if schedule and "working_days" in sched_data:
                dq.delete_future_unbooked_slots(schedule["schedule_id"])
                dq.delete_working_days(schedule["schedule_id"])
                for wd in sched_data["working_days"]:
                    dq.insert_working_day(
                        schedule["schedule_id"],
                        wd["day_of_week"],
                        wd.get("arrival"),
                        wd.get("leaving"),
                        wd.get("lunch_start"),
                        wd.get("lunch_end"),
                    )
                from doctors.services.appointment_service import AppointmentService
                count = AppointmentService.generate_slots_for_doctor(user_id, days=30)
                logger.info("Auto-generated %d slot(s) for doctor %s.", count, user_id)
                if count == 0:
                    logger.warning(
                        "generate_slots_for_doctor returned 0 for doctor %s. "
                        "Check that working days have non-null arrival/leaving times "
                        "and that consultation_duration_min is set.",
                        user_id,
                    )

        updated = dq.get_doctor_by_user_id(user_id)
        updated["qualifications"]  = dq.get_doctor_qualifications(user_id)
        updated["specializations"] = dq.get_doctor_specializations(user_id)
        schedule = dq.get_schedule_by_doctor(user_id)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        updated["schedule"] = schedule
        return updated