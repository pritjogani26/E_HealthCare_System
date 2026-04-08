# backend\users\database_queries\lab_service_quries.py
from users.database_queries.connection import (
    fn_fetchone,
    fn_fetchall,
    fn_scalar,
)

# --- CATEGORIES ---


def create_lab_test_category(
    category_name: str, description: str, created_by: str
) -> dict:
    return fn_fetchone(
        "l_create_lab_test_category", [category_name, description, str(created_by)]
    )


def update_lab_test_category(
    category_id: int,
    updated_by: str,
    category_name: str = None,
    description: str = None,
    is_active: bool = None,
) -> dict:
    return fn_fetchone(
        "l_update_lab_test_category",
        [category_id, str(updated_by), category_name, description, is_active],
    )


def get_lab_test_category(category_id):
    return fn_fetchone("l_get_lab_test_category", [category_id])


def delete_lab_test_category(category_id: int, deleted_by: str) -> dict:
    return fn_fetchone("l_delete_lab_test_category", [category_id, str(deleted_by)])


def list_lab_test_categories(
    search: str = None, is_active: bool = True, limit: int = 20, offset: int = 0
) -> list:
    return fn_fetchall("l_list_lab_test_categories", [search, is_active, limit, offset])


# --- TESTS ---


def create_lab_test(
    category_id: int,
    test_code: str,
    test_name: str,
    description: str,
    sample_type: str,
    fasting_required: bool,
    fasting_hours: int,
    price: float,
    turnaround_hours: int,
) -> dict:
    return fn_fetchone(
        "l_create_lab_test",
        [
            test_code,
            test_name,
            sample_type,
            category_id,
            description,
            fasting_required,
            fasting_hours,
            price,
            turnaround_hours,
        ],
    )


def update_lab_test(
    test_id: int,
    category_id: int = None,
    test_code: str = None,
    test_name: str = None,
    description: str = None,
    sample_type: str = None,
    fasting_required: bool = None,
    fasting_hours: int = None,
    price: float = None,
    turnaround_hours: int = None,
    is_active: bool = None,
) -> dict:
    return fn_fetchone(
        "l_update_lab_test",
        [
            test_id,
            test_code,
            test_name,
            sample_type,
            category_id,
            description,
            fasting_required,
            fasting_hours,
            False,
            price,
            turnaround_hours,
            is_active,
        ],
    )


def get_details_lab_test(test_id):
    return fn_fetchone("l_list_lab_test", [test_id])


def get_parameters_of_lab_test(test_id):
    return fn_fetchall("l_get_test_parameters", [test_id])


def delete_lab_test(test_id: int, deleted_by: str) -> dict:
    return fn_fetchone("l_delete_lab_test", [test_id, str(deleted_by)])


def list_lab_tests(
    user_id = None,
) -> list:
    return fn_fetchall(
        "l_list_lab_tests",
        [
            user_id,
        ],
    )


def list_lab_tests_by_filter(search: str = None, category_id: int = None, lab_id: str = None) -> list:
    return fn_fetchall(
        "l_get_lab_test_by_filter",
        [
            search,
            category_id,
            lab_id,
        ],
    )