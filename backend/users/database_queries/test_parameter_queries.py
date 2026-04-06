# backend\users\database_queries\test_parameter_queries.py

from users.database_queries.connection import fn_fetchone, fn_fetchall

def create_test_parameter(test_id: int, parameter_name: str, unit: str, normal_range: str) -> dict:
    return fn_fetchone("l_create_test_parameter", [test_id, parameter_name, unit, normal_range])

def update_test_parameter(
    parameter_id: int,
    test_id: int = None,
    parameter_name: str = None,
    unit: str = None,
    normal_range: str = None
) -> dict:
    return fn_fetchone("l_update_test_parameter", [parameter_id, test_id, parameter_name, unit, normal_range])

def delete_test_parameter(parameter_id: int) -> dict:
    return fn_fetchone("l_delete_test_parameter", [parameter_id])

def get_test_parameter(parameter_id: int) -> dict:
    return fn_fetchone("l_get_test_parameter", [parameter_id])

def list_test_parameters(test_id: int = None, limit: int = 20, offset: int = 0) -> list:
    return fn_fetchall("l_list_test_parameters", [test_id, limit, offset])
