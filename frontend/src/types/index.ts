// src/types/index.ts

export interface User {
  user_id: string;
  email: string;
  email_verified: boolean;
  role: 'PATIENT' | 'DOCTOR' | 'LAB' | 'ADMIN' | 'STAFF';
  account_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  is_active: boolean;
  is_staff: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
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

export interface DoctorQualification {
  doctor_qualification_id?: number;
  qualification: number;
  qualification_details?: Qualification;
  institution: string;
  year_of_completion: number;
  created_at?: string;
}

export interface PatientProfile {
  patient_id: number;
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
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profile_image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  user: User;
  full_name: string;
  gender: number;
  gender_details: Gender;
  experience_years: string;
  phone_number: string;
  consultation_fee: string | null;
  registration_number: string;
  profile_image: string;
  joining_date: string | null;
  is_active: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTIVE';
  verification_status_display: string;
  verified_by: string | null;
  verified_by_details: User | null;
  verified_at: string | null;
  verification_notes: string | null;
  qualifications: DoctorQualification[];
  created_at: string;
  updated_at: string;
}

export interface LabProfile {
  user: User;
  lab_name: string;
  license_number: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone_number: string | null;
  lab_logo: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTIVE';
  verification_status_display: string;
  verified_by: string | null;
  verified_by_details: User | null;
  verified_at: string | null;
  verification_notes: string | null;
  operating_hours: { [key: string]: string } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStaffProfile {
  user_id: string;
  email: string;
  email_verified: boolean;
  role: 'ADMIN' | 'STAFF';
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

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: PatientProfile | DoctorProfile | LabProfile | AdminStaffProfile;
    tokens: Tokens;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: PatientProfile | DoctorProfile | LabProfile;
    tokens: Tokens;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { [key: string]: string[] };
}

export interface PatientRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  mobile: string;
  date_of_birth?: string;
  gender_id: number;
  blood_group_id?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
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
  qualifications?: DoctorQualification[];
}

export interface LabRegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  lab_name: string;
  license_number?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone_number?: string;
  operating_hours?: { [key: string]: string };
}

export interface LoginData {
  email: string;
  password: string;
}