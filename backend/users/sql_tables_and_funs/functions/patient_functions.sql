CREATE OR REPLACE FUNCTION p_get_full_patient_profile(
    p_patient_id uuid
)
RETURNS TABLE(
    patient_id              uuid,
    email                   varchar,
    email_verified          boolean,
    is_active               boolean,

    full_name               varchar,
    date_of_birth           date,
    mobile                  varchar,
    emergency_contact_name  varchar,
    emergency_contact_phone varchar,
    profile_image           varchar,

    address_line            text,
    city                    varchar,
    state                   varchar,
    pincode                 varchar,

    blood_group             varchar,
    gender                  varchar,

    created_at              timestamptz,
    updated_at              timestamptz,
    last_login_at           timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        u.email,
        u.email_verified,
        u.is_active,

        p.full_name,
        p.date_of_birth,
        p.mobile,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.profile_image,

        a.address_line,
        a.city,
        a.state,
        a.pincode,

        bg.blood_group_value,
        g.gender_value,

        p.created_at,
        u.updated_at,
        u.last_login_at

    FROM patients p
    JOIN users u
        ON u.user_id = p.patient_id
    LEFT JOIN addresses a
        ON a.user_id = p.patient_id
    LEFT JOIN blood_groups bg
        ON bg.blood_group_id = p.blood_group_id
    LEFT JOIN genders g
        ON g.gender_id = p.gender_id
    WHERE p.patient_id = p_patient_id;
END;
$$;


CREATE OR REPLACE FUNCTION p_list_patients()
RETURNS TABLE(
    patient_id uuid,
    full_name varchar,
    email varchar,
    mobile varchar,
    blood_group varchar,
    gender varchar,
    is_active boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY
SELECT
    p.patient_id,
    p.full_name,
    u.email,
    p.mobile,
    bg.blood_group_value,
    g.gender_value,
    u.is_active,
    p.created_at
FROM patients p
JOIN users u
    ON u.user_id = p.patient_id
LEFT JOIN blood_groups bg
    ON bg.blood_group_id = p.blood_group_id
LEFT JOIN genders g
    ON g.gender_id = p.gender_id
ORDER BY p.created_at DESC;

END;
$$;



CREATE OR REPLACE FUNCTION p_update_patient_profile(
    p_patient_id              uuid,
    p_full_name               varchar DEFAULT NULL,
    p_date_of_birth           date    DEFAULT NULL,
    p_mobile                  varchar DEFAULT NULL,
    p_emergency_contact_name  varchar DEFAULT NULL,
    p_emergency_contact_phone varchar DEFAULT NULL,
    p_profile_image           varchar DEFAULT NULL,
    p_blood_group_id          int     DEFAULT NULL,
    p_gender_id               int     DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM patients WHERE patient_id = p_patient_id
    ) THEN
        RAISE EXCEPTION 'PATIENT_NOT_FOUND';
    END IF;

    IF p_full_name IS NULL AND p_date_of_birth IS NULL AND
       p_mobile IS NULL AND p_emergency_contact_name IS NULL AND
       p_emergency_contact_phone IS NULL AND p_profile_image IS NULL AND
       p_blood_group_id IS NULL AND p_gender_id IS NULL THEN
        RAISE EXCEPTION 'NO_FIELDS_TO_UPDATE: At least one field must be provided';
    END IF;

    IF p_date_of_birth IS NOT NULL AND p_date_of_birth > CURRENT_DATE THEN
        RAISE EXCEPTION 'INVALID_DATE_OF_BIRTH: date cannot be in the future';
    END IF;

    IF p_blood_group_id IS NOT NULL AND
       NOT EXISTS (SELECT 1 FROM blood_groups WHERE blood_group_id = p_blood_group_id) THEN
        RAISE EXCEPTION 'INVALID_BLOOD_GROUP_ID: %', p_blood_group_id;
    END IF;

    IF p_gender_id IS NOT NULL AND
       NOT EXISTS (SELECT 1 FROM genders WHERE gender_id = p_gender_id) THEN
        RAISE EXCEPTION 'INVALID_GENDER_ID: %', p_gender_id;
    END IF;

    UPDATE patients
    SET
        full_name               = COALESCE(p_full_name, full_name),
        date_of_birth           = COALESCE(p_date_of_birth, date_of_birth),
        mobile                  = COALESCE(p_mobile, mobile),
        emergency_contact_name  = COALESCE(p_emergency_contact_name, emergency_contact_name),
        emergency_contact_phone = COALESCE(p_emergency_contact_phone, emergency_contact_phone),
        profile_image           = COALESCE(p_profile_image, profile_image),
        blood_group_id          = COALESCE(p_blood_group_id, blood_group_id),
        gender_id               = COALESCE(p_gender_id, gender_id),
        updated_at              = NOW()
    WHERE patient_id = p_patient_id;

    RETURN TRUE;
END;
$$;