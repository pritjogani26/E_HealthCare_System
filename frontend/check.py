import os
import sys
import django
import json

project_dir = r"e:\New_Folder\backend"
sys.path.append(project_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection

out = []
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT proname, pg_get_function_arguments(p.oid) 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname LIKE 'l_%' AND n.nspname = 'public';
    """)
    result = cursor.fetchall()
    for row in result:
        out.append(f"{row[0]}({row[1]})")

with open('db_funcs.txt', 'w', encoding='utf-8') as f:
    for line in out:
        f.write(line + "\n")
