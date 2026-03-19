# backend/doctors/services/appointment_service.py
from datetime import datetime, timedelta, time as dt_time
from django.db import transaction
from django.utils import timezone
import db.doctor_queries as dq
from users.models import AppointmentStatus
import logging


class AppointmentService:

    @staticmethod
    def generate_slots_for_doctor(doctor_user_id: str, days: int = 30) -> int:
        schedule = dq.get_schedule_by_doctor(doctor_user_id)
        if not schedule:
            print(
                "No schedule for doctor %s – skipping slot generation.", doctor_user_id
            )
            return 0

        raw_working_days = dq.get_working_days(schedule["schedule_id"])
        if not raw_working_days:
            print("No working days configured for doctor %s.", doctor_user_id)
            return 0

        working_days = {wd["day_of_week"]: wd for wd in raw_working_days}

        duration_min = schedule.get("consultation_duration_min") or 30
        duration = timedelta(minutes=duration_min)
        today = timezone.localdate()
        newly_created = 0

        for offset in range(days):
            slot_date = today + timedelta(days=offset)
            weekday = slot_date.weekday()
            wd = working_days.get(weekday)
            if not wd:
                continue

            arrival = wd.get("arrival")
            leaving = wd.get("leaving")
            if not arrival or not leaving:
                continue

            if not isinstance(arrival, dt_time):
                arrival = dt_time.fromisoformat(str(arrival))
            if not isinstance(leaving, dt_time):
                leaving = dt_time.fromisoformat(str(leaving))

            lunch_start = wd.get("lunch_start")
            lunch_end = wd.get("lunch_end")

            if lunch_start and lunch_end:
                if not isinstance(lunch_start, dt_time):
                    lunch_start = dt_time.fromisoformat(str(lunch_start))
                if not isinstance(lunch_end, dt_time):
                    lunch_end = dt_time.fromisoformat(str(lunch_end))
                ranges = [(arrival, lunch_start), (lunch_end, leaving)]
            else:
                ranges = [(arrival, leaving)]

            for range_start, range_end in ranges:
                current = datetime.combine(slot_date, range_start)
                boundary = datetime.combine(slot_date, range_end)

                while current + duration <= boundary:
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

        print("Generated %d new slot(s) for doctor %s.", newly_created, doctor_user_id)
        return newly_created

    @staticmethod
    def get_available_slots(doctor_user_id: str, target_date=None) -> list:
        schedule = dq.get_schedule_by_doctor(str(doctor_user_id))
        if not schedule:
            return []
        today = timezone.localdate()
        return dq.get_available_slots(schedule["schedule_id"], today, target_date)

    @staticmethod
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

        # ── DO NOT call mark_slot_booked here ──
        # d_book_appointment() handles marking the slot as booked internally.
        # Calling mark_slot_booked() first causes SLOT_ALREADY_BOOKED from the DB function.

        return dq.create_appointment(
            doctor_id=doctor_user_id,
            patient_id=patient_user_id,
            slot_id=slot_id,
            appointment_type=appointment_type,
            status=AppointmentStatus.CONFIRMED,
            reason=reason,
        )

    @staticmethod
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
