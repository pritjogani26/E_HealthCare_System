# Backend Code Refactoring Documentation

## Overview

The backend codebase has been refactored to follow a service-oriented architecture pattern. This improves code organization, reusability, and maintainability by separating concerns into distinct layers.

## New Directory Structure

```
backend/users/
├── services/              # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py    # Authentication logic
│   ├── registration_service.py  # User registration logic
│   ├── profile_service.py # Profile management logic
│   └── admin_service.py   # Admin operations logic
├── helpers/               # Utility functions
│   ├── __init__.py
│   ├── auth_helpers.py    # Auth-related helpers
│   └── profile_helpers.py # Profile-related helpers
├── permissions/           # Custom permission classes
│   ├── __init__.py
│   └── role_permissions.py # Role-based permissions
├── validators/            # Validation functions
│   ├── __init__.py
│   └── user_validators.py # User data validators
├── views.py               # Refactored views (slim controllers)
├── views_old_backup.py    # Original views backup
├── models.py              # Database models
├── serializers.py         # DRF serializers
├── urls.py                # URL routing
└── utils.py               # JWT utilities
```

## Architecture Layers

### 1. Service Layer (`services/`)

The service layer contains all business logic. This layer is reusable across different views and can be easily tested in isolation.

#### **AuthService** (`auth_service.py`)
- `check_account_lockout(user)` - Validates account lockout status
- `check_account_status(user)` - Validates account active status
- `authenticate_user(request, email, password)` - Authenticates user
- `handle_failed_login(user)` - Manages failed login attempts
- `handle_successful_login(user)` - Resets login counters
- `revoke_refresh_token(refresh_token, user)` - Revokes tokens

#### **RegistrationService** (`registration_service.py`)
- `register_patient(serializer)` - Handles patient registration
- `register_doctor(serializer)` - Handles doctor registration
- `register_lab(serializer)` - Handles lab registration

#### **ProfileService** (`profile_service.py`)
- `get_patient_profile(user)` - Retrieves patient profile
- `get_doctor_profile(user)` - Retrieves doctor profile
- `get_lab_profile(user)` - Retrieves lab profile
- `validate_user_role(user, required_role)` - Validates user role
- `update_patient_profile(patient, serializer)` - Updates patient
- `update_doctor_profile(doctor, serializer)` - Updates doctor
- `update_lab_profile(lab, serializer)` - Updates lab

#### **AdminService** (`admin_service.py`)
- `toggle_patient_status(patient)` - Activates/deactivates patient
- `toggle_doctor_status(doctor)` - Activates/deactivates doctor
- `verify_doctor(doctor, status, notes, verified_by)` - Verifies doctor
- `verify_lab(lab, status, notes, verified_by)` - Verifies lab
- `get_pending_approvals_count()` - Gets pending approval counts

### 2. Helper Functions (`helpers/`)

Reusable utility functions that can be used across the application.

#### **auth_helpers.py**
- `set_auth_response_with_tokens(user, user_data, message)` - Creates auth response with tokens
- `set_refresh_token_cookie(response, refresh_token)` - Sets HTTP-only cookie

#### **profile_helpers.py**
- `get_profile_data_by_role(user)` - Returns profile data based on user role

### 3. Permissions (`permissions/`)

Custom permission classes for role-based access control.

#### **role_permissions.py**
- `IsAdminOrStaff` - Allows admin/staff access only
- `IsPatient` - Allows patient access only
- `IsDoctor` - Allows doctor access only
- `IsLab` - Allows lab access only

### 4. Validators (`validators/`)

Reusable validation functions for data integrity.

#### **user_validators.py**
- `validate_email_unique(email)` - Ensures email uniqueness
- `validate_mobile_unique(mobile)` - Ensures mobile uniqueness
- `validate_phone_unique(phone_number)` - Ensures phone uniqueness
- `validate_registration_number_unique(registration_number)` - Ensures registration number uniqueness
- `validate_license_number_unique(license_number)` - Ensures license number uniqueness

### 5. Views Layer (`views.py`)

Views are now slim controllers that:
1. Validate incoming requests
2. Call appropriate service methods
3. Return formatted responses

**Example Before:**
```python
def post(self, request):
    serializer = self.get_serializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        patient = Patient.objects.get(user=user)
        patient_data = PatientProfileSerializer(patient).data
        tokens = generate_tokens(user)
        # ... more logic
```

**Example After:**
```python
def post(self, request):
    serializer = self.get_serializer(data=request.data)
    if serializer.is_valid():
        # Service handles all business logic
        user, patient_data = RegistrationService.register_patient(serializer)
        response_dict, refresh_token = set_auth_response_with_tokens(
            user, patient_data, "Patient registered successfully"
        )
        # ... return response
```

## Benefits of Refactoring

### 1. **Improved Code Organization**
- Clear separation of concerns
- Easy to locate specific functionality
- Logical grouping of related code

### 2. **Enhanced Reusability**
- Service methods can be used across multiple views
- Validators can be shared across serializers
- Helpers reduce code duplication

### 3. **Better Maintainability**
- Smaller, focused files are easier to maintain
- Changes to business logic are centralized
- Less risk of breaking unrelated functionality

### 4. **Easier Testing**
- Services can be unit tested independently
- Mock dependencies easily in tests
- Better test coverage

### 5. **Scalability**
- Easy to add new services or helpers
- Can extend functionality without modifying existing code
- Follows SOLID principles

## Usage Examples

### Example 1: Using AuthService in Views

```python
# Check account lockout
is_locked, message = AuthService.check_account_lockout(user)
if is_locked:
    return Response({"message": message}, status=403)

# Authenticate user
authenticated_user = AuthService.authenticate_user(request, email, password)
```

### Example 2: Using ProfileService

```python
# Get patient profile
patient = ProfileService.get_patient_profile(user)

# Validate user role
if not ProfileService.validate_user_role(user, UserRole.PATIENT):
    return Response({"message": "Access denied"}, status=403)

# Update profile
updated_data = ProfileService.update_patient_profile(patient, serializer)
```

### Example 3: Using Validators in Serializers

```python
from users.validators import validate_email_unique, validate_mobile_unique

class PatientRegistrationSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        return validate_email_unique(value)
    
    def validate_mobile(self, value):
        return validate_mobile_unique(value)
```

### Example 4: Using Custom Permissions

```python
from users.permissions import IsAdminOrStaff, IsDoctor

class AdminOnlyView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
class DoctorOnlyView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsDoctor]
```

## Migration Guide

If you need to add new functionality:

### Adding a New Service Method:

1. Identify the appropriate service file (or create a new one)
2. Add the method with clear documentation
3. Update the service's `__init__.py` if needed
4. Use the method in your view

```python
# In services/profile_service.py
@staticmethod
def get_active_patients():
    """Get all active patients."""
    return Patient.objects.filter(is_active=True)

# In views.py
class ActivePatientsView(generics.ListAPIView):
    def get_queryset(self):
        return ProfileService.get_active_patients()
```

### Adding a New Helper Function:

1. Add to appropriate helper file
2. Update helper's `__init__.py`
3. Import and use in views

```python
# In helpers/auth_helpers.py
def send_welcome_email(user):
    """Send welcome email to new user."""
    # Implementation

# Export in helpers/__init__.py
from .auth_helpers import send_welcome_email

# Use in views
send_welcome_email(user)
```

### Adding a New Permission:

1. Add to `permissions/role_permissions.py`
2. Update `permissions/__init__.py`
3. Use in view's `permission_classes`

```python
# In permissions/role_permissions.py
class IsVerifiedDoctor(BasePermission):
    def has_permission(self, request, view):
        return (request.user.role == UserRole.DOCTOR and 
                request.user.doctor_profile.verification_status == 'VERIFIED')

# Use in views
permission_classes = [IsAuthenticated, IsVerifiedDoctor]
```

## File Size Comparison

**Before Refactoring:**
- `views.py`: 1440 lines, 51KB

**After Refactoring:**
- `views.py`: ~850 lines, 30KB
- `services/`: 4 files, ~500 lines combined
- `helpers/`: 2 files, ~100 lines combined
- `permissions/`: 1 file, ~50 lines
- `validators/`: 1 file, ~90 lines

**Total:** More organized, easier to navigate, and more maintainable.

## Best Practices

1. **Service Methods Should Be Static**
   - Most service methods don't need instance state
   - Use `@staticmethod` decorator

2. **Keep Views Thin**
   - Views should primarily handle HTTP concerns
   - Business logic belongs in services

3. **Single Responsibility**
   - Each service/helper should have one clear purpose
   - Don't mix unrelated functionality

4. **Clear Documentation**
   - Document what each method does
   - Include parameter and return type information

5. **Error Handling**
   - Services can raise exceptions
   - Views should catch and format errors appropriately

## Testing

With the refactored structure, testing becomes easier:

```python
# Test services independently
def test_register_patient():
    serializer = MockSerializer()
    user, data = RegistrationService.register_patient(serializer)
    assert user.role == UserRole.PATIENT

# Test helpers
def test_get_profile_by_role():
    user = create_test_user(role=UserRole.DOCTOR)
    profile = get_profile_data_by_role(user)
    assert 'doctor_id' in profile

# Test validators
def test_email_unique_validation():
    with pytest.raises(ValidationError):
        validate_email_unique('existing@email.com')
```

## Conclusion

This refactoring significantly improves the codebase by:
- Reducing file complexity (1440 lines → 850 lines in main views.py)
- Improving code reusability across the application
- Making the codebase easier to understand and maintain
- Facilitating easier testing and debugging
- Following industry best practices and design patterns

All existing functionality remains intact, with the added benefit of better organization and maintainability.
