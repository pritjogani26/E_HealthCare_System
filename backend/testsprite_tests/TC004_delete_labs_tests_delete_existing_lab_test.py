import requests

BASE_URL = "http://localhost:8000/api/"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6IjY5OTRlZDhlLWQzMDItNGQ0My1iODY2LTZhYTI4ZjM1M2E0MiIsImVtYWlsIjoicHJpdGpvZ2FuaTI2MDlAZ21haWwuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJpc19hY3RpdmUiOnRydWUsImlhdCI6MTc3NTQ1NDU5OSwiZXhwIjoxNzc1NDU1NDk5fQ.4YOC7YkFMLnDQcGc0zjhit2CHEZy-1ppn0J0ZL5qov4"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
TIMEOUT = 30

def test_delete_labs_tests_delete_existing_lab_test():
    # First create a new lab test to get a valid test_id to delete
    create_payload = {
        "test_code": "DELTC004",
        "test_name": "Test Delete Lab Test TC004",
        "category_id": 1,
        "price": 10.0,
        "sample_type": "Blood"
    }
    test_id = None

    # Attempt to delete without auth header to verify 401 Unauthorized
    try:
        # Create resource
        create_resp = requests.post(
            f"{BASE_URL}labs/tests/",
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Expected 201 on create, got {create_resp.status_code}"
        create_data = create_resp.json()
        assert create_data.get("success") is True
        assert "data" in create_data
        # Using 'test_id' as ID field from data (fallback to 'id' if not present)
        if "test_id" in create_data["data"]:
            test_id = create_data["data"]["test_id"]
        elif "id" in create_data["data"]:
            test_id = create_data["data"]["id"]
        else:
            assert False, "Created test data missing 'test_id' or 'id' field"

        # Delete without Authorization header to verify 401 Unauthorized error
        delete_resp_no_auth = requests.delete(f"{BASE_URL}labs/tests/{test_id}/", timeout=TIMEOUT)
        assert delete_resp_no_auth.status_code == 401, f"Expected 401 without auth, got {delete_resp_no_auth.status_code}"

        # Now delete with auth header
        delete_resp = requests.delete(f"{BASE_URL}labs/tests/{test_id}/", headers=HEADERS, timeout=TIMEOUT)
        assert delete_resp.status_code == 200, f"Expected 200 on delete, got {delete_resp.status_code}"
        delete_data = delete_resp.json()
        assert delete_data.get("success") is True, "Delete success flag not true"
        assert isinstance(delete_data.get("message"), str) and len(delete_data["message"]) > 0, "Delete message missing or empty"

    finally:
        # Cleanup: In case the test was not deleted, delete it now with auth
        if test_id is not None:
            requests.delete(f"{BASE_URL}labs/tests/{test_id}/", headers=HEADERS, timeout=TIMEOUT)

test_delete_labs_tests_delete_existing_lab_test()