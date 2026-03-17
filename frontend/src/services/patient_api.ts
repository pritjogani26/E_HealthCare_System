import { api, unwrap } from './api';
import { PatientRegistrationData, RegisterResponse, PatientProfile, PatientProfileUpdateData, ApiResponse } from '../types';

export async function registerPatient(data: PatientRegistrationData | FormData): Promise<RegisterResponse> {
  const res = await api.post<ApiResponse<RegisterResponse>>("/patients/register/", data);
  return unwrap(res.data);
}

export async function getPatientProfile(): Promise<PatientProfile> {
  const res = await api.get<ApiResponse<PatientProfile>>("/patients/profile/");
  return unwrap(res.data);
}

export async function updatePatientProfile(data: PatientProfileUpdateData): Promise<PatientProfile> {
  const res = await api.patch<ApiResponse<PatientProfile>>("/patients/profile/", data);
  return unwrap(res.data);
}
