// src/types/index.ts

export interface User {
  user_id: string;
  email: string;
  email_verified: boolean;
  role: "PATIENT" | "DOCTOR" | "LAB" | "ADMIN" | "STAFF";
  role_display?: string;
  account_status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  account_status_display?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
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
  /** ID reference returned by the backend read serializer */
  qualification: number;
  qualification_details?: Qualification;
  institution: string;
  year_of_completion: number;
  created_at?: string;
}

/**
 * Write shape sent to the backend for doctor qualification create/update.
 * Uses `qualification` (not `qualification_id`) to match
 * `_QualWriteSerializer` on the backend.
 */
export interface DoctorQualificationPayload {
  qualification_id: number; // qualification_id FK
  institution?: string;
  year_of_completion?: number;
}

/**
 * Matches backend WorkingDaySerializer:
 * fields = ["id", "day_of_week", "day_of_week_display", "arrival", "leaving", "lunch_start", "lunch_end"]
 * 0=Mon … 6=Sun (WeekDay choices)
 */
export interface WorkingDay {
  id?: number;
  day_of_week: number;
  day_of_week_display?: string;
  arrival?: string | null; // "HH:MM:SS"
  leaving?: string | null; // "HH:MM:SS"
  lunch_start?: string | null; // "HH:MM:SS"
  lunch_end?: string | null; // "HH:MM:SS"
}

/**
 * Matches backend DoctorScheduleSerializer / DoctorScheduleWriteSerializer.
 * NOTE: arrival/leaving/lunch times live on each WorkingDay, NOT on DoctorSchedule.
 */
export interface DoctorSchedule {
  schedule_id?: number;
  consultation_duration_min?: number;
  appointment_contact?: string;
  working_days?: WorkingDay[];
}

export interface LabOperatingHour {
  day_of_week: number; // 0=Mon … 6=Sun
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

  // Nested address (backend read / update)
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

/**
 * Write shape sent to the backend for doctor specialization create/update.
 * Matches `_SpecWriteSerializer` on the backend.
 */
export interface DoctorSpecializationPayload {
  specialization_id: number; // specialization_id FK
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

export interface LabService {
  service_id?: number;
  service_name: string;
  description?: string;
  price: number;
  turnaround_hours?: number;
  is_active?: boolean;
}

export interface LabProfile {
  user: User;
  lab_name: string;
  license_number: string | null;
  address?: Address | null;
  phone_number: string | null;
  lab_logo: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  verification_status_display: string;
  verified_by: string | null;
  verified_by_details?: User | null;
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
  role: "ADMIN" | "STAFF";
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
  user: PatientProfile | DoctorProfile | LabProfile | AdminStaffProfile;
}

export interface RegisterResponse {
  access_token: string;
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

/** Patient registration uses FLAT address fields */
export interface PatientRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  mobile: string;
  date_of_birth?: string;
  gender_id: number;
  blood_group_id?: number;
  /** flat field names expected by backend PatientRegistrationSerializer */
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
  /** flat address fields for registration */
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /**
   * Uses DoctorQualificationPayload (field: `qualification`, not `qualification_id`)
   * to match `_QualWriteSerializer` on the backend.
   * Sent as a JSON string inside multipart/form-data.
   */
  qualifications?: DoctorQualificationPayload[];
  /**
   * Uses DoctorSpecializationPayload to match `_SpecWriteSerializer` on the backend.
   * Sent as a JSON string inside multipart/form-data.
   */
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
  /** flat address fields for registration */
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone_number?: string;
  operating_hours?: LabOperatingHour[];
  oauth_provider?: string;
  oauth_provider_id?: string;
}

/** Payload sent to PATCH /patients/profile/ */
export interface PatientProfileUpdateData {
  full_name?: string;
  mobile?: string;
  date_of_birth?: string;
  gender_id?: number;
  blood_group_id?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  /** nested address for profile update */
  address?: Partial<Address>;
}

/** Payload sent to PATCH /doctors/profile/ */
export interface DoctorProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  gender_id?: number;
  experience_years?: number | string;
  consultation_fee?: number | string;
  address?: Partial<Address>;
  schedule?: Partial<DoctorSchedule>;
  qualifications?: DoctorQualificationPayload[];
  specializations?: DoctorSpecializationPayload[];
}

/** Payload sent to PATCH /labs/profile/ */
export interface LabProfileUpdateData {
  lab_name?: string;
  phone_number?: string;
  address?: Partial<Address>;
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
  performed_by: string | null; // email
  target_user: string | null; // email
  ip_address: string | null;
  user_agent: string | null;
  duration_ms: number | null;
  request_path: string | null;
  timestamp: string; // ISO 8601
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface AppointmentSlot {
  slot_id: number;
  slot_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_booked: boolean;
  is_blocked: boolean;
  is_available: boolean;
  doctor_name: string;
}

export interface DoctorAppointment {
  appointment_id: number;
  doctor: string;
  doctor_name: string;
  patient: string;
  patient_email: string;
  slot: number | null;
  slot_date: string | null;
  start_time: string | null;
  end_time: string | null;
  appointment_type: "in_person" | "online";
  appointment_type_display: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  status_display: string;
  reason: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorListItem {
  user_id: string;
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
