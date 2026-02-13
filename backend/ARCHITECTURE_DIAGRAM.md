# Backend Architecture Diagram

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                            │
│                     React/TypeScript Application                     │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ HTTP Requests (REST API)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DJANGO BACKEND                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    VIEWS LAYER (Thin Controllers)           │    │
│  │  - PatientRegistrationView                                  │    │
│  │  - LoginView, LogoutView                                    │    │
│  │  - PatientProfileView, DoctorProfileView                    │    │
│  │  - AdminVerifyDoctorView, etc.                             │    │
│  │                                                              │    │
│  │  Responsibilities:                                           │    │
│  │  ✓ Validate HTTP requests                                   │    │
│  │  ✓ Call service layer methods                               │    │
│  │  ✓ Format HTTP responses                                    │    │
│  └────────────────┬───────────────────────────┬─────────────────┘    │
│                   │                           │                       │
│                   ▼                           ▼                       │
│  ┌────────────────────────────┐  ┌──────────────────────────┐       │
│  │   PERMISSIONS LAYER        │  │    HELPERS LAYER          │       │
│  │  - IsAdminOrStaff          │  │  - set_auth_response...   │       │
│  │  - IsPatient               │  │  - set_refresh_token...   │       │
│  │  - IsDoctor                │  │  - get_profile_by_role    │       │
│  │  - IsLab                   │  └──────────────────────────┘       │
│  └────────────────────────────┘                                      │
│                   │                                                   │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    SERVICES LAYER (Business Logic)          │     │
│  │                                                              │     │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐     │     │
│  │  │  AuthService        │  │  RegistrationService    │     │     │
│  │  ├─────────────────────┤  ├─────────────────────────┤     │     │
│  │  │ - check_lockout     │  │ - register_patient      │     │     │
│  │  │ - check_status      │  │ - register_doctor       │     │     │
│  │  │ - authenticate_user │  │ - register_lab          │     │     │
│  │  │ - handle_login      │  └─────────────────────────┘     │     │
│  │  │ - revoke_token      │                                   │     │
│  │  └─────────────────────┘                                   │     │
│  │                                                              │     │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐     │     │
│  │  │  ProfileService     │  │  AdminService           │     │     │
│  │  ├─────────────────────┤  ├─────────────────────────┤     │     │
│  │  │ - get_patient       │  │ - toggle_patient        │     │     │
│  │  │ - get_doctor        │  │ - toggle_doctor         │     │     │
│  │  │ - get_lab           │  │ - verify_doctor         │     │     │
│  │  │ - update_profile    │  │ - verify_lab            │     │     │
│  │  │ - validate_role     │  │ - get_pending_count     │     │     │
│  │  └─────────────────────┘  └─────────────────────────┘     │     │
│  │                                                              │     │
│  │  Responsibilities:                                           │     │
│  │  ✓ Contain all business logic                               │     │
│  │  ✓ Reusable across multiple views                           │     │
│  │  ✓ Testable independently                                   │     │
│  └────────────────┬─────────────────────────────────────────────┘   │
│                   │                                                   │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                  VALIDATORS LAYER                           │     │
│  │  - validate_email_unique                                    │     │
│  │  - validate_mobile_unique                                   │     │
│  │  - validate_phone_unique                                    │     │
│  │  - validate_registration_number_unique                      │     │
│  │  - validate_license_number_unique                           │     │
│  └────────────────┬─────────────────────────────────────────────┘   │
│                   │                                                   │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                SERIALIZERS LAYER (Data Validation)          │     │
│  │  - PatientRegistrationSerializer                            │     │
│  │  - DoctorRegistrationSerializer                             │     │
│  │  - LoginSerializer                                          │     │
│  │  - PatientProfileSerializer, etc.                           │     │
│  │                                                              │     │
│  │  Responsibilities:                                           │     │
│  │  ✓ Validate incoming data                                   │     │
│  │  ✓ Serialize/deserialize data                               │     │
│  │  ✓ Use validators for complex checks                        │     │
│  └────────────────┬─────────────────────────────────────────────┘   │
│                   │                                                   │
│                   ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                     MODELS LAYER (Database)                 │     │
│  │  - User, Patient, Doctor, Lab                               │     │
│  │  - Gender, BloodGroup, Qualification                        │     │
│  │  - UserTokens                                               │     │
│  │                                                              │     │
│  │  Responsibilities:                                           │     │
│  │  ✓ Define database schema                                   │     │
│  │  ✓ Provide ORM interface                                    │     │
│  │  ✓ Manage data relationships                                │     │
│  └────────────────┬─────────────────────────────────────────────┘   │
│                   │                                                   │
└───────────────────┼───────────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   PostgreSQL/MySQL   │
         │      DATABASE        │
         └──────────────────────┘
```

## 🔄 Request Flow Example: User Login

```
1. CLIENT sends POST /api/auth/login/
   ↓
2. VIEWS LAYER: LoginView.post() receives request
   ↓
3. SERIALIZERS: LoginSerializer validates email & password format
   ↓
4. SERVICES: AuthService methods handle business logic
   ├─ check_account_lockout(user)
   ├─ check_account_status(user)
   ├─ authenticate_user(request, email, password)
   └─ handle_successful_login(user)
   ↓
5. HELPERS: Helper functions prepare response
   ├─ get_profile_data_by_role(user)
   └─ set_auth_response_with_tokens(user, data, message)
   ↓
6. VIEWS: Format and return HTTP response with cookie
   ↓
7. CLIENT receives response with access token
```

## 📊 Data Flow Example: Patient Registration

```
1. CLIENT submits registration form
   ↓
2. POST /api/auth/register/patient/
   ↓
3. PatientRegistrationView receives request
   ↓
4. PatientRegistrationSerializer validates data
   ├─ Uses validate_email_unique()
   ├─ Uses validate_mobile_unique()
   └─ Validates all required fields
   ↓
5. RegistrationService.register_patient(serializer)
   ├─ Saves user to database
   ├─ Creates patient profile
   └─ Returns user and patient_data
   ↓
6. Helper creates auth response with tokens
   ↓
7. View returns success response with access token
   └─ Sets refresh token in HTTP-only cookie
   ↓
8. CLIENT receives success response and redirects
```

## 🧩 Code Organization Benefits

### Before Refactoring:
```
views.py (1440 lines)
├─ All business logic mixed in
├─ Duplicate code across views  
├─ Hard to test
├─ Difficult to maintain
└─ No clear separation of concerns
```

### After Refactoring:
```
Organized Structure
├─ services/ (Business Logic)
│   ├─ Each service focused on specific domain
│   ├─ Reusable across multiple views
│   ├─ Easy to test independently
│   └─ Single responsibility principle
│
├─ helpers/ (Utility Functions)
│   ├─ Shared helper functions
│   ├─ DRY principle applied
│   └─ Consistent behavior across app
│
├─ permissions/ (Access Control)
│   ├─ Centralized permission logic
│   ├─ Reusable permission classes
│   └─ Easy to add new permissions
│
├─ validators/ (Data Validation)
│   ├─ Reusable validation functions
│   ├─ Used across serializers
│   └─ Consistent validation logic
│
└─ views.py (HTTP Controllers)
    ├─ Thin controllers (41% smaller)
    ├─ Focus on HTTP concerns
    ├─ Call services for business logic
    └─ Clean and readable
```

## 🎯 Key Principles Applied

1. **Separation of Concerns (SoC)**
   - Views handle HTTP
   - Services handle business logic
   - Models handle data

2. **Don't Repeat Yourself (DRY)**
   - Reusable services
   - Shared validators
   - Common helpers

3. **Single Responsibility Principle (SRP)**
   - Each file has one job
   - Each function has one purpose
   - Clear boundaries

4. **Open/Closed Principle**
   - Open for extension
   - Closed for modification
   - Add new services without changing existing code

## 📝 Maintenance Benefits

### Adding New Features:
```python
# BEFORE: Add code directly to views (messy)
class SomeView:
    def post(self, request):
        # 100 lines of mixed logic

# AFTER: Add to appropriate service (clean)
class SomeService:
    @staticmethod
    def new_feature(data):
        # Business logic here
        
class SomeView:
    def post(self, request):
        result = SomeService.new_feature(request.data)
        return Response(result)
```

### Testing:
```python
# BEFORE: Test entire view (complex)
def test_registration():
    response = client.post('/register/', data)
    # Hard to isolate what went wrong

# AFTER: Test service independently (simple)
def test_registration_service():
    user, data = RegistrationService.register_patient(serializer)
    assert user.role == 'PATIENT'
    assert data['email'] == expected_email
```

## 🚀 Performance Impact

- ✅ **No performance degradation**: Same database queries
- ✅ **Better caching potential**: Service methods can be cached
- ✅ **Easier optimization**: Isolate and optimize specific services
- ✅ **Better code splitting**: Import only what you need

---

This architecture provides a solid foundation for future development and makes the codebase significantly more maintainable and scalable.
