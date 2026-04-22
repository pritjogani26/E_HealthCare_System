# 🏥 E-Health Care Platform

<div align="center">

![E-Health Care](https://img.shields.io/badge/E--Health%20Care-Platform-blue?style=for-the-badge&logo=heart&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A comprehensive, full-stack digital healthcare platform enabling seamless interactions between patients, doctors, laboratories, and administrators.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Core Functional Areas](#-core-functional-areas)
- [API Overview](#-api-overview)
- [User Interface](#-user-interface)
  - [Authentication Module](#441-authentication-module)
  - [Admin Module](#442-admin-module)
  - [Doctor Module](#443-doctor-module)
  - [Laboratory Module](#444-laboratory-module)
  - [Patient Module](#445-patient-module)
- [Environment Variables](#-environment-variables)
- [Local Setup](#-local-setup-windows-powershell)
- [Testing](#-testing)

---

## 🌟 Overview

**E-Health Care** is a production-ready, multi-role healthcare management system designed to digitize and streamline end-to-end healthcare workflows. The platform connects patients, doctors, laboratories, and administrators through a unified, role-aware interface — supporting appointment booking, laboratory test management, digital prescriptions, real-time audit tracking, and secure online payments.

### Project Snapshot

| Feature | Details |
|---|---|
| **Roles Supported** | `PATIENT`, `DOCTOR`, `LAB`, `ADMIN`, `STAFF`, `SUPERADMIN` |
| **Authentication** | JWT (access + refresh-cookie), Google OAuth, email verification, forgot/reset password |
| **Clinical Workflows** | Doctor slot/appointment management, complete lab test booking lifecycle |
| **Admin Operations** | User verification, activation/deactivation, audit activity, settings master data |
| **Payments** | Razorpay order creation, payment verification, refunds, payment history, webhook handling |

---

## ✨ Key Features

- 🔐 **Secure Multi-Role Authentication** — JWT-based auth with Google OAuth, email verification, and password recovery
- 📅 **Appointment Management** — End-to-end booking, scheduling, and cancellation workflows
- 🧪 **Lab Test Lifecycle** — Complete lab test booking from search to report delivery
- 💊 **Digital Prescriptions** — Doctors generate PDF prescriptions; patients access them securely
- 💳 **Online Payments** — Razorpay integration with refunds and payment history
- 🛡️ **Role-Based Access Control** — Superadmin-managed permission system
- 📊 **Audit Logging** — Complete system activity tracking with export support
- 📧 **Email Notifications** — SMTP-driven transactional emails for key events

---

## 🛠 Tech Stack

### Frontend (`frontend/`)

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | Core UI framework |
| React Router | Client-side routing |
| TanStack Query | Server state management & caching |
| Axios | HTTP client |
| Formik + Yup | Form handling & validation |
| Tailwind CSS | Utility-first styling |
| React Hot Toast | Notifications |

### Backend (`backend/`)

| Technology | Purpose |
|---|---|
| Django 5 | Web framework |
| Django REST Framework | REST API layer |
| `django-cors-headers` | Cross-origin resource sharing |
| Custom PyJWT | Authentication middleware |
| Waitress | Production WSGI server |

### Database & Integrations

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Raw SQL Layer | SQL-first data access via query modules and SQL functions |
| SMTP | Transactional email delivery |
| Google OAuth | Social authentication |
| Razorpay | Payment gateway |

---

## 🏗 Architecture

```text
E:\E-Health Care
├── backend/
│   ├── backend/                     # Django project config (settings, urls, wsgi)
│   ├── users/
│   │   ├── views/                   # API endpoint handlers
│   │   │   ├── auth_views.py        # Authentication endpoints
│   │   │   ├── admin_user_views.py  # Admin user management
│   │   │   ├── doctor_view.py       # Doctor endpoints
│   │   │   ├── lab_view.py          # Lab endpoints
│   │   │   ├── lab_test_booking.py  # Lab booking lifecycle
│   │   │   ├── patients_view.py     # Patient endpoints
│   │   │   ├── payment_views.py     # Payment endpoints
│   │   │   ├── prescription_view.py # Prescription endpoints
│   │   │   ├── audit_views.py       # Audit log endpoints
│   │   │   └── role_permission_views.py # RBAC endpoints
│   │   ├── serializers/             # Request validation & response shaping
│   │   ├── services/                # Business logic layer
│   │   ├── database_queries/        # Raw SQL execution modules
│   │   └── sql_tables_and_funs/     # PostgreSQL schema + SQL functions
│   ├── manage.py
│   └── serve.py                     # Waitress production server
├── frontend/
│   └── src/
│       ├── pages/                   # Page-level React components
│       ├── components/              # Reusable UI components
│       ├── context/                 # React Context providers
│       ├── hooks/                   # Custom React hooks
│       ├── services/                # API service layer (Axios)
│       ├── types/                   # TypeScript type definitions
│       └── validation/              # Yup validation schemas
├── User Interface/                  # UI screenshots by module
├── requirements.txt
└── PROJECT_EXECUTION_GUIDE.txt
```

> **Design Pattern:** The backend follows a strict `Views → Services → Database Queries` layered architecture. Business-critical operations are SQL-driven, with PostgreSQL functions and scripts as first-class citizens of the codebase.

---

## 🔧 Core Functional Areas

### 🔐 Authentication & Security

- Email/password login, logout, refresh token, and re-authentication verification
- Google OAuth social login support
- Email verification and resend-verification flow
- Forgot-password / reset-password with secure token verification
- Account lock handling, custom password validators, and exception middleware
- Frontend inactivity timeout modal with session continuation and auto-logout

### 🛡️ Role & Permission Control

- Centrally managed roles (`PATIENT`, `DOCTOR`, `LAB`, `ADMIN`, `STAFF`, `SUPERADMIN`)
- Superadmin-only RBAC APIs for full permission governance
- Role-permission listing, grant, revoke, and sync flows
- Frontend protected routes with role-aware access guards

### 👤 Patient Features

- Registration, profile management, and personal health data
- Doctor discovery with specialization filtering and slot availability
- Appointment booking, confirmation, and cancellation
- Lab test search, slot selection (home/lab visit), and booking history
- Access to uploaded lab reports with digital prescription viewing

### 🩺 Doctor Features

- Registration with professional credentials and consultation details
- Schedule slot generation and real-time availability management
- Appointment listing, management, and completion workflow
- Digital prescription generation (PDF via ReportLab) with medicine tracking

### 🧪 Laboratory Features

- Lab registration, profile management, and operating hours configuration
- Test categories, tests, and lab test parameter management
- Slot generation based on configured operating hours
- Booking management (list, detail, cancel, complete)
- Lab report upload and delivery to patients

### 🔑 Admin & Superadmin Features

- Consolidated patient, doctor, and lab management dashboards
- Doctor and lab verification and approval workflows
- Account activation/deactivation toggles for all user types
- Pending approval counters and real-time audit activity monitoring
- Master data management: blood groups, genders, qualifications, specializations, user roles

### 💳 Payment Features

- Razorpay order creation for appointments and lab bookings
- Payment signature verification and webhook handling
- Refund initiation and payment history tracking

---

## 📡 API Overview

**Base URL:**
```
http://localhost:8000/api
```

| Route Group | Description |
|---|---|
| `users/auth/*` | Login, logout, register, token refresh, Google OAuth |
| `users/profile/*` | Profile view & update |
| `users/admin/*` | Admin user listing, verification, activation |
| `users/settings/*` | Master data (blood groups, specializations, etc.) |
| `users/rbac/*` | Role-permission management (Superadmin only) |
| `patients/*` | Patient appointments, lab bookings, prescriptions |
| `doctors/*` | Doctor schedules, appointments, prescriptions |
| `labs/*` | Lab tests, bookings, reports, operating hours |
| `payments/*` | Order creation, verification, refunds, history, webhook |

**Primary URL configurations:**
- `backend/backend/urls.py` — Root URL dispatcher
- `backend/users/urls.py` — Detailed endpoint registration

---

## 🖥️ User Interface

> All screenshots are captured from the live application across five core modules.

---

### 1. Authentication Module

The authentication module provides a secure gateway for all user types — patients, doctors, laboratory staff, and administrators — to access the platform.

---

#### 1.1 Login Page

> Securely sign in to access your healthcare dashboard

![Login Page](User%20Interface/Authentication%20Module/Login%20Page.png)

---

#### 1.2 Patient Registration Page

> Create a patient account with essential medical and personal details

![Patient Registration Page](User%20Interface/Authentication%20Module/Patient%20Registration%20Page.png)

---

#### 1.3 Doctor Registration Page

> Register as a doctor with professional credentials and consultation details

![Doctor Registration Page](User%20Interface/Authentication%20Module/Doctor%20Registration%20Page.png)

---

#### 1.4 Laboratory Registration Page

> Set up a laboratory profile with licensing and operational information

![Laboratory Registration Page](User%20Interface/Authentication%20Module/Laboratory%20Registration%20Page.png)

---

#### 1.5 Forgot Password Page

> Recover your account securely using password reset options

![Forgot Password Page](User%20Interface/Authentication%20Module/Forgot%20Password%20Page.png)

---

### 2. Admin Module

The admin module provides administrators and superadmins with centralized control over all platform users, activities, and system configurations.

---

#### 2.1 Admin Dashboard

> Monitor system activities, user statistics, and audit logs in one place

![Admin Dashboard](User%20Interface/Admin%20Module/Admin%20Dashboard.png)

---

#### 2.2 Patient Management Page

> View and manage all registered patient records

![Patient Management Page](User%20Interface/Admin%20Module/Patient%20Management%20Page.png)

---

#### 2.3 Laboratory Management Page

> Manage laboratory profiles and operational details

![Lab Management Page](User%20Interface/Admin%20Module/Lab%20Management%20Page.png)

---

#### 2.4 Doctor Management Page

> Access and control all registered doctor accounts

![Doctor Management Page](User%20Interface/Admin%20Module/Doctor%20Management%20Page.png)

---

#### 2.5 Pending Approvals Page

> Review and approve new doctor and laboratory registrations

![Pending Approvals Page](User%20Interface/Admin%20Module/Pending%20Approvals%20Page.png)

---

#### 2.6 Audit Logs Page

> Track system activities with options to review and download logs

![Audit Logs Page](User%20Interface/Admin%20Module/Audit%20Logs%20Page.png)

---

#### 2.7 Roles & Permissions Page

> Define and manage access control for different user roles

![Roles & Permissions Page](User%20Interface/Admin%20Module/Roles%20%26%20Permissions%20Page.png)

---

### 3. Doctor Module

The doctor module equips healthcare professionals with tools to manage their schedules, handle appointments, and issue digital prescriptions.

---

#### 3.1 Doctor Dashboard

> Get an overview of appointments, activities, and personal insights

![Doctor Dashboard](User%20Interface/Doctor%20Module/Doctor%20Dashboard.png)

---

#### 3.2 Schedule Management Page

> View and update availability for patient appointments

![Schedule Management Page](User%20Interface/Doctor%20Module/Schedule%20Management%20Page.png)

---

#### 3.3 Appointments Page

> Manage and review all booked patient appointments

![Appointments Page](User%20Interface/Doctor%20Module/Appointments%20Page.png)

---

#### 3.4 Prescription Management Page

> Create and manage digital prescriptions for patients

![Prescription Management Page](User%20Interface/Doctor%20Module/Prescription%20Management%20Page.png)

---

#### 3.5 Doctor Profile Page

> View and update professional and personal information

![Doctor Profile Page](User%20Interface/Doctor%20Module/Doctor%20Profile%20Page.png)

---

### 4. Laboratory Module

The laboratory module enables lab staff to manage their services, handle test bookings, generate reports, and configure operational hours.

---

#### 4.1 Laboratory Dashboard

> Access key insights, bookings, and activity logs

![Laboratory Dashboard](User%20Interface/Laboratory%20Module/Laboratory%20Dashboard.png)

---

#### 4.2 Test Bookings Page

> View and manage all incoming lab test bookings

![Test Bookings Page](User%20Interface/Laboratory%20Module/Test%20Bookings%20Page.png)

---

#### 4.3 Test Report Entry Page

> Enter test results and generate laboratory reports

![Test Report Entry Page](User%20Interface/Laboratory%20Module/Test%20Report%20Entry%20Page.png)

---

#### 4.4 Operating Hours Management Page

> Configure available time slots for lab services

![Operating Hours Management Page](User%20Interface/Laboratory%20Module/Operating%20Hours%20Management%20Page.png)

---

#### 4.5 Lab Test Management Page

> Add, update, or remove laboratory test offerings

![Lab Test Management Page](User%20Interface/Laboratory%20Module/Lab%20Test%20Management%20Page.png)

---

#### 4.6 Test Categories Management Page

> Organize lab tests into categories for better accessibility

![Test Categories Management Page](User%20Interface/Laboratory%20Module/Test%20Categories%20Management%20Page.png)

---

#### 4.7 Laboratory Profile Page

> Manage laboratory information and branding details

![Laboratory Profile Page](User%20Interface/Laboratory%20Module/Laboratory%20Profile%20Page.png)

---

### 5. Patient Module

The patient module empowers patients to discover doctors, book appointments, access lab services, view prescriptions, and manage their health records — all in one place.

---

#### 5.1 Patient Dashboard

> View appointments, reports, and personal health activity

![Patient Dashboard](User%20Interface/Patient%20Module/Patient%20Dashboard.png)

---

#### 5.2 Doctor Listing Page

> Browse and select doctors for appointment booking

![Doctor Listing Page](User%20Interface/Patient%20Module/Doctor%20Listing%20Page.png)

---

#### 5.3 Appointment Slot Selection Page

> Choose available time slots for doctor consultations

![Appointment Slot Selection Page](User%20Interface/Patient%20Module/Appointment%20Slot%20Selection%20Page.png)

---

#### 5.4 Appointment Confirmation Page

> Review and confirm appointment booking details

![Appointment Confirmation Page](User%20Interface/Patient%20Module/Appointment%20Confirmation%20Page.png)

---

#### 5.5 Payment Page

> Complete secure payments for consultations and services

![Payment Page](User%20Interface/Patient%20Module/Payment%20Page.png)

---

#### 5.6 Appointment History Page

> Track past and upcoming doctor appointments

![Appointment History Page](User%20Interface/Patient%20Module/Appointment%20History%20Page.png)

---

#### 5.7 Prescription View Page

> Access prescriptions provided by doctors

![Prescription View Page](User%20Interface/Patient%20Module/Prescription%20View%20Page.png)

---

#### 5.8 Lab Test Booking Page

> Search and select lab tests based on categories and laboratories

![Lab Test Booking Page](User%20Interface/Patient%20Module/Lab%20Test%20Booking%20Page.png)

---

#### 5.9 Lab Slot Booking Page

> Choose time slots and test preferences (home visit or lab visit)

![Lab Slot Booking Page](User%20Interface/Patient%20Module/Lab%20Slot%20Booking%20Page.png)

---

#### 5.10 Lab Booking History Page

> View history of all lab test bookings

![Lab Booking History Page](User%20Interface/Patient%20Module/Lab%20Booking%20History%20Page.png)

---

#### 5.11 Lab Reports Page

> Access and download laboratory test reports

![Lab Reports Page](User%20Interface/Patient%20Module/Lab%20Reports%20Page.png)

---

#### 5.12 Patient Profile Page

> Manage personal, medical, and contact information

![Patient Profile Page](User%20Interface/Patient%20Module/Patient%20Profile%20Page.png)

---

## 🔑 Environment Variables

Backend values are loaded via `python-dotenv` from `backend/backend/settings.py`.

### Backend `.env`

Create `backend/.env` with the following:

```env
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
TIME_ZONE=Asia/Kolkata

# Email (SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@example.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### Frontend `.env`

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

> If unset, frontend services default to `http://localhost:8000/api`.

---

## 🚀 Local Setup (Windows PowerShell)

### Step 1 — Create & Activate Virtual Environment

```powershell
cd "E:\E-Health Care"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2 — Install Python Dependencies

```powershell
pip install -r requirements.txt
```

### Step 3 — Install Frontend Dependencies

```powershell
cd "E:\E-Health Care\frontend"
npm install
```

### Step 4 — Prepare PostgreSQL Database

Before running the application:

1. Ensure PostgreSQL service is running
2. Create the target database (matching `DB_NAME` in your `.env`)
3. Apply all SQL schema and function scripts located in:
   ```
   backend/users/sql_tables_and_funs/
   ```

### Step 5 — Run the Backend

**Development server:**
```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe manage.py runserver
```

**Production server (Waitress):**
```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe serve.py
```

### Step 6 — Run the Frontend

```powershell
cd "E:\E-Health Care\frontend"
npm start
```

### ✅ Local URLs

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000/api |
| **Django Admin** | http://localhost:8000/admin/ |

> ⚠️ **Important:** Always start the backend before the frontend.

---

## 🧪 Testing

### Backend Tests

```powershell
cd "E:\E-Health Care\backend"
..\venv\Scripts\python.exe manage.py test
```

### Frontend Tests

```powershell
cd "E:\E-Health Care\frontend"
npm test
```

---

## 📝 Notes

- **SQL Bootstrap Required:** The application requires SQL schema and function scripts to be applied before first run. Without these, many API endpoints will fail at runtime.
- **Environment Files:** Never commit `.env` files to version control. Use `.env.example` templates for team onboarding.
- **JWT Cookies:** The refresh token is stored as an HTTP-only cookie. Ensure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` are correctly configured for your deployment environment.
- **Razorpay Webhooks:** Configure your Razorpay dashboard to point the webhook URL at `http://your-domain/api/payments/webhook/` with the correct secret.

---

<div align="center">

**Built with ❤️ for better healthcare**

![Made with Django](https://img.shields.io/badge/Made%20with-Django-092E20?style=flat-square&logo=django)
![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/Powered%20by-PostgreSQL-336791?style=flat-square&logo=postgresql)

</div>
