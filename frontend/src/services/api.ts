// frontend/src/services/api.ts

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
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
  BloodGroup,
  Gender,
  Qualification,
  PatientProfileUpdateData,
  DoctorProfileUpdateData,
  LabProfileUpdateData,
  AuditLog,
  DoctorListItem,
  AppointmentSlot,
  DoctorAppointment,
  BookAppointmentData,
  PatientList,
  DoctorList,
  LabList,
  // ── Fix: import reauth types from ../types (they are defined in types/index.ts)
  ReAuthVerifyPayload,
  ReAuthVerifyResponse,
  ReAuthErrorResponse,
  ReAuthError,
} from "../types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Token-refresh queue ───────────────────────────────────────────────────────
// When multiple requests arrive while a token refresh is in flight, they are
// queued here and resolved/rejected once the refresh completes.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

// ── Utility ───────────────────────────────────────────────────────────────────

export function buildFormData(
  payload: Record<string, any>,
  file?: File | null,
  fileKey = "profile_image"
): FormData {
  const fd = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      fd.append(key, value);
    } else if (Array.isArray(value) || typeof value === "object") {
      // Arrays and nested objects → JSON string.
      // Backend must call json.loads() to deserialise.
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  });

  if (file) fd.append(fileKey, file);
  return fd;
}

// ── ReAuthError ───────────────────────────────────────────────────────────────
// Re-exported from ../types so InactivityModel.tsx can import it from there
// instead of from here — preventing the circular import that caused
// AuthProvider to resolve as undefined.
// Both api.ts and InactivityModel.tsx import ReAuthError from "../types".
export { ReAuthError } from "../types";

// ── ApiService ────────────────────────────────────────────────────────────────

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    // ── Request: attach access token ─────────────────────────────────────────
    this.api.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem("access_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        // Let the browser set Content-Type for FormData so the multipart
        // boundary is generated correctly.
        if (config.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // ── Response: silent 401 → refresh ───────────────────────────────────────
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const original = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // ── Fix: skip auto-refresh for these endpoints ────────────────────────
        // /auth/refresh/      — refresh itself failing means full logout
        // /auth/reauth-verify/ — 401 here means wrong password, NOT expired token.
        //                        If we refreshed and retried, the reauth would
        //                        silently succeed with the new token but still
        //                        fail on the wrong password — confusing behaviour.
        const skipRefreshPaths = [
          "/users/auth/refresh/",
          "/users/auth/reauth-verify/",
        ];
        const requestUrl = (original as any)?.url ?? "";
        if (skipRefreshPaths.some((p) => requestUrl.includes(p))) {
          if (requestUrl.includes("/users/auth/refresh/")) {
            localStorage.removeItem("access_token");
            window.location.href = "/";
          }
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !original._retry) {
          if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                (original.headers as any).Authorization = `Bearer ${token}`;
                return this.api(original);
              })
              .catch((err) => Promise.reject(err));
          }

          original._retry = true;
          isRefreshing = true;

          try {
            const res = await axios.post(
              `${API_BASE_URL}/users/auth/refresh/`,
              {},
              { withCredentials: true }
            );
            const { access_token, user } = res.data.data;
            localStorage.setItem("access_token", access_token);
            if (user) localStorage.setItem("user", JSON.stringify(user));
            this.api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
            (original.headers as any).Authorization = `Bearer ${access_token}`;
            processQueue(null, access_token);
            isRefreshing = false;
            return this.api(original);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            localStorage.removeItem("access_token");
            window.location.href = "/";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Safely unwrap backend's { success, message, data } envelope */
  private unwrap<T>(responseData: ApiResponse<T>): T {
    return responseData.data;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────

  async login(data: LoginData): Promise<LoginResponse> {
    const res = await this.api.post<ApiResponse<LoginResponse>>(
      "/users/auth/login/",
      data
    );
    return this.unwrap(res.data);
  }

  async logout(): Promise<void> {
    await this.api.post("/users/auth/logout/");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }

  async refreshToken(): Promise<{ access_token: string; user: any }> {
    const res = await axios.post(
      `${API_BASE_URL}/users/auth/refresh/`,
      {},
      { withCredentials: true }
    );
    const { access_token, user } = res.data.data;
    return { access_token, user };
  }

  async googleLogin(token: string): Promise<any> {
    const res = await this.api.post("/users/auth/google/", { token });
    return res.data;
  }

  // ── Re-authentication (Scenario B — inactivity timeout) ──────────────────────
  //
  // Verifies the currently-authenticated user's password WITHOUT issuing
  // any new tokens. The existing access + refresh tokens remain in use.
  //
  // Throws ReAuthError on wrong password, rate-limit, locked account, or
  // missing access token. The axios interceptor is bypassed for this
  // endpoint (see skipRefreshPaths above) so a 401 here always means
  // wrong password, never a token expiry that can be silently fixed.

  async verifyPasswordForReauth(password: string): Promise<void> {
    const token = localStorage.getItem("access_token");

    if (!token) {
      // Session already dead on the client side — no point calling the API.
      throw new ReAuthError("No active session.", 401, "token_expired");
    }

    try {
      // POST /users/auth/reauth-verify/
      // Backend: ReAuthVerifyView — only verifies password, returns 200 or 4xx.
      await this.api.post(
        "/users/auth/reauth-verify/",
        { password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // HTTP 200 — re-auth successful. No return value needed.
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const httpStatus = error.response?.status ?? 500;
        const body = error.response?.data as
          | { success: boolean; message?: string; code?: string }
          | undefined;

        const message = body?.message ?? "Re-authentication failed.";
        const code = body?.code as ReAuthErrorResponse["code"] | undefined;

        switch (httpStatus) {
          case 401:
            throw new ReAuthError(
              message || "Incorrect password.",
              401,
              code ?? "invalid_password"
            );
          case 403:
            throw new ReAuthError(
              message || "Account is locked.",
              403,
              "account_locked"
            );
          case 429:
            throw new ReAuthError(
              "Too many attempts. Please wait a moment.",
              429
            );
          default:
            throw new ReAuthError(
              message || "Server error during re-authentication.",
              httpStatus
            );
        }
      }

      // Non-Axios error (network failure etc.)
      throw new ReAuthError("An unexpected error occurred.", 500);
    }
  }

  // ── Email Verification ───────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<any> {
    const res = await this.api.post("/users/auth/verify-email/", { token });
    return res.data;
  }

  async resendVerification(email: string): Promise<any> {
    const res = await this.api.post("/users/auth/resend-verification/", {
      email,
    });
    return res.data;
  }

  // ── Registration ─────────────────────────────────────────────────────────────

  async registerPatient(
    data: PatientRegistrationData | FormData
  ): Promise<RegisterResponse> {
    const res = await this.api.post<ApiResponse<RegisterResponse>>(
      "/patients/register/",
      data
    );
    return this.unwrap(res.data);
  }

  async registerDoctor(
    data: DoctorRegistrationData | FormData
  ): Promise<RegisterResponse> {
    const res = await this.api.post<ApiResponse<RegisterResponse>>(
      "/doctors/register/",
      data
    );
    return this.unwrap(res.data);
  }

  async registerLab(
    data: LabRegistrationData | FormData
  ): Promise<RegisterResponse> {
    const res = await this.api.post<ApiResponse<RegisterResponse>>(
      "/labs/register/",
      data
    );
    return this.unwrap(res.data);
  }

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async getCurrentUserProfile(): Promise<any> {
    const res = await this.api.get("/users/profile/me/");
    return this.unwrap(res.data);
  }

  async getPatientProfile(): Promise<PatientProfile> {
    const res =
      await this.api.get<ApiResponse<PatientProfile>>("/patients/profile/");
    return this.unwrap(res.data);
  }

  async updatePatientProfile(
    data: PatientProfileUpdateData
  ): Promise<PatientProfile> {
    const res = await this.api.patch<ApiResponse<PatientProfile>>(
      "/patients/profile/",
      data
    );
    return this.unwrap(res.data);
  }

  async getDoctorProfile(): Promise<DoctorProfile> {
    const res =
      await this.api.get<ApiResponse<DoctorProfile>>("/doctors/profile/");
    return this.unwrap(res.data);
  }

  async updateDoctorProfile(
    data: DoctorProfileUpdateData | Record<string, any>
  ): Promise<DoctorProfile> {
    const res = await this.api.patch<ApiResponse<DoctorProfile>>(
      "/doctors/profile/",
      data
    );
    return this.unwrap(res.data);
  }

  async getLabProfile(): Promise<LabProfile> {
    const res = await this.api.get<ApiResponse<LabProfile>>("/labs/profile/");
    return this.unwrap(res.data);
  }

  async updateLabProfile(data: LabProfileUpdateData): Promise<LabProfile> {
    const res = await this.api.patch<ApiResponse<LabProfile>>(
      "/labs/profile/",
      data
    );
    return this.unwrap(res.data);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────

  async getAllPatients(): Promise<PatientList[]> {
    const res = await this.api.get("/users/admin/patients/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  async getAllDoctors(): Promise<DoctorList[]> {
    const res = await this.api.get("/users/admin/doctors/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  async getAllLabs(): Promise<LabList[]> {
    const res = await this.api.get("/users/admin/labs/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  async togglePatientStatus(patientId: string): Promise<PatientList> {
    const res = await this.api.patch<ApiResponse<PatientList>>(
      `/users/admin/patients/${patientId}/toggle-status/`
    );
    return this.unwrap(res.data);
  }

  async toggleDoctorStatus(userId: string): Promise<DoctorList> {
    const res = await this.api.patch<ApiResponse<DoctorList>>(
      `/users/admin/doctors/${userId}/toggle-status/`
    );
    return this.unwrap(res.data);
  }

  async verifyDoctor(
    userId: string,
    status: "VERIFIED" | "REJECTED",
    notes?: string
  ): Promise<DoctorList> {
    const res = await this.api.patch<ApiResponse<DoctorList>>(
      `/users/admin/doctors/${userId}/verify/`,
      { status, notes }
    );
    return this.unwrap(res.data);
  }

  async verifyLab(
    userId: string,
    status: "VERIFIED" | "REJECTED",
    notes?: string
  ): Promise<LabProfile> {
    const res = await this.api.patch<ApiResponse<LabProfile>>(
      `/users/admin/labs/${userId}/verify/`,
      { status, notes }
    );
    return this.unwrap(res.data);
  }

  async getPendingApprovalsCount(): Promise<{
    doctors: number;
    labs: number;
    total: number;
  }> {
    const res = await this.api.get("/users/admin/pending-approvals/count/");
    return this.unwrap(res.data);
  }

  // ── Supporting Data ───────────────────────────────────────────────────────────

  async getBloodGroups(): Promise<BloodGroup[]> {
    const res = await this.api.get("/users/blood-groups/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  async getGenders(): Promise<Gender[]> {
    const res = await this.api.get("/users/genders/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  async getQualifications(): Promise<Qualification[]> {
    const res = await this.api.get("/users/qualifications/");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d.data ?? d.results ?? [];
  }

  // ── Audit Log ────────────────────────────────────────────────────────────────

  async getRecentActivity(): Promise<AuditLog[]> {
    const res = await this.api.get<ApiResponse<AuditLog[]>>(
      "/users/admin/recent-activity/"
    );
    return this.unwrap(res.data) ?? [];
  }

  // ── Appointments ──────────────────────────────────────────────────────────────

  async getDoctorsList(): Promise<DoctorListItem[]> {
    const res =
      await this.api.get<ApiResponse<DoctorListItem[]>>("/doctors/list/");
    return this.unwrap(res.data) ?? [];
  }

  async getDoctorSlots(
    userId: string,
    date?: string
  ): Promise<AppointmentSlot[]> {
    const url = date
      ? `/doctors/${userId}/slots/?date=${date}`
      : `/doctors/${userId}/slots/`;
    const res = await this.api.get<ApiResponse<AppointmentSlot[]>>(url);
    return this.unwrap(res.data) ?? [];
  }

  async bookAppointment(data: BookAppointmentData): Promise<DoctorAppointment> {
    const res = await this.api.post<ApiResponse<DoctorAppointment>>(
      "/doctors/appointments/book/",
      data
    );
    return this.unwrap(res.data);
  }

  async getMyAppointments(): Promise<DoctorAppointment[]> {
    const res = await this.api.get<ApiResponse<DoctorAppointment[]>>(
      "/doctors/appointments/my/"
    );
    return this.unwrap(res.data) ?? [];
  }

  async getDoctorAppointments(): Promise<DoctorAppointment[]> {
    const res = await this.api.get<ApiResponse<DoctorAppointment[]>>(
      "/doctors/appointments/my/"
    );
    return this.unwrap(res.data) ?? [];
  }

  async cancelAppointment(
    appointmentId: number,
    reason?: string
  ): Promise<DoctorAppointment> {
    const res = await this.api.patch<ApiResponse<DoctorAppointment>>(
      `/doctors/appointments/${appointmentId}/cancel/`,
      { reason: reason || "" }
    );
    return this.unwrap(res.data);
  }
}

export const apiService = new ApiService();

// ── Error Parser ───────────────────────────────────────────────────────────────

/**
 * Converts a backend ApiError into a human-readable string.
 * Backend format: { success: false, message: "...", errors: { field: ["msg"] } }
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiError | undefined;

    if (body?.errors && typeof body.errors === "object") {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(body.errors)) {
        const msg = Array.isArray(value) ? value[0] : String(value);
        if (msg)
          messages.push(
            field === "non_field_errors" ? msg : `${field}: ${msg}`
          );
      }
      if (messages.length > 0) return messages[0];
    }

    if (body?.message) return body.message;

    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "A conflict occurred. This record may already exist.";
      case 429:
        return "Too many requests. Please slow down.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
};

/**
 * Extracts per-field errors from an API error for inline form display.
 * Returns a map of { fieldName: "error message" }
 */
export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError(error)) return {};
  const body = error.response?.data as ApiError | undefined;
  if (!body?.errors) return {};

  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(body.errors)) {
    result[field] = Array.isArray(value) ? value[0] : String(value);
  }
  return result;
};