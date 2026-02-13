// src/services/api.ts

import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  LoginData,
  LoginResponse,
  PatientRegistrationData,
  DoctorRegistrationData,
  LabRegistrationData,
  RegisterResponse,
  ApiError,
  ApiResponse,
  PatientProfile,
  DoctorProfile,
  LabProfile,
  AdminStaffProfile,
  BloodGroup,
  Gender,
  Qualification
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: any) => {
        // Get access token from localStorage
        const token = localStorage.getItem('access_token');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh token is in HttpOnly cookie, backend will read it automatically
            const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, { withCredentials: true });

            // Backend returns new access_token in body
            const { data } = response.data;
            const access_token = data.access_token;

            // Store new access token in localStorage
            localStorage.setItem('access_token', access_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTHENTICATION ====================

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login/', data);
    return response.data.data;  // Unwrap the data
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout/');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    // This method might not be needed explicitly if handled by interceptor, or updated to not take arg
    const response = await this.api.post('/auth/refresh/');
    return response.data;
  }

  // ==================== REGISTRATION ====================

  async registerPatient(data: PatientRegistrationData): Promise<RegisterResponse> {
    const response = await this.api.post<ApiResponse<RegisterResponse>>('/auth/register/patient/', data);
    return response.data.data;  // Unwrap the data
  }

  async registerDoctor(data: DoctorRegistrationData): Promise<RegisterResponse> {
    const response = await this.api.post<ApiResponse<RegisterResponse>>('/auth/register/doctor/', data);
    return response.data.data;  // Unwrap the data
  }

  async registerLab(data: LabRegistrationData): Promise<RegisterResponse> {
    const response = await this.api.post<ApiResponse<RegisterResponse>>('/auth/register/lab/', data);
    return response.data.data;  // Unwrap the data
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail(token: string): Promise<any> {
    const response = await this.api.post('/auth/verify-email/', { token });
    return response.data;
  }

  async resendVerification(email: string): Promise<any> {
    const response = await this.api.post('/auth/resend-verification/', { email });
    return response.data;
  }

  async googleLogin(token: string): Promise<any> {
    const response = await this.api.post('/auth/google/', { token });
    return response.data;
  }

  // ==================== PROFILES ====================

  async getCurrentUserProfile(): Promise<any> {
    const response = await this.api.get('/profile/me/');
    return response.data.data;
  }

  async getPatientProfile(): Promise<PatientProfile> {
    const response = await this.api.get('/profile/patient/');
    return response.data.data;
  }

  async updatePatientProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
    const response = await this.api.patch('/profile/patient/', data);
    return response.data.data;
  }

  async getDoctorProfile(): Promise<DoctorProfile> {
    const response = await this.api.get('/profile/doctor/');
    return response.data.data;
  }

  async updateDoctorProfile(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const response = await this.api.patch('/profile/doctor/', data);
    return response.data.data;
  }

  async getLabProfile(): Promise<LabProfile> {
    const response = await this.api.get('/profile/lab/');
    return response.data.data;
  }

  async updateLabProfile(data: Partial<LabProfile>): Promise<LabProfile> {
    const response = await this.api.patch('/profile/lab/', data);
    return response.data.data;
  }

  async getAdminStaffProfile(): Promise<AdminStaffProfile> {
    const response = await this.api.get('/profile/admin-staff/');
    return response.data.data;
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getAllPatients(): Promise<PatientProfile[]> {
    const response = await this.api.get('/admin/patients/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }

  async getPatientById(id: number): Promise<PatientProfile> {
    const response = await this.api.get(`/admin/patients/${id}/`);
    return response.data.data;
  }

  async getAllDoctors(): Promise<DoctorProfile[]> {
    const response = await this.api.get('/admin/doctors/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }

  async getDoctorById(id: string): Promise<DoctorProfile> {
    const response = await this.api.get(`/admin/doctors/${id}/`);
    return response.data.data;
  }

  async getAllLabs(): Promise<LabProfile[]> {
    const response = await this.api.get('/admin/labs/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }

  async getLabById(id: string): Promise<LabProfile> {
    const response = await this.api.get(`/admin/labs/${id}/`);
    return response.data.data;
  }

  async togglePatientStatus(patientId: number): Promise<PatientProfile> {
    const response = await this.api.patch(`/admin/patients/${patientId}/toggle-status/`);
    return response.data.data;
  }

  async toggleDoctorStatus(userId: string): Promise<DoctorProfile> {
    const response = await this.api.patch(`/admin/doctors/${userId}/toggle-status/`);
    return response.data.data;
  }

  async verifyDoctor(userId: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<DoctorProfile> {
    const response = await this.api.patch(`/admin/doctors/${userId}/verify/`, { status, notes });
    return response.data.data;
  }

  async verifyLab(userId: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<LabProfile> {
    const response = await this.api.patch(`/admin/labs/${userId}/verify/`, { status, notes });
    return response.data.data;
  }

  async getPendingApprovalsCount(): Promise<{ doctors: number; labs: number; total: number }> {
    const response = await this.api.get('/admin/pending-approvals/count/');
    return response.data.data;
  }

  // ==================== SUPPORTING DATA ====================

  async getBloodGroups(): Promise<BloodGroup[]> {
    const response = await this.api.get('/blood-groups/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }

  async getGenders(): Promise<Gender[]> {
    const response = await this.api.get('/genders/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }

  async getQualifications(): Promise<Qualification[]> {
    const response = await this.api.get('/qualifications/');
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data.data || data.results || [];
  }
}

export const apiService = new ApiService();

// Error handler helper
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;

    // Check for specific field errors first
    if (apiError?.errors && Object.keys(apiError.errors).length > 0) {
      const firstErrorKey = Object.keys(apiError.errors)[0];
      const firstErrorValue = apiError.errors[firstErrorKey];
      const errorMessage = Array.isArray(firstErrorValue) ? firstErrorValue[0] : String(firstErrorValue);
      // Optional: prefix with field name if it makes sense, or just return the message
      // return `${firstErrorKey}: ${errorMessage}`; 
      return errorMessage;
    }

    // Fallback to generic message
    if (apiError?.message) {
      return apiError.message;
    }
  }
  return error.message || 'An unexpected error occurred';
};