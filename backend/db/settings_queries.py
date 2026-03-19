from db.connection import fn_fetchone, fn_fetchall, fn_scalar, fetchone, fetchscalar

def get_blood_groups(active_only: bool = False):
    return fn_fetchall("o_get_blood_groups", [active_only])

def insert_blood_group(value: str):
    return fn_scalar("o_insert_blood_group", [value])

def get_genders():
    return fn_fetchall("o_get_genders", [])

def insert_gender(value: str):
    return fn_scalar("o_insert_gender", [value])

def get_specializations(active_only: bool = False):
    return fn_fetchall("o_get_specializations", [active_only])

def insert_specialization(name: str, description: str = None):
    return fn_scalar("o_insert_specialization", [name, description])

def toggle_specialization(spec_id: int, is_active: bool):
    return fn_scalar("o_toggle_specialization", [spec_id, is_active])

def get_qualifications(active_only: bool = False):
    return fn_fetchall("o_get_qualifications", [active_only])

def insert_qualification(code: str, name: str):
    return fn_scalar("o_insert_qualification", [code, name])

def toggle_qualification(qual_id: int, is_active: bool):
    return fn_scalar("o_toggle_qualification", [qual_id, is_active])

def get_verification_types():
    return fn_fetchall("o_get_verification_types", [])

def insert_verification_type(name: str, description: str = None):
    return fn_scalar("o_insert_verification_type", [name, description])

def get_user_roles():
    return fn_fetchall("o_get_user_roles", [])

def insert_user_role(role: str, description: str = None):
    return fn_scalar("o_insert_user_role", [role, description])
