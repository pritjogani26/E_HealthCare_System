import uuid

from db.connection import fn_scalar, fn_fetchall

def get_recent_activity(limit: int = 100) -> list:
    rows = fn_fetchall("o_get_audit_logs", [limit])
    return rows



from db.connection import fn_scalar


def insert_auth_audit(user_id, action, status, reason=None):
    fn_scalar(
                "a_auth_audit_fn",
                [user_id, action, status, reason],
            )
    


def insert_patient_audit(user_id, action, status, targeted_user_id=None, old_data = None, new_data = None, reason=None):
    fn_scalar(
                "a_patient_audit_insert_fn",
                [user_id, action, status, targeted_user_id, old_data, new_data, reason],
            )
    