# Lab Test Completion and Report Generation

## Objective
Enable lab users to complete a booked lab test by entering patient-specific parameter values, generate a downloadable PDF report, and persist the report reference in the database for future access.

## Database Requirements

### Report Table
Use the `lab_test_reports` table to persist generated report metadata:

- `result_id`: identity primary key.
- `booking_id`: foreign key to `lab_test_slot_bookings.booking_id` (`ON DELETE CASCADE`).
- `report_file_url`: URL/path of generated report file.
- `report_type`: file type, default `pdf`.
- `result_notes`: optional narrative notes and structured result metadata.
- `uploaded_by`: user ID of lab user/admin uploading report.
- `uploaded_at`: timestamp of upload, default `now()`.

## Functional Flow

### 1) Initiate Completion
- Trigger: Lab user clicks `Mark complete` from booking list.
- System opens a completion form (modal/page) for that booking.

### 2) Enter Parameter Values
For each parameter configured for the selected test:
- Display `parameter_name`, `unit`, and `normal_range`.
- Provide an input field for the patient-specific value.
- Validate required entry before submission.

### 3) Abnormal Value Highlighting
- Parse numeric normal ranges where possible (for example, `0.4 - 4.0`).
- Compare entered value to range.
- Mark out-of-range values in red and flag them as abnormal.

### 4) Generate PDF Report
On submit, generate a PDF containing:
- Lab name (title) and test name (subtitle).
- Booking and lab context.
- Patient identity details: name, mobile, email, date of birth, gender.
- Parameter result table/list:
  - Parameter name
  - Patient value
  - Unit
  - Reference range
  - Abnormal indicator

### 5) Persist Completion + Report
- Backend receives generated PDF and result payload.
- System marks booking status from `BOOKED` to `COMPLETED`.
- System stores PDF file and inserts corresponding row into `lab_test_reports`.
- Response returns updated booking and success message.

## API/Service Expectations

- Endpoint: `POST /api/labs/bookings/{booking_id}/complete/`
- Request content type: `multipart/form-data`
- Required:
  - `report_file` (PDF file)
  - `parameter_results` (JSON array)
- Optional:
  - `result_notes`
  - `report_type` (defaults to `pdf`)

Processing rules:
- Reject if booking does not exist or is not completable.
- Reject if report file is missing.
- Perform completion and report insert atomically where possible.

## Non-Functional Considerations

- Keep report URLs deterministic and environment-safe (for example, `/media/lab_reports/...`).
- Ensure role-based access: only LAB/ADMIN/SUPERADMIN can complete and upload reports.
- Preserve backward compatibility for report listing endpoints.
- Support future extension for non-PDF report types.

## Acceptance Criteria

- Lab user can complete a `BOOKED` lab booking only after submitting parameter values.
- Out-of-range values are visually distinct before submission.
- PDF is generated on submission and saved.
- A row is created in `lab_test_reports` for the booking with a valid `report_file_url`.
- Booking status changes to `COMPLETED` in the same workflow.
