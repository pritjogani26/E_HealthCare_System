# Quick Start Guide

## Running the Application

### Backend (Django)
```bash
cd backend
python manage.py runserver
```
✅ Server will start on: http://localhost:8000

### Frontend (React)
```bash
cd frontend
npm start
```
✅ Will start on: http://localhost:3000 (or http://localhost:3001 if 3000 is busy)

---

## Testing the Application

### 1. Registration
- Visit: http://localhost:3001/registration
- Choose role: Patient, Doctor, or Lab
- Fill in the form
- **Test duplicate email**: Use `pritjogani2003@gmail.com` to see error handling
- **Test new user**: Use any new email like `test@example.com`

### 2. Login
- Visit: http://localhost:3001/
- Use credentials:
  - Email: `pritjogani2003@gmail.com`
  - Password: `Prit@269`

### 3. Profile
- After login, click on your profile avatar in the top right
- Click "My Profile" to view your profile details

### 4. Logout
- Click on profile avatar
- Click "Sign Out"
- You'll be redirected to home page

---

## API Endpoints

### Authentication
- `POST /api/auth/register/patient/` - Register patient
- `POST /api/auth/register/doctor/` - Register doctor
- `POST /api/auth/register/lab/` - Register lab
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout (requires auth)

### Profile
- `GET /api/profile/me/` - Get current user profile (requires auth)
- `GET /api/profile/patient/` - Get patient profile (requires auth)
- `GET /api/profile/doctor/` - Get doctor profile (requires auth)
- `GET /api/profile/lab/` - Get lab profile (requires auth)

### Supporting Data
- `GET /api/blood-groups/` - Get all blood groups
- `GET /api/genders/` - Get all genders
- `GET /api/qualifications/` - Get all qualifications

### Admin (requires admin/staff role)
- `GET /api/admin/patients/` - List all patients
- `GET /api/admin/doctors/` - List all doctors
- `GET /api/admin/labs/` - List all labs

---

## Testing with curl

### Get Blood Groups
```bash
curl http://localhost:8000/api/blood-groups/
```

### Register Patient (will fail - duplicate email)
```bash
curl -X POST http://localhost:8000/api/auth/register/patient/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pritjogani2003@gmail.com",
    "password": "Test@1234",
    "password_confirm": "Test@1234",
    "full_name": "Test User",
    "mobile": "1234567890",
    "gender": "M"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pritjogani2003@gmail.com",
    "password": "Prit@269"
  }'
```

---

## Testing with Python

Run the automated test script:
```bash
cd backend
python test_api.py
```

This will test:
- ✅ All supporting data endpoints
- ✅ Patient registration (duplicate email)
- ✅ Patient registration (new user)
- ✅ Login
- ✅ Profile retrieval
- ✅ Logout

---

## Project Structure

```
New folder/
├── backend/
│   ├── backend/          # Django project settings
│   ├── users/            # User authentication app
│   │   ├── models.py     # User, Patient, Doctor, Lab models
│   │   ├── serializers.py # API serializers
│   │   ├── views.py      # API views
│   │   └── urls.py       # API routes
│   ├── manage.py
│   ├── requirements.txt
│   └── test_api.py       # API testing script
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx       # Header with profile dropdown
    │   │   ├── Footer.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Dashboard.tsx
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── RegistrationPage.tsx  # Multi-role registration
    │   │   ├── ProfilePage.tsx       # User profile
    │   │   └── Admin*.tsx
    │   ├── services/
    │   │   └── api.ts           # API service with error handling
    │   ├── context/
    │   │   └── AuthContext.tsx  # Authentication state
    │   └── App.tsx
    ├── package.json
    └── tsconfig.json
```

---

## Features Implemented

### ✅ Multi-Role Registration
- Patient, Doctor, and Lab registration
- Dynamic form fields based on role
- Dropdowns populated from database:
  - Blood groups
  - Genders
  - Qualifications
- Proper validation with specific error messages

### ✅ Authentication
- JWT token-based authentication
- Access token and refresh token
- Token refresh on expiration
- Secure logout with token revocation

### ✅ Profile Management
- View current user profile
- Role-based profile display
- Shows user details, account status, creation date

### ✅ Error Handling
- Specific error messages (e.g., "A user with this email already exists")
- User-friendly error display
- Backend validation errors properly displayed in frontend

### ✅ UI/UX
- Profile dropdown in header
- Logout button with proper cleanup
- Responsive design
- Loading states
- Success/Error feedback

---

## Troubleshooting

### Backend not starting
```bash
# Install dependencies
pip install -r requirements.txt

# Check for errors
python manage.py check

# Run migrations if needed
python manage.py migrate
```

### Frontend not starting
```bash
# Install dependencies
npm install

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
- Backend: Change port in `python manage.py runserver 8001`
- Frontend: React will prompt to use another port (press Y)

---

## Next Steps

1. ✅ Add more profile fields editing
2. ✅ Implement doctor verification workflow
3. ✅ Add appointment booking system
4. ✅ Implement lab test management
5. ✅ Add admin dashboard for user management
6. ✅ Implement email verification
7. ✅ Add password reset functionality
8. ✅ Implement two-factor authentication

---

## Support

For issues or questions:
1. Check PROJECT_ANALYSIS.md for detailed information
2. Review backend/test_api.py for API examples
3. Check browser console for frontend errors
4. Check terminal for backend errors
