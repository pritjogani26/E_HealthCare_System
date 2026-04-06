import requests

BASE_URL = "http://localhost:8000/labs/"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6IjY5OTRlZDhlLWQzMDItNGQ0My1iODY2LTZhYTI4ZjM1M2E0MiIsImVtYWlsIjoicHJpdGpvZ2FuaTI2MDlAZ21haWwuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJpc19hY3RpdmUiOnRydWUsImlhdCI6MTc3NTQ1NDU5OSwiZXhwIjoxNzc1NDU1NDk5fQ.4YOC7YkFMLnDQcGc0zjhit2CHEZy-1ppn0J0ZL5qov4"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json",
}

def test_put_labs_tests_update_existing_lab_test():
    import json

    # Step 1: Create a new lab test to update
    create_payload = {
        "test_code": "UTP001",
        "test_name": "Unit Test Put - Initial",
        "category_id": 2,
        "price": 20.00,
        "sample_type": "Blood"
    }
    created_test_id = None
    try:
        create_resp = requests.post(
            f"{BASE_URL}tests/",
            headers=HEADERS,
            json=create_payload,
            timeout=30
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        create_json = create_resp.json()
        assert create_json.get("success") is True, "Create response success should be True"
        data = create_json.get("data")
        assert data, "Create response data should not be empty"
        created_test_id = data.get("id") or data.get("test_id")  # Defensive, if ID key unknown
        assert isinstance(created_test_id, int), "Created test ID should be int"

        # Step 2: Prepare update payload
        update_payload = {
            "price": 30.00,
            "test_name": "Unit Test Put - Updated"
        }

        # Step 3: Update the created lab test
        put_resp = requests.put(
            f"{BASE_URL}tests/{created_test_id}/",
            headers=HEADERS,
            json=update_payload,
            timeout=30
        )
        assert put_resp.status_code == 200, f"Expected 200 OK, got {put_resp.status_code}"
        put_json = put_resp.json()
        assert put_json.get("success") is True, "Update response success should be True"
        updated_data = put_json.get("data")
        assert updated_data, "Update response data should not be empty"
        # Validate updated fields
        assert updated_data.get("price") == update_payload["price"], "Price should be updated"
        assert updated_data.get("test_name") == update_payload["test_name"], "Test name should be updated"
        assert isinstance(put_json.get("message"), str) and len(put_json.get("message")) > 0, "Message should be non-empty string"

    finally:
        # Cleanup: Delete the created test if it was created
        if created_test_id is not None:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}tests/{created_test_id}/",
                    headers=HEADERS,
                    timeout=30
                )
                # It's ok if delete fails here; just attempt cleanup
            except Exception:
                pass


test_put_labs_tests_update_existing_lab_test()