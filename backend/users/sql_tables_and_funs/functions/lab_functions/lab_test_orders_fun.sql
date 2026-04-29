CREATE OR REPLACE FUNCTION public.l_lab_test_orders_insert(
    p_patient_id      UUID,
    p_lab_id          UUID,
    p_price_at_order  NUMERIC(10,2),          -- NOT NULL in table, required
    p_doctor_id       UUID          DEFAULT NULL,
    p_appointment_id  INTEGER       DEFAULT NULL,
    p_discount_amount NUMERIC(10,2) DEFAULT 0,
    p_notes           TEXT          DEFAULT NULL
)
RETURNS public.lab_test_orders
LANGUAGE plpgsql
AS $$
DECLARE
    v_row         public.lab_test_orders;
    v_total       NUMERIC(10,2);
BEGIN
    -- Guard: patient must exist
    IF NOT EXISTS (
        SELECT 1 FROM public.patients WHERE patient_id = p_patient_id
    ) THEN
        RAISE EXCEPTION 'Patient with id % not found', p_patient_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: lab must exist and be verified
    IF NOT EXISTS (
        SELECT 1 FROM public.labs
        WHERE lab_id = p_lab_id AND verification_status = 'VERIFIED'
    ) THEN
        RAISE EXCEPTION 'Lab with id % not found or not verified', p_lab_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: doctor must exist if provided
    IF p_doctor_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.doctors WHERE doctor_id = p_doctor_id
    ) THEN
        RAISE EXCEPTION 'Doctor with id % not found', p_doctor_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: appointment must exist if provided
    IF p_appointment_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.doctor_appointments WHERE appointment_id = p_appointment_id
    ) THEN
        RAISE EXCEPTION 'Appointment with id % not found', p_appointment_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Guard: numeric values
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

    -- Compute total_amount from price and discount
    v_total := p_price_at_order - p_discount_amount;

    INSERT INTO public.lab_test_orders (
        patient_id,
        lab_id,
        doctor_id,
        appointment_id,
        order_status,
        payment_status,
        sample_collection_status,
        price_at_order,
        discount_amount,
        total_amount,
        notes,
        ordered_at,
        updated_at
    )
    VALUES (
        p_patient_id,
        p_lab_id,
        p_doctor_id,
        p_appointment_id,
        'PLACED',
        'PENDING',
        'PENDING',
        p_price_at_order,
        p_discount_amount,
        v_total,
        p_notes,
        now(),
        now()
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE — minimal:
    SELECT * FROM public.l_lab_test_orders_insert(
        p_patient_id     => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_lab_id         => 'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid,
        p_price_at_order => 999.00
    );

USAGE — full:
    SELECT * FROM public.l_lab_test_orders_insert(
        p_patient_id      => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_lab_id          => 'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid,
        p_price_at_order  => 999.00,
        p_doctor_id       => 'c2ggde11-2e2d-6gh0-dd8f-8dd1df502c33'::uuid,
        p_appointment_id  => 5,
        p_discount_amount => 100.00,
        p_notes           => 'Fasting sample required'
    );
    -- total_amount will be computed as 899.00
*/


-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE
-- ─────────────────────────────────────────────────────────────
-- Updatable fields:
--   order_status, payment_status, sample_collection_status, notes
--
-- Status transition rules enforced:
--   order_status             PLACED → ACCEPTED → IN_PROGRESS → COMPLETED
--                            any    → CANCELLED
--   payment_status           PENDING → PAID | FAILED
--                            PAID    → REFUNDED
--   sample_collection_status PENDING → COLLECTED | REJECTED
--
-- NOTE: price_at_order, discount_amount, total_amount are intentionally
--       not updatable after order placement to preserve the audit trail.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_orders_update(
    p_order_id                 UUID,
    p_order_status             VARCHAR(20) DEFAULT NULL,
    p_payment_status           VARCHAR(20) DEFAULT NULL,
    p_sample_collection_status VARCHAR(20) DEFAULT NULL,
    p_notes                    TEXT        DEFAULT NULL
)
RETURNS public.lab_test_orders
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_orders;
BEGIN
    -- Guard: order must exist
    SELECT * INTO v_row
    FROM public.lab_test_orders
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- ── order_status transition guard ─────────────────────────
    IF p_order_status IS NOT NULL
       AND p_order_status <> v_row.order_status
    THEN
        IF p_order_status NOT IN ('PLACED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED') THEN
            RAISE EXCEPTION 'Invalid order_status "%". Allowed: PLACED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED',
                p_order_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        -- Block updates on already completed/cancelled orders
        IF v_row.order_status IN ('COMPLETED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Cannot change order_status. Order is already %', v_row.order_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        -- Enforce forward-only transitions (except → CANCELLED which is always allowed)
        IF p_order_status <> 'CANCELLED' THEN
            IF NOT (
                (v_row.order_status = 'PLACED'      AND p_order_status = 'ACCEPTED')    OR
                (v_row.order_status = 'ACCEPTED'    AND p_order_status = 'IN_PROGRESS') OR
                (v_row.order_status = 'IN_PROGRESS' AND p_order_status = 'COMPLETED')
            ) THEN
                RAISE EXCEPTION 'Invalid order_status transition: % → %',
                    v_row.order_status, p_order_status
                    USING ERRCODE = 'invalid_parameter_value';
            END IF;
        END IF;
    END IF;

    -- ── payment_status transition guard ───────────────────────
    IF p_payment_status IS NOT NULL
       AND p_payment_status <> v_row.payment_status
    THEN
        IF p_payment_status NOT IN ('PENDING','PAID','FAILED','REFUNDED') THEN
            RAISE EXCEPTION 'Invalid payment_status "%". Allowed: PENDING, PAID, FAILED, REFUNDED',
                p_payment_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF NOT (
            (v_row.payment_status = 'PENDING' AND p_payment_status IN ('PAID', 'FAILED')) OR
            (v_row.payment_status = 'PAID'    AND p_payment_status = 'REFUNDED')
        ) THEN
            RAISE EXCEPTION 'Invalid payment_status transition: % → %',
                v_row.payment_status, p_payment_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;
    END IF;

    -- ── sample_collection_status transition guard ─────────────
    IF p_sample_collection_status IS NOT NULL
       AND p_sample_collection_status <> v_row.sample_collection_status
    THEN
        IF p_sample_collection_status NOT IN ('PENDING','COLLECTED','REJECTED') THEN
            RAISE EXCEPTION 'Invalid sample_collection_status "%". Allowed: PENDING, COLLECTED, REJECTED',
                p_sample_collection_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;

        IF NOT (
            v_row.sample_collection_status = 'PENDING'
            AND p_sample_collection_status IN ('COLLECTED', 'REJECTED')
        ) THEN
            RAISE EXCEPTION 'Invalid sample_collection_status transition: % → %',
                v_row.sample_collection_status, p_sample_collection_status
                USING ERRCODE = 'invalid_parameter_value';
        END IF;
    END IF;

    UPDATE public.lab_test_orders
    SET
        order_status             = COALESCE(p_order_status,             order_status),
        payment_status           = COALESCE(p_payment_status,           payment_status),
        sample_collection_status = COALESCE(p_sample_collection_status, sample_collection_status),
        notes                    = COALESCE(p_notes,                    notes),
        updated_at               = now()
    WHERE order_id = p_order_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE — accept an order:
    SELECT * FROM public.l_lab_test_orders_update(
        p_order_id     => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_order_status => 'ACCEPTED'
    );

USAGE — mark payment and sample collected:
    SELECT * FROM public.l_lab_test_orders_update(
        p_order_id                 => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_payment_status           => 'PAID',
        p_sample_collection_status => 'COLLECTED'
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 3. DELETE  (soft — order_status = 'CANCELLED')
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_orders_delete(
    p_order_id UUID
)
RETURNS public.lab_test_orders
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.lab_test_orders;
BEGIN
    SELECT * INTO v_row
    FROM public.lab_test_orders
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_row.order_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Order with id % is already cancelled', p_order_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF v_row.order_status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot cancel a completed order %', p_order_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.lab_test_orders
    SET
        order_status = 'CANCELLED',
        updated_at   = now()
    WHERE order_id = p_order_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_orders_delete(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 4. SELECT  (single row by order_id)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_orders_select(
    p_order_id UUID
)
RETURNS TABLE (
    order_id                 UUID,
    patient_id               UUID,
    patient_name             TEXT,
    lab_id                   UUID,
    lab_name                 VARCHAR(255),
    doctor_id                UUID,
    doctor_name              TEXT,
    appointment_id           INTEGER,
    order_status             VARCHAR(20),
    payment_status           VARCHAR(20),
    sample_collection_status VARCHAR(20),
    price_at_order           NUMERIC(10,2),
    discount_amount          NUMERIC(10,2),
    total_amount             NUMERIC(10,2),
    notes                    TEXT,
    ordered_at               TIMESTAMPTZ,
    updated_at               TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: order must exist before running the join query
    IF NOT EXISTS (
        SELECT 1 FROM public.lab_test_orders WHERE order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'Order with id % not found', p_order_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT
        o.order_id,
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT      AS patient_name,
        o.lab_id,
        l.lab_name,
        o.doctor_id,
        CASE WHEN d.doctor_id IS NOT NULL
             THEN (d.first_name || ' ' || d.last_name)::TEXT
        END                                              AS doctor_name,
        o.appointment_id,
        o.order_status,
        o.payment_status,
        o.sample_collection_status,
        o.price_at_order,
        o.discount_amount,
        o.total_amount,
        o.notes,
        o.ordered_at,
        o.updated_at
    FROM public.lab_test_orders o
    JOIN  public.patients p ON p.patient_id = o.patient_id
    JOIN  public.labs     l ON l.lab_id     = o.lab_id
    LEFT JOIN public.doctors d ON d.doctor_id = o.doctor_id
    WHERE o.order_id = p_order_id;
END;
$$;

/*
USAGE:
    SELECT * FROM public.l_lab_test_orders_select(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );
*/


-- ─────────────────────────────────────────────────────────────
-- 5. SELECT ALL
-- ─────────────────────────────────────────────────────────────
-- Scoped by patient or lab (at least one must be provided).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.l_lab_test_orders_select_all(
    p_patient_id UUID DEFAULT NULL,
    p_lab_id     UUID DEFAULT NULL
)
RETURNS TABLE (
    order_id                 UUID,
    patient_id               UUID,
    patient_name             TEXT,
    lab_id                   UUID,
    lab_name                 VARCHAR(255),
    doctor_id                UUID,
    doctor_name              TEXT,
    appointment_id           INTEGER,
    order_status             VARCHAR(20),
    payment_status           VARCHAR(20),
    sample_collection_status VARCHAR(20),
    price_at_order           NUMERIC(10,2),
    discount_amount          NUMERIC(10,2),
    total_amount             NUMERIC(10,2),
    notes                    TEXT,
    ordered_at               TIMESTAMPTZ,
    updated_at               TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Guard: at least one scope filter required
    IF p_patient_id IS NULL AND p_lab_id IS NULL THEN
        RAISE EXCEPTION 'At least one of p_patient_id or p_lab_id must be provided'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    RETURN QUERY
    SELECT
        o.order_id,
        o.patient_id,
        (p.first_name || ' ' || p.last_name)::TEXT      AS patient_name,
        o.lab_id,
        l.lab_name,
        o.doctor_id,
        CASE WHEN d.doctor_id IS NOT NULL
             THEN (d.first_name || ' ' || d.last_name)::TEXT
        END                                              AS doctor_name,
        o.appointment_id,
        o.order_status,
        o.payment_status,
        o.sample_collection_status,
        o.price_at_order,
        o.discount_amount,
        o.total_amount,
        o.notes,
        o.ordered_at,
        o.updated_at
    FROM public.lab_test_orders o
    JOIN  public.patients p ON p.patient_id = o.patient_id
    JOIN  public.labs     l ON l.lab_id     = o.lab_id
    LEFT JOIN public.doctors d ON d.doctor_id = o.doctor_id
    WHERE
        (p_patient_id IS NULL OR o.patient_id = p_patient_id)
        AND (p_lab_id IS NULL OR o.lab_id     = p_lab_id)
    ORDER BY o.ordered_at DESC;
END;
$$;

/*
USAGE — all orders for a patient:
    SELECT * FROM public.l_lab_test_orders_select_all(
        p_patient_id => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    );

USAGE — all orders for a lab:
    SELECT * FROM public.l_lab_test_orders_select_all(
        p_lab_id => 'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );

USAGE — orders for a specific patient at a specific lab:
    SELECT * FROM public.l_lab_test_orders_select_all(
        p_patient_id => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        p_lab_id     => 'b1ffcd00-1d1c-5fg9-cc7e-7cc0ce491b22'::uuid
    );
*/