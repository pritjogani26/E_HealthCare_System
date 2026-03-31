CREATE OR REPLACE FUNCTION register_patient_user(
    u_email varchar,
    u_full_name varchar,
    u_date_of_birth date,
    u_mobile varchar,
    u_emergency_contact_name varchar,
    u_emergency_contact_phone varchar,
    u_profile_image varchar,
    u_blood_group_id int,
    u_gender_id int,
    u_password varchar DEFAULT NULL,
    u_oauth_provider varchar DEFAULT NULL,
    u_oauth_provider_id varchar DEFAULT NULL
)
RETURNS Table (
    user_id uuid,
    email varchar,
    is_active boolean,
    email_verified boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_role_id int;
    v_email_verified boolean;
BEGIN

IF NOT (
    (u_password IS NOT NULL AND u_oauth_provider_id IS NULL)
    OR
    (u_password IS NULL AND u_oauth_provider_id IS NOT NULL)
) THEN
    RAISE EXCEPTION 'INVALID_AUTH_METHOD';
END IF;

IF EXISTS (SELECT 1 FROM users u WHERE u.email = u_email) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS';
END IF;

SELECT ur.role_id INTO v_role_id
FROM user_roles ur
WHERE ur.role = 'PATIENT';

IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
END IF;

v_user_id := gen_random_uuid();
v_email_verified := FALSE;

IF u_oauth_provider_id IS NOT NULL AND u_oauth_provider IS NOT NULL THEN
    v_email_verified := TRUE;
END IF;


INSERT INTO users (
    user_id,
    email,
    password,
    oauth_provider,
    oauth_provider_id,
    email_verified,
    is_active,
    two_factor_enabled,
    failed_login_attempts,
    role_id,
    created_at,
    updated_at
)
VALUES (
    v_user_id,
    u_email,
    u_password,
    u_oauth_provider,
    u_oauth_provider_id,
    v_email_verified,
    TRUE,
    FALSE,
    0,
    v_role_id,
    NOW(),
    NOW()
);

INSERT INTO patients (
    patient_id,
    full_name,
    date_of_birth,
    mobile,
    emergency_contact_name,
    emergency_contact_phone,
    profile_image,
    blood_group_id,
    gender_id,
    created_at,
    updated_at
)
VALUES (
    v_user_id,
    u_full_name,
    u_date_of_birth,
    u_mobile,
    u_emergency_contact_name,
    u_emergency_contact_phone,
    u_profile_image,
    u_blood_group_id,
    u_gender_id,
    NOW(),
    NOW()
);

RETURN QUERY
    SELECT u.user_id, u.email, u.is_active, u.email_verified FROM users u WHERE u.user_id = v_user_id;
END;
$$;




CREATE OR REPLACE FUNCTION register_doctor_user(
    u_email varchar,
    u_full_name varchar,
    u_experience_years numeric,
    u_phone_number varchar,
    u_consultation_fee numeric,
    u_registration_number varchar,
    u_profile_image varchar,
    u_gender_id int,
    u_password varchar DEFAULT NULL,
    u_oauth_provider varchar DEFAULT NULL,
    u_oauth_provider_id varchar DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    email varchar,
    is_active boolean,
    email_verified boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_role_id int;
    v_email_verified boolean;
BEGIN

IF NOT (
    (u_password IS NOT NULL AND u_oauth_provider_id IS NULL)
    OR
    (u_password IS NULL AND u_oauth_provider_id IS NOT NULL)
) THEN
    RAISE EXCEPTION 'INVALID_AUTH_METHOD';
END IF;

IF EXISTS (SELECT 1 FROM users u WHERE u.email = u_email) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS';
END IF;

IF EXISTS (SELECT 1 FROM doctors d WHERE d.registration_number = u_registration_number) THEN
    RAISE EXCEPTION 'REGISTRATION_NUMBER_EXISTS';
END IF;

SELECT ur.role_id INTO v_role_id
FROM user_roles ur
WHERE ur.role = 'DOCTOR';

IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
END IF;

v_user_id := gen_random_uuid();
v_email_verified := FALSE;

IF u_oauth_provider_id IS NOT NULL AND u_oauth_provider IS NOT NULL THEN
    v_email_verified := TRUE;
END IF;

INSERT INTO users (
    user_id, email, password, oauth_provider, oauth_provider_id,
    email_verified, is_active, two_factor_enabled, failed_login_attempts,
    role_id, created_at, updated_at
)
VALUES (
    v_user_id, u_email, u_password, u_oauth_provider, u_oauth_provider_id,
    v_email_verified, TRUE, FALSE, 0, v_role_id, NOW(), NOW()
);

INSERT INTO doctors (
    doctor_id, full_name, experience_years, phone_number, consultation_fee,
    registration_number, profile_image, gender_id,
    verification_status, created_at, updated_at
)
VALUES (
    v_user_id, u_full_name, u_experience_years, u_phone_number, u_consultation_fee,
    u_registration_number, u_profile_image, u_gender_id,
    'PENDING', NOW(), NOW()
);

RETURN QUERY
    SELECT u.user_id, u.email, u.is_active, u.email_verified
    FROM users u
    WHERE u.user_id = v_user_id;
END;
$$;



CREATE OR REPLACE FUNCTION register_lab_user(
    u_email varchar,
    u_lab_name varchar,
    u_license_number varchar,
    u_phone_number varchar,
    u_lab_logo varchar,
    u_password varchar DEFAULT NULL,
    u_oauth_provider varchar DEFAULT NULL,
    u_oauth_provider_id varchar DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_role_id int;
BEGIN

IF NOT (
    (u_password IS NOT NULL AND u_oauth_provider_id IS NULL)
    OR
    (u_password IS NULL AND u_oauth_provider_id IS NOT NULL)
) THEN
    RAISE EXCEPTION 'INVALID_AUTH_METHOD';
END IF;

IF EXISTS (SELECT 1 FROM users WHERE email = u_email) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS';
END IF;

IF EXISTS (SELECT 1 FROM labs WHERE license_number = u_license_number) THEN
    RAISE EXCEPTION 'LICENSE_ALREADY_EXISTS';
END IF;

SELECT role_id INTO v_role_id
FROM user_roles
WHERE role = 'LAB_TECHNICIAN';

IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'ROLE_NOT_FOUND';
END IF;

v_user_id := gen_random_uuid();

INSERT INTO users (
    user_id,
    email,
    password,
    oauth_provider,
    oauth_provider_id,
    email_verified,
    is_active,
    two_factor_enabled,
    failed_login_attempts,
    role_id,
    created_at,
    updated_at
)
VALUES (
    v_user_id,
    u_email,
    u_password,
    u_oauth_provider,
    u_oauth_provider_id,
    FALSE,
    TRUE,
    FALSE,
    0,
    v_role_id,
    NOW(),
    NOW()
);

INSERT INTO labs (
    lab_id,
    lab_name,
    license_number,
    phone_number,
    lab_logo,
    verification_status,
    created_at,
    updated_at
)
VALUES (
    v_user_id,
    u_lab_name,
    u_license_number,
    u_phone_number,
    u_lab_logo,
    'pending',
    NOW(),
    NOW()
);

RETURN v_user_id;

END;
$$;