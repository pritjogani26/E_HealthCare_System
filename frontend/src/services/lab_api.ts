import { api, unwrap } from './api';
import {
  LabRegistrationData,
  RegisterResponse,
  LabProfile,
  LabProfileUpdateData,
  LabOperatingHour,
  ApiResponse,
} from '../types';

export async function registerLab(data: LabRegistrationData | FormData): Promise<RegisterResponse> {
  const res = await api.post<ApiResponse<RegisterResponse>>("/labs/register/", data);
  return unwrap(res.data);
}

export async function getLabProfile(): Promise<LabProfile> {
  const res = await api.get<ApiResponse<LabProfile>>("/labs/profile/");
  return unwrap(res.data);
}

export async function updateLabProfile(data: LabProfileUpdateData): Promise<LabProfile> {
  const res = await api.patch<ApiResponse<LabProfile>>("/labs/profile/", data);
  return unwrap(res.data);
}

/** Fetch the lab's current operating hours. */
export async function getLabOperatingHours(): Promise<LabOperatingHour[]> {
  const res = await api.get<ApiResponse<LabOperatingHour[]>>("/labs/operating-hours/");
  return unwrap(res.data);
}

/**
 * Replace all operating hours in one atomic call.
 * The backend will also purge future unbooked slots and regenerate new ones.
 */
export async function updateLabOperatingHours(
  hours: LabOperatingHour[],
): Promise<LabOperatingHour[]> {
  const res = await api.put<ApiResponse<LabOperatingHour[]>>("/labs/operating-hours/", hours);
  return unwrap(res.data);
}