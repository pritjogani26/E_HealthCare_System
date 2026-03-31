CREATE OR REPLACE FUNCTION public.a_insert_audit_log(
        a_performed_by_id UUID,
        a_target_user_id UUID,
        a_action VARCHAR(40),
        a_entity_type int,
        a_details TEXT,
        a_status VARCHAR(10) DEFAULT 'SUCCESS'
    ) RETURNS VOID LANGUAGE plpgsql AS $$ BEGIN IF a_action IS NULL
    OR a_details IS NULL THEN RAISE EXCEPTION 'AUDIT_LOG_INVALID_INPUT';
END IF;
IF a_status NOT IN ('SUCCESS', 'FAILURE') THEN RAISE EXCEPTION 'AUDIT_LOG_INVALID_STATUS';
END IF;
INSERT INTO public.audit_logs (
        performed_by_id,
        target_user_id,
        action,
        entity_type,
        details,
        status
    )
VALUES (
        a_performed_by_id,
        a_target_user_id,
        a_action,
        a_entity_type,
        a_details,
        a_status
    );
END;
$$;



CREATE OR REPLACE FUNCTION public.o_get_audit_logs(a_limit INTEGER DEFAULT 100) RETURNS TABLE (
        log_id BIGINT,
        performed_by_id UUID,
        performed_by_email VARCHAR,
        target_user_id UUID,
        target_user_email VARCHAR,
        action VARCHAR,
        entity_type VARCHAR,
        details TEXT,
        status VARCHAR,
        created_at TIMESTAMPTZ
    ) LANGUAGE plpgsql AS $$ BEGIN IF a_limit IS NULL
    OR a_limit <= 0
    OR a_limit > 1000 THEN a_limit := 100;
END IF;
RETURN QUERY
SELECT a.log_id,
    a.performed_by_id,
    u1.email AS performed_by_email,
    a.target_user_id,
    u2.email AS target_user_email,
    a.action,
    ur.role AS entity_type,
    a.details,
    a.status,
    a.created_at
FROM public.audit_logs a
    LEFT JOIN public.users u1 ON u1.user_id = a.performed_by_id
    LEFT JOIN public.users u2 ON u2.user_id = a.target_user_id
    LEFT JOIN public.user_roles ur ON ur.role_id = a.entity_type
ORDER BY a.created_at DESC
LIMIT a_limit;
END;
$$;


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

create or replace function a_patient_audit_insert_fn(
    u_user_id uuid,
    u_action varchar,
    u_status varchar,

    u_targeted_user_id uuid default null,
    u_old_data JSONB default null,
    u_new_data JSONB default null,
    u_failure_reason text default null
)
returns void
LANGUAGE plpgsql
as $$
BEGIN
    insert into audit_patients (user_id, targeted_user_id, action, status, old_data, new_data, failure_reason)
    values (u_user_id, u_targeted_user_id, u_action, u_status, u_old_data, u_new_data, u_failure_reason);
end;
$$;