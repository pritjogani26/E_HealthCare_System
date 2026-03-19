-- Roles

CREATE OR REPLACE FUNCTION r_create_role(
    p_role             VARCHAR(30),
    p_role_description TEXT        DEFAULT NULL,
    p_created_by       UUID        DEFAULT NULL
)
RETURNS public.user_roles AS $$
DECLARE
    v_row public.user_roles;
BEGIN
    INSERT INTO public.user_roles (role, role_description, created_by, updated_by)
    VALUES (UPPER(TRIM(p_role)), p_role_description, p_created_by, p_created_by)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_get_all_roles()
RETURNS SETOF public.user_roles AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.user_roles
    ORDER BY role_id ASC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_get_role_by_id(p_role_id INT)
RETURNS public.user_roles AS $$
DECLARE
    v_row public.user_roles;
BEGIN
    SELECT * INTO v_row
    FROM public.user_roles
    WHERE role_id = p_role_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role with ID % not found', p_role_id;
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_update_role(
    p_role_id          INT,
    p_role             VARCHAR(30) DEFAULT NULL,
    p_role_description TEXT        DEFAULT NULL,
    p_updated_by       UUID        DEFAULT NULL
)
RETURNS public.user_roles AS $$
DECLARE
    v_row public.user_roles;
BEGIN
    UPDATE public.user_roles
    SET
        role             = COALESCE(UPPER(TRIM(p_role)), role),
        role_description = COALESCE(p_role_description, role_description),
        updated_by       = p_updated_by,
        updated_at       = now()
    WHERE role_id = p_role_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role with ID % not found', p_role_id;
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_delete_role(p_role_id INT)
RETURNS TEXT AS $$
BEGIN
    DELETE FROM public.user_roles WHERE role_id = p_role_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role with ID % not found', p_role_id;
    END IF;

    RETURN FORMAT('Role %s deleted successfully', p_role_id);
END;
$$ LANGUAGE plpgsql;




-- permission
CREATE OR REPLACE FUNCTION r_create_permission(
    p_module      VARCHAR(50),
    p_action      VARCHAR(50),
    p_description VARCHAR(255) DEFAULT NULL
)
RETURNS permissions AS $$
DECLARE
    v_row permissions;
BEGIN
    INSERT INTO permissions (module, action, description)
    VALUES (LOWER(TRIM(p_module)), LOWER(TRIM(p_action)), p_description)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_get_permissions(p_module VARCHAR(50) DEFAULT NULL)
RETURNS SETOF permissions AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM permissions
    WHERE (p_module IS NULL OR module = LOWER(TRIM(p_module)))
    ORDER BY module, action;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_update_permission(
    p_permission_id INT,
    p_description   VARCHAR(255) DEFAULT NULL
)
RETURNS permissions AS $$
DECLARE
    v_row permissions;
BEGIN
    UPDATE permissions
    SET
        description = COALESCE(p_description, description),
        updated_at  = now()
    WHERE permission_id = p_permission_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission with ID % not found', p_permission_id;
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_delete_permission(p_permission_id INT)
RETURNS TEXT AS $$
BEGIN
    DELETE FROM permissions WHERE permission_id = p_permission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission with ID % not found', p_permission_id;
    END IF;

    RETURN FORMAT('Permission %s deleted successfully', p_permission_id);
END;
$$ LANGUAGE plpgsql;



-- permission to a role

CREATE OR REPLACE FUNCTION r_grant_permission_to_role(
    p_role_id       INT,
    p_permission_id INT,
    p_grant_by      UUID DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO role_permissions (role_id, permission_id, grant_by)
    VALUES (p_role_id, p_permission_id, p_grant_by)
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RETURN FORMAT('Permission %s granted to role %s', p_permission_id, p_role_id);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_grant_permissions_to_role(
    p_role_id        INT,
    p_permission_ids INT[],
    p_grant_by       UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_pid INT;
BEGIN
    FOREACH v_pid IN ARRAY p_permission_ids LOOP
        INSERT INTO role_permissions (role_id, permission_id, grant_by)
        VALUES (p_role_id, v_pid, p_grant_by)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    RETURN FORMAT('%s permissions granted to role %s', array_length(p_permission_ids, 1), p_role_id);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_revoke_permission_from_role(
    p_role_id       INT,
    p_permission_id INT
)
RETURNS TEXT AS $$
BEGIN
    DELETE FROM role_permissions
    WHERE role_id = p_role_id AND permission_id = p_permission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission % is not assigned to role %', p_permission_id, p_role_id;
    END IF;

    RETURN FORMAT('Permission %s revoked from role %s', p_permission_id, p_role_id);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_get_permissions_by_role(p_role_id INT)
RETURNS TABLE (
    permission_id INT,
    module        VARCHAR(50),
    action        VARCHAR(50),
    description   VARCHAR(255),
    grant_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.permission_id,
        p.module,
        p.action,
        p.description,
        rp.grant_at
    FROM role_permissions rp
    JOIN permissions p ON p.permission_id = rp.permission_id
    WHERE rp.role_id = p_role_id
    ORDER BY p.module, p.action;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_role_has_permission(
    p_role_id INT,
    p_module  VARCHAR(50),
    p_action  VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE rp.role_id = p_role_id
          AND p.module   = LOWER(TRIM(p_module))
          AND p.action   = LOWER(TRIM(p_action))
    );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION r_sync_role_permissions(
    p_role_id        INT,
    p_permission_ids INT[],
    p_grant_by       UUID DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    DELETE FROM role_permissions WHERE role_id = p_role_id;

    INSERT INTO role_permissions (role_id, permission_id, grant_by)
    SELECT p_role_id, UNNEST(p_permission_ids), p_grant_by
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RETURN FORMAT('Role %s synced with %s permissions', p_role_id, array_length(p_permission_ids, 1));
END;
$$ LANGUAGE plpgsql;