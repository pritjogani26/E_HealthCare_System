// src/services/prescription_api.ts

import { api, unwrap } from './api';
import { ApiResponse } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MedicineInput {
  medicine_name: string;
  dosage?: string;
  frequency?: FrequencyChoice | '';
  duration?: string;
  instructions?: InstructionChoice | '';
}

export type FrequencyChoice =
  | 'once_daily'
  | 'twice_daily'
  | 'thrice_daily'
  | 'four_times_daily'
  | 'as_needed'
  | 'at_bedtime';

export type InstructionChoice =
  | 'after_food'
  | 'before_food'
  | 'with_food'
  | 'empty_stomach'
  | 'at_bedtime'
  | 'with_water';

export interface PrescriptionCreatePayload {
  clinical_notes?: string;
  medicines: MedicineInput[];
  lab_tests?: string;
  advice?: string;
  follow_up_date?: string | null;   // "YYYY-MM-DD"
}

export interface MedicineOutput {
  medicine_id: number;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  sort_order: number;
}

export interface Prescription {
  prescription_id: string;
  appointment_id: number;
  prescription_number: string;
  clinical_notes: string | null;
  lab_tests: string | null;
  advice: string | null;
  follow_up_date: string | null;
  pdf_path: string | null;
  pdf_url: string | null;
  medicines: MedicineOutput[];
  created_at: string;
}

export interface PatientPrescriptionSummary {
  prescription_id: string;
  appointment_id: number;
  prescription_number: string;
  doctor_name: string;
  slot_date: string | null;
  pdf_path: string | null;
  pdf_url: string | null;
  created_at: string;
}

// ── Label maps (shared with form UI) ──────────────────────────────────────

export const FREQUENCY_LABELS: Record<FrequencyChoice, string> = {
  once_daily:       'Once daily',
  twice_daily:      'Twice daily',
  thrice_daily:     'Thrice daily',
  four_times_daily: 'Four times daily',
  as_needed:        'As needed',
  at_bedtime:       'At bedtime',
};

export const INSTRUCTION_LABELS: Record<InstructionChoice, string> = {
  after_food:    'After food',
  before_food:   'Before food',
  with_food:     'With food',
  empty_stomach: 'Empty stomach',
  at_bedtime:    'At bedtime',
  with_water:    'With water',
};

// ── API calls ──────────────────────────────────────────────────────────────

/** Doctor: submit a prescription for an appointment */
export async function createPrescription(
  appointmentId: number,
  payload: PrescriptionCreatePayload,
): Promise<Prescription> {
  const res = await api.post<ApiResponse<Prescription>>(
    `/appointments/${appointmentId}/prescribe/`,
    payload,
  );
  return unwrap(res.data);
}

/** Doctor or Patient: get prescription for a specific appointment */
export async function getPrescriptionByAppointment(
  appointmentId: number,
): Promise<Prescription> {
  const res = await api.get<ApiResponse<Prescription>>(
    `/appointments/${appointmentId}/prescription/`,
  );
  return unwrap(res.data);
}

/** Patient: list all their prescriptions */
export async function getMyPrescriptions(): Promise<PatientPrescriptionSummary[]> {
  const res = await api.get<ApiResponse<PatientPrescriptionSummary[]>>(
    '/prescriptions/my/',
  );
  return unwrap(res.data);
}