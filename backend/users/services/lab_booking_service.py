# backend\users\services\lab_booking_service.py
import logging
import json
from pydoc import text
import re
import uuid
from datetime import datetime, date, timedelta, time as dt_time

from django.db import transaction
from django.core.files.storage import default_storage

from users.middleware.exceptions import (
    NotFoundException,
    ValidationException,
    PermissionException,
)
from users.models import UserRole
from users.database_queries.connection import fetchone
import users.database_queries.lab_booking_queries as bq
import users.database_queries.lab_service_quries as lsq
import users.database_queries.lab_queries as lq

logger = logging.getLogger(__name__)

HOME_COLLECTION_CHARGE = 50.00
DEFAULT_DISCOUNT = 0.00


class LabBookingService:

    @staticmethod
    def create_booking(patient_user_id: str, validated_data: dict) -> dict:
        slot_id = validated_data["slot_id"]
        test_id = validated_data["test_id"]
        lab_id = str(validated_data["lab_id"])
        collection_type = validated_data["collection_type"]
        collection_address = validated_data.get("collection_address")
        notes = validated_data.get("notes")

        slot = fetchone(
            "SELECT slot_id, lab_id, slot_date, is_active, booked_count "
            "FROM lab_test_slots WHERE slot_id = %s",
            [slot_id],
        )

        if not slot:
            raise NotFoundException(f"Slot {slot_id} not found.")

        if not slot["is_active"]:
            raise ValidationException(f"Slot {slot_id} is not active.")

        if slot["slot_date"] < date.today():
            raise ValidationException("Cannot book a slot in the past.")

        if str(slot["lab_id"]) != lab_id:
            raise ValidationException(
                "The selected slot does not belong to the requested lab."
            )

        test = lsq.get_details_lab_test(test_id)
        if not test:
            raise NotFoundException(f"Lab test {test_id} not found.")

        if not test.get("is_active"):
            raise ValidationException(f"Lab test {test_id} is not active.")

        if collection_type not in ("lab_visit", "home"):
            raise ValidationException("collection_type must be 'lab_visit' or 'home'.")

        if collection_type == "home" and not collection_address:
            raise ValidationException(
                "collection_address is required for home collection."
            )

        subtotal = float(test["price"])
        home_fee = HOME_COLLECTION_CHARGE if collection_type == "home" else 0.00
        discount = DEFAULT_DISCOUNT
        total = subtotal + home_fee - discount

        try:
            with transaction.atomic():
                bq.increment_slot_booked_count(slot_id)
                booking = bq.create_lab_booking(
                    patient_id=patient_user_id,
                    lab_id=lab_id,
                    slot_id=slot_id,
                    test_id=test_id,
                    collection_type=collection_type,
                    collection_address=collection_address,
                    subtotal=subtotal,
                    home_collection_charge=home_fee,
                    discount_amount=discount,
                    total_amount=total,
                    notes=notes,
                )
        except Exception as exc:
            logger.warning("Booking creation failed: %s", exc)
            raise ValidationException(str(exc))

        return booking

    @staticmethod
    def cancel_booking(
        booking_id: str,
        requesting_user_id: str,
        requesting_user_role: str,
        cancellation_reason: str = None,
    ) -> dict:
        """Cancel an existing BOOKED booking."""

        booking = bq.get_lab_booking(booking_id)
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        is_patient = requesting_user_role == UserRole.PATIENT
        if is_patient and str(booking["patient_id"]) != requesting_user_id:
            raise PermissionException("You are not authorised to cancel this booking.")

        if booking["booking_status"] not in ("BOOKED", "CONFIRMED"):
            raise ValidationException(
                f"Cannot cancel a booking with status '{booking['booking_status']}'."
            )

        slot_date = booking["slot_date"]
        if isinstance(slot_date, str):
            slot_date = datetime.strptime(slot_date, "%Y-%m-%d").date()

        if slot_date < date.today():
            raise ValidationException(
                "Cannot cancel a booking whose slot date has already passed."
            )

        slot_id = booking["slot_id"]

        try:
            with transaction.atomic():
                bq.cancel_lab_booking(
                    booking_id=booking_id,
                    cancelled_by=requesting_user_id,
                    cancellation_reason=cancellation_reason,
                )
                bq.decrement_slot_booked_count(slot_id)
        except Exception as exc:
            logger.warning("Booking cancellation failed: %s", exc)
            raise ValidationException(str(exc))

        return bq.get_lab_booking(booking_id)

    @staticmethod
    def complete_booking(booking_id: str) -> dict:
        booking = bq.get_lab_booking(booking_id)
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        try:
            bq.complete_lab_booking(booking_id)
        except Exception as exc:
            logger.warning("Booking completion failed: %s", exc)
            raise ValidationException(str(exc))

        return bq.get_lab_booking(booking_id)

    @staticmethod
    def complete_booking_with_report(
        booking_id: str,
        uploaded_by: str,
        report_file=None,
        report_type: str = "pdf",
        result_notes: str = None,
        parameter_results=None,
    ) -> tuple[dict, dict]:
        booking = bq.get_lab_booking(booking_id)
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        if report_file is None:
            raise ValidationException("report_file is required to complete booking.")

        notes_parts = []
        if result_notes:
            notes_parts.append(result_notes.strip())
        if parameter_results is not None:
            notes_parts.append(
                "Parameter results:\n"
                + json.dumps(parameter_results, ensure_ascii=True)
            )
        composed_notes = "\n\n".join([p for p in notes_parts if p]).strip() or None

        def slugify(text: str) -> str:
            return re.sub(r"[^a-z0-9]+", "_", text.strip().lower()).strip("_")

        try:
            lab_name = slugify(booking["lab_name"])
            patient_name = slugify(booking["patient_name"])
            test_name = slugify(booking["test_name"])
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_path = f"lab_reports/{lab_name}/{patient_name}_{test_name}_{timestamp}_{'lab_report.pdf'}"
        except Exception as exc:
            logger.warning("Error constructing report path: %s", exc)
            report_path = f"lab_reports/General/{uuid.uuid4().hex}_{report_file.name or 'report.pdf'}"

        try:
            with transaction.atomic():
                bq.complete_lab_booking(booking_id)
                stored_path = default_storage.save(report_path, report_file)
                report_url = f"/media/{stored_path.replace('\\', '/')}"
                report = bq.upload_lab_report(
                    booking_id=booking_id,
                    report_file_url=report_url,
                    report_type=report_type or "pdf",
                    result_notes=composed_notes,
                    uploaded_by=uploaded_by,
                )
        except Exception as exc:
            logger.warning("Booking completion with report failed: %s", exc)
            raise ValidationException(str(exc))

        return bq.get_lab_booking(booking_id), report

    @staticmethod
    def upload_report(
        booking_id: str,
        report_file_url: str,
        report_type: str = "pdf",
        result_notes: str = None,
        uploaded_by: str = None,
    ) -> dict:
        booking = bq.get_lab_booking(booking_id)
        if not booking:
            raise NotFoundException(f"Booking {booking_id} not found.")

        return bq.upload_lab_report(
            booking_id=booking_id,
            report_file_url=report_file_url,
            report_type=report_type,
            result_notes=result_notes,
            uploaded_by=uploaded_by,
        )

    @staticmethod
    def get_booking_reports(booking_id: str) -> list:
        return bq.get_booking_reports(booking_id)


    @staticmethod
    def generate_slots_for_lab(lab_id: str, days: int = 30) -> int:
        raw_ops = lq.get_lab_operating_hours(lab_id)

        if not raw_ops:
            logger.warning("No operating hours for lab %s", lab_id)
            raise ValueError(
                "No operating hours found. Please configure your operating hours first."
            )

        ops_by_day = {}
        for ro in raw_ops:
            if not ro.get("is_closed"):
                ops_by_day[ro["day_of_week"]] = ro

        if not ops_by_day:
            logger.warning("All operating hours are marked closed for lab %s", lab_id)
            raise ValueError(
                "All configured operating hours are marked as 'Closed'. Cannot generate slots."
            )

        today = datetime.now().date()

        newly_created = 0

        for offset in range(days):
            slot_date = today + timedelta(days=offset)
            weekday = slot_date.weekday()
            db_weekday = (weekday + 1) % 7

            op = ops_by_day.get(db_weekday)
            if not op:
                print(f"[SKIP] No operating hours for this day")
                continue

            open_time = op["open_time"]
            close_time = op["close_time"]

            if not isinstance(open_time, dt_time):
                open_time = dt_time.fromisoformat(str(open_time))
            if not isinstance(close_time, dt_time):
                close_time = dt_time.fromisoformat(str(close_time))

            curr_dt = datetime.combine(slot_date, open_time)
            end_dt = datetime.combine(slot_date, close_time)

            while curr_dt + timedelta(hours=1) <= end_dt:
                slot_end = curr_dt + timedelta(hours=1)

                _slot, was_created = bq.get_or_create_slot(
                    lab_id=lab_id,
                    slot_date=slot_date,
                    start_time=curr_dt.time(),
                    end_time=slot_end.time(),
                )

                if was_created:
                    newly_created += 1
                    print(f"[CREATED] Slot created successfully")
                else:
                    print(f"[EXISTS] Slot already exists")

                curr_dt = slot_end

        return newly_created

    @staticmethod
    def get_available_slots(lab_id: str, target_date: str = None) -> list:
        today = datetime.now().date()
        parsed_date = None

        if target_date:
            try:
                parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
                print(f"[DEBUG] Parsed target_date: {parsed_date}")
            except ValueError:
                print(f"[ERROR] Invalid date format: {target_date}")
                raise ValidationException("Invalid date format. Use YYYY-MM-DD.")

        print(
            f"[INFO] Calling DB for available slots (today={today}, target_date={parsed_date})"
        )

        result = bq.get_available_slots(lab_id, today, parsed_date)

        print(f"[END] Retrieved {len(result)} slots")
        return result
