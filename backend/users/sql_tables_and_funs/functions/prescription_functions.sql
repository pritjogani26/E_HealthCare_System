-- backend\users\sql_tables_and_funs\functions\prescription_functions.sql
-- ============================================================
-- Prescription Functions
-- ============================================================


-- ── Create prescription header ───────────────────────────────

CREATE OR REPLACE FUNCTION doc_create_prescription(
    p_appointment_id      INTEGER,
    p_doctor_id           UUID,
    p_patient_id          UUID,
    p_prescription_number VARCHAR,
    p_clinical_notes      TEXT    DEFAULT NULL,
    p_lab_tests           TEXT    DEFAULT NULL,
    p_advice              TEXT    DEFAULT NULL,
    p_follow_up_date      DATE    DEFAULT NULL,
    p_pdf_path            VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Guard: appointment must belong to this doctor & patient
    IF NOT EXISTS (
        SELECT 1 FROM doctor_appointments
        WHERE appointment_id = p_appointment_id
          AND doctor_id  = p_doctor_id
          AND patient_id = p_patient_id
    ) THEN
        RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND_OR_MISMATCH';
    END IF;

    -- Guard: one prescription per appointment
    IF EXISTS (SELECT 1 FROM prescriptions WHERE appointment_id = p_appointment_id) THEN
        RAISE EXCEPTION 'PRESCRIPTION_ALREADY_EXISTS';
    END IF;

    INSERT INTO prescriptions (
        appointment_id, doctor_id, patient_id, prescription_number,
        clinical_notes, lab_tests, advice, follow_up_date, pdf_path
    ) VALUES (
        p_appointment_id, p_doctor_id, p_patient_id, p_prescription_number,
        p_clinical_notes, p_lab_tests, p_advice, p_follow_up_date, p_pdf_path
    )
    RETURNING prescription_id INTO v_id;

    -- Mark appointment as completed
    UPDATE doctor_appointments
    SET status = 'completed', updated_at = NOW()
    WHERE appointment_id = p_appointment_id;

    RETURN v_id;
END;
$$;


-- ── Add a medicine row ───────────────────────────────────────

CREATE OR REPLACE FUNCTION doc_add_prescription_medicine(
    p_prescription_id UUID,
    p_medicine_name   VARCHAR,
    p_dosage          VARCHAR DEFAULT NULL,
    p_frequency       VARCHAR DEFAULT NULL,
    p_duration        VARCHAR DEFAULT NULL,
    p_instructions    VARCHAR DEFAULT NULL,
    p_sort_order      INTEGER DEFAULT 0
)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE v_id INTEGER;
BEGIN
    INSERT INTO prescription_medicines (
        prescription_id, medicine_name, dosage, frequency,
        duration, instructions, sort_order
    ) VALUES (
        p_prescription_id, p_medicine_name, p_dosage, p_frequency,
        p_duration, p_instructions, p_sort_order
    )
    RETURNING medicine_id INTO v_id;
    RETURN v_id;
END;
$$;


-- ── Update pdf_path after file is written ────────────────────

CREATE OR REPLACE FUNCTION doc_update_prescription_pdf(
    p_prescription_id UUID,
    p_pdf_path        VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE prescriptions
    SET pdf_path = p_pdf_path, updated_at = NOW()
    WHERE prescription_id = p_prescription_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PRESCRIPTION_NOT_FOUND';
    END IF;
    RETURN TRUE;
END;
$$;


-- ── Fetch a prescription by appointment ─────────────────────

CREATE OR REPLACE FUNCTION doc_get_prescription_by_appointment(
    p_appointment_id INTEGER
)
RETURNS TABLE(
    prescription_id     UUID,
    appointment_id      INTEGER,
    doctor_id           UUID,
    patient_id          UUID,
    prescription_number VARCHAR,
    clinical_notes      TEXT,
    lab_tests           TEXT,
    advice              TEXT,
    follow_up_date      DATE,
    pdf_path            VARCHAR,
    created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.prescription_id, p.appointment_id, p.doctor_id, p.patient_id,
        p.prescription_number, p.clinical_notes, p.lab_tests, p.advice,
        p.follow_up_date, p.pdf_path, p.created_at
    FROM prescriptions p
    WHERE p.appointment_id = p_appointment_id
    LIMIT 1;
END;
$$;


-- ── Fetch all medicines for a prescription ───────────────────

CREATE OR REPLACE FUNCTION doc_get_prescription_medicines(
    p_prescription_id UUID
)
RETURNS TABLE(
    medicine_id   INTEGER,
    medicine_name VARCHAR,
    dosage        VARCHAR,
    frequency     VARCHAR,
    duration      VARCHAR,
    instructions  VARCHAR,
    sort_order    INTEGER
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT pm.medicine_id, pm.medicine_name, pm.dosage, pm.frequency,
           pm.duration, pm.instructions, pm.sort_order
    FROM prescription_medicines pm
    WHERE pm.prescription_id = p_prescription_id
    ORDER BY pm.sort_order, pm.medicine_id;
END;
$$;


-- ── Patient: list all their prescriptions ───────────────────

CREATE OR REPLACE FUNCTION doc_get_patient_prescriptions(p_patient_id UUID)
RETURNS TABLE(
    prescription_id     UUID,
    appointment_id      INTEGER,
    prescription_number VARCHAR,
    doctor_name         VARCHAR,
    slot_date           DATE,
    pdf_path            VARCHAR,
    created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.prescription_id,
        p.appointment_id,
        p.prescription_number,
        d.full_name,
        s.slot_date,
        p.pdf_path,
        p.created_at
    FROM prescriptions p
    JOIN doctors d ON d.doctor_id = p.doctor_id
    LEFT JOIN doctor_appointments da ON da.appointment_id = p.appointment_id
    LEFT JOIN appointment_slots    s  ON s.slot_id = da.slot_id
    WHERE p.patient_id = p_patient_id
    ORDER BY p.created_at DESC;
END;
$$;