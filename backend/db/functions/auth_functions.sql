CREATE OR REPLACE FUNCTION auth_get_user_for_login(
    p_email varchar
)
RETURNS TABLE (
    user_id uuid,
    password varchar,
    role varchar,
    is_active boolean,
    lockout_until timestamptz,
    failed_login_attempts int
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    u.user_id,
    u.password,
    r.role,
    u.is_active,
    u.lockout_until,
    u.failed_login_attempts
FROM users u
LEFT JOIN user_roles r
    ON r.role_id = u.role_id
WHERE u.email = p_email;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

END;
$$;



CREATE OR REPLACE FUNCTION auth_login_success(
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET
    failed_login_attempts = 0,
    lockout_until = NULL,
    last_login_at = NOW(),
    updated_at = NOW()
WHERE user_id = p_user_id;

PERFORM a_auth_audit_fn(p_user_id, 'USER_LOGIN', 'SUCCESS');

END;
$$;



CREATE OR REPLACE FUNCTION auth_login_failed(
    p_user_id uuid,
    p_failure_reason text
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts int;
BEGIN

UPDATE users
SET
    failed_login_attempts = failed_login_attempts + 1,
    lockout_until = CASE
        WHEN failed_login_attempts + 1 >= 5
        THEN NOW() + INTERVAL '15 minutes'
        ELSE lockout_until
    END,
    updated_at = NOW()
WHERE user_id = p_user_id
RETURNING failed_login_attempts INTO v_attempts;

PERFORM a_auth_audit_fn(p_user_id, 'USER_LOGIN', 'FAILURE', p_failure_reason);


RETURN v_attempts;

END;
$$;



CREATE OR REPLACE FUNCTION auth_toggle_user_is_active(u_user_id uuid, u_reason varchar)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET is_active = NOT is_active, status_change_reason = u_reason, updated_at = NOW()
    WHERE user_id = u_user_id;
END;
$$;



CREATE OR REPLACE FUNCTION auth_insert_refresh_token(
    p_user_id uuid,
    p_refresh_token text,
    p_expiry_days int DEFAULT 7
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_token_id int;
BEGIN

IF p_expiry_days IS NULL OR p_expiry_days <= 0 THEN
    p_expiry_days := 7;
END IF;

UPDATE user_refresh_tokens
SET is_revoked = TRUE
WHERE user_id = p_user_id
AND is_revoked = FALSE;

INSERT INTO user_refresh_tokens (
    user_id,
    refresh_token,
    expires_at
)
VALUES (
    p_user_id,
    p_refresh_token,
    NOW() + (p_expiry_days || ' days')::interval
)
RETURNING token_id INTO v_token_id;

RETURN v_token_id;

END;
$$;



CREATE OR REPLACE FUNCTION auth_verify_refresh_token(
    p_refresh_token text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_expiry timestamptz;
    v_revoked boolean;
BEGIN

SELECT
    user_id,
    expires_at,
    is_revoked
INTO
    v_user_id,
    v_expiry,
    v_revoked
FROM user_refresh_tokens
WHERE refresh_token = p_refresh_token;

IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_REFRESH_TOKEN';
END IF;

IF v_revoked THEN
    RAISE EXCEPTION 'TOKEN_REVOKED';
END IF;

IF v_expiry < NOW() THEN
    RAISE EXCEPTION 'TOKEN_EXPIRED';
END IF;

RETURN v_user_id;

END;
$$;



CREATE OR REPLACE FUNCTION auth_revoke_refresh_token(
    p_refresh_token text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE user_refresh_tokens
SET is_revoked = TRUE
WHERE refresh_token = p_refresh_token;

IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_REFRESH_TOKEN';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION auth_revoke_all_user_tokens(
    p_user_id uuid
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_count int;
BEGIN

UPDATE user_refresh_tokens
SET is_revoked = TRUE
WHERE user_id = p_user_id
AND is_revoked = FALSE;

GET DIAGNOSTICS v_count = ROW_COUNT;

RETURN v_count;

END;
$$;



CREATE OR REPLACE FUNCTION auth_create_verification(
    p_user_id uuid,
    p_verification_type_id int,
    p_token text DEFAULT NULL,
    p_otp varchar DEFAULT NULL,
    p_expiry_minutes int DEFAULT 30
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    v_id bigint;
BEGIN

IF p_token IS NULL AND p_otp IS NULL THEN
    RAISE EXCEPTION 'TOKEN_OR_OTP_REQUIRED';
END IF;

UPDATE email_verification_table
SET is_used = TRUE
WHERE user_id = p_user_id
AND verification_type_id = p_verification_type_id
AND is_used = FALSE;

INSERT INTO email_verification_table (
    user_id,
    verification_type_id,
    token,
    otp,
    expires_at
)
VALUES (
    p_user_id,
    p_verification_type_id,
    p_token,
    p_otp,
    NOW() + (p_expiry_minutes || ' minutes')::interval
)
RETURNING id INTO v_id;

RETURN v_id;

END;
$$;



CREATE OR REPLACE FUNCTION auth_verify_token(
    p_token text DEFAULT NULL,
    p_otp varchar DEFAULT NULL,
    p_verification_type_id int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_id bigint;
    v_user_id uuid;
    v_expiry timestamptz;
    v_used boolean;
    v_type_id int;
    v_email_type_id int;
BEGIN

IF p_token IS NULL AND p_otp IS NULL THEN
    RAISE EXCEPTION 'TOKEN_OR_OTP_REQUIRED';
END IF;

SELECT
    evt.id,
    evt.user_id,
    evt.expires_at,
    evt.is_used,
    evt.verification_type_id
INTO
    v_id,
    v_user_id,
    v_expiry,
    v_used,
    v_type_id
FROM email_verification_table evt
WHERE (p_token IS NOT NULL AND evt.token = p_token)
   OR (p_otp IS NOT NULL AND evt.otp = p_otp)
ORDER BY evt.created_at DESC
LIMIT 1;

IF v_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN';
END IF;

IF p_verification_type_id IS NOT NULL
AND v_type_id <> p_verification_type_id THEN
    RAISE EXCEPTION 'INVALID_TOKEN';
END IF;

IF v_used THEN
    PERFORM a_auth_audit_fn(v_user_id, 'EMAIL_VERIFICATION', 'FAILURE', 'Token already used.'); 
    RAISE EXCEPTION 'TOKEN_ALREADY_USED';
END IF;

IF v_expiry < NOW() THEN
    PERFORM a_auth_audit_fn(v_user_id, 'EMAIL_VERIFICATION', 'FAILURE', 'Token expired.');
    RAISE EXCEPTION 'TOKEN_EXPIRED';
END IF;

UPDATE email_verification_table
SET is_used = TRUE
WHERE id = v_id;

SELECT id
INTO v_email_type_id
FROM verification_types
WHERE name = 'email_verification';

IF v_type_id = v_email_type_id THEN
    UPDATE users
    SET email_verified = TRUE,
        updated_at = NOW()
    WHERE user_id = v_user_id
    AND email_verified = FALSE;
END IF;

PERFORM a_auth_audit_fn(v_user_id, 'EMAIL_VERIFICATION', 'SUCCESS', 'Email verification successful.');

RETURN v_user_id;

END;
$$;



CREATE OR REPLACE FUNCTION auth_change_password(
    p_user_id uuid,
    p_new_password varchar
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE users
SET
    password = p_new_password,
    updated_at = NOW()
WHERE user_id = p_user_id;

IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
END IF;

RETURN TRUE;

END;
$$;



CREATE OR REPLACE FUNCTION auth_reset_password(
    p_token text,
    p_new_password varchar
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_id bigint;
    v_user_id uuid;
    v_expiry timestamptz;
    v_used boolean;
BEGIN

SELECT
    evt.id,
    evt.user_id,
    evt.expires_at,
    evt.is_used
INTO
    v_id,
    v_user_id,
    v_expiry,
    v_used
FROM email_verification_table evt
JOIN verification_types vt
ON vt.id = evt.verification_type_id
WHERE vt.name = 'password_reset'
AND evt.token = p_token
ORDER BY evt.created_at DESC
LIMIT 1;

IF v_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN';
END IF;

IF v_used THEN
    RAISE EXCEPTION 'TOKEN_ALREADY_USED';
END IF;

IF v_expiry < NOW() THEN
    RAISE EXCEPTION 'TOKEN_EXPIRED';
END IF;

UPDATE email_verification_table
SET is_used = TRUE
WHERE id = v_id;

UPDATE users
SET password = p_new_password,
    updated_at = NOW()
WHERE user_id = v_user_id;

RETURN TRUE;

END;
$$;