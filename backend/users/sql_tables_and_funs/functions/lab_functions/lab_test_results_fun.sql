-- =============================================================
--  lab_test_results  ·  PL/pgSQL CRUD FUNCTIONS
-- =============================================================
--  1. l_lab_test_results_insert
--  2. l_lab_test_results_update
--  3. l_lab_test_results_delete      → hard delete
--                                       (no status/is_active column on this table;
--                                        row is physically removed and item result_status
--                                        is rolled back to 'PENDING')
--  4. l_lab_test_results_select      → single row by result_id
--  5. l_lab_test_results_select_all  → all results for a given order_id
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. INSERT
-- ─────────────────────────────────────────────────────────────
-- One result per order item (item_id is UNIQUE).
-- Also updates lab_test_order_items.result_status → 'AVAILABLE'.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_results_insert(
    p_item_id        INTEGER,
    p_result_value   TEXT,
    p_reported_by_id UUID,
    p_result_flag    VARCHAR(20)  DEFAULT NULL,
    p_result_notes   TEXT         DEFAULT NULL,
    p_report_file    VARCHAR(255) DEFAULT NULL
)
RETURNS public.lab_test_results
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_results;
BEGIN
    -- Guard: result_value must not be blank
    IF TRIM(p_result_value) = '' THEN
        RAISE EXCEPTION 'result_value cannot be empty'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Guard: item must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_test_order_items WHERE item_id = p_item_id
    ) THEN
        RAISE EXCEPTION 'Order item with id % not found', p_item_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: result already exists for this item
    IF EXISTS (
        SELECT 1 FROM public.lab_test_results WHERE item_id = p_item_id
    ) THEN
        RAISE EXCEPTION 'A result already exists for order item id %. Use update instead.', p_item_id
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Guard: reporter must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE user_id = p_reported_by_id
    ) THEN
        RAISE EXCEPTION 'Reported-by user with id % not found', p_reported_by_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: result_flag value
    IF p_result_flag IS NOT NULL
       AND p_result_flag NOT IN ('NORMAL', 'HIGH', 'LOW', 'CRITICAL')
    THEN
        RAISE EXCEPTION 'Invalid result_flag "%". Allowed: NORMAL, HIGH, LOW, CRITICAL', p_result_flag
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    INSERT INTO public.lab_test_results (
        item_id,
        result_value,
        result_flag,
        result_notes,
        report_file,
        reported_by_id,
        verified_by_id,
        reported_at,
        verified_at,
        created_at,
        updated_at
    )
    VALUES (
        p_item_id,
        TRIM(p_result_value),
        p_result_flag,
        p_result_notes,
        p_report_file,
        p_reported_by_id,
        NULL,
        now(),
        NULL,
        now(),
        now()
    )
    RETURNING * INTO v_row;

    -- Sync: mark the order item as AVAILABLE
    UPDATE public.lab_test_order_items
    SET result_status = 'AVAILABLE', updated_at = now()
    WHERE item_id = p_item_id;

    RETURN v_row;
END;
$$;

/*
USAGE — minimal:
    SELECT * FROM public.l_lab_test_results_insert(
        p_item_id        => 1,
        p_result_value   => '13.5 g/dL',
        p_reported_by_id => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );

USAGE — full:
    SELECT * FROM public.l_lab_test_results_insert(
        p_item_id        => 1,
        p_result_value   => '13.5 g/dL',
        p_reported_by_id => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_result_flag    => 'NORMAL',
        p_result_notes   => 'Within expected range for age group',
        p_report_file    => 'reports/order-123/haemoglobin.pdf'
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE
-- ─────────────────────────────────────────────────────────────
-- Two kinds of update in one function:
--   a) Correction  — lab staff updates result_value, flag, notes, file
--   b) Verification — pass p_verified_by_id to stamp verified_by_id + verified_at
--
-- Once verified, result_value / result_flag cannot be changed.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_results_update(
    p_result_id      INTEGER,
    p_result_value   TEXT         DEFAULT NULL,
    p_result_flag    VARCHAR(20)  DEFAULT NULL,
    p_result_notes   TEXT         DEFAULT NULL,
    p_report_file    VARCHAR(255) DEFAULT NULL,
    p_verified_by_id UUID         DEFAULT NULL   -- pass to verify the result
)
RETURNS public.lab_test_results
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_results;
BEGIN
    -- Guard: result must exist
    SELECT * INTO v_row
    FROM public.lab_test_results
    WHERE result_id = p_result_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Result with id % not found', p_result_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- Guard: cannot correct a verified result
    IF v_row.verified_at IS NOT NULL
       AND (p_result_value IS NOT NULL OR p_result_flag IS NOT NULL)
    THEN
        RAISE EXCEPTION 'Cannot modify result_value or result_flag after verification'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Guard: result_flag value
    IF p_result_flag IS NOT NULL
       AND p_result_flag NOT IN ('NORMAL', 'HIGH', 'LOW', 'CRITICAL')
    THEN
        RAISE EXCEPTION 'Invalid result_flag "%". Allowed: NORMAL, HIGH, LOW, CRITICAL', p_result_flag
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Guard: verifier must exist
    IF p_verified_by_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.users WHERE user_id = p_verified_by_id
    ) THEN
        RAISE EXCEPTION 'Verified-by user with id % not found', p_verified_by_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: already verified
    IF p_verified_by_id IS NOT NULL AND v_row.verified_at IS NOT NULL THEN
        RAISE EXCEPTION 'Result with id % is already verified', p_result_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.lab_test_results
    SET
        result_value   = COALESCE(NULLIF(TRIM(p_result_value), ''), result_value),
        result_flag    = COALESCE(p_result_flag,    result_flag),
        result_notes   = COALESCE(p_result_notes,   result_notes),
        report_file    = COALESCE(p_report_file,    report_file),
        verified_by_id = COALESCE(p_verified_by_id, verified_by_id),
        verified_at    = CASE
                           WHEN p_verified_by_id IS NOT NULL THEN now()
                           ELSE verified_at
                         END,
        updated_at     = now()
    WHERE result_id = p_result_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE — correct result value before verification:
    SELECT * FROM public.l_lab_test_results_update(
        p_result_id    => 1,
        p_result_value => '14.2 g/dL',
        p_result_flag  => 'NORMAL'
    );

USAGE — verify a result:
    SELECT * FROM public.l_lab_test_results_update(
        p_result_id      => 1,
        p_verified_by_id => 'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );

USAGE — attach report file:
    SELECT * FROM public.l_lab_test_results_update(
        p_result_id   => 1,
        p_report_file => 'reports/order-123/haemoglobin-v2.pdf'
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 3. DELETE  (hard delete)
-- ─────────────────────────────────────────────────────────────
-- lab_test_results has no is_active or status column,
-- so this is a physical delete.
-- Also rolls back lab_test_order_items.result_status → 'PENDING'.
-- Blocked if result is already verified.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_results_delete(
    p_result_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_results;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_test_results
    WHERE result_id = p_result_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Result with id % not found', p_result_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- Guard: cannot delete a verified result
    IF v_row.verified_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot delete a verified result (result_id: %)', p_result_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    DELETE FROM public.lab_test_results
    WHERE result_id = p_result_id;

    -- Rollback: reset the order item status back to PENDING
    UPDATE public.lab_test_order_items
    SET result_status = 'PENDING', updated_at = now()
    WHERE item_id = v_row.item_id;
END;
$$;

/*
USAGE:
    SELECT public.l_lab_test_results_delete(1);
*/


-- ─────────────────────────────────────────────────────────────
-- 4. SELECT  (single row by result_id)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_results_select(
    p_result_id INTEGER
)
RETURNS TABLE (
    result_id       INTEGER,
    item_id         INTEGER,
    test_code       VARCHAR(30),
    test_name       VARCHAR(255),
    result_value    TEXT,
    result_flag     VARCHAR(20),
    result_notes    TEXT,
    report_file     VARCHAR(255),
    reported_by_id  UUID,
    reported_by     TEXT,
    verified_by_id  UUID,
    verified_by     TEXT,
    is_verified     BOOLEAN,
    reported_at     TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.result_id,
        r.item_id,
        t.test_code,
        t.test_name,
        r.result_value,
        r.result_flag,
        r.result_notes,
        r.report_file,
        r.reported_by_id,
        (ru.full_name)::TEXT                    AS reported_by,
        r.verified_by_id,
        (vu.full_name)::TEXT                    AS verified_by,
        (r.verified_at IS NOT NULL)             AS is_verified,
        r.reported_at,
        r.verified_at,
        r.created_at,
        r.updated_at
    FROM public.lab_test_results r
    JOIN public.lab_test_order_items i  ON i.item_id   = r.item_id
    JOIN public.lab_tests t             ON t.test_id   = i.test_id
    LEFT JOIN public.users ru           ON ru.user_id  = r.reported_by_id
    LEFT JOIN public.users vu           ON vu.user_id  = r.verified_by_id
    WHERE r.result_id = p_result_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Result with id % not found', p_result_id
            USING ERRCODE = 'no_data_found';
    END IF;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_results_select(1);
*/


-- ─────────────────────────────────────────────────────────────
-- 5. SELECT ALL  (all results for a given order_id)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_results_select_all(
    p_order_id UUID
)
RETURNS TABLE (
    result_id       INTEGER,
    item_id         INTEGER,
    test_code       VARCHAR(30),
    test_name       VARCHAR(255),
    result_value    TEXT,
    result_flag     VARCHAR(20),
    result_notes    TEXT,
    report_file     VARCHAR(255),
    reported_by_id  UUID,
    reported_by     TEXT,
    verified_by_id  UUID,
    verified_by     TEXT,
    is_verified     BOOLEAN,
    reported_at     TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: order must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_test_orders WHERE order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        r.result_id,
        r.item_id,
        t.test_code,
        t.test_name,
        r.result_value,
        r.result_flag,
        r.result_notes,
        r.report_file,
        r.reported_by_id,
        (ru.full_name)::TEXT                    AS reported_by,
        r.verified_by_id,
        (vu.full_name)::TEXT                    AS verified_by,
        (r.verified_at IS NOT NULL)             AS is_verified,
        r.reported_at,
        r.verified_at,
        r.created_at,
        r.updated_at
    FROM public.lab_test_results r
    JOIN public.lab_test_order_items i  ON i.item_id   = r.item_id
    JOIN public.lab_tests t             ON t.test_id   = i.test_id
    LEFT JOIN public.users ru           ON ru.user_id  = r.reported_by_id
    LEFT JOIN public.users vu           ON vu.user_id  = r.verified_by_id
    WHERE i.order_id = p_order_id
    ORDER BY r.reported_at ASC;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_results_select_all(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/