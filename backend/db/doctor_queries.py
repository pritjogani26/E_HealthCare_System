from db.connection import (
    fn_fetchone,
    fn_fetchall,
    fn_scalar,
    fetchscalar,
    fetchone,
    fetchall,
    execute,
)


def get_doctor_by_user_id(user_id: str) -> dict | None:
    row = fn_fetchone("d_get_full_doctor_profile", [str(user_id)])
    return dict(row) if row else None


def get_all_doctors() -> list:
    rows = fn_fetchall("d_list_doctors", [])
    return [dict(r) for r in rows]


def get_verified_active_doctors() -> list:
    rows = fn_fetchall("d_list_doctors", [])
    return [
        dict(r)
        for r in rows
        if r.get("is_active") and r.get("verification_status") == "VERIFIED"
    ]


def update_doctor(user_id: str, **fields) -> dict:
    if not fields:
        return get_doctor_by_user_id(user_id)
    fn_scalar(
        "d_update_doctor_profile",
        [
            str(user_id),
            fields.get("full_name"),
            fields.get("experience_years"),
            fields.get("phone_number"),
            fields.get("consultation_fee"),
            fields.get("registration_number"),
            fields.get("profile_image"),
            fields.get("gender_id"),
        ],
    )
    return get_doctor_by_user_id(user_id)


def toggle_doctor_is_active(user_id: str, reason: str) -> dict:
    fn_scalar(
        "auth_toggle_user_is_active",
        [str(user_id), reason],
    )
    return fn_fetchone("d_get_full_doctor_profile", [str(user_id)])


def update_doctor_verification(
    user_id: str, status: str, notes: str, verified_by_id: str
) -> dict:
    fn_scalar(
        "a_verify_doctor",
        [str(verified_by_id), str(user_id), status, notes],
    )
    return get_doctor_by_user_id(user_id)


def get_pending_doctors_count() -> int:
    return (
        fetchscalar(
            "SELECT COUNT(*) FROM doctors WHERE verification_status='pending'", []
        )
        or 0
    )


def get_doctor_qualifications(doctor_id: str) -> list:
    return fn_fetchall("d_get_qualifications", [str(doctor_id)])


def delete_doctor_qualifications(doctor_id: str):
    execute("DELETE FROM doctor_qualifications WHERE doctor_id=%s", [str(doctor_id)])


def insert_doctor_qualification(
    doctor_id: str,
    qualification_id: int,
    institution: str = None,
    year_of_completion: int = None,
):
    fn_scalar(
        "d_add_qualification",
        [str(doctor_id), qualification_id, institution, year_of_completion],
    )


def get_doctor_specializations(doctor_id: str) -> list:
    return fn_fetchall("d_get_specializations", [str(doctor_id)])


def delete_doctor_specializations(doctor_id: str):
    execute("DELETE FROM doctor_specializations WHERE doctor_id=%s", [str(doctor_id)])


def insert_doctor_specialization(
    doctor_id: str,
    specialization_id: int,
    is_primary: bool = False,
    years_in_specialty: int = None,
):
    fn_scalar(
        "d_add_specialization",
        [str(doctor_id), specialization_id, is_primary, years_in_specialty],
    )


def get_schedule_by_doctor(doctor_id: str) -> dict | None:
    return fn_fetchone("d_get_full_schedule", [str(doctor_id)])


def upsert_schedule(
    doctor_id: str,
    consultation_duration_min: int = 30,
    appointment_contact: str = None,
) -> dict:
    fn_scalar(
        "d_upsert_schedule",
        [str(doctor_id), consultation_duration_min, appointment_contact],
    )
    return fetchone(
        "SELECT * FROM doctor_schedules WHERE doctor_id=%s LIMIT 1",
        [str(doctor_id)],
    )


def get_working_days(schedule_id: int) -> list:
    return fetchall(
        "SELECT * FROM doctor_working_days WHERE schedule_id=%s ORDER BY day_of_week",
        [schedule_id],
    )


def delete_working_days(schedule_id: int):
    execute("DELETE FROM doctor_working_days WHERE schedule_id=%s", [schedule_id])

def delete_future_unbooked_slots(schedule_id: int):
    from django.utils import timezone
    today = timezone.localdate()
    execute(
        "DELETE FROM appointment_slots WHERE schedule_id=%s AND slot_date >= %s AND is_booked=FALSE",
        [schedule_id, today],
    )


def insert_working_day(
    schedule_id: int,
    day_of_week: int,
    arrival=None,
    leaving=None,
    lunch_start=None,
    lunch_end=None,
):
    fn_scalar(
        "d_upsert_working_day",
        [schedule_id, day_of_week, arrival, leaving, lunch_start, lunch_end],
    )


def get_or_create_slot(schedule_id: int, slot_date, start_time, end_time) -> tuple:
    existing = fetchone(
        "SELECT * FROM appointment_slots WHERE schedule_id=%s AND slot_date=%s AND start_time=%s",
        [schedule_id, slot_date, start_time],
    )
    if existing:
        return existing, False
    row = fetchone(
        """
        INSERT INTO appointment_slots (schedule_id, slot_date, start_time, end_time,
                                       is_booked, is_blocked, created_at)
        VALUES (%s, %s, %s, %s, FALSE, FALSE, NOW())
        RETURNING slot_id
        """,
        [schedule_id, slot_date, start_time, end_time],
    )
    slot = fetchone(
        "SELECT * FROM appointment_slots WHERE slot_id=%s", [row["slot_id"]]
    )
    return slot, True


def get_available_slots(schedule_id: int, today, target_date=None) -> list:
    base = """
        SELECT s.*, ds.doctor_id
        FROM appointment_slots s
        JOIN doctor_schedules ds ON ds.schedule_id = s.schedule_id
        WHERE s.schedule_id=%s AND s.is_booked=FALSE AND s.is_blocked=FALSE
          AND s.slot_date >= %s
    """
    params = [schedule_id, today]
    if target_date:
        base += " AND s.slot_date=%s"
        params.append(target_date)
    base += " ORDER BY s.slot_date, s.start_time"
    return fetchall(base, params)


def lock_slot_for_update(slot_id: int) -> dict | None:
    from django.db import connection as dj_conn

    with dj_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT s.*, ds.doctor_id
            FROM appointment_slots s
            JOIN doctor_schedules ds ON ds.schedule_id = s.schedule_id
            WHERE s.slot_id=%s FOR UPDATE
            """,
            [slot_id],
        )
        cols = [c[0] for c in cursor.description]
        row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def mark_slot_booked(slot_id: int, booked: bool):
    execute(
        "UPDATE appointment_slots SET is_booked=%s WHERE slot_id=%s", [booked, slot_id]
    )


def get_slot(slot_id: int) -> dict | None:
    return fetchone(
        """
        SELECT s.*, ds.doctor_id
        FROM appointment_slots s
        JOIN doctor_schedules ds ON ds.schedule_id = s.schedule_id
        WHERE s.slot_id=%s
        """,
        [slot_id],
    )


def slot_exists(slot_id: int) -> bool:
    return (
        fetchscalar(
            "SELECT COUNT(*) FROM appointment_slots WHERE slot_id=%s", [slot_id]
        )
        > 0
    )


def create_appointment(
    doctor_id: str,
    patient_id: str,
    slot_id: int,
    appointment_type: str,
    status: str,
    reason: str = "",
) -> dict:
    fn_scalar(
        "d_book_appointment",
        [str(patient_id), str(doctor_id), slot_id, appointment_type, reason],
    )
    return fetchone(
        """
        SELECT da.*, d.full_name AS doctor_name, pu.email AS patient_email,
               s.slot_date, s.start_time, s.end_time
        FROM doctor_appointments da
        JOIN doctors d ON d.doctor_id = da.doctor_id
        JOIN users pu ON pu.user_id = da.patient_id
        LEFT JOIN appointment_slots s ON s.slot_id = da.slot_id
        WHERE da.doctor_id=%s AND da.patient_id=%s AND da.slot_id=%s
        ORDER BY da.created_at DESC LIMIT 1
        """,
        [str(doctor_id), str(patient_id), slot_id],
    )


def get_appointment_by_id(appointment_id: int) -> dict | None:
    return fetchone(
        """
        SELECT da.*, d.full_name AS doctor_name, pu.email AS patient_email,
               s.slot_date, s.start_time, s.end_time
        FROM doctor_appointments da
        JOIN doctors d ON d.doctor_id = da.doctor_id
        JOIN users pu ON pu.user_id = da.patient_id
        LEFT JOIN appointment_slots s ON s.slot_id = da.slot_id
        WHERE da.appointment_id=%s
        """,
        [appointment_id],
    )


def lock_appointment_for_update(appointment_id: int) -> dict | None:
    from django.db import connection as dj_conn

    with dj_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT da.*, d.full_name AS doctor_name, pu.email AS patient_email,
                   s.slot_date, s.start_time, s.end_time
            FROM doctor_appointments da
            JOIN doctors d ON d.doctor_id = da.doctor_id
            JOIN users pu ON pu.user_id = da.patient_id
            LEFT JOIN appointment_slots s ON s.slot_id = da.slot_id
            WHERE da.appointment_id = %s FOR UPDATE
            """,
            [appointment_id],
        )
        cols = [c[0] for c in cursor.description]
        row = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


def update_appointment(appointment_id: int, **fields) -> dict:
    if not fields:
        return get_appointment_by_id(appointment_id)
    if fields.get("status") in ("cancelled", "CANCELLED"):
        fn_scalar(
            "d_cancel_appointment",
            [
                appointment_id,
                str(fields.get("cancelled_by_id", "")),
                fields.get("cancellation_reason", ""),
            ],
        )
    else:
        set_clause = ", ".join(f"{k}=%s" for k in fields)
        values = list(fields.values()) + [appointment_id]
        execute(
            f"UPDATE doctor_appointments SET {set_clause}, updated_at=NOW() WHERE appointment_id=%s",
            values,
        )
    return get_appointment_by_id(appointment_id)


def get_patient_appointments(patient_user_id: str) -> list:
    return fn_fetchall("d_get_appointments", [None, str(patient_user_id)])


def get_doctor_appointments(doctor_id: str) -> list:
    return fn_fetchall("d_get_appointments", [str(doctor_id), None])
