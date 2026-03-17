CREATE TABLE IF NOT EXISTS public.audit_logs
(
    log_id bigint NOT NULL DEFAULT nextval('audit_logs_log_id_seq'::regclass),
    performed_by_id uuid,
    target_user_id uuid,
    action character varying(40) COLLATE pg_catalog."default" NOT NULL,
    entity_type character varying(20) COLLATE pg_catalog."default",
    details text COLLATE pg_catalog."default" NOT NULL,
    status character varying(10) COLLATE pg_catalog."default" NOT NULL DEFAULT 'SUCCESS'::character varying,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id),
    CONSTRAINT audit_logs_performed_by_id_fkey FOREIGN KEY (performed_by_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)
