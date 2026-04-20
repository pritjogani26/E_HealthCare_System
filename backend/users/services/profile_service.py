# backend\users\services\profile_service.py
import uuid

import users.database_queries.patient_queries as pq
import users.database_queries.user_queries as uq
from ..serializers.patient_serializers import PatientProfileSerializer
from users.services.base_profile_service import BaseProfileService

import users.database_queries.lab_queries as lq
from ..serializers.lab_serializers import LabProfileSerializer
from users.services.base_profile_service import BaseProfileService

import logging
import users.database_queries.doctor_queries as dq
from users.services.base_profile_service import BaseProfileService

logger = logging.getLogger(__name__)


class PatientProfileService(BaseProfileService):

    @staticmethod
    def get_patient_profile(user) -> dict | None:
        if type(user) == uuid.UUID:
            user_id = str(user)
        else:
            user_id = str(getattr(user, "user_id", ""))
        return pq.get_patient_by_id(user_id)

    @staticmethod
    def update_patient_profile(patient_dict: dict, serializer, request=None) -> dict:
        # print("\n\nInside update_patient_profile.")
        patient_id = str(patient_dict.get("patient_id") or patient_dict.get("user_id"))
        data = serializer.validated_data
        # print(f"\nPatient data : {data}")
        addr = data.get("address") or {}
        address_fields = {
            k: addr.get(k) if k in addr else data.get(k)
            for k in ("address_line", "city", "state", "pincode")
        }
        # print(f"\n\nAddress Fields : {address_fields}")

        if any(v is not None for v in address_fields.values()):
            if patient_dict.get("address_line"):
                # print("\nYes Address is available. Updating.")
                uq.update_address_by_user_id(
                    patient_id,
                    **{k: v for k, v in address_fields.items() if v is not None},
                )
                print("\nUpdate Successful.")
            else:
                print("\nCreating new address.")
                uq.create_address(
                    user_id=patient_id,
                    address_line=address_fields.get("address_line", ""),
                    city=address_fields.get("city", ""),
                    state=address_fields.get("state", ""),
                    pincode=address_fields.get("pincode", ""),
                )

        profile_fields = {
            k: data[k]
            for k in (
                "full_name",
                "date_of_birth",
                "mobile",
                "emergency_contact_name",
                "emergency_contact_phone",
                "profile_image",
                "gender_id",
                "blood_group_id",
            )
            if k in data
        }
        # Removed profile_fields["address_id"] = address_id
        updated = pq.update_patient(patient_id, **profile_fields)
        return PatientProfileSerializer(updated).data


class LabProfileService(BaseProfileService):

    @staticmethod
    def get_lab_profile(user) -> dict | None:
        user_id = str(getattr(user, "user_id", ""))
        lab = lq.get_lab_by_user_id(user_id)
        if not lab:
            return None
        lab["operating_hours"] = lq.get_lab_operating_hours(user_id)
        # print(f"\nLab operating hours: {lab['operating_hours']}")  # Debug print
        # lab["services"] = lq.get_lab_services(user_id)
        return lab

    @staticmethod
    def update_lab_profile(lab_dict: dict, serializer, request=None) -> dict:
        user_id = str(lab_dict.get("lab_id") or lab_dict.get("lab_user_id"))
        data = serializer.validated_data

        addr = data.get("address") or {}
        address_fields = {
            k: addr.get(k) if k in addr else data.get(k)
            for k in ("address_line", "city", "state", "pincode")
        }
        if any(v is not None for v in address_fields.values()):
            if lab_dict.get("address_line"):
                uq.update_address_by_user_id(
                    user_id,
                    **{k: v for k, v in address_fields.items() if v is not None},
                )
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
            for k in ("lab_name", "license_number", "phone_number", "lab_logo")
            if k in data
        }

        if profile_fields:
            lq.update_lab(user_id, **profile_fields)

        if "operating_hours" in data:
            lq.delete_lab_operating_hours(user_id)
            for oh in data["operating_hours"]:
                lq.insert_lab_operating_hour(
                    user_id,
                    oh["day_of_week"],
                    oh.get("open_time"),
                    oh.get("close_time"),
                    oh.get("is_closed", False),
                )

            # Purge future unbooked slots and regenerate from new hours
            deleted = lq.delete_future_unbooked_lab_slots(user_id)
            logger.info(
                "Deleted %d future unbooked slot(s) for lab %s after hours update.",
                deleted,
                user_id,
            )
            from users.services.lab_booking_service import LabBookingService

            count = LabBookingService.generate_slots_for_lab(user_id, days=30)
            logger.info(
                "Auto-generated %d slot(s) for lab %s after hours update.",
                count,
                user_id,
            )

        # if "services" in data:
        #     lq.delete_lab_services(user_id)
        #     for svc in data["services"]:
        #         lq.insert_lab_service(
        #             user_id,
        #             svc["service_name"],
        #             svc.get("description"),
        #             svc.get("price"),
        #             svc.get("turnaround_hours"),
        #         )

        updated = lq.get_lab_by_user_id(user_id)
        updated["operating_hours"] = lq.get_lab_operating_hours(user_id)
        # updated["services"] = lq.get_lab_services(user_id)

        return LabProfileSerializer(updated).data


class DoctorProfileService(BaseProfileService):

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
        address_fields = {
            k: addr.get(k) if k in addr else data.get(k)
            for k in ("address_line", "city", "state", "pincode")
        }
        if any(v is not None for v in address_fields.values()):
            if doctor_dict.get("address_line"):
                uq.update_address_by_user_id(
                    user_id,
                    **{k: v for k, v in address_fields.items() if v is not None},
                )
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
            for k in (
                "full_name",
                "experience_years",
                "phone_number",
                "consultation_fee",
                "registration_number",
                "profile_image",
                "gender_id",
            )
            if k in data
        }
        if profile_fields:
            dq.update_doctor(user_id, **profile_fields)

        if "qualifications" in data:
            dq.delete_doctor_qualifications(user_id)
            for q in data["qualifications"]:
                dq.insert_doctor_qualification(
                    user_id,
                    q["qualification_id"],
                    q.get("institution"),
                    q.get("year_of_completion"),
                )

        if "specializations" in data:
            dq.delete_doctor_specializations(user_id)
            for s in data["specializations"]:
                dq.insert_doctor_specialization(
                    user_id,
                    s["specialization_id"],
                    s.get("is_primary", False),
                    s.get("years_in_specialty"),
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
                from users.services.appointment_service import (
                    AppointmentService,
                )

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
        updated["qualifications"] = dq.get_doctor_qualifications(user_id)
        updated["specializations"] = dq.get_doctor_specializations(user_id)
        schedule = dq.get_schedule_by_doctor(user_id)
        if schedule:
            schedule["working_days"] = dq.get_working_days(schedule["schedule_id"])
        updated["schedule"] = schedule
        return updated
