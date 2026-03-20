import { api, unwrap } from "./api";
import {
  PatientList,
  DoctorList,
  LabList,
  DoctorProfile,
  LabProfile,
  AuditLog,
  ApiResponse,
} from "../types";

export async function getAllPatients(): Promise<PatientList[]> {
  const res = await api.get("/users/admin/patients/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export async function getAllDoctors(): Promise<DoctorList[]> {
  const res = await api.get("/users/admin/doctors/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export async function getAllLabs(): Promise<LabList[]> {
  const res = await api.get("/users/admin/labs/");
  const d = res.data;
  if (Array.isArray(d)) return d;
  return d.data ?? d.results ?? [];
}

export async function togglePatientStatus(
  patientId: string,
  reason?: string,
): Promise<PatientList> {
  const res = await api.patch<ApiResponse<PatientList>>(
    `/users/admin/patients/${patientId}/toggle-status/`,
    { reason },
  );
  return unwrap(res.data);
}

export async function toggleDoctorStatus(
  userId: string,
  reason?: string,
): Promise<DoctorList> {
  const res = await api.patch<ApiResponse<DoctorList>>(
    `/users/admin/doctors/${userId}/toggle-status/`,
    { reason },
  );
  return unwrap(res.data);
}

export async function toggleLabStatus(
  userId: string,
  reason?: string,
): Promise<LabList> {
  const res = await api.patch<ApiResponse<LabList>>(
    `/users/admin/labs/${userId}/toggle-status/`,
    { reason },
  );
  return unwrap(res.data);
}

export async function verifyDoctor(
  userId: string,
  status: "VERIFIED" | "REJECTED",
  notes?: string,
): Promise<DoctorList> {
  const res = await api.patch<ApiResponse<DoctorList>>(
    `/users/admin/doctors/${userId}/verify/`,
    { status, notes },
  );
  return unwrap(res.data);
}

export async function verifyLab(
  userId: string,
  status: "VERIFIED" | "REJECTED",
  notes?: string,
): Promise<LabProfile> {
  const res = await api.patch<ApiResponse<LabProfile>>(
    `/users/admin/labs/${userId}/verify/`,
    { status, notes },
  );
  return unwrap(res.data);
}

export async function getPendingApprovalsCount(): Promise<{
  doctors: number;
  labs: number;
  total: number;
}> {
  const res = await api.get("/users/admin/pending-approvals/count/");
  return unwrap(res.data);
}

export async function getRecentActivity(): Promise<AuditLog[]> {
  const res = await api.get<ApiResponse<AuditLog[]>>(
    "/users/admin/recent-activity/",
  );
  return unwrap(res.data) ?? [];
}

export async function downloadAuditLogs(
  status: "ALL" | "SUCCESS" | "FAILURE",
  type: "PDF" | "CSV",
): Promise<void> {
  const res = await api.post(
    `/users/admin/download-audit-logs/`,
    { status, type },
    {
      responseType: "blob",
    },
  );

  const mimeType = type === "PDF" ? "application/pdf" : "text/csv";
  const ext = type.toLowerCase();
  const filename = `audit_logs_${status.toLowerCase()}_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.${ext}`;

  const url = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}