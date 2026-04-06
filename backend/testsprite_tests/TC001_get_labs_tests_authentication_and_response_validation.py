import requests

BASE_URL = "http://localhost:8000/labs/tests/"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6IjY5OTRlZDhlLWQzMDItNGQ0My1iODY2LTZhYTI4ZjM1M2E0MiIsImVtYWlsIjoicHJpdGpvZ2FuaTI2MDlAZ21haWwuY29tIiwicm9sZSI6IlNVUEVSQURNSU4iLCJpc19hY3RpdmUiOnRydWUsImlhdCI6MTc3NTQ1NDU5OSwiZXhwIjoxNzc1NDU1NDk5fQ.4YOC7YkFMLnDQcGc0zjhit2CHEZy-1ppn0J0ZL5qov4"
HEADERS_AUTH = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_get_labs_tests_authentication_and_response_validation():
    # Attempt request without auth header, expect 401 Unauthorized
    try:
        resp_no_auth = requests.get(BASE_URL, timeout=TIMEOUT)
        assert resp_no_auth.status_code == 401, f"Expected 401 Unauthorized without token, got {resp_no_auth.status_code}"
    except requests.RequestException as e:
        assert False, f"Request without auth failed unexpectedly: {e}"

    # Attempt request with valid Authorization header
    try:
        resp_auth = requests.get(BASE_URL, headers=HEADERS_AUTH, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Authenticated request failed unexpectedly: {e}"

    assert resp_auth.status_code == 200, f"Expected status 200, got {resp_auth.status_code}"

    try:
        json_resp = resp_auth.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response keys and types
    assert "success" in json_resp, "'success' key missing in response"
    assert isinstance(json_resp["success"], bool), "'success' should be boolean"
    assert "data" in json_resp, "'data' key missing in response"
    assert isinstance(json_resp["data"], list), "'data' should be a list"
    assert "total_count" in json_resp, "'total_count' key missing in response"
    assert isinstance(json_resp["total_count"], int), "'total_count' should be integer"

test_get_labs_tests_authentication_and_response_validation()