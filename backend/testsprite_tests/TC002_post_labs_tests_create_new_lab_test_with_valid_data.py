import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6IjY5OTRlZDhlLWQzMDItNGQ0My1iODY2LTZhYTI4ZjM1M2E0MiIsImVtYWlsIjoicHJpdGpvZ2FuaTI2MDlAZ21haWwuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJpc19hY3RpdmUiOnRydWUsImlhdCI6MTc3NTQ1NDU5OSwiZXhwIjoxNzc1NDU1NDk5fQ.4YOC7YkFMLnDQcGc0zjhit2CHEZy-1ppn0J0ZL5qov4"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_post_labs_tests_create_new_lab_test_with_valid_data():
    url = BASE_URL + "/labs/tests/"
    payload = {
        "test_code": "CBC001",
        "test_name": "Complete Blood Count",
        "category_id": 2,
        "price": 25.00,
        "sample_type": "Blood"
    }
    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=30)
        assert response.status_code == 201, f"Expected status 201, got {response.status_code}"
        json_resp = response.json()
        assert isinstance(json_resp, dict), "Response is not a JSON object"
        assert "success" in json_resp, "'success' key missing in response"
        assert json_resp["success"] is True, "Success flag is not True"
        assert "data" in json_resp, "'data' key missing in response"
        data = json_resp["data"]
        assert isinstance(data, dict), "'data' is not an object"
        for field in ["test_code", "test_name", "category_id", "price", "sample_type"]:
            assert field in data, f"Field '{field}' missing in response data"
        assert data["test_code"] == payload["test_code"], "test_code does not match"
        assert data["test_name"] == payload["test_name"], "test_name does not match"
        assert data["category_id"] == payload["category_id"], "category_id does not match"
        assert data["price"] == payload["price"], "price does not match"
        assert data["sample_type"] == payload["sample_type"], "sample_type does not match"
        assert "message" in json_resp, "'message' key missing in response"
        assert isinstance(json_resp["message"], str) and len(json_resp["message"]) > 0, "Message is empty or not a string"
    finally:
        # Cleanup: delete the created test if the creation was successful
        if 'json_resp' in locals() and json_resp.get("success") and "data" in json_resp and "id" in json_resp["data"]:
            test_id = json_resp["data"]["id"]
            del_url = f"{BASE_URL}/labs/tests/{test_id}/"
            try:
                del_resp = requests.delete(del_url, headers=HEADERS, timeout=30)
                assert del_resp.status_code == 200, f"Expected 200 on delete, got {del_resp.status_code}"
                del_json = del_resp.json()
                assert del_json.get("success") is True, "Delete success flag not True"
            except Exception:
                # If deletion fails, just pass to not mask original test errors
                pass

test_post_labs_tests_create_new_lab_test_with_valid_data()