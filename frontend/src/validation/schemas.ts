// frontend/src/validation/schemas.ts
import * as Yup from "yup";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const phoneRegex = /^[6-9]\d{9}$/; // Indian 10-digit mobile starting with 6-9
const pincodeRegex = /^[1-9][0-9]{5}$/; // 6-digit Indian pincode

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// ─── Account fields (shared for registration) ─────────────────────────────────

export const accountSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  password_confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

// ─── Shared nested address schema ─────────────────────────────────────────────

const addressSchema = Yup.object({
  address_line: Yup.string().trim().nullable(),
  city: Yup.string().trim().nullable(),
  state: Yup.string().trim().nullable(),
  pincode: Yup.string()
    .matches(pincodeRegex, "Enter a valid 6-digit pincode")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

// ─── Patient Registration ─────────────────────────────────────────────────────

export const patientRegistrationSchema = accountSchema.shape({
  full_name: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  mobile: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit mobile number")
    .required("Mobile number is required"),
  gender_id: Yup.number().nullable().required("Please select a gender"),
  date_of_birth: Yup.string()
    .nullable()
    .test("not-future", "Date of birth cannot be in the future", (val) => {
      if (!val) return true;
      return new Date(val) <= new Date();
    }),
  blood_group_id: Yup.number().nullable(),
  emergency_contact_name: Yup.string().trim().nullable(),
  emergency_contact_phone: Yup.string()
    .matches(
      phoneRegex,
      "Emergency contact phone must be a valid 10-digit number",
    )
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address_line: Yup.string().trim().nullable(),
  city: Yup.string().trim().nullable(),
  state: Yup.string().trim().nullable(),
  pincode: Yup.string()
    .matches(pincodeRegex, "Enter a valid 6-digit pincode")
    .nullable(),
});

// ─── Doctor Registration ──────────────────────────────────────────────────────

export const doctorRegistrationSchema = accountSchema.shape({
  full_name: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  phone_number: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit phone number")
    .required("Phone number is required"),
  registration_number: Yup.string()
    .trim()
    .required("Medical registration number is required"),
  gender_id: Yup.number().nullable().required("Please select a gender"),
  experience_years: Yup.number()
    .min(0, "Experience cannot be negative")
    .max(60, "Please enter a realistic value")
    .required("Experience is required")
    .transform((v, orig) => (orig === "" ? null : v)),
  consultation_fee: Yup.number()
    .min(0, "Fee cannot be negative")
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v)),
  address_line: Yup.string().trim().nullable(),
  city: Yup.string().trim().nullable(),
  state: Yup.string().trim().nullable(),
  pincode: Yup.string()
    .matches(pincodeRegex, "Enter a valid 6-digit pincode")
    .nullable(),
});

// ─── Lab Registration ─────────────────────────────────────────────────────────

export const labRegistrationSchema = accountSchema.shape({
  lab_name: Yup.string()
    .trim()
    .min(3, "Lab name must be at least 3 characters")
    .required("Lab name is required"),
  license_number: Yup.string().trim().nullable(),
  phone_number: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit phone number")
    .nullable(),
  address_line: Yup.string().trim().nullable(),
  city: Yup.string().trim().nullable(),
  state: Yup.string().trim().nullable(),
  pincode: Yup.string()
    .matches(pincodeRegex, "Enter a valid 6-digit pincode")
    .nullable(),
});

// ─── Edit Patient Profile ─────────────────────────────────────────────────────
// Uses a nested `address` object — matches Formik's path resolution for
// name="address.city" inputs.

export const editPatientProfileSchema = Yup.object({
  full_name: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  mobile: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit mobile number")
    .required("Mobile number is required"),
  date_of_birth: Yup.string()
    .nullable()
    .test("not-future", "Date of birth cannot be in the future", (val) => {
      if (!val) return true;
      return new Date(val) <= new Date();
    }),
  gender_id: Yup.string().nullable(),
  blood_group_id: Yup.string().nullable(),
  emergency_contact_name: Yup.string().trim().nullable(),
  emergency_contact_phone: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit number")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: addressSchema,
});

// ─── Edit Doctor Profile ──────────────────────────────────────────────────────
// Uses a nested `address` object — matches Formik's path resolution.

export const editDoctorProfileSchema = Yup.object({
  full_name: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  phone_number: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit phone number")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  gender_id: Yup.string().nullable(),
  experience_years: Yup.number()
    .min(0, "Experience cannot be negative")
    .max(60, "Please enter a realistic value")
    .required("Experience is required"),
  consultation_fee: Yup.number()
    .min(0, "Fee cannot be negative")
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v)),
  consultation_duration_min: Yup.number()
    .min(5, "Minimum consultation duration is 5 minutes")
    .max(240, "Maximum consultation duration is 240 minutes")
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v)),
  appointment_contact: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit number")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: addressSchema,
});

// ─── Edit Lab Profile ─────────────────────────────────────────────────────────
// Uses a nested `address` object — matches Formik's path resolution.

export const editLabProfileSchema = Yup.object({
  lab_name: Yup.string()
    .trim()
    .min(3, "Lab name must be at least 3 characters")
    .required("Lab name is required"),
  phone_number: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit phone number")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: addressSchema,
});

// ─── Doctor Schedule ──────────────────────────────────────────────────────────

export const doctorScheduleSchema = Yup.object({
  consultation_duration_min: Yup.number()
    .min(5, "Minimum is 5 minutes")
    .max(240, "Maximum is 240 minutes")
    .required("Consultation duration is required"),
  appointment_contact: Yup.string()
    .matches(phoneRegex, "Enter a valid 10-digit number")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});
