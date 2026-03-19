import { api } from "./api";
import { AxiosResponse } from "axios";

export interface LookupItem {
  blood_group_id?: number;
  blood_group_value?: string;
  gender_id?: number;
  gender_value?: string;
  specialization_id?: number;
  specialization_name?: string;
  description?: string;
  qualification_id?: number;
  qualification_code?: string;
  qualification_name?: string;
  id?: number;
  name?: string;
  role_id?: number;
  role?: string;
  role_description?: string;
  is_active?: boolean;
}

export const getBloodGroups = (activeOnly: boolean = false) => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/blood-groups/?active_only=${activeOnly}`).then((r: AxiosResponse) => r.data);

export const addBloodGroup = (value: string) => 
  api.post<{success: boolean}>(`/users/settings/blood-groups/`, { blood_group_value: value }).then((r: AxiosResponse) => r.data);

export const getGenders = () => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/genders/`).then((r: AxiosResponse) => r.data);

export const addGender = (value: string) => 
  api.post<{success: boolean}>(`/users/settings/genders/`, { gender_value: value }).then((r: AxiosResponse) => r.data);

export const getSpecializations = (activeOnly: boolean = false) => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/specializations/?active_only=${activeOnly}`).then((r: AxiosResponse) => r.data);

export const addSpecialization = (name: string, description: string) => 
  api.post<{success: boolean}>(`/users/settings/specializations/`, { specialization_name: name, description }).then((r: AxiosResponse) => r.data);

export const toggleSpecializationStatus = (id: number, isActive: boolean) => 
  api.patch<{success: boolean}>(`/users/settings/specializations/`, { specialization_id: id, is_active: isActive }).then((r: AxiosResponse) => r.data);

export const getQualifications = (activeOnly: boolean = false) => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/qualifications/?active_only=${activeOnly}`).then((r: AxiosResponse) => r.data);

export const addQualification = (code: string, name: string) => 
  api.post<{success: boolean}>(`/users/settings/qualifications/`, { qualification_code: code, qualification_name: name }).then((r: AxiosResponse) => r.data);

export const toggleQualificationStatus = (id: number, isActive: boolean) => 
  api.patch<{success: boolean}>(`/users/settings/qualifications/`, { qualification_id: id, is_active: isActive }).then((r: AxiosResponse) => r.data);

export const getVerificationTypes = () => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/verification-types/`).then((r: AxiosResponse) => r.data);

export const addVerificationType = (name: string, description: string) => 
  api.post<{success: boolean}>(`/users/settings/verification-types/`, { name, description }).then((r: AxiosResponse) => r.data);

export const getUserRoles = () => 
  api.get<{success: boolean, data: LookupItem[]}>(`/users/settings/user-roles/`).then((r: AxiosResponse) => r.data);

export const addUserRole = (role: string, description: string) => 
  api.post<{success: boolean}>(`/users/settings/user-roles/`, { role, role_description: description }).then((r: AxiosResponse) => r.data);
