# Admin Patient & Doctor Management - Complete Documentation

## Overview
Enhanced the admin pages to provide comprehensive patient and doctor management capabilities with detailed views, status control, and frontend pagination. **Only accessible to ADMIN and STAFF users.**

---

## 🎯 Key Features

### ✅ **List View**
- Displays all patients/doctors in a clean table format
- Shows: No., Name, Email, Mobile/Phone, Status
- Color-coded status badges (Green = Active, Red = Inactive)
- Responsive table with horizontal scroll on mobile

### ✅ **Detail View Modal**
- Click on "View Details" (👁️ eye icon) to see complete information
- Full-screen modal with all user data
- Organized sections with icons
- **Patients**: Personal info, emergency contacts, address
- **Doctors**: Professional info, qualifications, verification status

### ✅ **Activate/Deactivate**
- Toggle button to activate or deactivate users
- Visual feedback with toast notifications
- Updates both list and detail views in real-time
- Icon changes based on current status:
  - ✅ UserCheck = Activate (for inactive users)
  -  ❌ UserX = Deactivate (for active users)

### ✅ **Frontend Pagination**
- 10 items per page (configurable)
- Page numbers with navigation arrows
- Shows current range (e.g., "Showing 1 to 10 of 45 patients")
- All pagination logic handled in frontend (fast, no server calls)

---

## 📊 Admin Patients Page

### List View Columns
| Column | Description |
|--------|-------------|
| **No.** | Sequential number (pagination-aware) |
| **Patient Name** | Full name from patient profile |
| **Email** | User's email address |
| **Mobile** | Patient's mobile number |
| **Status** | Active/Inactive badge (color-coded) |
| **Actions** | View details + Toggle status buttons |

### Detail Modal Sections

#### 1. **Patient Information**
- Full Name
- Email
- Mobile
- Date of Birth (formatted)
- Gender (display value)
- Blood Group (display value)
- Emergency Contact Name
- Emergency Contact Phone

#### 2. **Address Information** (if available)
- Complete formatted address
- City, State, Pincode

#### 3. **Account Information**
- Account Status (Active/Inactive)
- Email Verified (Yes/No)
- Account Created (timestamp)
- Last Updated (timestamp)

---

## 👨‍⚕️ Admin Doctors Page

### List View Columns
| Column | Description |
|--------|-------------|
| **No.** | Sequential number (pagination-aware) |
| **Doctor Name** | Full name from doctor profile |
| **Email** | User's email address |
| **Phone** | Doctor's phone number |
| **Status** | Active/Inactive badge (color-coded) |
| **Actions** | View details + Toggle status buttons |

### Detail Modal Sections

#### 1. **Doctor Information**
- Full Name
- Email
- Phone Number
- Gender (display value)
- Registration Number
- Experience (in years)
- Consultation Fee (₹ formatted)
- Joining Date
- Verification Status
- Verified At (if verified)

#### 2. **Qualifications** (if available)
- Each qualification shown in separate card
- Includes:
  - Qualification Name & Code
  - Institution
  - Year of Completion

#### 3. **Account Information**
- Account Status (Active/Inactive)
- Email Verified (Yes/No)
- Account Created (timestamp)
- Last Updated (timestamp)

#### 4. **Verification Notes** (if available)
- Notes from verification process

---

## 🔧 Frontend Implementation

### Files Modified

#### `frontend/src/services/api.ts`
Added API methods:
```typescript
async togglePatientStatus(patientId: number): Promise<PatientProfile>
async toggleDoctorStatus(userId: string): Promise<DoctorProfile>
```

#### `frontend/src/pages/AdminPatientsPage.tsx`
Complete redesign:
- **State Management**: 
  - `patients` - Full list
  - `selectedPatient` - Currently viewed patient
  - `isDetailOpen` - Modal state
  - `currentPage` - Pagination
  - `actionLoading` - Button disable state
  
- **Functions**:
  - `loadPatients()` - Fetch all patients
  - `handleToggleStatus()` - Toggle active status
  - `viewPatientDetails()` - Open detail modal
  - `handlePageChange()` - Pagination navigation

- **Components**:
  - `InfoRow` - Reusable display component
  - List table
  - Detail modal
  - Pagination controls

#### `frontend/src/pages/AdminDoctorsPage.tsx`
Similar structure to patients page with doctor-specific fields

---

## ⚙️ Backend Implementation

### Files Modified

#### `backend/users/views.py`
Added two new views:

**1. AdminTogglePatientStatusView**
```python
PATCH /api/admin/patients/<patient_id>/toggle-status/
```
- Toggles `patient.is_active`
- Also updates `user.is_active`
- Returns updated patient profile
- Protected by `IsAdminOrStaff` permission

**2. AdminToggleDoctorStatusView**
```python
PATCH /api/admin/doctors/<user_id>/toggle-status/
```
- Toggles `doctor.is_active`
- Also updates `user.is_active`
- Returns updated doctor profile
- Protected by `IsAdminOrStaff` permission

#### `backend/users/urls.py`
Added URL patterns:
```python
path('admin/patients/<int:patient_id>/toggle-status/', ...)
path('admin/doctors/<str:user_id>/toggle-status/', ...)
```

---

## 🔒 Security & Authorization

### Backend Protection
- ✅ **Permission Required**: `IsAdminOrStaff`
- ✅ Only users with role `ADMIN` or `STAFF` can access
- ✅ Returns 403 Forbidden if unauthorized
- ✅ All endpoints require authentication

### Frontend Protection
- Routes protected by auth context
- Should be behind admin route guards
- Actions disabled during processing

---

## 📱 Frontend Pagination Details

### Configuration
```typescript
const [itemsPerPage] = useState(10); // Show 10 per page
```

### Logic
```typescript
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(items.length / itemsPerPage);
```

### Benefits
- ⚡ **Instant navigation** - No server calls
- 💾 **Lower server load** - Fetch once, paginate client-side
- 🎯 **Better UX** - No loading between pages
- 📊 **Easy filtering** - Can add search/filter without backend changes

### Pagination UI
```
[← Previous] [1] [2] [3] [4] [5] [Next →]
Showing 1 to 10 of 45 patients
```

---

## 🎨 UI Components

### Status Badge
```tsx
<span className={
  isActive 
    ? "bg-emerald-100 text-emerald-800"  // Green for active
    : "bg-red-100 text-red-800"          // Red for inactive
}>
  {isActive ? "Active" : "Inactive"}
</span>
```

### Action Buttons
```tsx
// View Details - Blue
<button className="bg-blue-50 text-blue-600">
  <Eye className="w-4 h-4" />
</button>

// Deactivate - Red (for active users)
<button className="bg-red-50 text-red-600">
  <UserX className="w-4 h-4" />
</button>

// Activate - Green (for inactive users)
<button className="bg-emerald-50 text-emerald-600">
  <UserCheck className="w-4 h-4" />
</button>
```

### Toast Notifications
```tsx
toast.success("Patient activated successfully");
toast.error("Failed to toggle status");
```

---

## 🧪 Testing Guide

### Test Patient Management

1. **Login as Admin/Staff**
   - Navigate to `/admin/patients`

2. **View List**
   - ✅ All patients displayed
   - ✅ Correct numbering (1, 2, 3...)
   - ✅ Status badges colored correctly
   - ✅ Action buttons visible

3. **View Details**
   - Click eye icon on any patient
   - ✅ Modal opens with full details
   - ✅ All sections displayed correctly
   - ✅ Close button works

4. **Toggle Status**
   - Click activate/deactivate button
   - ✅ Toast notification appears
   - ✅ Status updates in list
   - ✅ Status updates in modal (if open)
   - ✅ Badge color changes
   - ✅ Button icon changes

5. **Pagination**
   - If > 10 patients exist:
   - ✅ Pagination controls appear
   - ✅ Page numbers work
   - ✅ Previous/Next buttons work
   - ✅ Current page highlighted
   - ✅ "Showing X to Y of Z" correct

### Test Doctor Management

Same tests as patients, plus:

6. **Qualifications Display**
   - View doctor with qualifications
   - ✅ Qualifications section appears
   - ✅ Each qualification shown in card
   - ✅ All fields populated correctly

7. **Verification Info**
   - ✅ Verification status displayed
   - ✅ Verification notes shown (if any)
   - ✅ Verified timestamp shown (if verified)

---

## 📋 API Endpoints Summary

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/patients/` | List all patients | Admin/Staff |
| GET | `/api/admin/doctors/` | List all doctors | Admin/Staff |
| PATCH | `/api/admin/patients/<id>/toggle-status/` | Toggle patient status | Admin/Staff |
| PATCH | `/api/admin/doctors/<id>/toggle-status/` | Toggle doctor status | Admin/Staff |

---

## 🔄 Data Flow

### Viewing Details
```
User clicks eye icon
    ↓
selectedPatient = patient
    ↓
isDetailOpen = true
    ↓
Modal renders with patient data
```

### Toggling Status
```
User clicks toggle button
    ↓
actionLoading = true
    ↓
API call to toggle endpoint
    ↓
Update patient/doctor in list
    ↓
Update selectedPatient if open
    ↓
Show toast notification
    ↓
actionLoading = false
```

### Pagination
```
User clicks page number
    ↓
setCurrentPage(pageNumber)
    ↓
Calculate slice indices
    ↓
Re-render table with new slice
    ↓
(No API call - instant!)
```

---

## ✨ Key Improvements

### Before:
- ❌ Only showed list view
- ❌ Limited information visible
- ❌ No way to manage user status
- ❌ All items on one page (slow with many users)
- ❌ No toast feedback

### After:
- ✅ **List + Detail views**
- ✅ **Complete information** for each user
- ✅ **Activate/Deactivate** functionality
- ✅ **Pagination** (10 items per page)
- ✅ **Toast notifications** for actions
- ✅ **Real-time updates** in UI
- ✅ **Professional design** with icons & colors
- ✅ **Mobile responsive**

---

## 🚀 Future Enhancements (Optional)

- [ ] Search/filter patients by name, email
- [ ] Sort columns (name, date, status)
- [ ] Bulk actions (activate/deactivate multiple)
- [ ] Export to CSV/PDF
- [ ] Edit patient/doctor details
- [ ] View patient appointment history
- [ ] Advanced filters (date range, blood group, etc.)
- [ ] Backend pagination for very large datasets

---

All admin management features are now complete and ready to use! 🎉
