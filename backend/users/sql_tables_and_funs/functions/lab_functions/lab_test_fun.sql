-- =============================================================
--  lab_tests  ·  PL/pgSQL CRUD FUNCTIONS
-- =============================================================
--  Functions
--    1. l_create_lab_test      → INSERT
--    2. l_update_lab_test      → UPDATE (partial, only non-NULL params)
--    3. l_delete_lab_test      → soft-delete (is_active = false)
--    4. l_list_lab_tests       → SELECT (filtered + paginated)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. CREATE
-- ─────────────────────────────────────────────────────────────
-- Returns the full newly inserted row.
-- Raises exceptions on:
--   · blank test_name, test_code, or sample_type
--   · duplicate test_code (case-insensitive)
--   · invalid / inactive category_id
--   · negative price / turnaround_hours / fasting_hours
--   · fasting_hours provided when fasting_required = false
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_create_lab_test(
    p_test_code        VARCHAR(30),
    p_test_name        VARCHAR(255),
    p_sample_type      VARCHAR(50),
    p_category_id      INTEGER       DEFAULT NULL,
    p_description      TEXT          DEFAULT NULL,
    p_fasting_required BOOLEAN       DEFAULT FALSE,
    p_fasting_hours    INTEGER       DEFAULT NULL,
    p_price            NUMERIC(10,2) DEFAULT 0,
    p_turnaround_hours INTEGER       DEFAULT NULL,
    p_created_by       UUID          DEFAULT NULL
)
RETURNS public.lab_tests
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_tests;
BEGIN
    -- Blank field guards
    IF TRIM(p_test_code) = '' THEN
        RAISE EXCEPTION 'test_code cannot be empty'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF TRIM(p_test_name) = '' THEN
        RAISE EXCEPTION 'test_name cannot be empty'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF TRIM(p_sample_type) = '' THEN
        RAISE EXCEPTION 'sample_type cannot be empty'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
 
    -- Duplicate test_code check (case-insensitive)
    IF EXISTS (
        SELECT 1 FROM public.lab_tests
        WHERE LOWER(test_code) = LOWER(TRIM(p_test_code))
    ) THEN
        RAISE EXCEPTION 'A test with code "%" already exists', TRIM(p_test_code)
            USING ERRCODE = 'unique_violation';
    END IF;
 
    -- Category existence check
    IF p_category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.lab_test_categories
        WHERE category_id = p_category_id AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Category with id % does not exist or is inactive', p_category_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
 
    -- Numeric constraint guards
    IF p_price < 0 THEN
        RAISE EXCEPTION 'price cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_turnaround_hours IS NOT NULL AND p_turnaround_hours < 0 THEN
        RAISE EXCEPTION 'turnaround_hours cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    
    INSERT INTO public.lab_tests (
        category_id,
        test_code,
        test_name,
        description,
        sample_type,
        fasting_required,
        fasting_hours,
        price,
        turnaround_hours,
        is_active,
        -- FIX: store both created_by and updated_by
        created_by,
        updated_by,
        created_at,
        updated_at
    )
    VALUES (
        p_category_id,
        TRIM(p_test_code),
        TRIM(p_test_name),
        p_description,
        TRIM(p_sample_type),
        p_fasting_required,
        p_fasting_hours,
        p_price,
        p_turnaround_hours,
        TRUE,
        p_created_by,
        p_created_by,
        now(),
        now()
    )
    RETURNING * INTO v_row;
 
    RETURN v_row;
END;
$$;

/*
USAGE — minimal:
    SELECT * FROM public.l_create_lab_test(
        p_test_code   => 'CBC-001',
        p_test_name   => 'Complete Blood Count',
        p_sample_type => 'Blood'
    );

USAGE — full:
    SELECT * FROM public.l_create_lab_test(
        p_test_code        => 'LFT-001',
        p_test_name        => 'Liver Function Test',
        p_sample_type      => 'Blood',
        p_category_id      => 2,
        p_description      => 'Comprehensive liver enzyme panel',
        p_fasting_required => TRUE,
        p_fasting_hours    => 8,
        p_price            => 499.00,
        p_turnaround_hours => 6
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE
-- ─────────────────────────────────────────────────────────────
-- Only updates fields that are explicitly passed (non-NULL).
-- Exception: to explicitly clear fasting_hours pass p_clear_fasting_hours = TRUE.
-- Raises exceptions on:
--   · test not found
--   · duplicate test_code collision with another row
--   · invalid / inactive category_id
--   · negative numeric values
--   · fasting logic mismatch
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.l_update_lab_test(
    p_test_id              INTEGER,
    p_test_code            VARCHAR(30)   DEFAULT NULL,
    p_test_name            VARCHAR(255)  DEFAULT NULL,
    p_sample_type          VARCHAR(50)   DEFAULT NULL,
    p_category_id          INTEGER       DEFAULT NULL,
    p_description          TEXT          DEFAULT NULL,
    p_fasting_required     BOOLEAN       DEFAULT NULL,
    p_fasting_hours        INTEGER       DEFAULT NULL,
    p_clear_fasting_hours  BOOLEAN       DEFAULT FALSE,
    p_price                NUMERIC(10,2) DEFAULT NULL,
    p_turnaround_hours     INTEGER       DEFAULT NULL,
    p_is_active            BOOLEAN       DEFAULT NULL
)
RETURNS public.lab_tests
LANGUAGE plpgsql
AS $$
DECLARE
    v_row              public.lab_tests;
    v_fasting_hours    INTEGER;   -- FIX: now properly assigned below
BEGIN
    -- Existence check
    SELECT * INTO v_row FROM public.lab_tests WHERE test_id = p_test_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lab test with id % not found', p_test_id
            USING ERRCODE = 'no_data_found';
    END IF;
 
    -- Duplicate test_code check
    IF p_test_code IS NOT NULL
       AND TRIM(p_test_code) <> ''
       AND LOWER(TRIM(p_test_code)) <> LOWER(v_row.test_code)
    THEN
        IF EXISTS (
            SELECT 1 FROM public.lab_tests
            WHERE LOWER(test_code) = LOWER(TRIM(p_test_code))
              AND test_id <> p_test_id
        ) THEN
            RAISE EXCEPTION 'A test with code "%" already exists', TRIM(p_test_code)
                USING ERRCODE = 'unique_violation';
        END IF;
    END IF;
 
    -- Category existence check
    IF p_category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.lab_test_categories
        WHERE category_id = p_category_id AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Category with id % does not exist or is inactive', p_category_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
 
    -- Numeric constraint guards
    IF p_price IS NOT NULL AND p_price < 0 THEN
        RAISE EXCEPTION 'price cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_turnaround_hours IS NOT NULL AND p_turnaround_hours < 0 THEN
        RAISE EXCEPTION 'turnaround_hours cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_fasting_hours IS NOT NULL AND p_fasting_hours < 0 THEN
        RAISE EXCEPTION 'fasting_hours cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
 
    -- FIX: compute v_fasting_hours before the UPDATE
    --   Priority: explicit clear > new value provided > keep existing value
    IF p_clear_fasting_hours THEN
        v_fasting_hours := NULL;
    ELSIF p_fasting_required = FALSE THEN
        -- Turning fasting off implicitly clears the hours
        v_fasting_hours := NULL;
    ELSIF p_fasting_hours IS NOT NULL THEN
        v_fasting_hours := p_fasting_hours;
    ELSE
        -- No change — preserve the existing value
        v_fasting_hours := v_row.fasting_hours;
    END IF;
 
    UPDATE public.lab_tests
    SET
        test_code        = COALESCE(NULLIF(TRIM(p_test_code),    ''), test_code),
        test_name        = COALESCE(NULLIF(TRIM(p_test_name),    ''), test_name),
        sample_type      = COALESCE(NULLIF(TRIM(p_sample_type),  ''), sample_type),
        category_id      = COALESCE(p_category_id,      category_id),
        description      = COALESCE(p_description,      description),
        fasting_required = COALESCE(p_fasting_required, fasting_required),
        fasting_hours    = v_fasting_hours,   -- FIX: now correctly set
        price            = COALESCE(p_price,            price),
        turnaround_hours = COALESCE(p_turnaround_hours, turnaround_hours),
        is_active        = COALESCE(p_is_active,        is_active),
        updated_at       = now()
    WHERE test_id = p_test_id
    RETURNING * INTO v_row;
 
    RETURN v_row;
END;
$$;

/*
USAGE — update price only:
    SELECT * FROM public.l_update_lab_test(
        p_test_id => 1,
        p_price   => 599.00
    );

USAGE — disable fasting requirement and clear fasting_hours:
    SELECT * FROM public.l_update_lab_test(
        p_test_id             => 1,
        p_fasting_required    => FALSE,
        p_clear_fasting_hours => TRUE
    );

USAGE — update multiple fields:
    SELECT * FROM public.l_update_lab_test(
        p_test_id          => 1,
        p_test_name        => 'Complete Blood Count (CBC)',
        p_turnaround_hours => 4,
        p_price            => 349.00
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 3. SOFT DELETE
-- ─────────────────────────────────────────────────────────────
-- Sets is_active = FALSE. Does NOT remove the row.
-- Raises exceptions if:
--   · test does not exist
--   · test is already inactive
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_delete_lab_test(
    p_test_id INTEGER,
    p_user_id uuid
)
RETURNS public.lab_tests
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_tests;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_tests
    WHERE test_id = p_test_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lab test with id % not found', p_test_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT v_row.is_active THEN
        RAISE EXCEPTION 'Lab test with id % is already inactive', p_test_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.lab_tests
    SET
        is_active  = FALSE,
        updated_by = p_user_id,
        updated_at = now()
    WHERE test_id = p_test_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_delete_lab_test(1);
*/


-- ─────────────────────────────────────────────────────────────
-- 4. LIST
-- ─────────────────────────────────────────────────────────────
-- Returns a paginated, optionally filtered result set.
--
-- Filters
--   p_search           ILIKE match on test_code, test_name, description
--   p_category_id      filter by a specific category
--   p_sample_type      case-insensitive exact match
--   p_fasting_required filter tests that require fasting
--   p_is_active        NULL = all rows | TRUE = active (default) | FALSE = inactive
--   p_price_min        minimum price (inclusive)
--   p_price_max        maximum price (inclusive)
--
-- Pagination
--   p_limit            page size  (default 20, max 100)
--   p_offset           page start (default 0)
--
-- Result includes category_name (JOIN) and total_count (window function).
-- ─────────────────────────────────────────────────────────────

-- CREATE OR REPLACE FUNCTION public.l_list_lab_tests(
--     p_search           TEXT          DEFAULT NULL,
--     p_category_id      INTEGER       DEFAULT NULL,
--     p_sample_type      VARCHAR(50)   DEFAULT NULL,
--     p_fasting_required BOOLEAN       DEFAULT NULL,
--     p_is_active        BOOLEAN       DEFAULT TRUE,
--     p_price_min        NUMERIC(10,2) DEFAULT NULL,
--     p_price_max        NUMERIC(10,2) DEFAULT NULL,
--     p_limit            INTEGER       DEFAULT 20,
--     p_offset           INTEGER       DEFAULT 0
-- )
-- RETURNS TABLE (
--     test_id          INTEGER,
--     category_id      INTEGER,
--     category_name    VARCHAR(100),
--     test_code        VARCHAR(30),
--     test_name        VARCHAR(255),
--     description      TEXT,
--     sample_type      VARCHAR(50),
--     fasting_required BOOLEAN,
--     fasting_hours    INTEGER,
--     price            NUMERIC(10,2),
--     turnaround_hours INTEGER,
--     is_active        BOOLEAN,
--     created_at       TIMESTAMPTZ,
--     updated_at       TIMESTAMPTZ,
--     total_count      BIGINT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     -- Clamp limit and offset to sane values
--     p_limit  := GREATEST(1, LEAST(p_limit, 100));
--     p_offset := GREATEST(0, p_offset);

--     -- Price range guard
--     IF p_price_min IS NOT NULL AND p_price_max IS NOT NULL
--        AND p_price_min > p_price_max THEN
--         RAISE EXCEPTION 'p_price_min (%) cannot be greater than p_price_max (%)',
--             p_price_min, p_price_max
--             USING ERRCODE = 'invalid_parameter_value';
--     END IF;

--     RETURN QUERY
--     SELECT
--         t.test_id,
--         t.category_id,
--         c.category_name,
--         t.test_code,
--         t.test_name,
--         t.description,
--         t.sample_type,
--         t.fasting_required,
--         t.fasting_hours,
--         t.price,
--         t.turnaround_hours,
--         t.is_active,
--         t.created_at,
--         t.updated_at,
--         COUNT(*) OVER () AS total_count
--     FROM public.lab_tests t
--     LEFT JOIN public.lab_test_categories c USING (category_id)
--     WHERE
--         (p_is_active        IS NULL OR t.is_active            = p_is_active)
--         AND (p_category_id  IS NULL OR t.category_id          = p_category_id)
--         AND (p_fasting_required IS NULL OR t.fasting_required = p_fasting_required)
--         AND (p_sample_type  IS NULL OR LOWER(t.sample_type)   = LOWER(TRIM(p_sample_type)))
--         AND (p_price_min    IS NULL OR t.price                >= p_price_min)
--         AND (p_price_max    IS NULL OR t.price                <= p_price_max)
--         AND (
--             p_search IS NULL
--             OR t.test_code   ILIKE '%' || TRIM(p_search) || '%'
--             OR t.test_name   ILIKE '%' || TRIM(p_search) || '%'
--             OR t.description ILIKE '%' || TRIM(p_search) || '%'
--         )
--     ORDER BY t.created_at DESC
--     LIMIT  p_limit
--     OFFSET p_offset;
-- END;
-- $$;


drop function l_list_lab_tests;
CREATE OR REPLACE FUNCTION public.l_list_lab_tests(
    p_created_by uuid DEFAULT NULL
)
RETURNS TABLE (
    test_id          INTEGER,
    category_id      INTEGER,
    category_name    VARCHAR(100),
    test_code        VARCHAR(30),
    test_name        VARCHAR(255),
    description      TEXT,
    sample_type      VARCHAR(50),
    fasting_required BOOLEAN,
    fasting_hours    INTEGER,
    price            NUMERIC(10,2),
    turnaround_hours INTEGER,
    is_active        BOOLEAN,
    created_at       TIMESTAMPTZ,
    created_by       uuid,
    created_by_name  VARCHAR(255),
    updated_at       TIMESTAMPTZ,
    updated_by       uuid,
    total_count      BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.test_id,
        t.category_id,
        c.category_name,
        t.test_code,
        t.test_name,
        t.description,
        t.sample_type,
        t.fasting_required,
        t.fasting_hours,
        t.price,
        t.turnaround_hours,
        t.is_active,
        t.created_at,
        t.created_by,
        l.lab_name AS created_by_name,
        t.updated_at,
        t.updated_by,
        COUNT(*) OVER () AS total_count
    FROM public.lab_tests t
    LEFT JOIN public.lab_test_categories c 
        ON t.category_id = c.category_id
    LEFT JOIN public.labs l 
        ON t.created_by = l.lab_id
    WHERE 
        (p_created_by IS NULL OR t.created_by = p_created_by)
    ORDER BY t.created_at DESC;
END;
$$;

select * from l_list_lab_tests();




CREATE OR REPLACE FUNCTION public.l_get_lab_test_by_filter(
    p_search TEXT DEFAULT NULL,
    p_category_id INTEGER DEFAULT NULL,
    p_lab_id UUID DEFAULT NULL
)
RETURNS TABLE (
    test_id          INTEGER,
    category_id      INTEGER,
    category_name    VARCHAR(100),
    test_code        VARCHAR(30),
    test_name        VARCHAR(255),
    description      TEXT,
    sample_type      VARCHAR(50),
    fasting_required BOOLEAN,
    fasting_hours    INTEGER,
    price            NUMERIC(10,2),
    turnaround_hours INTEGER,
    is_active        BOOLEAN,
    created_at       TIMESTAMPTZ,
    created_by       UUID,
    created_by_name  VARCHAR(255),
    updated_at       TIMESTAMPTZ,
    updated_by       UUID,
    total_count      BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.test_id,
        t.category_id,
        c.category_name,
        t.test_code,
        t.test_name,
        t.description,
        t.sample_type,
        t.fasting_required,
        t.fasting_hours,
        t.price,
        t.turnaround_hours,
        t.is_active,
        t.created_at,
        t.created_by,
        l.lab_name AS created_by_name,
        t.updated_at,
        t.updated_by,
        COUNT(*) OVER () AS total_count
    FROM public.lab_tests t
    LEFT JOIN public.lab_test_categories c 
        ON t.category_id = c.category_id
    LEFT JOIN public.labs l 
        ON t.created_by = l.lab_id
    WHERE
        -- Search filter
        (
            p_search IS NULL 
            OR t.test_name ILIKE '%' || p_search || '%'
            OR t.test_code ILIKE '%' || p_search || '%'
        )
        
        -- Category filter
        AND (
            p_category_id IS NULL 
            OR t.category_id = p_category_id
        )

        -- Lab filter
        AND (
            p_lab_id IS NULL 
            OR t.created_by = p_lab_id
        )

    ORDER BY t.created_at DESC;
END;
$$;


/*
USAGE — active tests, first page:
    SELECT * FROM public.l_list_lab_tests();

USAGE — search by keyword across all statuses:
    SELECT * FROM public.l_list_lab_tests(
        p_search    => 'blood',
        p_is_active => NULL
    );

USAGE — filter by category and fasting:
    SELECT * FROM public.l_list_lab_tests(
        p_category_id      => 2,
        p_fasting_required => TRUE
    );

USAGE — price range with pagination:
    SELECT * FROM public.l_list_lab_tests(
        p_price_min => 100.00,
        p_price_max => 500.00,
        p_limit     => 10,
        p_offset    => 0
    );

USAGE — urine tests only:
    SELECT * FROM public.l_list_lab_tests(
        p_sample_type => 'Urine'
    );
*/
CREATE OR REPLACE FUNCTION public.l_get_test_parameters(
    p_test_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    parameter_id   INTEGER,
    parameter_name VARCHAR(255),
    unit           VARCHAR(50),
    normal_range   VARCHAR(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.parameter_id,
        t.parameter_name,
        t.unit,
        t.normal_range
    FROM public.test_parameters t
    WHERE t.test_id = p_test_id
    ORDER BY t.parameter_id ASC;
END;
$$;



CREATE OR REPLACE FUNCTION public.l_get_lab_test_detail(p_test_id INTEGER)
RETURNS TABLE (
    test_id          INTEGER,
    category_id      INTEGER,
    category_name    VARCHAR(100),
    test_code        VARCHAR(30),
    test_name        VARCHAR(255),
    description      TEXT,
    sample_type      VARCHAR(50),
    fasting_required BOOLEAN,
    fasting_hours    INTEGER,
    price            NUMERIC(10,2),
    turnaround_hours INTEGER,
    is_active        BOOLEAN,
    created_at       TIMESTAMPTZ,
    created_by       UUID,
    created_by_name  VARCHAR(255),
    updated_at       TIMESTAMPTZ,
    updated_by       UUID
)
LANGUAGE sql STABLE AS $$
    SELECT
        t.test_id,
        t.category_id,
        c.category_name,
        t.test_code,
        t.test_name,
        t.description,
        t.sample_type,
        t.fasting_required,
        t.fasting_hours,
        t.price,
        t.turnaround_hours,
        t.is_active,
        t.created_at,
        t.created_by,
        l.lab_name  AS created_by_name,
        t.updated_at,
        t.updated_by
    FROM public.lab_tests t
    LEFT JOIN public.lab_test_categories c ON c.category_id = t.category_id
    LEFT JOIN public.labs               l ON l.lab_id       = t.created_by
    WHERE t.test_id = p_test_id;
$$;
