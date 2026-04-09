# backend\users\database_queries\lab_booking_queries.py
"""
Raw-SQL query layer for lab test slot bookings and reports.

All functions call stored PostgreSQL functions via the shared helpers in
`database_queries.connection`.  No business logic lives here — only the
wire-up between Python call sites and the database.

Naming convention mirrors the rest of the project:
  fn_fetchone  → functions that return exactly one row (or None)
  fn_fetchall  → functions that return zero-or-more rows
  fn_execute   → VOID-returning procedures (side-effects only)
"""

from users.database_queries.connection import fn_fetchone, fn_fetchall, fn_execute


# ─────────────────────────────────────────────────────────────────────────────
# SLOT BOOKINGS
# ─────────────────────────────────────────────────────────────────────────────


def create_lab_booking(
    patient_id: str,
    lab_id: str,
    slot_id: int,
    test_id: int,
    collection_type: str,
    collection_address,         # dict | None
    subtotal: float,
    home_collection_charge: float,
    discount_amount: float,
    total_amount: float,
    notes: str = None,
) -> dict:
    """
    Insert a new booking row.

    Calls the PostgreSQL function `l_create_lab_booking` which does the INSERT
    and returns the full booking + joined test/slot/lab detail in one shot.

    Args:
        patient_id: UUID string of the authenticated patient.
        lab_id: UUID string of the lab.
        slot_id: integer PK of the chosen slot.
        test_id: integer PK of the chosen lab test.
        collection_type: 'lab_visit' or 'home'.
        collection_address: JSONB dict (required when collection_type='home').
        subtotal: test base price.
        home_collection_charge: 50.00 for home, 0 otherwise.
        discount_amount: coupon discount (0 for now).
        total_amount: final amount charged.
        notes: optional patient notes.

    Returns:
        dict with all booking columns + joined test/slot/lab fields.
    """
    import json
    # Serialise the JSONB parameter so psycopg2 can handle it correctly
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
    """
    Fetch a single booking (with joined test/slot/lab fields) by its UUID.

    Args:
        booking_id: UUID string of the booking.

    Returns:
        dict or None if not found.
    """
    return fn_fetchone("l_get_lab_booking", [str(booking_id)])


def list_patient_bookings(patient_id: str) -> list:
    """
    Fetch all bookings belonging to a patient, ordered newest first.

    Args:
        patient_id: UUID string of the patient.

    Returns:
        List of booking dicts (may be empty).
    """
    return fn_fetchall("l_list_patient_bookings", [str(patient_id)])


def list_lab_bookings(lab_id: str) -> list:
    """
    Fetch all bookings belonging to a lab, ordered newest first.
    Intended for lab dashboard / admin overview.

    Args:
        lab_id: UUID string of the lab.

    Returns:
        List of booking dicts (may be empty).
    """
    return fn_fetchall("l_list_lab_bookings", [str(lab_id)])


def cancel_lab_booking(
    booking_id: str,
    cancelled_by: str,
    cancellation_reason: str = None,
) -> dict:
    """
    Mark a booking as CANCELLED in the database.

    The function returns only the status columns (not full booking details).
    Call `get_lab_booking` afterwards if you need the full detail back.

    Args:
        booking_id: UUID string of the booking to cancel.
        cancelled_by: UUID string of the user initiating the cancellation.
        cancellation_reason: optional free-text reason.

    Returns:
        dict with booking_id, booking_status, cancelled_at, etc.
    """
    return fn_fetchone(
        "l_cancel_lab_booking",
        [str(booking_id), str(cancelled_by), cancellation_reason],
    )


def complete_lab_booking(booking_id: str) -> dict:
    """
    Transition a booking from BOOKED → COMPLETED.

    Only valid when the booking is currently in BOOKED status (enforced in the
    PostgreSQL function which raises an exception otherwise).

    Args:
        booking_id: UUID string of the booking.

    Returns:
        dict with booking_id, booking_status, updated_at.
    """
    return fn_fetchone("l_complete_lab_booking", [str(booking_id)])


# ─────────────────────────────────────────────────────────────────────────────
# SLOTS
# ─────────────────────────────────────────────────────────────────────────────

def get_available_slots(lab_id: str, today, target_date=None) -> list:
    """
    Fetch all active, unbooked slots for a lab on/after today.
    """
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
    """
    Check if a slot exists for the given lab/date/time. If not, insert it.
    Returns (slot_dict, was_created).
    """
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


# ─────────────────────────────────────────────────────────────────────────────
# SLOT COUNTERS  (called inside atomic transactions)
# ─────────────────────────────────────────────────────────────────────────────


def increment_slot_booked_count(slot_id: int) -> None:
    """
    Increment the booked_count for a slot.

    The PostgreSQL function raises an exception if the slot is full, inactive,
    or in the past. The caller should catch `Exception` and surface as 400.

    Args:
        slot_id: integer PK of the slot.
    """
    fn_execute("increment_slot_booked_count", [slot_id])


def decrement_slot_booked_count(slot_id: int) -> None:
    """
    Decrement the booked_count for a slot (floor at 0).

    Called when a booking is cancelled.

    Args:
        slot_id: integer PK of the slot.
    """
    fn_execute("decrement_slot_booked_count", [slot_id])


# ─────────────────────────────────────────────────────────────────────────────
# REPORTS
# ─────────────────────────────────────────────────────────────────────────────


def upload_lab_report(
    booking_id: str,
    report_file_url: str,
    report_type: str = "pdf",
    result_notes: str = None,
    uploaded_by: str = None,
) -> dict:
    """
    Insert a new report row linked to a booking.

    Args:
        booking_id: UUID string of the parent booking.
        report_file_url: URL/path of the uploaded file.
        report_type: 'pdf', 'image', etc. Defaults to 'pdf'.
        result_notes: optional text notes from the lab.
        uploaded_by: UUID string of the user uploading.

    Returns:
        dict with the newly created report row.
    """
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
    """
    Fetch all reports for a given booking, ordered newest first.

    Args:
        booking_id: UUID string of the booking.

    Returns:
        List of report dicts (may be empty).
    """
    return fn_fetchall("l_get_booking_reports", [str(booking_id)])
