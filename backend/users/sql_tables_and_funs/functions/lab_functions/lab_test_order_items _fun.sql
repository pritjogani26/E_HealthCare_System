-- =============================================================
--  lab_test_order_items  ·  PL/pgSQL CRUD FUNCTIONS
-- =============================================================
--  1. l_lab_test_order_items_insert
--  2. l_lab_test_order_items_update
--  3. l_lab_test_order_items_delete    → soft-delete (result_status = 'CANCELLED')
--  4. l_lab_test_order_items_select    → single row by item_id
--  5. l_lab_test_order_items_select_all → all rows for an order_id
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. INSERT
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_order_items_insert(
    p_order_id        UUID,
    p_test_id         INTEGER,
    p_price_at_order  NUMERIC(10,2),
    p_discount_amount NUMERIC(10,2) DEFAULT 0
)
RETURNS public.lab_test_order_items
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_order_items;
BEGIN
    -- Guard: order must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_test_orders WHERE order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: test must exist and be active
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_tests WHERE test_id = p_test_id AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Lab test with id % not found or inactive', p_test_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: duplicate (order_id, test_id)
    IF EXISTS (
        SELECT 1 FROM public.lab_test_order_items
        WHERE order_id = p_order_id AND test_id = p_test_id
    ) THEN
        RAISE EXCEPTION 'Test id % is already added to order %', p_test_id, p_order_id
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Guard: numeric constraints
    IF p_price_at_order < 0 THEN
        RAISE EXCEPTION 'price_at_order cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF p_discount_amount < 0 THEN
        RAISE EXCEPTION 'discount_amount cannot be negative'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF p_discount_amount > p_price_at_order THEN
        RAISE EXCEPTION 'discount_amount (%) cannot exceed price_at_order (%)',
            p_discount_amount, p_price_at_order
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    INSERT INTO public.lab_test_order_items (
        order_id,
        test_id,
        price_at_order,
        discount_amount,
        result_status,
        created_at,
        updated_at
    )
    VALUES (
        p_order_id,
        p_test_id,
        p_price_at_order,
        p_discount_amount,
        'PENDING',
        now(),
        now()
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_order_items_insert(
        p_order_id       => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_test_id        => 3,
        p_price_at_order => 499.00,
        p_discount_amount => 50.00
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE
-- ─────────────────────────────────────────────────────────────
-- Updatable fields: price_at_order, discount_amount, result_status.
-- order_id and test_id are intentionally NOT updatable.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_order_items_update(
    p_item_id         INTEGER,
    p_price_at_order  NUMERIC(10,2) DEFAULT NULL,
    p_discount_amount NUMERIC(10,2) DEFAULT NULL,
    p_result_status   VARCHAR(20)   DEFAULT NULL
)
RETURNS public.lab_test_order_items
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_order_items;
BEGIN
    -- Guard: item must exist
    SELECT * INTO v_row
    FROM public.lab_test_order_items
    WHERE item_id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item with id % not found', p_item_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- Guard: result_status value
    IF p_result_status IS NOT NULL
       AND p_result_status NOT IN ('PENDING', 'PARTIAL', 'AVAILABLE') THEN
        RAISE EXCEPTION 'Invalid result_status "%". Allowed: PENDING, PARTIAL, AVAILABLE', p_result_status
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Guard: numeric constraints (resolve final values first)
    DECLARE
        v_price    NUMERIC(10,2) := COALESCE(p_price_at_order,  v_row.price_at_order);
        v_discount NUMERIC(10,2) := COALESCE(p_discount_amount, v_row.discount_amount);
    BEGIN
        IF v_price < 0 THEN
            RAISE EXCEPTION 'price_at_order cannot be negative'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF v_discount < 0 THEN
            RAISE EXCEPTION 'discount_amount cannot be negative'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF v_discount > v_price THEN
            RAISE EXCEPTION 'discount_amount (%) cannot exceed price_at_order (%)',
                v_discount, v_price
                USING ERRCODE = 'invalid_parameter_value';
        END IF;
    END;

    UPDATE public.lab_test_order_items
    SET
        price_at_order  = COALESCE(p_price_at_order,  price_at_order),
        discount_amount = COALESCE(p_discount_amount, discount_amount),
        result_status   = COALESCE(p_result_status,   result_status),
        updated_at      = now()
    WHERE item_id = p_item_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE — update result status only:
    SELECT * FROM public.l_lab_test_order_items_update(
        p_item_id       => 1,
        p_result_status => 'AVAILABLE'
    );

USAGE — update price and discount:
    SELECT * FROM public.l_lab_test_order_items_update(
        p_item_id         => 1,
        p_price_at_order  => 450.00,
        p_discount_amount => 25.00
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 3. DELETE  (soft — result_status = 'CANCELLED')
-- ─────────────────────────────────────────────────────────────
-- lab_test_order_items has no is_active column, so soft-delete
-- is represented as result_status = 'CANCELLED'.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_order_items_delete(
    p_item_id INTEGER
)
RETURNS public.lab_test_order_items
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_order_items;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_test_order_items
    WHERE item_id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item with id % not found', p_item_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_row.result_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Order item with id % is already cancelled', p_item_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.lab_test_order_items
    SET
        result_status = 'CANCELLED',
        updated_at    = now()
    WHERE item_id = p_item_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_order_items_delete(1);
*/


-- ─────────────────────────────────────────────────────────────
-- 4. SELECT  (single row by item_id)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_order_items_select(
    p_item_id INTEGER
)
RETURNS TABLE (
    item_id         INTEGER,
    order_id        UUID,
    test_id         INTEGER,
    test_code       VARCHAR(30),
    test_name       VARCHAR(255),
    sample_type     VARCHAR(50),
    price_at_order  NUMERIC(10,2),
    discount_amount NUMERIC(10,2),
    net_amount      NUMERIC(10,2),
    result_status   VARCHAR(20),
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.item_id,
        i.order_id,
        i.test_id,
        t.test_code,
        t.test_name,
        t.sample_type,
        i.price_at_order,
        i.discount_amount,
        (i.price_at_order - i.discount_amount) AS net_amount,
        i.result_status,
        i.created_at,
        i.updated_at
    FROM public.lab_test_order_items i
    JOIN public.lab_tests t USING (test_id)
    WHERE i.item_id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item with id % not found', p_item_id
            USING ERRCODE = 'no_data_found';
    END IF;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_order_items_select(1);
*/


-- ─────────────────────────────────────────────────────────────
-- 5. SELECT ALL  (all items for a given order_id)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_order_items_select_all(
    p_order_id UUID
)
RETURNS TABLE (
    item_id         INTEGER,
    order_id        UUID,
    test_id         INTEGER,
    test_code       VARCHAR(30),
    test_name       VARCHAR(255),
    sample_type     VARCHAR(50),
    price_at_order  NUMERIC(10,2),
    discount_amount NUMERIC(10,2),
    net_amount      NUMERIC(10,2),
    result_status   VARCHAR(20),
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
        i.item_id,
        i.order_id,
        i.test_id,
        t.test_code,
        t.test_name,
        t.sample_type,
        i.price_at_order,
        i.discount_amount,
        (i.price_at_order - i.discount_amount) AS net_amount,
        i.result_status,
        i.created_at,
        i.updated_at
    FROM public.lab_test_order_items i
    JOIN public.lab_tests t USING (test_id)
    WHERE i.order_id = p_order_id
    ORDER BY i.created_at ASC;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_order_items_select_all(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/