CREATE TABLE IF NOT EXISTS public.payments (
    payment_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          VARCHAR(100) NOT NULL UNIQUE,
    transaction_id    VARCHAR(100),
    razorpay_signature VARCHAR(300),
    
    payment_for       VARCHAR(20) NOT NULL,
    reference_id      VARCHAR(100) NOT NULL,
    
    patient_id        UUID NOT NULL REFERENCES public.users(user_id),
    amount            NUMERIC(10,2) NOT NULL,
    currency          VARCHAR(3) NOT NULL DEFAULT 'INR',
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    failure_reason    TEXT,
    refund_id         VARCHAR(100),
    
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_patient  ON public.payments(patient_id);
CREATE INDEX idx_payments_ref      ON public.payments(reference_id, payment_for);
CREATE INDEX idx_payments_order    ON public.payments(order_id);