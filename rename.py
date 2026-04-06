import os
import sys
import django

project_dir = r"e:\New_Folder\backend"
sys.path.append(project_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection, transaction

sql = """
DO $$ 
BEGIN 
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='lab_tests' and column_name='report_time') THEN
    ALTER TABLE public.lab_tests RENAME COLUMN report_time TO turnaround_hours;
  END IF;
END $$;
"""

with connection.cursor() as cursor:
    cursor.execute(sql)
transaction.commit()

print("Renamed report_time to turnaround_hours (COMMITTED).")
