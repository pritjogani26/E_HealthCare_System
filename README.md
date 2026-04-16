# E-Health Care Platform

Full-stack healthcare platform for multi-role care operations: patient onboarding, doctor appointments, lab test workflows, admin verification, RBAC controls, and online payments.

## Project Snapshot

- Multi-role support: `PATIENT`, `DOCTOR`, `LAB`, `ADMIN`, `STAFF`, `SUPERADMIN`
- Authentication: JWT access + refresh-cookie flow, Google OAuth, email verification, forgot/reset password
- Clinical workflows: doctor slot/appointment management and complete lab test booking lifecycle
- Admin operations: user verification, activation/deactivation, audit activity, settings master data
- Payments: Razorpay order creation, payment verification, refunds, payment history, webhook handling

## Tech Stack

### Frontend (`frontend/`)

- React 19 + TypeScript
- React Router
- TanStack Query
- Axios
- Formik + Yup
- Tailwind CSS
- React Hot Toast

### Backend (`backend/`)

- Django 5
- Django REST Framework
- `django-cors-headers`
- Custom PyJWT authentication
- Waitress server support (`backend/serve.py`)

### Database and Integrations

- PostgreSQL
- SQL-first data layer with raw SQL query modules and SQL function scripts
- SMTP email delivery
- Google OAuth token verification
- Razorpay payment gateway

## Architecture

The repository is organized as:

```text
E:\E-Health Care
|-- backend/
|   |-- backend/                   # Django project config
|   |-- users/
|   |   |-- views/                # API endpoints
|   |   |-- serializers/          # validation/response shaping
|   |   |-- services/             # business logic
|   |   |-- database_queries/     # raw SQL execution modules
|   |   |-- sql_tables_and_funs/  # schema + SQL functions
|   |-- manage.py
|   |-- serve.py
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- services/
|   |-- package.json
|-- requirements.txt
|-- PROJECT_EXECUTION_GUIDE.txt
```

The backend follows a `views -> services -> database_queries` design. Most business-critical operations are SQL-driven, so database functions/scripts are part of the core codebase.

## Core Functional Areas

### Authentication and Security

- Email/password login, logout, refresh token, re-auth verification
- Google OAuth login support
- Email verification and resend verification flow
- Forgot-password/reset-password with token verification
- Account lock handling, password validators, custom exception middleware
- Frontend inactivity timeout modal with controlled session continuation/logout

### Role and Permission Control

- Roles managed centrally (including lab role as `LAB`)
- Superadmin-only RBAC APIs
- Role-permission listing, grant, revoke, and sync flows
- Frontend protected routes with role-aware access checks

### Patient Features

- Registration and profile management
- Doctor discovery and slot viewing
- Appointment booking and cancellation
- Lab test booking and booking history
- Access to uploaded lab reports (role-based visibility)

### Doctor Features

- Registration and profile updates
- Schedule slot generation and availability management
- Appointment listing and handling

### Lab Features

- Lab registration/profile and operating-hours setup
- Test categories, tests, and test-parameter management
- Slot generation based on operating hours
- Booking management (list/detail/cancel/complete)
- Report upload and report listing for completed bookings

### Admin and Superadmin Features

- Patient/doctor/lab listing endpoints
- Doctor/lab verification workflows
- Account status toggles for users
- Pending approval counters and recent audit activity
- Settings master data management (blood groups, genders, qualifications, specializations, verification types, user roles)

### Payment Features

- Razorpay order creation
- Payment signature verification
- Refund initiation
- Payment history APIs
- Webhook endpoint for asynchronous payment updates

## API Overview

API base path is mounted at:

```text
http://localhost:8000/api
```

Major route groups:

- `users/auth/*`
- `users/profile/*`
- `users/admin/*`
- `users/settings/*`
- `users/rbac/*`
- `patients/*`
- `doctors/*`
- `labs/*`
- `payments/*`

Primary URL definitions:

- `backend/backend/urls.py`
- `backend/users/urls.py`

## Environment Variables

Backend values are loaded via `python-dotenv` (`backend/backend/settings.py`).

### Backend `.env` (example)

```env
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=project2
DB_USER=postgres
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432

JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
TIME_ZONE=Asia/Kolkata

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@example.com

FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### Frontend `.env` (example)

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

If unset, frontend services default to `http://localhost:8000/api`.

## Local Setup (Windows PowerShell)

### 1) Install Python dependencies

```powershell
cd "E:\E-Health Care"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) Install frontend dependencies

```powershell
cd "E:\E-Health Care\frontend"
npm install
```

### 3) Prepare PostgreSQL database

Before running the app:

- ensure PostgreSQL is running
- create the target database
- apply required SQL table/function scripts from `backend/users/sql_tables_and_funs/`

### 4) Run backend

Development server:

```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe manage.py runserver
```

Waitress server:

```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe serve.py
```

### 5) Run frontend

```powershell
cd "E:\E-Health Care\frontend"
npm start
```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Django admin: `http://localhost:8000/admin/`

## Testing

Backend:

```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe manage.py test
```

Frontend:

```powershell
cd "E:\E-Health Care\frontend"
npm test
```

## Notes

- Some local path references still contain legacy values (for example, `E:\New_Folder`). These should be normalized for fully portable developer tooling.
- SQL bootstrap is required for full functionality; without schema/functions, many APIs will fail at runtime.
