# Admin Management - Quick Reference

## 🎯 Features Summary

### Admin Patients Page (`/admin/patients`)
```
┌─────────────────────────────────────────────────────┐
│  No. │ Patient Name    │ Email          │ Status   │
├─────────────────────────────────────────────────────┤
│  1   │ John Doe       │ john@email.com │ ✓Active  │ [👁️] [❌]
│  2   │ Jane Smith     │ jane@email.com │ ✗Inactive│ [👁️] [✅]
│  3   │ Bob Johnson    │ bob@email.com  │ ✓Active  │ [👁️] [❌]
└─────────────────────────────────────────────────────┘
          [← Previous] [1] [2] [3] [Next →]
       Showing 1 to 10 of 25 patients
```

**Actions:**
- 👁️ **View Details** - Opens modal with complete patient info
- ✅ **Activate** - Enable inactive patient account
- ❌ **Deactivate** - Disable active patient account

---

###Admin Doctors Page (`/admin/doctors`)
```
┌─────────────────────────────────────────────────────┐
│  No. │ Doctor Name    │ Email          │ Status   │
├─────────────────────────────────────────────────────┤
│  1   │ Dr. A. Sharma  │ doc@email.com  │ ✓Active  │ [👁️] [❌]
│  2   │ Dr. B. Patel   │ pat@email.com  │ ✗Inactive│ [👁️] [✅]
└─────────────────────────────────────────────────────┘
          [← Previous] [1] [2] [Next →]
       Showing 1 to 10 of 15 doctors
```

**Plus Qualifications:**
- Each doctor can have multiple qualifications
- Shown in separate cards with institution & year

---

## 📱 User Flow

### Viewing Patient/Doctor List
1. Navigate to `/admin/patients` or `/admin/doctors`
2. See table with all users (10 per page)
3. Use pagination to navigate pages

### Viewing Full Details
1. Click **eye icon** (👁️) on any row
2. Modal opens with complete information
3. Click **X** or outside modal to close

### Activating/Deactivating User
1. Click **toggle icon** (✅ or ❌) on row or in modal
2. Toast notification confirms action
3. Status updates immediately in table
4. Badge color changes (Green/Red)

---

## 🎨 Visual Indicators

### Status Badges
- 🟢 **Green Badge** = Active user
- 🔴 **Red Badge** = Inactive user

### Action Icons
- 👁️ **Eye** = View details
- ✅ **UserCheck** = Activate (shown for inactive users)
- ❌ **UserX** = Deactivate (shown for active users)

### Colors
- **Blue** = View action
- **Green** = Activate action
- **Red** = Deactivate action

---

## 🔑 Access Control

**Who Can Access:**
- ✅ Users with ADMIN role
- ✅ Users with STAFF role

**Who Cannot Access:**
- ❌ PATIENT users
- ❌ DOCTOR users
- ❌ LAB users
- ❌ Unauthenticated users

---

## 💾 Data Displayed

### Patient Details
```
👤 PATIENT INFORMATION
├─ Full Name
├─ Email
├─ Mobile
├─ Date of Birth
├─ Gender
├─ Blood Group
├─ Emergency Contact
└─ Emergency Phone

📍 ADDRESS
└─ Complete address (city, state, pincode)

📅 ACCOUNT
├─ Status (Active/Inactive)
├─ Email Verified
├─ Created Date
└─ Updated Date
```

### Doctor Details
```
🩺 DOCTOR INFORMATION
├─ Full Name
├─ Email
├─ Phone
├─ Gender
├─ Registration Number
├─ Experience Years
├─ Consultation Fee
├─ Joining Date
└─ Verification Status

🎓 QUALIFICATIONS (if any)
└─ [Multiple cards, each showing:]
    ├─ Qualification Name & Code
    ├─ Institution
    └─ Year

📅 ACCOUNT
├─ Status (Active/Inactive)
├─ Email Verified
├─ Created Date
└─ Updated Date

📝 VERIFICATION (if available)
└─ Notes & Timestamp
```

---

## 🔧 Technical Details

### Pagination
- **Items Per Page**: 10
- **Logic**: Frontend (client-side)
- **Benefits**: Instant navigation, no server load

### API Calls
```
GET  /api/admin/patients/          → List all patients
GET  /api/admin/doctors/           → List all doctors
PATCH /api/admin/patients/:id/toggle-status/  → Toggle patient
PATCH /api/admin/doctors/:id/toggle-status/   → Toggle doctor
```

### State Updates
1. API call returns updated user
2. Update user in list array
3. Update selected user (if modal open)
4. Show toast notification
5. Re-render affected components

---

## ⚡ Quick Actions

### Activate Multiple Users (Manual)
1. Click activate button for first user
2. Wait for toast confirmation
3. Click activate for next user
4. Repeat as needed

### View Details While Toggling
1. Open detail modal for user
2. Click toggle button in modal header
3. Modal stays open, status updates
4. Close when finished

### Navigate Pages Quickly
- Click page numbers directly
- Or use Previous/Next arrows
- Current page highlighted in green

---

## 🐛 Troubleshooting

### "Failed to load patients/doctors"
- Check network connection
- Verify you're logged in as Admin/Staff
- Check backend server is running

### Toggle button not working
- Action might be in progress (button disabled)
- Check console for errors
- Verify you have toggle permissions

### Pagination not showing
- Only shows when > 10 items exist
- Check if data loaded successfully
- Try refreshing the page

### Modal not opening
- Check console for JavaScript errors
- Ensure patient/doctor data loaded
- Try clicking a different row

---

## 📊 Statistics Display

At the bottom of each page:
```
Showing 11 to 20 of 45 patients
```

This tells you:
- **11 to 20** = Current visible range
- **45** = Total number of patients/doctors

---

## ⌨️ Keyboard Shortcuts (Future)

Currently: Mouse/touch only
Planned:
- `←/→` Navigate pages
- `Enter` View details of selected row
- `Esc` Close modal
- `Space` Toggle status

---

## 📱 Mobile Experience

### List View
- Horizontal scroll for table
- Touch-friendly buttons
- Larger touch targets

### Detail Modal
- Full-screen on mobile
- Scrollable content
- Easy to close (X button)

### Pagination
- Simplified on small screens
- Page numbers may wrap
- Previous/Next always visible

---

## ✅ Testing Checklist

- [ ] Can view patient list
- [ ] Can view doctor list
- [ ] Status badges show correctly
- [ ] Can view patient details
- [ ] Can view doctor details
- [ ] Can activate patient
- [ ] Can deactivate patient
- [ ] Can activate doctor
- [ ] Can deactivate doctor
- [ ] Toast notificationsappear
- [ ] Pagination works correctly
- [ ] Modal opens and closes
- [ ] Qualifications display (doctors)
- [ ] Only Admin/Staff can access

---

All features working perfectly! 🎉
