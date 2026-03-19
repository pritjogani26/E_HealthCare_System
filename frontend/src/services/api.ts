import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
  LoginData,
  LoginResponse,
  ApiError,
  ApiResponse,
  BloodGroup,
  Gender,
  Qualification,
  ReAuthErrorResponse,
  ReAuthError,
} from "../types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

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
            return api(original);
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
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        (original.headers as any).Authorization = `Bearer ${access_token}`;
        processQueue(null, access_token);
        isRefreshing = false;
        return api(original);
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
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  });

  if (file) fd.append(fileKey, file);
  return fd;
}

export { ReAuthError } from "../types";

export function unwrap<T>(responseData: ApiResponse<T>): T {
  return responseData.data;
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const res = await api.post<{ success: boolean; message: string; data: LoginResponse; permissions?: string[] }>("/users/auth/login/", data);
  const body = res.data;
  // Backend shape: { success, message, data: { user, access_token, ... }, permissions: [...] }
  const loginData = body.data;
  const permissions = (body as any).permissions ?? loginData.permissions ?? [];
  return { ...loginData, permissions };
}

export async function logout(): Promise<void> {
  await api.post("/users/auth/logout/");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export async function refreshToken(): Promise<{ access_token: string; user: any }> {
  const res = await axios.post(
    `${API_BASE_URL}/users/auth/refresh/`,
    {},
    { withCredentials: true }
  );
  const { access_token, user } = res.data.data;
  return { access_token, user };
}

export async function googleLogin(token: string): Promise<any> {
  const res = await api.post("/users/auth/google/", { token });
  return res.data;
}

export async function verifyPasswordForReauth(password: string): Promise<void> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new ReAuthError("No active session.", 401, "token_expired");
  }

  try {
    await api.post(
      "/users/auth/reauth-verify/",
      { password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const httpStatus = error.response?.status ?? 500;
      const body = error.response?.data as { success: boolean; message?: string; code?: string } | undefined;
      const message = body?.message ?? "Re-authentication failed.";
      const code = body?.code as ReAuthErrorResponse["code"] | undefined;
      throw new ReAuthError(message, httpStatus, code ?? "invalid_password");
    }
    throw new ReAuthError("An unexpected error occurred.", 500);
  }
}

export async function verifyEmail(token: string): Promise<any> {
  const res = await api.post("/users/auth/verify-email/", { token });
  return res.data;
}

export async function resendVerification(email: string): Promise<any> {
  const res = await api.post("/users/auth/resend-verification/", { email });
  return res.data;
}

export async function getCurrentUserProfile(): Promise<any> {
  const res = await api.get("/users/profile/me/");
  return unwrap(res.data);
}

export async function getBloodGroups(): Promise<BloodGroup[]> {
  const res = await api.get("/users/blood-groups/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export async function getGenders(): Promise<Gender[]> {
  const res = await api.get("/users/genders/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export async function getQualifications(): Promise<Qualification[]> {
  const res = await api.get("/users/qualifications/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
    if ((body as any)?.detail) return String((body as any).detail);
    if (body?.errors && typeof body.errors === "object") {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(body.errors)) {
        const msg = Array.isArray(value) ? value[0] : String(value);
        if (msg) messages.push(field === "non_field_errors" ? msg : `${field}: ${msg}`);
      }
      if (messages.length > 0) return messages[0];
    }
    return error.message || "An unexpected error occurred.";
  }

  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
};

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