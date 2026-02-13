# Hospital_Management\backend\patient\patient_service\db.py
from django.db import connection

def fetch_one(query, params=None):
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        row = cursor.fetchone()
        if not row:
            return 0
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, row))
    

def fetch_all(query, params=None):
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        columns = [col[0] for col in cursor.description]
        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

def execute(query, params = None):
    with connection.cursor() as cursor:
        cursor.execute(query, params)