DROP FUNCTION IF EXISTS o_get_blood_groups;
CREATE OR REPLACE FUNCTION o_get_blood_groups(
    p_active_only boolean DEFAULT TRUE
)
RETURNS TABLE(
    blood_group_id int,
    blood_group_value varchar,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.blood_group_id,
        b.blood_group_value,
        b.created_at
    FROM public.blood_groups b
    ORDER BY b.blood_group_value;
END;
$$;


CREATE OR REPLACE FUNCTION o_insert_blood_group(
    p_blood_group_value varchar
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_id int;
BEGIN

    IF p_blood_group_value IS NULL OR TRIM(p_blood_group_value) = '' THEN
        RAISE EXCEPTION 'INVALID_BLOOD_GROUP: value cannot be null or empty';
    END IF;

    INSERT INTO public.blood_groups (
        blood_group_value,
        created_at
    )
    VALUES (
        TRIM(p_blood_group_value),
        NOW()
    )
    ON CONFLICT (blood_group_value) DO NOTHING;

    SELECT blood_group_id
    INTO v_id
    FROM public.blood_groups
    WHERE blood_group_value = TRIM(p_blood_group_value);

    RETURN v_id;

END;
$$;


DROP FUNCTION IF EXISTS o_get_genders;
CREATE OR REPLACE FUNCTION o_get_genders()
RETURNS TABLE(
    gender_id int,
    gender_value varchar,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.gender_id,
        g.gender_value,
        g.created_at
    FROM public.genders g
    ORDER BY g.gender_value;
END;
$$;

DROP FUNCTION IF EXISTS o_insert_gender;
CREATE OR REPLACE FUNCTION o_insert_gender(
    p_gender_value varchar
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_id int;
BEGIN

    IF p_gender_value IS NULL OR TRIM(p_gender_value) = '' THEN
        RAISE EXCEPTION 'INVALID_GENDER: value cannot be null or empty';
    END IF;

    INSERT INTO public.genders (
        gender_value,
        created_at
    )
    VALUES (
        TRIM(p_gender_value),
        NOW()
    )
    ON CONFLICT (gender_value) DO NOTHING;

    SELECT gender_id
    INTO v_id
    FROM public.genders
    WHERE gender_value = TRIM(p_gender_value);

    RETURN v_id;

END;
$$;


DROP FUNCTION IF EXISTS o_get_specializations;
CREATE OR REPLACE FUNCTION o_get_specializations(
    p_active_only boolean DEFAULT TRUE
)
RETURNS TABLE(
    specialization_id int,
    specialization_name varchar,
    description text,
    is_active boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.specialization_id,
        s.specialization_name,
        s.description,
        s.is_active,
        s.created_at
    FROM public.specializations s
    WHERE (NOT p_active_only OR s.is_active = TRUE)
    ORDER BY s.specialization_name;
END;
$$;

DROP FUNCTION IF EXISTS o_insert_specialization;
CREATE OR REPLACE FUNCTION o_insert_specialization(
    p_name varchar,
    p_description text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_id int;
BEGIN

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_SPECIALIZATION_NAME: name cannot be null or empty';
    END IF;

    INSERT INTO public.specializations (
        specialization_name,
        description,
        is_active,
        created_at
    )
    VALUES (
        TRIM(p_name),
        p_description,
        TRUE,
        NOW()
    )
    ON CONFLICT (specialization_name)
    DO UPDATE SET
        description = EXCLUDED.description,
        is_active   = TRUE;

    SELECT specialization_id
    INTO v_id
    FROM public.specializations
    WHERE specialization_name = TRIM(p_name);

    RETURN v_id;

END;
$$;


CREATE OR REPLACE FUNCTION o_toggle_specialization(
    p_specialization_id int,
    p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

    IF p_specialization_id IS NULL OR p_specialization_id <= 0 THEN
        RAISE EXCEPTION 'INVALID_SPECIALIZATION_ID: %', p_specialization_id;
    END IF;

    IF p_is_active IS NULL THEN
        RAISE EXCEPTION 'INVALID_IS_ACTIVE: value cannot be null';
    END IF;

    UPDATE public.specializations
    SET is_active = p_is_active
    WHERE specialization_id = p_specialization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SPECIALIZATION_NOT_FOUND: %', p_specialization_id;
    END IF;

    RETURN TRUE;

END;
$$;


DROP FUNCTION IF EXISTS o_get_qualifications;
CREATE OR REPLACE FUNCTION o_get_qualifications(
    p_active_only boolean DEFAULT TRUE
)
RETURNS TABLE(
    qualification_id int,
    qualification_code varchar,
    qualification_name varchar,
    is_active boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.qualification_id,
        q.qualification_code,
        q.qualification_name,
        q.is_active,
        q.created_at
    FROM public.qualifications q
    WHERE (NOT p_active_only OR q.is_active = TRUE)
    ORDER BY q.qualification_code;
END;
$$;


DROP FUNCTION IF EXISTS o_insert_qualification;
CREATE OR REPLACE FUNCTION o_insert_qualification(
    p_code varchar,
    p_name varchar
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_id int;
BEGIN

    IF p_code IS NULL OR TRIM(p_code) = '' THEN
        RAISE EXCEPTION 'INVALID_QUALIFICATION_CODE: code cannot be null or empty';
    END IF;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_QUALIFICATION_NAME: name cannot be null or empty';
    END IF;

    INSERT INTO public.qualifications (
        qualification_code,
        qualification_name,
        is_active,
        created_at
    )
    VALUES (
        TRIM(p_code),
        TRIM(p_name),
        TRUE,
        NOW()
    )
    ON CONFLICT (qualification_code)
    DO UPDATE SET
        qualification_name = EXCLUDED.qualification_name,
        is_active          = TRUE;

    SELECT qualification_id
    INTO v_id
    FROM public.qualifications
    WHERE qualification_code = TRIM(p_code);

    RETURN v_id;

END;
$$;

DROP FUNCTION IF EXISTS o_toggle_qualification;
CREATE OR REPLACE FUNCTION o_toggle_qualification(
    p_qualification_id int,
    p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

    IF p_qualification_id IS NULL OR p_qualification_id <= 0 THEN
        RAISE EXCEPTION 'INVALID_QUALIFICATION_ID: %', p_qualification_id;
    END IF;

    IF p_is_active IS NULL THEN
        RAISE EXCEPTION 'INVALID_IS_ACTIVE: value cannot be null';
    END IF;

    UPDATE public.qualifications
    SET is_active = p_is_active
    WHERE qualification_id = p_qualification_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUALIFICATION_NOT_FOUND: %', p_qualification_id;
    END IF;

    RETURN TRUE;

END;
$$;


DROP FUNCTION IF EXISTS o_get_verification_types;
CREATE OR REPLACE FUNCTION o_get_verification_types()
RETURNS TABLE(
    id smallint,
    name varchar,
    description text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        vt.id,
        vt.name,
        vt.description,
        vt.created_at
    FROM public.verification_types vt
    ORDER BY vt.name;
END;
$$;


DROP FUNCTION IF EXISTS o_insert_verification_type;
CREATE OR REPLACE FUNCTION o_insert_verification_type(
    p_name        varchar,
    p_description text DEFAULT NULL
)
RETURNS smallint
LANGUAGE plpgsql
AS $$
DECLARE
    v_id smallint;
BEGIN

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        RAISE EXCEPTION 'INVALID_VERIFICATION_TYPE_NAME: name cannot be null or empty';
    END IF;

    INSERT INTO public.verification_types (
        name,
        description
    )
    VALUES (
        TRIM(p_name),
        p_description
    )
    ON CONFLICT (name)
    DO UPDATE SET description = EXCLUDED.description;

    SELECT id
    INTO v_id
    FROM public.verification_types
    WHERE name = TRIM(p_name);

    RETURN v_id;

END;
$$;
