-- =============================================================
--  LAB MODULE  ·  SUPPORTING / REPORTING FUNCTIONS
-- =============================================================
--  Multi-table joins that span the full lab workflow.
--
--  1. l_lab_get_order_full_summary
--       order + items + results in one call
--
--  2. l_lab_get_patient_history
--       all orders for a patient with per-order item/result counts
--
--  3. l_lab_get_pending_results
--       order items that need a result reported (per lab)
--
--  4. l_lab_get_pending_verification
--       results reported but not yet verified (per lab)
--
--  5. l_lab_get_dashboard_stats
--       single-row counts for a lab's home dashboard
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. FULL ORDER SUMMARY
-- ─────────────────────────────────────────────────────────────
-- Returns one row per test item in the order, with:
--   · order-level fields (status, payment, sample collection)
--   · item-level fields  (test info, price, discount, net)
--   · result-level fields (value, flag, verified status)
--
-- Useful for: order detail page, report download screen.
-- ─────────────────────────────────────────────────────────────
DROP function public.l_lab_get_order_full_summary;
CREATE OR REPLACE FUNCTION public.l_lab_get_order_full_summary(
    p_order_id UUID
)
RETURNS TABLE (
    -- order
    order_id                 UUID,
    order_status             VARCHAR(20),
    payment_status           VARCHAR(20),
    sample_collection_status VARCHAR(20),
    total_amount             NUMERIC(10,2),
    notes                    TEXT,
    ordered_at               TIMESTAMPTZ,
    -- patient
    patient_id               UUID,
    patient_name             TEXT,
    -- lab
    lab_id                   UUID,
    lab_name                 VARCHAR(255),
    -- doctor (nullable)
    doctor_id                UUID,
    doctor_name              TEXT,
    -- item
    item_id                  INTEGER,
    test_id                  INTEGER,
    test_code                VARCHAR(30),
    test_name                VARCHAR(255),
    sample_type              VARCHAR(50),
    fasting_required         BOOLEAN,
    price_at_order           NUMERIC(10,2),
    discount_amount          NUMERIC(10,2),
    net_amount               NUMERIC(10,2),
    item_result_status       VARCHAR(20),
    -- result (nullable — not yet reported)
    result_id                INTEGER,
    result_value             TEXT,
    result_flag              VARCHAR(20),
    result_notes             TEXT,
    report_file              VARCHAR(255),
    reported_by              TEXT,
    verified_by              TEXT,
    is_verified              BOOLEAN,
    reported_at              TIMESTAMPTZ,
    verified_at              TIMESTAMPTZ
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
        -- order
        o.order_id,
        o.order_status,
        o.payment_status,
        o.sample_collection_status,
        o.total_amount,
        o.notes,
        o.ordered_at,
        -- patient
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT     AS patient_name,
        -- lab
        o.lab_id,
        l.lab_name,
        -- doctor
        o.doctor_id,
        CASE WHEN d.doctor_id IS NOT NULL
             THEN (d.first_name || ' ' || d.last_name)::TEXT
        END                                             AS doctor_name,
        -- item
        i.item_id,
        i.test_id,
        t.test_code,
        t.test_name,
        t.sample_type,
        t.fasting_required,
        i.price_at_order,
        i.discount_amount,
        (i.price_at_order - i.discount_amount)          AS net_amount,
        i.result_status                                 AS item_result_status,
        -- result
        r.result_id,
        r.result_value,
        r.result_flag,
        r.result_notes,
        r.report_file,
        (ru.first_name || ' ' || ru.last_name)::TEXT   AS reported_by,
        (vu.first_name || ' ' || vu.last_name)::TEXT   AS verified_by,
        (r.verified_at IS NOT NULL)                     AS is_verified,
        r.reported_at,
        r.verified_at
    FROM public.lab_test_orders           o
    JOIN  public.patients                 p  ON p.patient_id  = o.patient_id
    JOIN  public.labs                     l  ON l.lab_id      = o.lab_id
    LEFT JOIN public.doctors              d  ON d.doctor_id   = o.doctor_id
    JOIN  public.lab_test_order_items     i  ON i.order_id    = o.order_id
    JOIN  public.lab_tests                t  ON t.test_id     = i.test_id
    LEFT JOIN public.lab_test_results     r  ON r.item_id     = i.item_id
    LEFT JOIN public.users               ru  ON ru.user_id    = r.reported_by_id
    LEFT JOIN public.users               vu  ON vu.user_id    = r.verified_by_id
    WHERE o.order_id = p_order_id
    ORDER BY i.created_at ASC;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_get_order_full_summary(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 2. PATIENT LAB HISTORY
-- ─────────────────────────────────────────────────────────────
-- Returns one row per order for a patient.
-- Includes aggregated counts (total tests, results ready, verified).
--
-- Useful for: patient profile → "My Lab Tests" tab.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_get_patient_history(
    p_patient_id UUID
)
RETURNS TABLE (
    order_id                 UUID,
    ordered_at               TIMESTAMPTZ,
    lab_id                   UUID,
    lab_name                 VARCHAR(255),
    doctor_name              TEXT,
    order_status             VARCHAR(20),
    payment_status           VARCHAR(20),
    sample_collection_status VARCHAR(20),
    total_amount             NUMERIC(10,2),
    total_tests              BIGINT,
    results_available        BIGINT,
    results_verified         BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: patient must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.patients WHERE patient_id = p_patient_id
    ) THEN
        RAISE EXCEPTION 'Patient with id % not found', p_patient_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        o.order_id,
        o.ordered_at,
        o.lab_id,
        l.lab_name,
        CASE WHEN d.doctor_id IS NOT NULL
             THEN (d.first_name || ' ' || d.last_name)::TEXT
        END                                                 AS doctor_name,
        o.order_status,
        o.payment_status,
        o.sample_collection_status,
        o.total_amount,
        COUNT(i.item_id)                                    AS total_tests,
        COUNT(r.result_id)                                  AS results_available,
        COUNT(r.verified_at)                                AS results_verified
    FROM public.lab_test_orders           o
    JOIN  public.labs                     l  ON l.lab_id    = o.lab_id
    LEFT JOIN public.doctors              d  ON d.doctor_id = o.doctor_id
    JOIN  public.lab_test_order_items     i  ON i.order_id  = o.order_id
    LEFT JOIN public.lab_test_results     r  ON r.item_id   = i.item_id
    WHERE o.patient_id = p_patient_id
    GROUP BY
        o.order_id,    o.ordered_at,   o.lab_id,      l.lab_name,
        d.doctor_id,   d.first_name,   d.last_name,
        o.order_status, o.payment_status,
        o.sample_collection_status,    o.total_amount
    ORDER BY o.ordered_at DESC;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_get_patient_history(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 3. PENDING RESULTS  (items awaiting result entry)
-- ─────────────────────────────────────────────────────────────
-- Returns order items where sample is COLLECTED but
-- no result has been reported yet.
--
-- NOTE: both i.result_status = 'PENDING' and the NOT EXISTS check
-- are intentionally kept. The status filter uses the index for
-- performance; NOT EXISTS is a defensive guard against any
-- data inconsistency between the two tables.
--
-- Useful for: lab staff worklist — "what results do I need to enter?"
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_get_pending_results(
    p_lab_id UUID
)
RETURNS TABLE (
    item_id            INTEGER,
    order_id           UUID,
    ordered_at         TIMESTAMPTZ,
    patient_id         UUID,
    patient_name       TEXT,
    test_id            INTEGER,
    test_code          VARCHAR(30),
    test_name          VARCHAR(255),
    sample_type        VARCHAR(50),
    price_at_order     NUMERIC(10,2),
    item_result_status VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: lab must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.labs WHERE lab_id = p_lab_id
    ) THEN
        RAISE EXCEPTION 'Lab with id % not found', p_lab_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        i.item_id,
        o.order_id,
        o.ordered_at,
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT  AS patient_name,
        i.test_id,
        t.test_code,
        t.test_name,
        t.sample_type,
        i.price_at_order,
        i.result_status                              AS item_result_status
    FROM public.lab_test_order_items      i
    JOIN  public.lab_test_orders          o  ON o.order_id   = i.order_id
    JOIN  public.patients                 p  ON p.patient_id = o.patient_id
    JOIN  public.lab_tests                t  ON t.test_id    = i.test_id
    WHERE
        o.lab_id                       = p_lab_id
        AND o.sample_collection_status = 'COLLECTED'
        AND o.order_status         NOT IN ('CANCELLED', 'COMPLETED')
        AND i.result_status            = 'PENDING'
        AND NOT EXISTS (
            SELECT 1 FROM public.lab_test_results r
            WHERE r.item_id = i.item_id
        )
    ORDER BY o.ordered_at ASC;   -- oldest first → process in order
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_get_pending_results(
        'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 4. PENDING VERIFICATION  (results awaiting sign-off)
-- ─────────────────────────────────────────────────────────────
-- Returns results that have been reported but not yet
-- verified by a senior/pathologist.
--
-- Useful for: lab supervisor dashboard — "what needs my sign-off?"
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_get_pending_verification(
    p_lab_id UUID
)
RETURNS TABLE (
    result_id    INTEGER,
    item_id      INTEGER,
    order_id     UUID,
    patient_id   UUID,
    patient_name TEXT,
    test_code    VARCHAR(30),
    test_name    VARCHAR(255),
    result_value TEXT,
    result_flag  VARCHAR(20),
    report_file  VARCHAR(255),
    reported_by  TEXT,
    reported_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: lab must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.labs WHERE lab_id = p_lab_id
    ) THEN
        RAISE EXCEPTION 'Lab with id % not found', p_lab_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        r.result_id,
        r.item_id,
        o.order_id,
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT  AS patient_name,
        t.test_code,
        t.test_name,
        r.result_value,
        r.result_flag,
        r.report_file,
        (ru.first_name || ' ' || ru.last_name)::TEXT AS reported_by,
        r.reported_at
    FROM public.lab_test_results          r
    JOIN  public.lab_test_order_items     i  ON i.item_id    = r.item_id
    JOIN  public.lab_test_orders          o  ON o.order_id   = i.order_id
    JOIN  public.patients                 p  ON p.patient_id = o.patient_id
    JOIN  public.lab_tests                t  ON t.test_id    = i.test_id
    LEFT JOIN public.users               ru  ON ru.user_id   = r.reported_by_id
    WHERE
        o.lab_id          = p_lab_id
        AND r.verified_at IS NULL          -- not yet verified
    ORDER BY r.reported_at ASC;            -- oldest unverified first
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_get_pending_verification(
        'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 5. LAB DASHBOARD STATS
-- ─────────────────────────────────────────────────────────────
-- Returns a single summary row for a lab's home dashboard.
--
-- Counts
--   orders_today          orders placed today
--   orders_pending        PLACED or ACCEPTED (not yet in progress)
--   orders_in_progress    IN_PROGRESS
--   samples_pending       sample_collection_status = PENDING
--   results_pending       order items with no result yet
--   results_unverified    results reported but not verified
--   payments_pending      orders where payment_status = PENDING
--
-- Useful for: lab home dashboard KPI cards.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_get_dashboard_stats(
    p_lab_id UUID
)
RETURNS TABLE (
    orders_today       BIGINT,
    orders_pending     BIGINT,
    orders_in_progress BIGINT,
    samples_pending    BIGINT,
    results_pending    BIGINT,
    results_unverified BIGINT,
    payments_pending   BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: lab must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.labs WHERE lab_id = p_lab_id
    ) THEN
        RAISE EXCEPTION 'Lab with id % not found', p_lab_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        -- orders placed today
        COUNT(*) FILTER (
            WHERE o.ordered_at >= CURRENT_DATE
              AND o.ordered_at <  CURRENT_DATE + INTERVAL '1 day'
        )                                                       AS orders_today,

        -- orders not yet started
        COUNT(*) FILTER (
            WHERE o.order_status IN ('PLACED', 'ACCEPTED')
        )                                                       AS orders_pending,

        -- orders currently being processed
        COUNT(*) FILTER (
            WHERE o.order_status = 'IN_PROGRESS'
        )                                                       AS orders_in_progress,

        -- samples not yet collected
        COUNT(*) FILTER (
            WHERE o.sample_collection_status = 'PENDING'
              AND o.order_status NOT IN ('CANCELLED', 'COMPLETED')
        )                                                       AS samples_pending,

        -- items with no result entry yet
        (
            SELECT COUNT(*)
            FROM public.lab_test_order_items  i2
            JOIN public.lab_test_orders       o2 ON o2.order_id = i2.order_id
            WHERE o2.lab_id        = p_lab_id
              AND i2.result_status = 'PENDING'
              AND o2.order_status NOT IN ('CANCELLED')
        )                                                       AS results_pending,

        -- results awaiting verification
        (
            SELECT COUNT(*)
            FROM public.lab_test_results      r2
            JOIN public.lab_test_order_items  i2 ON i2.item_id  = r2.item_id
            JOIN public.lab_test_orders       o2 ON o2.order_id = i2.order_id
            WHERE o2.lab_id       = p_lab_id
              AND r2.verified_at IS NULL
        )                                                       AS results_unverified,

        -- unpaid orders
        COUNT(*) FILTER (
            WHERE o.payment_status = 'PENDING'
              AND o.order_status  NOT IN ('CANCELLED')
        )                                                       AS payments_pending

    FROM public.lab_test_orders o
    WHERE o.lab_id = p_lab_id;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_get_dashboard_stats(
        'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );
*/