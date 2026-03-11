# backend\doctors\services\appointment_service.py
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
import db.doctor_queries as dq
from users.models import AppointmentStatus


class AppointmentService:
    @staticmethod
    def generate_slots_for_doctor(doctor_user_id: str, days: int = 7) -> int:
        schedule = dq.get_schedule_by_doctor(doctor_user_id)
        if not schedule:
            print(
                f"No schedule for doctor {doctor_user_id} – skipping slot generation."
            )
            return 0
        working_days = {
            wd["day_of_week"]: wd for wd in dq.get_working_days(schedule["schedule_id"])
        }
        if not working_days:
            return 0
        duration = timedelta(minutes=schedule.get("consultation_duration_min") or 30)
        today = timezone.localdate()
        newly_created = 0
        for offset in range(days):
            slot_date = today + timedelta(days=offset)
            weekday = slot_date.weekday()
            wd = working_days.get(weekday)
            if not wd or not wd.get("arrival") or not wd.get("leaving"):
                continue
            ranges = []
            if wd.get("lunch_start") and wd.get("lunch_end"):
                ranges.append((wd["arrival"], wd["lunch_start"]))
                ranges.append((wd["lunch_end"], wd["leaving"]))
            else:
                ranges.append((wd["arrival"], wd["leaving"]))
            for range_start, range_end in ranges:
                current = datetime.combine(slot_date, range_start)
                end_boundary = datetime.combine(slot_date, range_end)
                while current + duration <= end_boundary:
                    slot_end = current + duration
                    _slot, was_created = dq.get_or_create_slot(
                        schedule_id=schedule["schedule_id"],
                        slot_date=slot_date,
                        start_time=current.time(),
                        end_time=slot_end.time(),
                    )
                    if was_created:
                        newly_created += 1
                    current = slot_end
        print(f"Generated {newly_created} new slot(s) for doctor {doctor_user_id}")
        return newly_created

    @staticmethod
    def get_available_slots(doctor_user_id: str, target_date=None) -> list:
        schedule = dq.get_schedule_by_doctor(doctor_user_id)
        if not schedule:
            return []
        today = timezone.localdate()
        return dq.get_available_slots(schedule["schedule_id"], today, target_date)

    @staticmethod
    @transaction.atomic
    def book_appointment(
        patient_user_id: str,
        slot_id: int,
        reason: str = "",
        appointment_type: str = "in_person",
    ) -> dict:
        slot = dq.lock_slot_for_update(slot_id)
        if not slot:
            raise ValueError("Slot not found.")
        if slot["is_booked"]:
            raise ValueError("This slot has already been booked.")
        if slot["is_blocked"]:
            raise ValueError("This slot is blocked by the doctor.")
        if slot["slot_date"] < timezone.localdate():
            raise ValueError("Cannot book a slot in the past.")
        doctor_user_id = str(slot["doctor_id"])
        dq.mark_slot_booked(slot_id, booked=True)
        appointment = dq.create_appointment(
            doctor_id=doctor_user_id,
            patient_id=patient_user_id,
            slot_id=slot_id,
            appointment_type=appointment_type,
            status=AppointmentStatus.CONFIRMED,
            reason=reason,
        )
        return appointment

    @staticmethod
    @transaction.atomic
    def cancel_appointment(
        appointment_id: int, cancelled_by_user_id: str, reason: str = ""
    ) -> dict:
        appointment = dq.lock_appointment_for_update(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")
        current_status = appointment["status"]
        if current_status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
            raise ValueError(
                f"Cannot cancel an appointment that is already {current_status}."
            )
        is_patient = str(appointment["patient_id"]) == str(cancelled_by_user_id)
        is_doctor = str(appointment["doctor_id"]) == str(cancelled_by_user_id)
        if not (is_patient or is_doctor):
            raise ValueError("You are not authorised to cancel this appointment.")
        dq.update_appointment(
            appointment_id,
            status=AppointmentStatus.CANCELLED,
            cancelled_by_id=cancelled_by_user_id,
            cancellation_reason=reason,
        )
        if appointment.get("slot_id"):
            dq.mark_slot_booked(appointment["slot_id"], booked=False)
        return dq.get_appointment_by_id(appointment_id)
