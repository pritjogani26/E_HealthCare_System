import sys
import os
import django

sys.path.append(r"e:\E-Health Care\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection

tables_path = r"e:\E-Health Care\backend\users\sql_tables_and_funs\tables\doctor_tables.sql"
funs_path = r"e:\E-Health Care\backend\users\sql_tables_and_funs\functions\prescription_functions.sql"

with open(tables_path, "r", encoding="utf-8") as f:
    tables_sql = f.read()

with open(funs_path, "r", encoding="utf-8") as f:
    funs_sql = f.read()

# Split statements on semicolons that are not inside dollar-quoted blocks
# and execute each individually so multi-statement files work correctly.
def split_sql(sql: str):
    """Yield non-empty SQL statements from a multi-statement script."""
    in_dollar_quote = False
    current: list[str] = []
    lines = sql.splitlines(keepends=True)
    for line in lines:
        stripped = line.strip()
        # Track dollar-quoting ($$) used by PL/pgSQL function bodies
        if "$$" in stripped:
            count = stripped.count("$$")
            for _ in range(count):
                in_dollar_quote = not in_dollar_quote
        current.append(line)
        # A semicolon outside a dollar-quote block ends a statement
        if not in_dollar_quote and stripped.endswith(";"):
            stmt = "".join(current).strip()
            if stmt and not stmt.startswith("--"):
                yield stmt
            current = []
    # Yield any leftover
    remainder = "".join(current).strip()
    if remainder and not remainder.startswith("--"):
        yield remainder


with connection.cursor() as cur:
    print("=== Running prescription tables ===")
    for stmt in split_sql(tables_sql):
        try:
            cur.execute(stmt)
        except Exception as e:
            print(f"  [SKIP/ERROR] {str(e)[:120]}")

    print("=== Running prescription functions ===")
    for stmt in split_sql(funs_sql):
        try:
            cur.execute(stmt)
        except Exception as e:
            print(f"  [ERROR] {str(e)[:120]}")

    print("SQL files executed successfully!")
