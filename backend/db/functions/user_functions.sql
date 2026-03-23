CREATE OR REPLACE FUNCTION u_get_user_by_id(u_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    email varchar,
    email_verified boolean,
    is_active boolean,
    password varchar,
    oauth_provider varchar,
    oauth_provider_id varchar,
    two_factor_enabled boolean,
    failed_login_attempts int,
    lockout_until timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    last_login_at timestamptz,
    role_id int,
    role varchar
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    u.user_id,
    u.email,
    u.email_verified,
    u.is_active,
    u.password,
    u.oauth_provider,
    u.oauth_provider_id,
    u.two_factor_enabled,
    u.failed_login_attempts,
    u.lockout_until,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    u.role_id,
    r.role
FROM users u
JOIN user_roles r
    ON r.role_id = u.role_id
WHERE u.user_id = u_user_id;

END;
$$;



CREATE OR REPLACE FUNCTION u_get_user_by_email(u_email varchar)
RETURNS TABLE (
    user_id uuid,
    email varchar,
    email_verified boolean,
    is_active boolean,
    password varchar,
    oauth_provider varchar,
    oauth_provider_id varchar,
    two_factor_enabled boolean,
    failed_login_attempts int,
    lockout_until timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    last_login_at timestamptz,
    role_id int,
    role varchar
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    u.user_id,
    u.email,
    u.email_verified,
    u.is_active,
    u.password,
    u.oauth_provider,
    u.oauth_provider_id,
    u.two_factor_enabled,
    u.failed_login_attempts,
    u.lockout_until,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    u.role_id,
    r.role
FROM users u
JOIN user_roles r
    ON r.role_id = u.role_id
WHERE u.email = u_email;

END;
$$;



CREATE OR REPLACE FUNCTION u_get_user_roles()
RETURNS TABLE (
    role_id int,
    role varchar,
    role_description text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    r.role_id,
    r.role,
    r.role_description,
    r.created_at,
    r.updated_at
FROM user_roles r;

END;
$$;




CREATE OR REPLACE FUNCTION u_set_email_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET email_verified = TRUE,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_update_email(
    p_user_id uuid,
    p_new_email varchar
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

IF EXISTS (
    SELECT 1 FROM users
    WHERE email = p_new_email
    AND user_id <> p_user_id
) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS';
END IF;

UPDATE users
SET email = p_new_email,
    email_verified = FALSE,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_toggle_two_factor(
    p_user_id uuid,
    p_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET two_factor_enabled = p_enabled,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;


CREATE OR REPLACE FUNCTION u_lock_user(
    p_user_id uuid,
    p_locked_until timestamptz DEFAULT (NOW() + INTERVAL '24 hours')
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET lockout_until = p_locked_until,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_unlock_user(
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET lockout_until = NULL,
    failed_login_attempts = 0,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_toggle_user_status(
    p_admin_id uuid,
    p_target_id uuid,
    p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

IF p_admin_id = p_target_id THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_SELF';
END IF;

UPDATE users
SET is_active = p_is_active,
    updated_at = NOW()
WHERE user_id = p_target_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

UPDATE patients SET is_active = p_is_active WHERE patient_id = p_target_id;
UPDATE doctors  SET is_active = p_is_active WHERE doctor_id = p_target_id;
UPDATE labs     SET is_active = p_is_active WHERE lab_id = p_target_id;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_soft_deactivate_user(
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET is_active = FALSE,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

UPDATE patients SET is_active = FALSE WHERE patient_id = p_user_id;
UPDATE doctors  SET is_active = FALSE WHERE doctor_id = p_user_id;
UPDATE labs     SET is_active = FALSE WHERE lab_id = p_user_id;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_list_users()
RETURNS TABLE(
    user_id uuid,
    email varchar,
    role varchar,
    is_active boolean,
    email_verified boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    u.user_id,
    u.email,
    r.role,
    u.is_active,
    u.email_verified,
    u.created_at
FROM users u
JOIN user_roles r
    ON r.role_id = u.role_id
ORDER BY u.created_at DESC;

END;
$$;



CREATE OR REPLACE FUNCTION u_get_full_user_profile(
    p_user_id uuid
)
RETURNS TABLE(
    user_id uuid,
    email varchar,
    email_verified boolean,
    is_active boolean,
    role varchar,
    two_factor_enabled boolean,
    created_at timestamptz,
    updated_at timestamptz,
    last_login_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    u.user_id,
    u.email,
    u.email_verified,
    u.is_active,
    r.role,
    u.two_factor_enabled,
    u.created_at,
    u.updated_at,
    u.last_login_at
FROM users u
JOIN user_roles r
    ON r.role_id = u.role_id
WHERE u.user_id = p_user_id;

END;
$$;


CREATE OR REPLACE FUNCTION u_insert_document(
    p_user_id uuid,
    p_document_type varchar,
    p_file_path varchar,
    p_original_name varchar DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_id int;
BEGIN

IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

INSERT INTO user_documents
(user_id, document_type, file_path, original_name, uploaded_at, is_verified)
VALUES
(p_user_id, p_document_type, p_file_path, p_original_name, NOW(), FALSE)
RETURNING document_id INTO v_id;

RETURN v_id;

END;
$$;



CREATE OR REPLACE FUNCTION u_verify_document(
    p_document_id int,
    p_verified_by_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE user_documents
SET is_verified = TRUE,
    verified_at = NOW(),
    verified_by_id = p_verified_by_id
WHERE document_id = p_document_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION u_get_documents(p_user_id uuid)
RETURNS TABLE(
    document_id int,
    document_type varchar,
    file_path varchar,
    original_name varchar,
    uploaded_at timestamptz,
    is_verified boolean,
    verified_at timestamptz,
    verified_by_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    ud.document_id,
    ud.document_type,
    ud.file_path,
    ud.original_name,
    ud.uploaded_at,
    ud.is_verified,
    ud.verified_at,
    ud.verified_by_id
FROM user_documents ud
WHERE ud.user_id = p_user_id
ORDER BY ud.uploaded_at DESC;

END;
$$;