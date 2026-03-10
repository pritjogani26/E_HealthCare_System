CREATE OR REPLACE FUNCTION public.a_insert_audit_log(
    a_performed_by_id UUID,
    a_target_user_id  UUID,
    a_action          VARCHAR,
    a_entity_type     VARCHAR,
    a_details         TEXT,
    a_status          VARCHAR DEFAULT 'SUCCESS',
    a_ip_address      INET DEFAULT NULL,
    a_user_agent      TEXT DEFAULT NULL,
    a_duration_ms     INTEGER DEFAULT NULL,
    a_request_path    VARCHAR DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id BIGINT;
BEGIN

    -- Validate required fields
    IF a_action IS NULL OR a_details IS NULL THEN
        RAISE EXCEPTION 'AUDIT_LOG_INVALID_INPUT';
    END IF;

    -- Prevent negative duration
    IF a_duration_ms IS NOT NULL AND a_duration_ms < 0 THEN
        a_duration_ms := NULL;
    END IF;

    INSERT INTO public.audit_logs (
        performed_by_id,
        target_user_id,
        action,
        entity_type,
        details,
        status,
        ip_address,
        user_agent,
        duration_ms,
        request_path
    )
    VALUES (
        a_performed_by_id,
        a_target_user_id,
        a_action,
        a_entity_type,
        a_details,
        COALESCE(a_status, 'SUCCESS'),
        a_ip_address,
        a_user_agent,
        a_duration_ms,
        a_request_path
    )
    RETURNING log_id INTO v_log_id;

    RETURN v_log_id;

END;
$$;

CREATE OR REPLACE FUNCTION public.o_get_audit_logs(
    a_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    log_id BIGINT,
    performed_by_id UUID,
    performed_by_email VARCHAR,
    target_user_id UUID,
    target_user_email VARCHAR,
    action VARCHAR,
    entity_type VARCHAR,
    details TEXT,
    status VARCHAR,
    ip_address INET,
    user_agent TEXT,
    duration_ms INTEGER,
    request_path VARCHAR,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF a_limit IS NULL OR a_limit <= 0 THEN
        a_limit := 100;
    END IF;

    RETURN QUERY
    SELECT
        a.log_id,
        a.performed_by_id,
        u1.email,
        a.target_user_id,
        u2.email,
        a.action,
        a.entity_type,
        a.details,
        a.status,
        a.ip_address,
        a.user_agent,
        a.duration_ms,
        a.request_path,
        a.created_at
    FROM public.audit_logs a
    LEFT JOIN public.users u1
        ON u1.user_id = a.performed_by_id
    LEFT JOIN public.users u2
        ON u2.user_id = a.target_user_id
    ORDER BY a.created_at DESC
    LIMIT a_limit;

END;
$$;