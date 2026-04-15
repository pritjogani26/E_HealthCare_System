-- backend\users\sql_tables_and_funs\tables\audit_tables.sql
CREATE TABLE audit_logs (
    audit_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          UUID NOT NULL,
    targeted_user_id UUID,
    table_name       VARCHAR(100),          -- e.g. 'users', 'orders', 'invoices'
    row_id        	VARCHAR(255),          -- ID of the affected row
    action           VARCHAR(100) NOT NULL, -- e.g. 'INSERT', 'UPDATE', 'DELETE'
    status           VARCHAR(50)  NOT NULL, -- e.g. 'SUCCESS', 'FAILURE'
    old_data         JSONB,
    new_data         JSONB,
    failure_reason   TEXT,
    ip_address       INET,
    user_agent       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
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