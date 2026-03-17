import { api, unwrap } from './api';
import { LabRegistrationData, RegisterResponse, LabProfile, LabProfileUpdateData, ApiResponse } from '../types';

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
