# backend\users\database_queries\lab_booking_queries.py
from users.database_queries.connection import fn_fetchone, fn_fetchall, fn_execute


def create_lab_booking(
    patient_id: str,
    lab_id: str,
    slot_id: int,
    test_id: int,
    collection_type: str,
    collection_address,
    subtotal: float,
    home_collection_charge: float,
    discount_amount: float,
    total_amount: float,
    notes: str = None,
) -> dict:
    import json
    collection_address_json = (
        json.dumps(collection_address) if collection_address is not None else None
    )
    return fn_fetchone(
        "l_create_lab_booking",
        [
            str(patient_id),
            str(lab_id),
            slot_id,
            test_id,
            collection_type,
            collection_address_json,
            subtotal,
            home_collection_charge,
            discount_amount,
            total_amount,
            notes,
        ],
    )


def get_lab_booking(booking_id: str) -> dict:
    return fn_fetchone("l_get_lab_booking", [str(booking_id)])


def list_patient_bookings(patient_id: str) -> list:
    return fn_fetchall("l_list_patient_bookings", [str(patient_id)])


def list_lab_bookings(lab_id: str) -> list:
    return fn_fetchall("l_list_lab_bookings", [str(lab_id)])


def cancel_lab_booking(
    booking_id: str,
    cancelled_by: str,
    cancellation_reason: str = None,
) -> dict:
    return fn_fetchone(
        "l_cancel_lab_booking",
        [str(booking_id), str(cancelled_by), cancellation_reason],
    )


def complete_lab_booking(booking_id: str) -> dict:
    return fn_fetchone("l_complete_lab_booking", [str(booking_id)])


def get_available_slots(lab_id: str, today, target_date=None) -> list:
    from users.database_queries.connection import fetchall
    base = """
        SELECT * FROM lab_test_slots
        WHERE lab_id=%s AND is_active=TRUE
          AND slot_date >= %s
    """
    params = [str(lab_id), today]
    if target_date:
        base += " AND slot_date=%s"
        params.append(target_date)
    base += " ORDER BY slot_date, start_time"
    return fetchall(base, params)


def get_or_create_slot(lab_id: str, slot_date, start_time, end_time) -> tuple:
    from users.database_queries.connection import fetchone
    existing = fetchone(
        "SELECT * FROM lab_test_slots WHERE lab_id=%s AND slot_date=%s AND start_time=%s",
        [str(lab_id), slot_date, start_time],
    )
    if existing:
        return existing, False

    row = fetchone(
        """
        INSERT INTO lab_test_slots (lab_id, slot_date, start_time, end_time,
                                   booked_count, is_active, created_at)
        VALUES (%s, %s, %s, %s, 0, TRUE, NOW())
        RETURNING slot_id
        """,
        [str(lab_id), slot_date, start_time, end_time],
    )
    slot = fetchone("SELECT * FROM lab_test_slots WHERE slot_id=%s", [row["slot_id"]])
    return slot, True


def slot_exists(slot_id: int) -> bool:
    from users.database_queries.connection import fetchscalar
    return fetchscalar("SELECT COUNT(*) FROM lab_test_slots WHERE slot_id=%s", [slot_id]) > 0


def get_slot_by_id(slot_id: int) -> dict | None:
    from users.database_queries.connection import fetchone
    return fetchone("SELECT * FROM lab_test_slots WHERE slot_id=%s", [slot_id])


def increment_slot_booked_count(slot_id: int) -> None:
    fn_execute("increment_slot_booked_count", [slot_id])


def decrement_slot_booked_count(slot_id: int) -> None:
    fn_execute("decrement_slot_booked_count", [slot_id])


def upload_lab_report(
    booking_id: str,
    report_file_url: str,
    report_type: str = "pdf",
    result_notes: str = None,
    uploaded_by: str = None,
) -> dict:
    return fn_fetchone(
        "l_upload_lab_report",
        [
            str(booking_id),
            report_file_url,
            report_type,
            result_notes,
            str(uploaded_by) if uploaded_by else None,
        ],
    )


def get_booking_reports(booking_id: str) -> list:
    return fn_fetchall("l_get_booking_reports", [str(booking_id)])
