import os
import sys
import django

project_dir = r"e:\New_Folder\backend"
sys.path.append(project_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection, transaction

sql_file = r"e:\New_Folder\backend\users\sql_tables_and_funs\functions\lab_functions\lab_test_fun.sql"

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    with connection.cursor() as cursor:
        cursor.execute(sql)
    transaction.commit()
    print("SUCCESS: lab_test_fun.sql executed and COMMITTED successfully.")
except Exception as e:
    print(f"FAILED: {e}")
