create table if not exists error_logs (
    error_id      serial        primary key,
    error_key     uuid          not null default gen_random_uuid(),
    ref_from      varchar(255),
    description   text,
    created_by    uuid,
    created_at    timestamp     not null default now()
);

select * from error_logs;
create or replace function insert_error_log (
    p_ref_from      varchar  default null,
    p_description   text     default null,
    p_created_by    uuid     default null
)
returns table (
    error_id   int,
    error_key  uuid
)
language plpgsql
as $$
declare
    v_error_id  int;
    v_error_key uuid;
begin
    insert into error_logs (ref_from, description, created_by)
    values (p_ref_from, p_description, p_created_by)
    returning error_logs.error_id, error_logs.error_key
    into v_error_id, v_error_key;

    return query select v_error_id, v_error_key;

exception
    when others then
        raise warning '[insert_error_log] Failed to insert log: %', sqlerrm;
        return;
end;
$$;

create or replace function get_error_logs (
    p_created_by  uuid       default null,
    p_ref_from    varchar    default null,
    p_from        timestamp  default null,
    p_to          timestamp  default now(),
    p_limit       int        default 100
)
returns table (
    error_id     int,
    error_key    uuid,
    ref_from     varchar,
    description  text,
    created_by   uuid,
    created_at   timestamp
)
language plpgsql
as $$
begin
    return query
        select
            el.error_id,
            el.error_key,
            el.ref_from,
            el.description,
            el.created_by,
            el.created_at
        from error_logs el
        where
            (p_created_by is null or el.created_by = p_created_by)
            and (p_ref_from  is null or el.ref_from  ilike '%' || p_ref_from || '%')
            and (p_from      is null or el.created_at >= p_from)
            and (el.created_at <= p_to)
        order by el.created_at desc
        limit p_limit;
end;
$$;


create or replace function get_error_log_by_key (
    p_error_key uuid
)
returns table (
    error_id     int,
    error_key    uuid,
    ref_from     varchar,
    description  text,
    created_by   uuid,
    created_at   timestamp
)
language plpgsql
as $$
begin
    return query
        select
            el.error_id,
            el.error_key,
            el.ref_from,
            el.description,
            el.created_by,
            el.created_at
        from error_logs el
        where el.error_key = p_error_key;
end;
$$;