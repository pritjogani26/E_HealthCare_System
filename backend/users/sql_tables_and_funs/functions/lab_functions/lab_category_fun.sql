create or replace function public.l_get_lab_test_category(
    p_category_id int
)
RETURNS TABLE (
    category_id   INTEGER,
    category_name VARCHAR(100),
    description   TEXT,
    is_active     BOOLEAN,
    created_by    UUID,
    created_at    TIMESTAMPTZ,
    updated_by    UUID,
    updated_at    TIMESTAMPTZ,
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.category_id,
        c.category_name,
        c.description,
        c.is_active,
        c.created_by,
        c.created_at,
        c.updated_by,
        c.updated_at
    FROM public.lab_test_categories c
    WHERE c.category_id = p_category_id;
END;
$$;





CREATE OR REPLACE FUNCTION public.l_create_lab_test_category(
    p_category_name   VARCHAR(100),
    p_description     TEXT,
    p_created_by      UUID
)
RETURNS public.lab_test_categories
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_categories;
BEGIN
    IF TRIM(p_category_name) = '' THEN
        RAISE EXCEPTION 'category_name cannot be empty'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.lab_test_categories
        WHERE LOWER(category_name) = LOWER(TRIM(p_category_name))
    ) THEN
        RAISE EXCEPTION 'A category with name "%" already exists', TRIM(p_category_name)
            USING ERRCODE = 'unique_violation';
    END IF;

    INSERT INTO public.lab_test_categories (
        category_name,
        description,
        is_active,
        created_by,
        created_at,
        updated_by,
        updated_at
    )
    VALUES (
        TRIM(p_category_name),
        p_description,
        TRUE,
        p_created_by,
        now(),
        p_created_by,
        now()
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_update_lab_test_category(
    p_category_id     INTEGER,
    p_updated_by      UUID,
    p_category_name   VARCHAR(100) DEFAULT NULL,
    p_description     TEXT         DEFAULT NULL,
    p_is_active       BOOLEAN      DEFAULT NULL
)
RETURNS public.lab_test_categories
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_categories;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_test_categories
    WHERE category_id = p_category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Category with id % not found', p_category_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF p_category_name IS NOT NULL
       AND TRIM(p_category_name) <> ''
       AND LOWER(TRIM(p_category_name)) <> LOWER(v_row.category_name)
    THEN
        IF EXISTS (
            SELECT 1
            FROM public.lab_test_categories
            WHERE LOWER(category_name) = LOWER(TRIM(p_category_name))
              AND category_id <> p_category_id
        ) THEN
            RAISE EXCEPTION 'A category with name "%" already exists', TRIM(p_category_name)
                USING ERRCODE = 'unique_violation';
        END IF;
    END IF;

    UPDATE public.lab_test_categories
    SET
        category_name = COALESCE(NULLIF(TRIM(p_category_name), ''), category_name),
        description   = COALESCE(p_description, description),
        is_active     = COALESCE(p_is_active,   is_active),
        updated_by    = p_updated_by,
        updated_at    = now()
    WHERE category_id = p_category_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;


CREATE OR REPLACE FUNCTION public.l_delete_lab_test_category(
    p_category_id INTEGER,
    p_deleted_by  UUID
)
RETURNS public.lab_test_categories
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_categories;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_test_categories
    WHERE category_id = p_category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Category with id % not found', p_category_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT v_row.is_active THEN
        RAISE EXCEPTION 'Category with id % is already inactive', p_category_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.lab_test_categories
    SET
        is_active  = FALSE,
        updated_by = p_deleted_by,
        updated_at = now()
    WHERE category_id = p_category_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.l_list_lab_test_categories(
    p_search    TEXT    DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_limit     INTEGER DEFAULT 20,
    p_offset    INTEGER DEFAULT 0
)
RETURNS TABLE (
    category_id   INTEGER,
    category_name VARCHAR(100),
    description   TEXT,
    is_active     BOOLEAN,
    created_by    UUID,
    created_at    TIMESTAMPTZ,
    updated_by    UUID,
    updated_at    TIMESTAMPTZ,
    total_count   BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    p_limit  := GREATEST(1, LEAST(p_limit, 100));
    p_offset := GREATEST(0, p_offset);

    RETURN QUERY
    SELECT
        c.category_id,
        c.category_name,
        c.description,
        c.is_active,
        c.created_by,
        c.created_at,
        c.updated_by,
        c.updated_at,
        COUNT(*) OVER () AS total_count
    FROM public.lab_test_categories c
    WHERE
        (p_is_active IS NULL OR c.is_active = p_is_active)
        AND (
            p_search IS NULL
            OR c.category_name ILIKE '%' || TRIM(p_search) || '%'
            OR c.description   ILIKE '%' || TRIM(p_search) || '%'
        )
    ORDER BY c.created_at DESC
    LIMIT  p_limit
    OFFSET p_offset;
END;
$$;