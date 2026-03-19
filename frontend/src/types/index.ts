// frontend/src/types/index.ts

export interface User {
  user_id: string;
  email: string;
  email_verified: boolean;
  role: "PATIENT" | "DOCTOR" | "LAB" | "ADMIN" | "STAFF" | "SUPERADMIN";
  is_active: boolean;
  is_staff?: boolean;
  account_status?: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Address {
  address_id?: number;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BloodGroup {
  blood_group_id: number;
  blood_group_value: string;
}

export interface Gender {
  gender_id: number;
  gender_value: string;
}

export interface Qualification {
  qualification_id: number;
  qualification_code: string;
  qualification_name: string;
  is_active: boolean;
}

// ── Read shapes (profile responses) ──────────────────────────────────────────

export interface DoctorQualification {
  doctor_qualification_id?: number;
  qualification: number;
  qualification_details?: Qualification;
  institution: string;
  year_of_completion: number;
  created_at?: string;
}

export interface DoctorQualificationPayload {
  qualification_id: number;
  institution?: string;
  year_of_completion?: number;
}

export interface WorkingDay {
  id?: number;
  day_of_week: number;
  day_of_week_display?: string;
  arrival?: string | null;
  leaving?: string | null;
  lunch_start?: string | null;
  lunch_end?: string | null;
}

export interface DoctorSchedule {
  schedule_id?: number;
  consultation_duration_min?: number;
  appointment_contact?: string;
  working_days?: WorkingDay[];
}

export interface LabOperatingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// ── Patient ──────────────────────────────────────────────────────────────────

export interface PatientProfile {
  patient_id: string;
  user: User;
  full_name: string;
  date_of_birth: string | null;
  gender: number | null;
  gender_details: Gender | null;
  blood_group: number | null;
  blood_group_details: BloodGroup | null;
  mobile: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address?: Address | null;
  profile_image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientList {
  patient_id: string;
  full_name: string;
  email: string;
  mobile: string;
  blood_group?: string | null;
  gender?: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Doctor ───────────────────────────────────────────────────────────────────

export interface Specialization {
  specialization_id: number;
  specialization_name: string;
  description?: string;
}

export interface DoctorSpecialization {
  id?: number;
  specialization: number;
  specialization_details?: Specialization;
  is_primary: boolean;
  years_in_specialty?: number;
}

export interface DoctorSpecializationPayload {
  specialization_id: number;
  is_primary?: boolean;
  years_in_specialty?: number;
}

export interface DoctorProfile {
  user: User;
  full_name: string;
  gender: number | null;
  gender_details: Gender | null;
  experience_years: string;
  phone_number: string;
  consultation_fee: string | null;
  registration_number: string;
  profile_image: string;
  joining_date: string | null;
  is_active: boolean;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  verification_status_display: string;
  verified_by: string | null;
  verified_by_details?: User | null;
  verified_at: string | null;
  verification_notes: string | null;
  qualifications: DoctorQualification[];
  specializations: DoctorSpecialization[];
  address?: Address | null;
  schedule?: DoctorSchedule | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorList {
  doctor_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  consultation_fee?: string | number | null;
  experience_years?: string | number | null;
  registration_number: string;
  is_active: boolean;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  verified_at: string | null;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
  gender?: string | null;
  verified_by_id?: string | null;
  verified_by_email?: string | null;
}

// ── Lab ──────────────────────────────────────────────────────────────────────

export interface LabList {
  lab_id: string;
  email: string;
  email_verified: boolean;
  address_id?: number | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  created_at: string;
  is_active: boolean;
  lab_logo?: string | null;
  lab_name: string;
  last_login_at?: string | null;
  license_number?: string | null;
  phone_number?: string | null;
  role: string;
  updated_at: string;
  verification_notes?: string | null;
  verification_status:
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | "pending"
    | "verified"
    | "rejected";
  verification_status_display?: string;
  verified_at?: string | null;
  verified_by_email?: string | null;
  verified_by_id?: string | null;
  operating_hours?: LabOperatingHour[];
}

export interface LabService {
  service_id?: number;
  service_name: string;
  description?: string;
  price: number;
  turnaround_hours?: number;
  is_active?: boolean;
}

export interface LabProfile {
  user?: User;
  lab_id?: string;
  lab_user_id?: string;
  role?: string;
  email?: string;
  lab_name: string;
  license_number: string | null;
  address?: Address | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone_number: string | null;
  lab_logo: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED" | string;
  verification_status_display?: string;
  verified_by?: string | null;
  verified_by_details?: User | null;
  verified_by_email?: string | null;
  verified_by_id?: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  operating_hours: LabOperatingHour[];
  services?: LabService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Admin / Staff ─────────────────────────────────────────────────────────────

export interface AdminStaffProfile {
  user_id: string;
  email: string;
  email_verified: boolean;
  role: "ADMIN" | "STAFF" | "SUPERADMIN";
  role_display: string;
  account_status: string;
  account_status_display: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

// ── Auth / API ────────────────────────────────────────────────────────────────

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user: PatientProfile | DoctorProfile | LabProfile | AdminStaffProfile;
  permissions?: string[];
}

export interface RegisterResponse {
  user: PatientProfile | DoctorProfile | LabProfile;
  email_verification_sent?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[] | string>;
}

// ── Registration Payloads ─────────────────────────────────────────────────────

export interface PatientRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  mobile: string;
  date_of_birth?: string;
  gender_id: number;
  blood_group_id?: number;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  oauth_provider?: string;
  oauth_provider_id?: string;
}

export interface DoctorRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  phone_number: string;
  registration_number: string;
  gender_id: number;
  experience_years: number;
  consultation_fee?: number;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualifications?: DoctorQualificationPayload[];
  specializations?: DoctorSpecializationPayload[];
  oauth_provider?: string;
  oauth_provider_id?: string;
}

export interface LabRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  lab_name: string;
  license_number?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone_number?: string;
  operating_hours?: LabOperatingHour[];
  oauth_provider?: string;
  oauth_provider_id?: string;
}

export interface PatientProfileUpdateData {
  full_name?: string;
  mobile?: string;
  date_of_birth?: string;
  gender_id?: number;
  blood_group_id?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DoctorProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  gender_id?: number;
  experience_years?: number | string;
  consultation_fee?: number | string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  schedule?: Partial<DoctorSchedule>;
  qualifications?: DoctorQualificationPayload[];
  specializations?: DoctorSpecializationPayload[];
}

export interface LabProfileUpdateData {
  lab_name?: string;
  phone_number?: string;
  license_number?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  operating_hours?: LabOperatingHour[];
  services?: LabService[];
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_LOGIN_FAILED"
  | "ACCOUNT_LOCKED"
  | "EMAIL_VERIFIED"
  | "PASSWORD_RESET"
  | "PATIENT_REGISTERED"
  | "DOCTOR_REGISTERED"
  | "LAB_REGISTERED"
  | "PATIENT_PROFILE_UPDATED"
  | "DOCTOR_PROFILE_UPDATED"
  | "LAB_PROFILE_UPDATED"
  | "DOCTOR_VERIFIED"
  | "DOCTOR_REJECTED"
  | "LAB_VERIFIED"
  | "LAB_REJECTED"
  | "PATIENT_ACTIVATED"
  | "PATIENT_DEACTIVATED"
  | "DOCTOR_ACTIVATED"
  | "DOCTOR_DEACTIVATED"
  | "LAB_ACTIVATED"
  | "LAB_DEACTIVATED"
  | "ADMIN_ACTION"
  | "SYSTEM_ERROR";

export type AuditEntityType = "Patient" | "Doctor" | "Lab" | "User" | "System";
export type AuditStatus = "SUCCESS" | "FAILURE";

export interface AuditLog {
  log_id: number;
  action: AuditAction;
  entity_type: AuditEntityType | null;
  entity_name: string | null;
  details: string;
  status: AuditStatus;
  performed_by: string | null;
  target_user: string | null;
  ip_address: string | null;
  user_agent: string | null;
  duration_ms: number | null;
  request_path: string | null;
  timestamp: string;
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface AppointmentSlot {
  slot_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  is_blocked: boolean;
  is_available: boolean;
}

export interface DoctorAppointment {
  appointment_id: number;
  doctor_id: string;
  doctor_name: string;
  patient_id: string;
  patient_email: string;
  slot_id: number | null;
  slot_date: string | null;
  start_time: string | null;
  end_time: string | null;
  appointment_type: "in_person" | "online";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorListItem {
  doctor_id: string;
  full_name: string;
  phone_number: string;
  consultation_fee: string | null;
  experience_years: string;
  profile_image: string;
  specializations: DoctorSpecialization[];
}

export interface BookAppointmentData {
  slot_id: number;
  reason?: string;
  appointment_type?: "in_person" | "online";
}

// ── Inactivity / Re-auth ──────────────────────────────────────────────────────
// These types are consumed by:
//   - services/api.ts  (verifyPasswordForReauth method)
//   - pages/InactivityModel.tsx (ModalStep)
//   - context/AuthContext.tsx  (RestorableFormEntry registry)

export interface ReAuthVerifyPayload {
  password: string;
}

/**
 * Fix: backend _ok() returns { success, message, data }.
 * The re-auth verify view returns _ok(message="Re-authentication successful.")
 * so the response shape is { success: true, message: string }.
 */
export interface ReAuthVerifyResponse {
  success: boolean;
  message: string;
}

/**
 * Fix: backend _error() returns { success, message } — field is "message"
 * not "details". Updated to match actual backend response shape.
 */
export interface ReAuthErrorResponse {
  success: false;
  message: string;
  /** Optional machine-readable code set by ReAuthVerifyView */
  code?: "invalid_password" | "account_locked" | "token_expired";
}

export type ModalStep = "prompt" | "password" | "loading" | "error" | "locked";

export interface InactivityState {
  isModalVisible: boolean;
}

/**
 * Registry entry for a form that participates in Scenario B.
 *
 * onBeforeTimeout — called by AuthContext right BEFORE the modal appears,
 *   so the form can take an in-memory snapshot of its current values.
 *   Wire this to useFormStatePersistence's takeSnapshot().
 *
 * onRestore — called by AuthContext right AFTER successful re-auth,
 *   so the form can restore from the snapshot.
 *   Wire this to read restoreSnapshot() and call setFormValues(snapshot).
 */
export interface RestorableFormEntry {
  formId: string;
  onRestore: () => void;
  /** Optional — only needed if the form has state worth preserving. */
  onBeforeTimeout?: () => void;
}

// ── ReAuthError class ─────────────────────────────────────────────────────────
// Defined here (not in api.ts) so InactivityModel.tsx can import it from
// ../types without depending on ../services/api — breaking the import chain
// that caused AuthProvider to resolve as undefined at runtime.
//
// Import pattern:
//   InactivityModel.tsx  → import { ReAuthError } from "../types"
//   services/api.ts      → import { ReAuthError } from "../types"

export class ReAuthError extends Error {
  public statusCode: number;
  public code?: ReAuthErrorResponse["code"];

  constructor(
    message: string,
    statusCode: number,
    code?: ReAuthErrorResponse["code"]
  ) {
    super(message);
    this.name = "ReAuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}