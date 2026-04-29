DROP function public.l_lab_get_order_full_summary;
CREATE OR REPLACE FUNCTION public.l_lab_get_order_full_summary(
    p_order_id UUID
)
RETURNS TABLE (
    order_id                 UUID,
    order_status             VARCHAR(20),
    payment_status           VARCHAR(20),
    sample_collection_status VARCHAR(20),
    total_amount             NUMERIC(10,2),
    notes                    TEXT,
    ordered_at               TIMESTAMPTZ,
    patient_id               UUID,
    patient_name             TEXT,
    lab_id                   UUID,
    lab_name                 VARCHAR(255),
    doctor_id                UUID,
    doctor_name              TEXT,
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
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_test_orders WHERE order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        o.order_id,
        o.order_status,
        o.payment_status,
        o.sample_collection_status,
        o.total_amount,
        o.notes,
        o.ordered_at,
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT     AS patient_name,
        o.lab_id,
        l.lab_name,
        o.doctor_id,
        CASE WHEN d.doctor_id IS NOT NULL
             THEN (d.first_name || ' ' || d.last_name)::TEXT
        END                                             AS doctor_name,
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
    ORDER BY o.ordered_at ASC;
END;
$$;


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
        AND r.verified_at IS NULL
    ORDER BY r.reported_at ASC;
END;
$$;


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
    IF NOT EXISTS (
        SELECT 1 FROM public.labs WHERE lab_id = p_lab_id
    ) THEN
        RAISE EXCEPTION 'Lab with id % not found', p_lab_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*) FILTER (
            WHERE o.ordered_at >= CURRENT_DATE
              AND o.ordered_at <  CURRENT_DATE + INTERVAL '1 day'
        )                                                       AS orders_today,

        COUNT(*) FILTER (
            WHERE o.order_status IN ('PLACED', 'ACCEPTED')
        )                                                       AS orders_pending,

        COUNT(*) FILTER (
            WHERE o.order_status = 'IN_PROGRESS'
        )                                                       AS orders_in_progress,

        COUNT(*) FILTER (
            WHERE o.sample_collection_status = 'PENDING'
              AND o.order_status NOT IN ('CANCELLED', 'COMPLETED')
        )                                                       AS samples_pending,

        (
            SELECT COUNT(*)
            FROM public.lab_test_order_items  i2
            JOIN public.lab_test_orders       o2 ON o2.order_id = i2.order_id
            WHERE o2.lab_id        = p_lab_id
              AND i2.result_status = 'PENDING'
              AND o2.order_status NOT IN ('CANCELLED')
        )                                                       AS results_pending,

        (
            SELECT COUNT(*)
            FROM public.lab_test_results      r2
            JOIN public.lab_test_order_items  i2 ON i2.item_id  = r2.item_id
            JOIN public.lab_test_orders       o2 ON o2.order_id = i2.order_id
            WHERE o2.lab_id       = p_lab_id
              AND r2.verified_at IS NULL
        )                                                       AS results_unverified,

        COUNT(*) FILTER (
            WHERE o.payment_status = 'PENDING'
              AND o.order_status  NOT IN ('CANCELLED')
        )                                                       AS payments_pending

    FROM public.lab_test_orders o
    WHERE o.lab_id = p_lab_id;
END;
$$;