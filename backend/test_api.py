"""
Test script for backend API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_supporting_data():
    """Test endpoints for blood groups, genders, and qualifications"""
    print("\n=== Testing Supporting Data Endpoints ===")
    
    # Test blood groups
    print("\n1. Testing /api/blood-groups/")
    response = requests.get(f"{BASE_URL}/blood-groups/")
    print(f"Status: {response.status_code}")
    data = response.json()
    if 'results' in data:
        print(f"Blood groups found: {len(data['results'])}")
        for bg in data['results'][:3]:
            print(f"  - {bg.get('blood_group_value')}")
    
    # Test genders
    print("\n2. Testing /api/genders/")
    response = requests.get(f"{BASE_URL}/genders/")
    print(f"Status: {response.status_code}")
    data = response.json()
    if 'results' in data:
        print(f"Genders found: {len(data['results'])}")
        for g in data['results']:
            print(f"  - {g.get('gender_value')} (ID: {g.get('gender_id')})")
    
    # Test qualifications
    print("\n3. Testing /api/qualifications/")
    response = requests.get(f"{BASE_URL}/qualifications/")
    print(f"Status: {response.status_code}")
    data = response.json()
    if 'results' in data:
        print(f"Qualifications found: {len(data['results'])}")
        for q in data['results'][:3]:
            print(f"  - {q.get('qualification_name')}")

def test_patient_registration_duplicate():
    """Test patient registration with duplicate email"""
    print("\n=== Testing Patient Registration (Duplicate Email) ===")
    
    payload = {
        "email": "pritjogani2003@gmail.com",
        "password": "Prit@269",
        "password_confirm": "Prit@269",
        "full_name": "Test User",
        "mobile": "9999999999",
        "date_of_birth": "2000-01-01",
        "gender": "M",
        "blood_group_id": 1,
        "address": "Test Address",
        "city": "Test City",
        "state": "Test State",
        "pincode": "123456"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/patient/", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 400:
        data = response.json()
        if 'errors' in data and 'email' in data['errors']:
            print(f"\n✓ Error message correctly shows: {data['errors']['email']}")

def test_patient_registration_new():
    """Test patient registration with new email"""
    print("\n=== Testing Patient Registration (New Email) ===")
    
    import time
    email = f"test{int(time.time())}@example.com"
    
    payload = {
        "email": email,
        "password": "Test@1234",
        "password_confirm": "Test@1234",
        "full_name": "Test User",
        "mobile": f"{int(time.time())}",
        "date_of_birth": "2000-01-01",
        "gender": "M",
        "blood_group_id": 1,
        "address": "Test Address",
        "city": "Test City",
        "state": "Test State",
        "pincode": "123456"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/patient/", json=payload)
    print(f"Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 201:
        print(f"✓ Registration successful!")
        print(f"  Email: {email}")
        print(f"✓ Tokens received: {list(data.get('data', {}).get('tokens', {}).keys())}")
        return data.get('data', {}).get('tokens', {})
    else:
        print(f"Response: {json.dumps(data, indent=2)}")
        return None

def test_login(email, password):
    """Test login functionality"""
    print("\n=== Testing Login ===")
    
    payload = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    print(f"Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print(f"✓ Login successful!")
        print(f"✓ Tokens received: {list(data.get('data', {}).get('tokens', {}).keys())}")
        return data.get('data', {}).get('tokens', {})
    else:
        print(f"Response: {json.dumps(data, indent=2)}")
        return None

def test_profile(access_token):
    """Test profile retrieval"""
    print("\n=== Testing Profile Retrieval ===")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}/profile/me/", headers=headers)
    print(f"Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print(f"✓ Profile retrieved successfully!")
        profile = data.get('data', {})
        print(f"  Full Name: {profile.get('full_name')}")
        print(f"  Email: {profile.get('user', {}).get('email')}")
    else:
        print(f"Response: {json.dumps(data, indent=2)}")

def test_logout(access_token, refresh_token):
    """Test logout functionality"""
    print("\n=== Testing Logout ===")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    payload = {
        "refresh_token": refresh_token
    }
    
    response = requests.post(f"{BASE_URL}/auth/logout/", json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print(f"✓ Logout successful!")
    else:
        print(f"Response: {json.dumps(data, indent=2)}")

if __name__ == "__main__":
    print("=" * 60)
    print("BACKEND API INTEGRATION TEST")
    print("=" * 60)
    
    # Test supporting data endpoints
    test_supporting_data()
    
    # Test duplicate email registration
    test_patient_registration_duplicate()
    
    # Test new user registration
    tokens = test_patient_registration_new()
    
    if tokens:
        access_token = tokens.get('access_token')
        refresh_token = tokens.get('refresh_token')
        
        # Test profile
        test_profile(access_token)
        
        # Test logout
        test_logout(access_token, refresh_token)
    
    # Test login with existing user
    tokens2 = test_login("pritjogani2003@gmail.com", "Prit@269")
    if tokens2:
        test_profile(tokens2.get('access_token'))
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
