# Testing Guide for Registration Fixes

## Quick Test Steps

### 1. Verify Backend is Running
The Django development server should have auto-reloaded with the new changes. Look for a message like:
```
Watching for file changes with StatReloader
Performing system checks...
```

If not, restart the server:
```bash
cd backend
python manage.py runserver
```

### 2. Test Doctor Registration

1. Navigate to the registration page in your browser
2. Select the **Doctor** role
3. Fill in all required fields:
   - Email: `test-doctor@example.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Full Name: `Dr. Test Doctor`
   - Gender: Select any option (e.g., Male)
   - Experience: `5.5` years
   - Consultation Fee: `1000`
   - Phone Number: `1234567890`
   - Registration Number: `REG12345`
   
4. **Add a Qualification**:
   - Click the "Add" button in the Qualifications section
   - Select a qualification from the dropdown (e.g., "BAMS - Bachelor of Ayurvedic Medicine and Surgery")
   - Enter Institution: `Test Medical College`
   - Enter Year: `2021`

5. Click the **Register** button

### Expected Results

✅ **Success Case:**
- A green toast notification should appear in the top-right corner with the message:
  > "Doctor registered successfully! Account pending verification."
- No error should appear in the server console
- The user should be logged in automatically

❌ **Previous Error (Now Fixed):**
```
TypeError: Field 'qualification_id' expected a number but got <Qualification: BAMS...>
```

### 3. Test Error Handling

Try these scenarios to see the toast notifications:

1. **Password Mismatch**:
   - Enter different passwords
   - Click Register
   - Expected: Red toast notification "Passwords do not match."

2. **Missing Gender** (for Doctor):
   - Leave the Gender field empty
   - Click Register
   - Expected: Red toast notification "Please select a gender for the doctor."

3. **Duplicate Email**:
   - Try registering with an email that already exists
   - Expected: Red toast notification with API error message

### 4. Test Other Roles

**Patient Registration:**
- Should show green toast: "Patient registered successfully!"

**Lab Registration:**  
- Should show green toast: "Lab registered successfully! Account pending verification."

## Toast Notification Features

- **Position**: Top-right corner
- **Duration**: 4 seconds (auto-dismiss)
- **Colors**: 
  - ✅ Success: Green (#10b981)
  - ❌ Error: Red (#ef4444)
- **Animation**: Smooth slide-in/slide-out

## Troubleshooting

### If doctor registration still fails:

1. Check the Django console for any errors
2. Verify the qualification exists in the database:
   ```bash
   python manage.py shell
   >>> from users.models import Qualification
   >>> Qualification.objects.all()
   ```

3. Check that the frontend is sending the correct data format:
   - Open browser DevTools → Network tab
   - Look at the request payload for `/api/auth/register/doctor/`
   - The `qualifications` array should contain objects with `qualification` as a number:
     ```json
     "qualifications": [
       {
         "qualification": 7,
         "institution": "Test College",
         "year_of_completion": 2021
       }
     ]
     ```

### If toast notifications don't appear:

1. Check browser console for errors
2. Verify `react-hot-toast` was installed:
   ```bash
   npm list react-hot-toast
   ```
3. Clear browser cache and refresh
