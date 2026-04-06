CREATE OR REPLACE FUNCTION public.l_create_test_parameter(
    p_test_id          INTEGER,
    p_parameter_name   VARCHAR(255),
    p_unit             VARCHAR(50),
    p_normal_range     VARCHAR(100)
)
RETURNS public.test_parameters
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.test_parameters;
BEGIN
    IF TRIM(p_parameter_name) = '' THEN
        RAISE EXCEPTION 'parameter_name cannot be empty';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lab_tests WHERE test_id = p_test_id) THEN
        RAISE EXCEPTION 'test with id % does not exist', p_test_id;
    END IF;

    INSERT INTO public.test_parameters (test_id, parameter_name, unit, normal_range)
    VALUES (p_test_id, TRIM(p_parameter_name), TRIM(p_unit), TRIM(p_normal_range))
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_update_test_parameter(
    p_parameter_id     INTEGER,
    p_test_id          INTEGER DEFAULT NULL,
    p_parameter_name   VARCHAR(255) DEFAULT NULL,
    p_unit             VARCHAR(50) DEFAULT NULL,
    p_normal_range     VARCHAR(100) DEFAULT NULL
)
RETURNS public.test_parameters
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.test_parameters;
BEGIN
    SELECT * INTO v_row
    FROM public.test_parameters
    WHERE parameter_id = p_parameter_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test parameter with id % not found', p_parameter_id;
    END IF;

    UPDATE public.test_parameters
    SET
        test_id        = COALESCE(p_test_id, test_id),
        parameter_name = COALESCE(NULLIF(TRIM(p_parameter_name), ''), parameter_name),
        unit           = COALESCE(TRIM(p_unit), unit),
        normal_range   = COALESCE(TRIM(p_normal_range), normal_range)
    WHERE parameter_id = p_parameter_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_delete_test_parameter(
    p_parameter_id INTEGER
)
RETURNS public.test_parameters
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.test_parameters;
BEGIN
    SELECT * INTO v_row FROM public.test_parameters WHERE parameter_id = p_parameter_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test parameter with id % not found', p_parameter_id;
    END IF;

    DELETE FROM public.test_parameters WHERE parameter_id = p_parameter_id RETURNING * INTO v_row;
    RETURN v_row;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_get_test_parameter(
    p_parameter_id INTEGER
)
RETURNS TABLE (
    parameter_id   INTEGER,
    test_id        INTEGER,
    parameter_name VARCHAR(255),
    unit           VARCHAR(50),
    normal_range   VARCHAR(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT t.parameter_id, t.test_id, t.parameter_name, t.unit, t.normal_range
    FROM public.test_parameters t WHERE t.parameter_id = p_parameter_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_list_test_parameters(
    p_test_id INTEGER DEFAULT NULL,
    p_limit   INTEGER DEFAULT 20,
    p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
    parameter_id   INTEGER,
    test_id        INTEGER,
    test_name      VARCHAR(255),
    parameter_name VARCHAR(255),
    unit           VARCHAR(50),
    normal_range   VARCHAR(100),
    total_count    BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    p_limit  := GREATEST(1, LEAST(p_limit, 100));
    p_offset := GREATEST(0, p_offset);

    RETURN QUERY
    SELECT
        t.parameter_id,
        t.test_id,
        l.test_name,
        t.parameter_name,
        t.unit,
        t.normal_range,
        COUNT(*) OVER () AS total_count
    FROM public.test_parameters t
    JOIN public.lab_tests l ON l.test_id = t.test_id
    WHERE (p_test_id IS NULL OR t.test_id = p_test_id)
    ORDER BY t.parameter_id ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
