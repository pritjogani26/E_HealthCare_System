-- backend\users\sql_tables_and_funs\functions\audit_functions.sql
create or replace function a_auth_audit_fn(
    u_user_id uuid,
    u_action varchar,
    u_status varchar,
    u_failure_reason text default null
)
returns VOID
LANGUAGE plpgsql
as $$
BEGIN   
    insert into audit_auth (user_id, action, status, failure_reason)
    values (u_user_id, u_action, u_status, u_failure_reason);
end;
$$;


CREATE OR REPLACE FUNCTION a_insert_audit_log(
    p_user_id          UUID,
    p_targeted_user_id UUID        DEFAULT NULL,
    p_table_name       VARCHAR     DEFAULT NULL,
    p_row_id           VARCHAR     DEFAULT NULL,
    p_action           VARCHAR     DEFAULT NULL,
    p_status           VARCHAR     DEFAULT 'SUCCESS',
    p_old_data         JSONB       DEFAULT NULL,
    p_new_data         JSONB       DEFAULT NULL,
    p_failure_reason   TEXT        DEFAULT NULL,
    p_ip_address       INET        DEFAULT NULL,
    p_user_agent       TEXT        DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_audit_id BIGINT;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        targeted_user_id,
        table_name,
        row_id,
        action,
        status,
        old_data,
        new_data,
        failure_reason,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_targeted_user_id,
        p_table_name,
        p_row_id,
        p_action,
        p_status,
        p_old_data,
        p_new_data,
        p_failure_reason,
        p_ip_address,
        p_user_agent
    )
    RETURNING audit_id INTO v_audit_id;

    RETURN v_audit_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '[insert_audit_log] Failed to insert audit log: %', SQLERRM;
        RETURN NULL;
END;
$$;


CREATE OR REPLACE FUNCTION a_get_audit_logs(
    p_user_id          UUID        DEFAULT NULL,
    p_targeted_user_id UUID        DEFAULT NULL,
    p_table_name       VARCHAR     DEFAULT NULL,
    p_row_id           VARCHAR     DEFAULT NULL,
    p_action           VARCHAR     DEFAULT NULL,
    p_status           VARCHAR     DEFAULT NULL,
    p_from_date        TIMESTAMPTZ DEFAULT NULL,
    p_to_date          TIMESTAMPTZ DEFAULT NULL,
    p_limit            INT         DEFAULT 50,
    p_offset           INT         DEFAULT 0
)
RETURNS TABLE (
    audit_id           BIGINT,
    user_id            UUID,
    user_email         VARCHAR,
    targeted_user_id   UUID,
    targeted_user_email varchar,
    table_name         VARCHAR,
    row_id             VARCHAR,
    action             VARCHAR,
    status             VARCHAR,
    old_data           JSONB,
    new_data           JSONB,
    failure_reason     TEXT,
    ip_address         INET,
    user_agent         TEXT,
    created_at         TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.audit_id,
        al.user_id,
        u1.email AS user_email,
        al.targeted_user_id,
        u2.email AS targeted_user_email,
        al.table_name,
        al.row_id,
        al.action,
        al.status,
        al.old_data,
        al.new_data,
        al.failure_reason,
        al.ip_address,
        al.user_agent,
        al.created_at
    FROM audit_logs al
    LEFT JOIN users u1 ON al.user_id = u1.user_id
    LEFT JOIN users u2 ON al.targeted_user_id = u2.user_id
    WHERE
        (p_user_id          IS NULL OR al.user_id          = p_user_id)
        AND (p_targeted_user_id IS NULL OR al.targeted_user_id = p_targeted_user_id)
        AND (p_table_name       IS NULL OR al.table_name       = p_table_name)
        AND (p_row_id           IS NULL OR al.row_id           = p_row_id)
        AND (p_action           IS NULL OR al.action           = p_action)
        AND (p_status           IS NULL OR al.status           = p_status)
        AND (p_from_date        IS NULL OR al.created_at      >= p_from_date)
        AND (p_to_date          IS NULL OR al.created_at      <= p_to_date)
    ORDER BY al.created_at DESC
    LIMIT  p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '[get_audit_logs] Failed: %', SQLERRM;
END;
$$;
