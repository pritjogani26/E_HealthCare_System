# Registration Form Testing Guide

## Changes Implemented

### ✅ Fixed Blood Group Dropdown
- **Issue**: Blood groups weren't displaying in the patient registration form
- **Fix**: 
  - Changed `bloodGroup` state type from `string | null` to `number | null` 
  - Updated dropdown to use `blood_group_id` as value instead of `blood_group_value`
  - Fixed submission payload to use bloodGroup directly (it now stores the ID)
  - Added console logging to track API data loading

### ✅ Fixed Gender Dropdown
- **Issue**: Gender options were hardcoded (M, F, O) instead of using API data
- **Fix**:
  - Changed patient gender select to use `genderOptions.map()` from API
  - Added "Select Gender" placeholder option
  - Gender dropdown now dynamically populated from `/api/genders/`

### ✅ Added Qualification Select Dropdown for Doctors
- **Issue**: Qualifications were text input fields
- **Fix**:
  - Replaced two text inputs (qualification_code, qualification_name) with single select dropdown
  - Dropdown shows: "Qualification Name (CODE)"
  - Options populated from `/api/qualifications/`
  - Updated state structure to use `qualification_id` instead of code/name
  - Improved layout: Qualification (4 cols) | Institution (4 cols) | Year (3 cols) | Delete (1 col)
  - Added red styling to delete button for better UX

## Testing Instructions

### 1. Test Patient Registration

#### Check Blood Group Dropdown:
1. Navigate to: http://localhost:3001/registration
2. Select "Patient" role
3. Scroll to "Blood group" field
4. Click the dropdown - you should see:
   - "Select Blood Group" (placeholder)
   - Options like: A+, A-, B+, B-, AB+, AB-, O+, O-
5. Select a blood group
6. **Open browser console (F12)** and check for logs:
   ```
   Loaded blood groups: [{blood_group_id: 1, blood_group_value: "A+"}, ...]
   ```

#### Check Gender Dropdown:
1. Scroll to "Gender" field
2. Click the dropdown - you should see:
   - "Select Gender" (placeholder)
   - Male
   - Female
   - Other (if available from API)
3. **Open browser console** and check for logs:
   ```
   Loaded genders: [{gender_id: 1, gender_value: "Male"}, ...]
   ```

### 2. Test Doctor Registration

#### Check Qualification Dropdown:
1. Select "Doctor" role
2. Scroll to "Qualifications" section
3. Click "Add Qualification" button
4. You should see a row with:
   - **Qualification Dropdown** (not text input!)
   - Institution input field
   - Year input field
   - Red delete button
5. Click the qualification dropdown - you should see:
   - "Select Qualification" (placeholder)
   - Options like: "MBBS (MBBS)", "MD (MD)", "MS (MS)", etc.
6. **Open browser console** and check for logs:
   ```
   Loaded qualifications: [{qualification_id: 1, qualification_code: "MBBS", qualification_name: "MBBS"}, ...]
   ```

### 3. Test Form Submission

#### Patient Registration:
```
Email: test_patient@example.com
Password: Test@1234
Confirm Password: Test@1234
Full Name: Test Patient
Date of Birth: 2000-01-01
Gender: Male  (from dropdown)
Blood Group: A+  (from dropdown)
Mobile: 9876543210
```

#### Doctor Registration:
```
Email: test_doctor@example.com
Password: Test@1234
Confirm Password: Test@1234
Full Name: Dr. Test Doctor
Gender: Male  (from dropdown)
Experience: 5
Consultation Fee: 500
Registration Number: DR12345
Phone: 9876543210

Qualifications:
  - Select: MBBS (from dropdown)
  - Institution: ABC Medical College
  - Year: 2015
```

### 4. Verify Console Logs

Open browser console (F12) and you should see:
```
Loaded blood groups: Array(8)
  0: {blood_group_id: 1, blood_group_value: "A+"}
  1: {blood_group_id: 2, blood_group_value: "A-"}
  ...
  
Loaded genders: Array(3)
  0: {gender_id: 1, gender_value: "Male"}
  1: {gender_id: 2, gender_value: "Female"}
  2: {gender_id: 3, gender_value: "Other"}
  
Loaded qualifications: Array(N)
  0: {qualification_id: 1, qualification_code: "MBBS", qualification_name: "MBBS", is_active: true}
  1: {qualification_id: 2, qualification_code: "MD", qualification_name: "MD", is_active: true}
  ...
```

## Troubleshooting

### Dropdowns are empty:
1. Check browser console for errors
2. Verify backend is running on http://localhost:8000
3. Check console logs - you should see the "Loaded..." messages
4. If no logs, check Network tab for failed API calls to:
   - `/api/blood-groups/`
   - `/api/genders/`
   - `/api/qualifications/`

### Gender/Blood Group still hardcoded:
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Make sure you're on http://localhost:3001 (not 3000)

### Qualification dropdown not appearing for doctors:
- Switch to Doctor role
- Scroll to "Qualifications" section
- Click "Add Qualification"
- If still seeing text inputs instead of dropdown, hard refresh the page

## Expected Behavior

### ✅ Patient Form:
- Gender: Dropdown with API data
- Blood Group: Dropdown with API data
- All values update correctly when selected
- Form submits with correct IDs

### ✅ Doctor Form:
- Gender: Dropdown with API data
- Qualifications: Select dropdown (not text input)
- "Add Qualification" creates new row with dropdown
- Delete button removes qualification row
- Form submits with correct qualification IDs

### ✅ Lab Form:
- No changes (working as before)

## Files Modified

1. `frontend/src/pages/RegistrationPage.tsx`:
   - Line 52: Changed gender default from "M" to ""
   - Line 60: Changed bloodGroup type from `string | null` to `number | null`
   - Line 91: Changed qualificationOptions type to `Qualification[]`
   - Line 106-113: Added console logging for debugging
   - Line 130: Fixed gender reset to ""
   - Line 214: Simplified blood_group_id submission
   - Line 468-481: Patient gender dropdown from API
   - Line 486-501: Blood group dropdown using blood_group_id
   - Line 741-806: Qualification select dropdown with improved layout

## Backend API Endpoints Used

- `GET /api/blood-groups/` - Returns paginated list of blood groups
- `GET /api/genders/` - Returns paginated list of genders
- `GET /api/qualifications/` - Returns paginated list of qualifications

All endpoints return data in format:
```json
{
  "count": N,
  "next": null,
  "previous": null,
  "results": [...]
}
```

The `api.ts` service automatically extracts the `results` array.
