# Healthcare Management Platform

A full-stack healthcare management platform with role-based workflows for patients, doctors, labs, and administrators. The project combines a Django REST backend, a React TypeScript frontend, and a PostgreSQL database layer built heavily around custom SQL tables and functions.

## Overview

This project supports:

- Patient registration, login, profile management, and appointment booking
- Doctor registration, verification, schedule management, and appointment handling
- Lab registration, verification, lab test catalog management, slot generation, and test bookings
- Admin and superadmin dashboards for verification, user management, audit activity, and role/permission control
- Email verification, password reset, JWT authentication, refresh-token cookie flow, and Google OAuth login

## Tech Stack

### Frontend

- React 19
- TypeScript
- React Router
- TanStack Query
- Axios
- Formik + Yup
- Tailwind CSS
- React Hot Toast
- Google OAuth for React

### Backend

- Django 5
- Django REST Framework
- `django-cors-headers`
- PyJWT-based custom authentication
- Waitress for production-style serving on Windows

### Database and Integrations

- PostgreSQL
- Custom SQL functions and table scripts under `backend/users/sql_tables_and_funs/`
- SMTP email flow
- Google OAuth token verification

## Architecture

The repo is split into three main areas:

- `frontend/`: React application for user-facing UI
- `backend/`: Django API server and domain logic
- `scripts/`: helper scripts for code collection and SQL execution

The backend does **not** rely primarily on standard Django ORM models for business entities. Instead, it uses:

- thin Django/DRF views
- serializers for request/response validation
- service modules for business rules
- query modules under `backend/users/database_queries/`
- SQL tables/functions stored as `.sql` files

This means the database layer is a core part of the application design and should be treated as part of the source code, not just infrastructure.

## Major Functional Areas

### Authentication and Security

- Email/password login
- Google login
- Refresh-token rotation using cookies
- Email verification
- Forgot-password and reset-password flow
- Inactivity timeout and re-authentication support on the frontend
- Custom exception middleware and consistent JSON error responses

### Role-Based Access

Roles visible in the project include:

- `PATIENT`
- `DOCTOR`
- `ADMIN`
- `STAFF`
- `SUPERADMIN`
- lab role support exists in both frontend and backend, though naming differs in places:
  - frontend commonly uses `LAB`
  - backend `UserRole` currently defines `LAB_TECHNICIAN`

The system also includes RBAC endpoints for listing roles, listing permissions, and granting/revoking/syncing role permissions.

### Patient Features

- register as a patient
- manage profile
- browse doctors
- view available doctor slots
- book appointments
- cancel appointments
- book lab tests
- view personal lab bookings and reports

### Doctor Features

- register as a doctor
- upload/update profile data
- manage qualification and specialization details
- manage schedule and generate slots
- view appointments

### Lab Features

- register as a lab
- maintain lab profile
- define lab test categories and tests
- define test parameters
- generate available lab slots
- accept patient bookings
- mark bookings complete
- upload booking reports

### Admin Features

- view patients, doctors, and labs
- activate/deactivate user accounts
- verify/reject doctors and labs
- see pending approval counts
- view recent audit activity
- manage settings data such as genders, blood groups, qualifications, verification types, and roles
- manage role permissions

## Repository Structure

```text
E:\New_Folder
|-- backend/
|   |-- backend/                   # Django project config
|   |-- users/
|   |   |-- views/                # API endpoints
|   |   |-- serializers/          # input/output validation
|   |   |-- services/             # business logic
|   |   |-- database_queries/     # SQL execution modules
|   |   |-- sql_tables_and_funs/  # SQL schema and database functions
|   |   |-- permissions/
|   |   |-- middleware/
|   |   |-- helpers/
|   |-- manage.py
|   |-- serve.py                  # Waitress entrypoint
|-- frontend/
|   |-- src/
|   |   |-- pages/
|   |   |-- components/
|   |   |-- services/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- validation/
|   |   |-- utils/
|   |-- public/
|   |-- package.json
|-- scripts/
|-- requirements.txt
|-- Run.txt
```

## Key Backend Entry Points

- API root is mounted at `/api/`
- backend URL configuration: `backend/backend/urls.py`
- app routes: `backend/users/urls.py`
- Waitress entrypoint: `backend/serve.py`
- Django settings: `backend/backend/settings.py`

Example local backend base URL:

```text
http://localhost:8000/api
```

## Key Frontend Entry Points

- app root: `frontend/src/App.tsx`
- auth state: `frontend/src/context/AuthContext.tsx`
- shared HTTP client: `frontend/src/services/api.ts`
- admin dashboard UI: `frontend/src/components/Dashboard.tsx`

The frontend defaults to:

```text
REACT_APP_API_URL=http://localhost:8000/api
```

if no environment variable is provided.

## API Surface Summary

The project exposes a fairly broad API. Major groups include:

- `users/auth/*`
  - login
  - google login
  - logout
  - token refresh
  - email verification
  - resend verification
  - forgot/reset password
- `users/profile/*`
  - current profile
  - admin/staff profile
- `users/admin/*`
  - list patients/doctors/labs
  - toggle status
  - verify doctor/lab
  - pending approvals count
  - recent activity
- `users/settings/*`
  - blood groups
  - genders
  - specializations
  - qualifications
  - verification types
  - roles
- `users/rbac/*`
  - roles
  - permissions
  - role permission assignment/sync
- `patients/*`
  - registration
  - patient profile
- `doctors/*`
  - registration
  - public doctor list/detail
  - slot listing/generation
  - appointments
- `labs/*`
  - registration
  - profile
  - categories
  - tests
  - test parameters
  - bookings
  - reports
  - slots

## Database Design Notes

This project is database-centric.

Important folders:

- `backend/users/sql_tables_and_funs/tables/`
- `backend/users/sql_tables_and_funs/functions/`
- `backend/users/sql_tables_and_funs/functions/lab_functions/`

The backend query helpers in `backend/users/database_queries/connection.py` execute raw SQL and SQL functions through Django database connections. Because of that:

- database schema and SQL functions must exist before major features work
- API behavior depends on the PostgreSQL function contracts
- onboarding is incomplete unless the database initialization process is documented and run

## Environment Variables

The backend reads configuration from environment variables through `python-dotenv`.

### Backend

Create a `.env` file in or above the backend settings resolution path with values like:

```env
SECRET_KEY=change-me
DEBUG=True
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
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=your-email@example.com

FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend

Create `frontend/.env` with:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Local Setup

### 1. Create and activate Python virtual environment

Windows PowerShell:

```powershell
cd E:\New_Folder
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Install frontend dependencies

```powershell
cd E:\New_Folder\frontend
npm install
```

### 3. Prepare PostgreSQL

At minimum, ensure:

- PostgreSQL is running
- the configured database exists
- the SQL table scripts and SQL function scripts have been applied

The repo contains SQL assets, but no single fully documented bootstrap command was found during analysis, so database setup may currently require manually applying the SQL files or using the helper script in `scripts/execute_sql.py`.

### 4. Run the backend

Development server:

```powershell
cd E:\New_Folder\backend
..\venv\Scripts\python.exe manage.py runserver
```

Waitress server:

```powershell
cd E:\New_Folder\backend
..\venv\Scripts\python.exe serve.py
```

### 5. Run the frontend

```powershell
cd E:\New_Folder\frontend
npm start
```

## Typical Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Django admin: `http://localhost:8000/admin/`

## Scripts and Utilities

The repo includes helper scripts such as:

- `scripts/execute_sql.py`
- `scripts/collect_backend_code.py`
- `scripts/collect_frontend_code.py`
- `scripts/test.py`
- `backend/serve.py`
- `Run.txt` for some Windows/NSSM and Waitress notes

## Testing

Visible testing-related assets include:

- Django default-style test file: `backend/users/tests.py`
- frontend React test stubs
- generated or external test artifacts under `backend/testsprite_tests/`

There is no single documented project-wide test workflow in the repo root yet. Recommended starting points:

```powershell
cd E:\New_Folder\backend
..\venv\Scripts\python.exe manage.py test
```

```powershell
cd E:\New_Folder\frontend
npm test
```

## Observations and Project Caveats

These are worth knowing before extending the project:

- The backend uses custom query modules and SQL functions extensively, so schema drift can break the app even when Python code looks fine.
- There are signs of active development and local debugging code in a few files, such as console logging and print statements.
- Role naming for lab users is not perfectly consistent between frontend and backend.
- Some operational knowledge currently lives in `Run.txt` rather than structured docs.
- The root project previously lacked a consolidated README, so setup knowledge may still be partly tribal/manual.

## Recommended Improvements

If you continue maintaining this project, the next documentation wins would be:

- add a repeatable database bootstrap script
- provide sample seed data
- document the exact order for applying SQL files
- add a root `.env.example`
- add a proper API reference or OpenAPI schema
- document deployment steps separately for development and production

## License

No license file was found during analysis. Add one if this project is meant to be shared or distributed.
