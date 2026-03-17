import { api, unwrap } from './api';
import { DoctorRegistrationData, RegisterResponse, DoctorProfile, DoctorProfileUpdateData, DoctorListItem, AppointmentSlot, DoctorAppointment, BookAppointmentData, ApiResponse } from '../types';

export async function registerDoctor(data: DoctorRegistrationData | FormData): Promise<RegisterResponse> {
  const res = await api.post<ApiResponse<RegisterResponse>>("/doctors/register/", data);
  return unwrap(res.data);
}

export async function getDoctorProfile(): Promise<DoctorProfile> {
  const res = await api.get<ApiResponse<DoctorProfile>>("/doctors/profile/");
  return unwrap(res.data);
}

export async function updateDoctorProfile(data: DoctorProfileUpdateData | Record<string, any>): Promise<DoctorProfile> {
  const res = await api.patch<ApiResponse<DoctorProfile>>("/doctors/profile/", data);
  return unwrap(res.data);
}

export async function getDoctorsList(): Promise<DoctorListItem[]> {
  const res = await api.get<ApiResponse<DoctorListItem[]>>("/doctors/list/");
  return unwrap(res.data) ?? [];
}

export async function getDoctorSlots(userId: string, date?: string): Promise<AppointmentSlot[]> {
  const url = date ? `/doctors/${userId}/slots/?date=${date}` : `/doctors/${userId}/slots/`;
  const res = await api.get<ApiResponse<AppointmentSlot[]>>(url);
  return unwrap(res.data) ?? [];
}

export async function bookAppointment(data: BookAppointmentData): Promise<DoctorAppointment> {
  const res = await api.post<ApiResponse<DoctorAppointment>>("/doctors/appointments/book/", data);
  return unwrap(res.data);
}

export async function getMyAppointments(): Promise<DoctorAppointment[]> {
  const res = await api.get<ApiResponse<DoctorAppointment[]>>("/doctors/appointments/my/");
  return unwrap(res.data) ?? [];
}

export async function getDoctorAppointments(): Promise<DoctorAppointment[]> {
  const res = await api.get<ApiResponse<DoctorAppointment[]>>("/doctors/appointments/my/");
  return unwrap(res.data) ?? [];
}

export async function cancelAppointment(appointmentId: number, reason?: string): Promise<DoctorAppointment> {
  const res = await api.patch<ApiResponse<DoctorAppointment>>(`/doctors/appointments/${appointmentId}/cancel/`, { reason: reason || "" });
  return unwrap(res.data);
}
