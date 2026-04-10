-- backend\users\sql_tables_and_funs\functions\lab_functions\lab_booking_fun.sql

-- ── lab_booking_fun.sql ──────────────────────────────────────────────────────
-- Atomic slot counter: increment booked_count only when capacity is available.
-- Raises an exception (caught by application) if the slot is full / inactive.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_slot_booked_count(p_slot_id INT)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_slot_rec     RECORD;
    v_max_bookings INT;
BEGIN
    -- FIX: LEFT JOIN so missing operating-hours row doesn't cause NOT FOUND
    SELECT
        s.slot_id,
        s.lab_id,
        s.slot_date,
        s.booked_count,
        s.is_active,
        COALESCE(oh.max_bookings, 10) AS max_bookings
    INTO v_slot_rec
    FROM lab_test_slots s
    LEFT JOIN lab_operating_hours oh
        ON  oh.lab_id      = s.lab_id
        AND oh.day_of_week = EXTRACT(DOW FROM s.slot_date)::INT
    WHERE s.slot_id = p_slot_id
    FOR UPDATE OF s;
 
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot % not found.', p_slot_id;
    END IF;
 
    IF NOT v_slot_rec.is_active THEN
        RAISE EXCEPTION 'Slot % is no longer active.', p_slot_id;
    END IF;
 
    IF v_slot_rec.slot_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Slot % date is in the past.', p_slot_id;
    END IF;
 
    v_max_bookings := v_slot_rec.max_bookings;
 
    IF v_slot_rec.booked_count >= v_max_bookings THEN
        RAISE EXCEPTION 'Slot % is fully booked (capacity: %).', p_slot_id, v_max_bookings;
    END IF;
 
    UPDATE lab_test_slots
    SET booked_count = booked_count + 1,
        updated_at   = NOW()
    WHERE slot_id = p_slot_id;
END;
$$;
 


-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic slot counter: decrement booked_count (floor at 0).
-- Called on booking cancellation.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_slot_booked_count(p_slot_id INT)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE lab_test_slots
    SET booked_count = GREATEST(booked_count - 1, 0),
        updated_at   = NOW()
    WHERE slot_id = p_slot_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot % not found.', p_slot_id;
    END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Create a new lab test slot booking.
-- Returns the full booking row joined with test / slot details.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_create_lab_booking(
    p_patient_id        UUID,
    p_lab_id            UUID,
    p_slot_id           INT,
    p_test_id           INT,
    p_collection_type   VARCHAR(20),
    p_collection_address JSONB,
    p_subtotal          NUMERIC(10,2),
    p_home_collection_charge NUMERIC(10,2),
    p_discount_amount   NUMERIC(10,2),
    p_total_amount      NUMERIC(10,2),
    p_notes             TEXT DEFAULT NULL
)
RETURNS TABLE (
    booking_id              UUID,
    patient_id              UUID,
    lab_id                  UUID,
    slot_id                 INT,
    test_id                 INT,
    collection_type         VARCHAR(20),
    collection_address      JSONB,
    booking_status          VARCHAR(20),
    subtotal                NUMERIC(10,2),
    home_collection_charge  NUMERIC(10,2),
    discount_amount         NUMERIC(10,2),
    total_amount            NUMERIC(10,2),
    notes                   TEXT,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    cancelled_by            UUID,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ,
    -- joined fields
    test_name               VARCHAR(255),
    test_code               VARCHAR(30),
    sample_type             VARCHAR(50),
    fasting_required        BOOLEAN,
    slot_date               DATE,
    start_time              TIME,
    end_time                TIME,
    lab_name                VARCHAR(255)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    INSERT INTO lab_test_slot_bookings (
        patient_id, lab_id, slot_id, test_id,
        collection_type, collection_address,
        booking_status,
        subtotal, home_collection_charge, discount_amount, total_amount,
        notes, created_at, updated_at
    )
    VALUES (
        p_patient_id, p_lab_id, p_slot_id, p_test_id,
        p_collection_type, p_collection_address,
        'BOOKED',
        p_subtotal, p_home_collection_charge, p_discount_amount, p_total_amount,
        p_notes, NOW(), NOW()
    )
    RETURNING lab_test_slot_bookings.booking_id INTO v_booking_id;

    RETURN QUERY
    SELECT
        b.booking_id, b.patient_id, b.lab_id, b.slot_id, b.test_id,
        b.collection_type, b.collection_address,
        b.booking_status,
        b.subtotal, b.home_collection_charge, b.discount_amount, b.total_amount,
        b.notes, b.cancelled_at, b.cancellation_reason, b.cancelled_by,
        b.created_at, b.updated_at,
        t.test_name, t.test_code, t.sample_type, t.fasting_required,
        s.slot_date, s.start_time, s.end_time,
        l.lab_name
    FROM lab_test_slot_bookings b
    JOIN lab_tests           t ON t.test_id  = b.test_id
    JOIN lab_test_slots      s ON s.slot_id  = b.slot_id
    JOIN labs                l ON l.lab_id   = b.lab_id
    WHERE b.booking_id = v_booking_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Fetch a single booking (with joined details) by booking_id.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_get_lab_booking(p_booking_id UUID)
RETURNS TABLE (
    booking_id              UUID,
    patient_id              UUID,
    lab_id                  UUID,
    slot_id                 INT,
    test_id                 INT,
    collection_type         VARCHAR(20),
    collection_address      JSONB,
    booking_status          VARCHAR(20),
    subtotal                NUMERIC(10,2),
    home_collection_charge  NUMERIC(10,2),
    discount_amount         NUMERIC(10,2),
    total_amount            NUMERIC(10,2),
    notes                   TEXT,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    cancelled_by            UUID,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ,
    test_name               VARCHAR(255),
    test_code               VARCHAR(30),
    sample_type             VARCHAR(50),
    fasting_required        BOOLEAN,
    slot_date               DATE,
    start_time              TIME,
    end_time                TIME,
    lab_name                VARCHAR(255)
)
LANGUAGE sql STABLE AS $$
    SELECT
        b.booking_id, b.patient_id, b.lab_id, b.slot_id, b.test_id,
        b.collection_type, b.collection_address,
        b.booking_status,
        b.subtotal, b.home_collection_charge, b.discount_amount, b.total_amount,
        b.notes, b.cancelled_at, b.cancellation_reason, b.cancelled_by,
        b.created_at, b.updated_at,
        t.test_name, t.test_code, t.sample_type, t.fasting_required,
        s.slot_date, s.start_time, s.end_time,
        l.lab_name
    FROM lab_test_slot_bookings b
    JOIN lab_tests           t ON t.test_id  = b.test_id
    JOIN lab_test_slots      s ON s.slot_id  = b.slot_id
    JOIN labs                l ON l.lab_id   = b.lab_id
    WHERE b.booking_id = p_booking_id;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- List all bookings for a patient (ordered newest first).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_list_patient_bookings(p_patient_id UUID)
RETURNS TABLE (
    booking_id              UUID,
    patient_id              UUID,
    lab_id                  UUID,
    slot_id                 INT,
    test_id                 INT,
    collection_type         VARCHAR(20),
    collection_address      JSONB,
    booking_status          VARCHAR(20),
    subtotal                NUMERIC(10,2),
    home_collection_charge  NUMERIC(10,2),
    discount_amount         NUMERIC(10,2),
    total_amount            NUMERIC(10,2),
    notes                   TEXT,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    cancelled_by            UUID,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ,
    test_name               VARCHAR(255),
    test_code               VARCHAR(30),
    sample_type             VARCHAR(50),
    fasting_required        BOOLEAN,
    slot_date               DATE,
    start_time              TIME,
    end_time                TIME,
    lab_name                VARCHAR(255)
)
LANGUAGE sql STABLE AS $$
    SELECT
        b.booking_id, b.patient_id, b.lab_id, b.slot_id, b.test_id,
        b.collection_type, b.collection_address,
        b.booking_status,
        b.subtotal, b.home_collection_charge, b.discount_amount, b.total_amount,
        b.notes, b.cancelled_at, b.cancellation_reason, b.cancelled_by,
        b.created_at, b.updated_at,
        t.test_name, t.test_code, t.sample_type, t.fasting_required,
        s.slot_date, s.start_time, s.end_time,
        l.lab_name
    FROM lab_test_slot_bookings b
    JOIN lab_tests           t ON t.test_id  = b.test_id
    JOIN lab_test_slots      s ON s.slot_id  = b.slot_id
    JOIN labs                l ON l.lab_id   = b.lab_id
    WHERE b.patient_id = p_patient_id
    ORDER BY b.created_at DESC;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- List all bookings for a lab (ordered newest first).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_list_lab_bookings(p_lab_id UUID)
RETURNS TABLE (
    booking_id              UUID,
    patient_id              UUID,
    lab_id                  UUID,
    slot_id                 INT,
    test_id                 INT,
    collection_type         VARCHAR(20),
    collection_address      JSONB,
    booking_status          VARCHAR(20),
    subtotal                NUMERIC(10,2),
    home_collection_charge  NUMERIC(10,2),
    discount_amount         NUMERIC(10,2),
    total_amount            NUMERIC(10,2),
    notes                   TEXT,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    cancelled_by            UUID,
    created_at              TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ,
    test_name               VARCHAR(255),
    test_code               VARCHAR(30),
    sample_type             VARCHAR(50),
    fasting_required        BOOLEAN,
    slot_date               DATE,
    start_time              TIME,
    end_time                TIME,
    lab_name                VARCHAR(255)
)
LANGUAGE sql STABLE AS $$
    SELECT
        b.booking_id, b.patient_id, b.lab_id, b.slot_id, b.test_id,
        b.collection_type, b.collection_address,
        b.booking_status,
        b.subtotal, b.home_collection_charge, b.discount_amount, b.total_amount,
        b.notes, b.cancelled_at, b.cancellation_reason, b.cancelled_by,
        b.created_at, b.updated_at,
        t.test_name, t.test_code, t.sample_type, t.fasting_required,
        s.slot_date, s.start_time, s.end_time,
        l.lab_name
    FROM lab_test_slot_bookings b
    JOIN lab_tests           t ON t.test_id  = b.test_id
    JOIN lab_test_slots      s ON s.slot_id  = b.slot_id
    JOIN labs                l ON l.lab_id   = b.lab_id
    WHERE b.lab_id = p_lab_id
    ORDER BY b.created_at DESC;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Cancel a booking: set status, timestamp, and reason in a single UPDATE.
-- Returns the updated booking row for the caller to verify.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_cancel_lab_booking(
    p_booking_id         UUID,
    p_cancelled_by       UUID,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    booking_id   UUID,
    booking_status VARCHAR(20),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID,
    updated_at   TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE lab_test_slot_bookings
    SET booking_status      = 'CANCELLED',
        cancelled_at        = NOW(),
        cancellation_reason = p_cancellation_reason,
        cancelled_by        = p_cancelled_by,
        updated_at          = NOW()
    WHERE lab_test_slot_bookings.booking_id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking % not found.', p_booking_id;
    END IF;

    RETURN QUERY
    SELECT
        b.booking_id, b.booking_status, b.cancelled_at,
        b.cancellation_reason, b.cancelled_by, b.updated_at
    FROM lab_test_slot_bookings b
    WHERE b.booking_id = p_booking_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Upload / add a report for a booking.
-- Returns the newly inserted report row.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_upload_lab_report(
    p_booking_id      UUID,
    p_report_file_url VARCHAR(255),
    p_report_type     VARCHAR(50),
    p_result_notes    TEXT,
    p_uploaded_by     UUID
)
RETURNS TABLE (
    result_id        INT,
    booking_id       UUID,
    report_file_url  VARCHAR(255),
    report_type      VARCHAR(50),
    result_notes     TEXT,
    uploaded_by      UUID,
    uploaded_at      TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
DECLARE
    v_result_id INT;
BEGIN
    INSERT INTO lab_test_reports (
        booking_id, report_file_url, report_type,
        result_notes, uploaded_by, uploaded_at
    )
    VALUES (
        p_booking_id, p_report_file_url, COALESCE(p_report_type, 'pdf'),
        p_result_notes, p_uploaded_by, NOW()
    )
    RETURNING lab_test_reports.result_id INTO v_result_id;

    RETURN QUERY
    SELECT r.result_id, r.booking_id, r.report_file_url,
           r.report_type, r.result_notes, r.uploaded_by, r.uploaded_at
    FROM lab_test_reports r
    WHERE r.result_id = v_result_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Fetch all reports for a given booking.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_get_booking_reports(p_booking_id UUID)
RETURNS TABLE (
    result_id        INT,
    booking_id       UUID,
    report_file_url  VARCHAR(255),
    report_type      VARCHAR(50),
    result_notes     TEXT,
    uploaded_by      UUID,
    uploaded_at      TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
    SELECT r.result_id, r.booking_id, r.report_file_url,
           r.report_type, r.result_notes, r.uploaded_by, r.uploaded_at
    FROM lab_test_reports r
    WHERE r.booking_id = p_booking_id
    ORDER BY r.uploaded_at DESC;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Update booking status to COMPLETED.
-- Only lab or admin should call this endpoint.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION l_complete_lab_booking(p_booking_id UUID)
RETURNS TABLE (
    booking_id     UUID,
    booking_status VARCHAR(20),
    updated_at     TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE lab_test_slot_bookings lb
    SET booking_status = 'COMPLETED',
        updated_at     = NOW()
    WHERE lb.booking_id = p_booking_id
      AND lb.booking_status = 'BOOKED';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking % not found or is not in BOOKED status.', p_booking_id;
    END IF;

    RETURN QUERY
    SELECT b.booking_id, b.booking_status, b.updated_at
    FROM lab_test_slot_bookings b
    WHERE b.booking_id = p_booking_id;
END;
$$;
