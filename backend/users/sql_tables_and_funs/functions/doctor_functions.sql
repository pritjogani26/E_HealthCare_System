CREATE OR REPLACE FUNCTION d_get_full_doctor_profile(p_doctor_id uuid)
RETURNS TABLE(
    doctor_id           uuid,
    email               varchar,
    email_verified      boolean,
    is_active           boolean,
    two_factor_enabled  boolean,
    last_login_at       timestamptz,
    role                varchar,

    full_name           varchar,
    experience_years    numeric,
    phone_number        varchar,
    consultation_fee    numeric,
    registration_number varchar,
    profile_image       varchar,

    address_line        text,
    city                varchar,
    state               varchar,
    pincode             varchar,

    gender_id           int,
    gender_value        varchar,

    verification_status varchar,
    verification_notes  text,
    verified_at         timestamptz,
    verified_by_id      uuid,

    created_at          timestamptz,
    updated_at          timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        u.email,
        u.email_verified,
        u.is_active,
        u.two_factor_enabled,
        u.last_login_at,
        r.role,

        d.full_name,
        d.experience_years,
        d.phone_number,
        d.consultation_fee,
        d.registration_number,
        d.profile_image,

        a.address_line,
        a.city,
        a.state,
        a.pincode,

        d.gender_id,
        g.gender_value,

        d.verification_status,
        d.verification_notes,
        d.verified_at,
        d.verified_by_id,

        d.created_at,
        d.updated_at
    FROM doctors d
    JOIN users u ON u.user_id = d.doctor_id
    JOIN user_roles r ON r.role_id = u.role_id
    LEFT JOIN addresses a ON a.user_id = d.doctor_id
    LEFT JOIN genders g ON g.gender_id = d.gender_id
    WHERE d.doctor_id = p_doctor_id;
END;
$$;

CREATE OR REPLACE FUNCTION d_list_doctors()
RETURNS TABLE(
    doctor_id           uuid,
    full_name           varchar,
    email               varchar,
    phone_number        varchar,
    consultation_fee    numeric,
    experience_years    numeric,
    registration_number varchar,
    is_active           boolean,
    verification_status varchar,
    verified_at timestamptz,
    verification_notes text,
    created_at          timestamptz,
    updated_at timestamptz,
    gender varchar,
    verified_by uuid
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.full_name,
        u.email,
        d.phone_number,
        d.consultation_fee,
        d.experience_years,
        d.registration_number,
        u.is_active,
        d.verification_status,
        d.verified_at,
        d.verification_notes,
        d.created_at,
        d.updated_at,
        g.gender_value,
        d.verified_by_id
    FROM doctors d
    Inner JOIN users u ON u.user_id = d.doctor_id
    left Join genders g on d.gender_id = g.gender_id
    ORDER BY d.created_at DESC;
END;
$$;


CREATE OR REPLACE FUNCTION d_update_doctor_profile(
    p_doctor_id           uuid,
    p_full_name           varchar  DEFAULT NULL,
    p_experience_years    numeric  DEFAULT NULL,
    p_phone_number        varchar  DEFAULT NULL,
    p_consultation_fee    numeric  DEFAULT NULL,
    p_registration_number varchar  DEFAULT NULL,
    p_profile_image       varchar  DEFAULT NULL,
    p_gender_id           int      DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_id = p_doctor_id) THEN
        RAISE EXCEPTION 'DOCTOR_NOT_FOUND';
    END IF;

    UPDATE doctors
    SET
        full_name           = COALESCE(p_full_name, full_name),
        experience_years    = COALESCE(p_experience_years, experience_years),
        phone_number        = COALESCE(p_phone_number, phone_number),
        consultation_fee    = COALESCE(p_consultation_fee, consultation_fee),
        registration_number = COALESCE(p_registration_number, registration_number),
        profile_image       = COALESCE(p_profile_image, profile_image),
        gender_id           = COALESCE(p_gender_id, gender_id),
        updated_at          = NOW()
    WHERE doctor_id = p_doctor_id;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION a_verify_doctor(
    p_admin_id            uuid,
    p_doctor_id           uuid,
    p_verification_status varchar,
    p_verification_notes  text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    IF p_verification_status NOT IN ('VERIFIED', 'REJECTED') THEN
        RAISE EXCEPTION 'INVALID_VERIFICATION_STATUS';
    END IF;

    UPDATE doctors
    SET
        verification_status = p_verification_status,
        verification_notes  = p_verification_notes,
        verified_at         = NOW(),
        verified_by_id      = p_admin_id,
        updated_at          = NOW()
    WHERE doctor_id = p_doctor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'DOCTOR_NOT_FOUND';
    END IF;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION d_get_qualifications(p_doctor_id uuid)
RETURNS TABLE(
    doctor_qualification_id int,
    qualification_id        int,
    qualification_code      varchar,
    qualification_name      varchar,
    qual_is_active          boolean,
    institution             varchar,
    year_of_completion      int,
    created_at              timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dq.doctor_qualification_id,
        q.qualification_id,
        q.qualification_code,
        q.qualification_name,
        q.is_active,
        dq.institution,
        dq.year_of_completion,
        dq.created_at
    FROM doctor_qualifications dq
    JOIN qualifications q ON q.qualification_id = dq.qualification_id
    WHERE dq.doctor_id = p_doctor_id
    ORDER BY dq.created_at;
END;
$$;


CREATE OR REPLACE FUNCTION d_add_qualification(
    p_doctor_id          uuid,
    p_qualification_id   int,
    p_institution        varchar DEFAULT NULL,
    p_year_of_completion int     DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    INSERT INTO doctor_qualifications
        (doctor_id, qualification_id, institution, year_of_completion, created_at)
    VALUES
        (p_doctor_id, p_qualification_id, p_institution, p_year_of_completion, NOW())
    ON CONFLICT (doctor_id, qualification_id)
    DO UPDATE SET
        institution        = EXCLUDED.institution,
        year_of_completion = EXCLUDED.year_of_completion
    RETURNING doctor_qualification_id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION d_add_specialization(
    p_doctor_id         uuid,
    p_specialization_id int,
    p_is_primary        boolean DEFAULT FALSE,
    p_years_in_specialty int   DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    IF p_is_primary THEN
        UPDATE doctor_specializations SET is_primary = FALSE WHERE doctor_id = p_doctor_id;
    END IF;

    INSERT INTO doctor_specializations
        (doctor_id, specialization_id, is_primary, years_in_specialty, created_at)
    VALUES
        (p_doctor_id, p_specialization_id, p_is_primary, p_years_in_specialty, NOW())
    ON CONFLICT (doctor_id, specialization_id)
    DO UPDATE SET
        is_primary        = EXCLUDED.is_primary,
        years_in_specialty = EXCLUDED.years_in_specialty
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION d_get_specializations(p_doctor_id uuid)
RETURNS TABLE(
    id                  int,
    specialization_id   int,
    specialization_name varchar,
    description         text,
    spec_is_active      boolean,
    is_primary          boolean,
    years_in_specialty  int,
    created_at          timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.id,
        ds.specialization_id,
        s.specialization_name,
        s.description,
        s.is_active,
        ds.is_primary,
        ds.years_in_specialty,
        ds.created_at
    FROM doctor_specializations ds
    JOIN specializations s ON s.specialization_id = ds.specialization_id
    WHERE ds.doctor_id = p_doctor_id
    ORDER BY ds.is_primary DESC, ds.created_at;
END;
$$;


CREATE OR REPLACE FUNCTION d_upsert_schedule(
    p_doctor_id                uuid,
    p_consultation_duration_min int,
    p_appointment_contact      varchar DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    INSERT INTO doctor_schedules
        (doctor_id, consultation_duration_min, appointment_contact, created_at, updated_at)
    VALUES
        (p_doctor_id, p_consultation_duration_min, p_appointment_contact, NOW(), NOW())
    ON CONFLICT (doctor_id)
    DO UPDATE SET
        consultation_duration_min = EXCLUDED.consultation_duration_min,
        appointment_contact       = EXCLUDED.appointment_contact,
        updated_at                = NOW()
    RETURNING schedule_id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION d_get_full_schedule(p_doctor_id uuid)
RETURNS TABLE(
    schedule_id               int,
    doctor_id                 uuid,
    consultation_duration_min int,
    appointment_contact       varchar,
    created_at                timestamptz,
    updated_at                timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.schedule_id,
        ds.doctor_id,
        ds.consultation_duration_min,
        ds.appointment_contact,
        ds.created_at,
        ds.updated_at
    FROM doctor_schedules ds
    WHERE ds.doctor_id = p_doctor_id
    LIMIT 1;
END;
$$;



CREATE OR REPLACE FUNCTION d_upsert_working_day(
    p_schedule_id  int,
    p_day_of_week  int,
    p_arrival      time DEFAULT NULL,
    p_leaving      time DEFAULT NULL,
    p_lunch_start  time DEFAULT NULL,
    p_lunch_end    time DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    IF p_day_of_week < 0 OR p_day_of_week > 6 THEN
        RAISE EXCEPTION 'INVALID_DAY_OF_WEEK: %', p_day_of_week;
    END IF;

    INSERT INTO doctor_working_days
        (schedule_id, day_of_week, arrival, leaving, lunch_start, lunch_end, created_at)
    VALUES
        (p_schedule_id, p_day_of_week, p_arrival, p_leaving, p_lunch_start, p_lunch_end, NOW())
    ON CONFLICT (schedule_id, day_of_week)
    DO UPDATE SET
        arrival     = EXCLUDED.arrival,
        leaving     = EXCLUDED.leaving,
        lunch_start = EXCLUDED.lunch_start,
        lunch_end   = EXCLUDED.lunch_end
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION d_get_available_slots(p_doctor_id uuid, p_date date)
RETURNS TABLE(slot_id int, slot_date date, start_time time, end_time time)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT s.slot_id, s.slot_date, s.start_time, s.end_time
    FROM appointment_slots s
    JOIN doctor_schedules ds ON ds.schedule_id = s.schedule_id
    WHERE ds.doctor_id = p_doctor_id
      AND s.slot_date = p_date
      AND s.is_booked = FALSE
      AND s.is_blocked = FALSE
    ORDER BY s.start_time;
END;
$$;



CREATE OR REPLACE FUNCTION d_book_appointment(
    p_patient_id      uuid,
    p_doctor_id       uuid,
    p_slot_id         int,
    p_appointment_type varchar DEFAULT 'in_person',
    p_reason          text    DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
    v_appointment_id int;
    v_is_booked      boolean;
    v_is_blocked     boolean;
BEGIN
    SELECT is_booked, is_blocked
    INTO v_is_booked, v_is_blocked
    FROM appointment_slots
    WHERE slot_id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'SLOT_NOT_FOUND'; END IF;
    IF v_is_booked  THEN RAISE EXCEPTION 'SLOT_ALREADY_BOOKED'; END IF;
    IF v_is_blocked THEN RAISE EXCEPTION 'SLOT_BLOCKED'; END IF;

    UPDATE appointment_slots SET is_booked = TRUE WHERE slot_id = p_slot_id;

    INSERT INTO doctor_appointments
        (doctor_id, patient_id, slot_id, appointment_type, status, reason, created_at, updated_at)
    VALUES
        (p_doctor_id, p_patient_id, p_slot_id, p_appointment_type, 'confirmed', p_reason, NOW(), NOW())
    RETURNING appointment_id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$;


CREATE OR REPLACE FUNCTION d_cancel_appointment(
    p_appointment_id   int,
    p_cancelled_by_id  uuid,
    p_reason           text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE doctor_appointments
    SET
        status              = 'cancelled',
        cancelled_by_id     = p_cancelled_by_id,
        cancellation_reason = p_reason,
        updated_at          = NOW()
    WHERE appointment_id = p_appointment_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND'; END IF;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION d_get_appointments(
    p_doctor_id  uuid DEFAULT NULL,
    p_patient_id uuid DEFAULT NULL
)
RETURNS TABLE(
    appointment_id      int,
    doctor_id           uuid,
    doctor_name         varchar,
    patient_id          uuid,
    patient_email       varchar,
    slot_id             int,
    slot_date           date,
    start_time          time,
    end_time            time,
    appointment_type    varchar,
    status              varchar,
    reason              text,
    cancellation_reason text,
    created_at          timestamptz,
    updated_at          timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.appointment_id,
        da.doctor_id,
        d.full_name,
        da.patient_id,
        u.email,
        da.slot_id,
        s.slot_date,
        s.start_time,
        s.end_time,
        da.appointment_type,
        da.status,
        da.reason,
        da.cancellation_reason,
        da.created_at,
        da.updated_at
    FROM doctor_appointments da
    JOIN doctors d ON d.doctor_id = da.doctor_id
    JOIN users u ON u.user_id = da.patient_id
    LEFT JOIN appointment_slots s ON s.slot_id = da.slot_id
    WHERE
        (p_doctor_id  IS NULL OR da.doctor_id  = p_doctor_id)
        AND (p_patient_id IS NULL OR da.patient_id = p_patient_id)
    ORDER BY da.created_at DESC;
END;
$$;