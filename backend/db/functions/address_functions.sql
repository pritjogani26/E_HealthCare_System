CREATE OR REPLACE FUNCTION public.o_insert_address(
    p_address_line TEXT,
    p_city         VARCHAR,
    p_state        VARCHAR,
    p_pincode      VARCHAR,
    p_user_id      UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_address_id INTEGER;
BEGIN
    IF TRIM(p_address_line) = '' OR TRIM(p_city) = '' OR 
       TRIM(p_state) = '' OR TRIM(p_pincode) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Address fields cannot be empty';
    END IF;

    INSERT INTO public.addresses (
        address_line,
        city,
        state,
        pincode,
        created_at,
        updated_at,
        user_id
    )
    VALUES (
        p_address_line,
        p_city,
        p_state,
        p_pincode,
        NOW(),
        NOW(),
        p_user_id
    )
    RETURNING address_id INTO v_address_id;

    RETURN v_address_id;
END;
$$;



CREATE OR REPLACE FUNCTION public.o_update_address_by_address_id(
    p_address_id INTEGER,
    p_address_line TEXT    DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL,
    p_pincode VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF (p_address_id IS NULL OR p_address_id <= 0) THEN
        RAISE EXCEPTION 'INVALID_INPUT: Provide valid address_id';
    END IF;

    IF p_address_line IS NULL AND p_city IS NULL AND 
       p_state IS NULL AND p_pincode IS NULL THEN
        RAISE EXCEPTION 'NO_FIELDS_TO_UPDATE: At least one field must be provided';
    END IF;

    UPDATE public.addresses
    SET
        address_line = COALESCE(p_address_line, address_line),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        pincode = COALESCE(p_pincode, pincode),
        updated_at = NOW()
    WHERE address_id = p_address_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ADDRESS_NOT_FOUND: %', p_address_id;
    END IF;

    RETURN TRUE;

END;
$$;

CREATE OR REPLACE FUNCTION public.o_update_address_by_user_id(
    p_user_id UUID,
    p_address_line TEXT    DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL,
    p_pincode VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_INPUT: Provide valid user_id';
    END IF;

    IF p_address_line IS NULL AND p_city IS NULL AND 
       p_state IS NULL AND p_pincode IS NULL THEN
        RAISE EXCEPTION 'NO_FIELDS_TO_UPDATE: At least one field must be provided';
    END IF;

    UPDATE public.addresses
    SET
        address_line = COALESCE(p_address_line, address_line),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        pincode = COALESCE(p_pincode, pincode),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ADDRESS_NOT_FOUND: %', p_user_id;
    END IF;

    RETURN TRUE;

END;
$$;