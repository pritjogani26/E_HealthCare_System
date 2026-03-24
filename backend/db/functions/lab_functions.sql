CREATE OR REPLACE FUNCTION l_get_full_lab_profile(p_lab_id uuid)
RETURNS TABLE(
    lab_id              uuid,
    email               varchar,
    email_verified      boolean,
    is_active           boolean,
    two_factor_enabled  boolean,
    last_login_at       timestamptz,
    role                varchar,

    lab_name            varchar,
    license_number      varchar,
    phone_number        varchar,
    lab_logo            varchar,

    address_line        text,
    city                varchar,
    state               varchar,
    pincode             varchar,

    verification_status varchar,
    verification_notes  text,
    verified_at         timestamptz,
    verified_by_id      uuid,
    verified_by_email   varchar,

    created_at          timestamptz,
    updated_at          timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.lab_id,
        u.email,
        u.email_verified,
        u.is_active,
        u.two_factor_enabled,
        u.last_login_at,
        r.role,

        l.lab_name,
        l.license_number,
        l.phone_number,
        l.lab_logo,

        a.address_line,
        a.city,
        a.state,
        a.pincode,

        l.verification_status,
        l.verification_notes,
        l.verified_at,
        l.verified_by_id,

        v.email,
        l.created_at,
        l.updated_at
    FROM labs l
    JOIN users u ON u.user_id = l.lab_id
    JOIN user_roles r ON r.role_id = u.role_id
    LEFT JOIN addresses a ON a.user_id = l.lab_id
    LEFT JOIN users v ON v.user_id = l.verified_by_id
    WHERE l.lab_id = p_lab_id;
END;
$$;

CREATE OR REPLACE FUNCTION l_list_labs()
RETURNS TABLE(
    lab_id              uuid,
    email               varchar,
    email_verified      boolean,
    is_active           boolean,
    last_login_at       timestamptz,
    role                varchar,

    lab_name            varchar,
    license_number      varchar,
    phone_number        varchar,
    lab_logo            varchar,

    address_line        text,
    city                varchar,
    state               varchar,
    pincode             varchar,

    verification_status varchar,
    verification_notes  text,
    verified_at         timestamptz,
    verified_by_id      uuid,
    verified_by_email   varchar,

    created_at          timestamptz,
    updated_at          timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.lab_id,
        u.email,
        u.email_verified,
        u.is_active,
        u.last_login_at,
        r.role,

        l.lab_name,
        l.license_number,
        l.phone_number,
        l.lab_logo,

        a.address_line,
        a.city,
        a.state,
        a.pincode,

        l.verification_status,
        l.verification_notes,
        l.verified_at,
        l.verified_by_id,

        v.email,
        l.created_at,
        l.updated_at
    FROM labs l
    JOIN users u ON u.user_id = l.lab_id
    JOIN user_roles r ON r.role_id = u.role_id
    LEFT JOIN addresses a ON a.user_id = l.lab_id
    LEFT JOIN users v ON v.user_id = l.verified_by_id
    ORDER BY l.created_at DESC;
END;
$$;


CREATE OR REPLACE FUNCTION l_update_lab_profile(
    p_lab_id              uuid,
    p_lab_name            varchar DEFAULT NULL,
    p_license_number      varchar DEFAULT NULL,
    p_phone_number        varchar DEFAULT NULL,
    p_lab_logo            varchar DEFAULT NULL,
    p_verification_status varchar DEFAULT NULL,
    p_verification_notes  text    DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM labs WHERE lab_id = p_lab_id) THEN
        RAISE EXCEPTION 'LAB_NOT_FOUND';
    END IF;

    UPDATE labs
    SET
        lab_name            = COALESCE(p_lab_name, lab_name),
        license_number      = COALESCE(p_license_number, license_number),
        phone_number        = COALESCE(p_phone_number, phone_number),
        lab_logo            = COALESCE(p_lab_logo, lab_logo),
        verification_status = COALESCE(p_verification_status, verification_status),
        verification_notes  = COALESCE(p_verification_notes, verification_notes),
        updated_at          = NOW()
    WHERE lab_id = p_lab_id;

    RETURN TRUE;
END;
$$;


CREATE OR REPLACE FUNCTION a_verify_lab(
    p_admin_id            uuid,
    p_lab_id              uuid,
    p_verification_status varchar,
    p_verification_notes  text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
    IF p_verification_status NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'INVALID_VERIFICATION_STATUS';
    END IF;

    UPDATE labs
    SET
        verification_status = p_verification_status,
        verification_notes  = p_verification_notes,
        verified_at         = NOW(),
        verified_by_id      = p_admin_id,
        updated_at          = NOW()
    WHERE lab_id = p_lab_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'LAB_NOT_FOUND'; END IF;

    RETURN TRUE;
END;
$$;



CREATE OR REPLACE FUNCTION l_upsert_operating_hours(
    p_lab_id      uuid,
    p_day_of_week int,
    p_open_time   time,
    p_close_time  time,
    p_is_closed   boolean DEFAULT FALSE
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    IF p_day_of_week < 0 OR p_day_of_week > 6 THEN
        RAISE EXCEPTION 'INVALID_DAY_OF_WEEK';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM labs WHERE lab_id = p_lab_id) THEN
        RAISE EXCEPTION 'LAB_NOT_FOUND';
    END IF;

    INSERT INTO lab_operating_hours
        (lab_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
    VALUES
        (p_lab_id, p_day_of_week, p_open_time, p_close_time, p_is_closed, NOW(), NOW())
    ON CONFLICT (lab_id, day_of_week)
    DO UPDATE SET
        open_time  = EXCLUDED.open_time,
        close_time = EXCLUDED.close_time,
        is_closed  = EXCLUDED.is_closed,
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION l_get_operating_hours(p_lab_id uuid)
RETURNS TABLE(
    id         int,
    day_of_week int,
    open_time  time,
    close_time time,
    is_closed  boolean,
    updated_at timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT loh.id, loh.day_of_week, loh.open_time, loh.close_time, loh.is_closed, loh.updated_at
    FROM lab_operating_hours loh
    WHERE loh.lab_id = p_lab_id
    ORDER BY loh.day_of_week;
END;
$$;



CREATE OR REPLACE FUNCTION l_add_service(
    p_lab_id           uuid,
    p_service_name     varchar,
    p_description      text    DEFAULT NULL,
    p_price            numeric DEFAULT NULL,
    p_turnaround_hours int     DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE v_id int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM labs WHERE lab_id = p_lab_id) THEN
        RAISE EXCEPTION 'LAB_NOT_FOUND';
    END IF;

    INSERT INTO lab_services
        (lab_id, service_name, description, price, turnaround_hours, is_active, created_at, updated_at)
    VALUES
        (p_lab_id, p_service_name, p_description, p_price, p_turnaround_hours, TRUE, NOW(), NOW())
    RETURNING service_id INTO v_id;

    RETURN v_id;
END;
$$;


CREATE OR REPLACE FUNCTION l_get_services(p_lab_id uuid, p_active_only boolean DEFAULT TRUE)
RETURNS TABLE(
    service_id       int,
    service_name     varchar,
    description      text,
    price            numeric,
    turnaround_hours int,
    is_active        boolean,
    created_at       timestamptz
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT ls.service_id, ls.service_name, ls.description, ls.price,
           ls.turnaround_hours, ls.is_active, ls.created_at
    FROM lab_services ls
    WHERE ls.lab_id = p_lab_id
      AND (NOT p_active_only OR ls.is_active = TRUE)
    ORDER BY ls.service_name;
END;
$$;