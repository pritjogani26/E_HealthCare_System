CREATE TABLE IF NOT EXISTS public.audit_logs
(
    log_id bigint NOT NULL DEFAULT nextval('audit_logs_log_id_seq'::regclass),
    performed_by_id uuid,
    target_user_id uuid,
    action character varying(40) COLLATE pg_catalog."default" NOT NULL,
    details text COLLATE pg_catalog."default" NOT NULL,
    status character varying(10) COLLATE pg_catalog."default" NOT NULL DEFAULT 'SUCCESS'::character varying,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    entity_type integer DEFAULT 4,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id),
    CONSTRAINT audit_logs_performed_by_id_fkey FOREIGN KEY (performed_by_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);


-- USER_LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, TOKEN_REFRESH | ACCOUNT_LOCKED
-- drop table audit_auth;
create table audit_auth (
    audit_id bigserial primary key,
    user_id uuid NOT NULL, --ref user id

    action VARCHAR(30),
    status VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),

    failure_reason TEXT,
    created_at timestamptz not null default now()
);


-- drop table audit_patients;
create table audit_patients (
    audit_id bigserial primary key,
    user_id uuid, -- ref user id
    targeted_user_id uuid, -- ref user id

    action varchar(30) NOT NULL, -- REGISTER | TOGGLE_STATUS | UPDATE_PROFILE | ACTIVE/INACTIVE 
    status VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),

    old_data JSONB,
    new_data JSONB,

    failure_reason TEXT,
    created_at timestamptz not null default now()
);

-- drop table audit_doctor;
create table audit_doctor (
    audit_id bigserial primary key,
    user_id uuid, -- ref user id
    targeted_user_id uuid, -- ref user id

    action VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),

    old_data JSONB,
    new_data JSONB,

    failure_reason TEXT,
    created_at timestamptz not null default now()
);

drop table audit_lab;
create table audit_lab (
    audit_id bigserial primary key,
    user_id uuid, -- ref user id
    targeted_user_id uuid, -- ref user id

    action VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),

    old_data JSONB,
    new_data JSONB,

    failure_reason TEXT,
    created_at timestamptz not null default now()
);

-- drop table audit_admin;
create table if not exists audit_admin (
    audit_id bigserial primary key,
    user_id uuid, -- ref user id
    targeted_user_id uuid, -- ref user id
    
    action VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),

    old_data JSONB,
    new_data JSONB,

    failure_reason TEXT,
    created_at timestamptz not null default now()
);
