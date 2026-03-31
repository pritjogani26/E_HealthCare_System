CREATE TABLE IF NOT EXISTS public.patients
(
    full_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    date_of_birth date,
    mobile character varying(15) COLLATE pg_catalog."default" NOT NULL,
    emergency_contact_name character varying(255) COLLATE pg_catalog."default",
    emergency_contact_phone character varying(15) COLLATE pg_catalog."default",
    profile_image character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    blood_group_id integer,
    gender_id integer,
    patient_id uuid NOT NULL,
    CONSTRAINT patients_pkey PRIMARY KEY (patient_id),
    CONSTRAINT patients_user_id_key UNIQUE (patient_id),
    CONSTRAINT patients_blood_group_id_81adc630_fk_blood_groups_blood_group_id FOREIGN KEY (blood_group_id)
        REFERENCES public.blood_groups (blood_group_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT patients_gender_id_8a67e84f_fk_genders_gender_id FOREIGN KEY (gender_id)
        REFERENCES public.genders (gender_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT patients_user_id_11c42fa7_fk_users_user_id FOREIGN KEY (patient_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        DEFERRABLE INITIALLY DEFERRED
);