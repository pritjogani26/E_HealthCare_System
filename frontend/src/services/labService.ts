// frontend\src\services\labService.ts
import { api, unwrap } from "./api";

// --- Types ---
export interface LabTestCategory {
  category_id?: number;
  category_name: string;
  description?: string;
  is_active?: boolean;
}

export interface LabTest {
  test_id?: number;
  category_id?: number;
  test_code: string;
  test_name: string;
  description?: string;
  sample_type: string;
  fasting_required: boolean;
  fasting_hours?: number;
  price: number;
  turnaround_hours?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  created_by_name?: string;
  parameters?: TestParameter[];
}

export interface TestParameter {
  parameter_id?: number;
  test_id: number;
  test_name?: string;
  parameter_name: string;
  unit?: string;
  normal_range?: string;
}

// --- Category API ---
export const fetchLabCategories = async (params?: any): Promise<LabTestCategory[]> => {
  const res = await api.get("/labs/categories/", { params });
  return unwrap<LabTestCategory[]>(res.data);
};

export const createLabCategory = async (data: LabTestCategory): Promise<LabTestCategory> => {
  const res = await api.post("/labs/categories/", data);
  return unwrap<LabTestCategory>(res.data);
};

export const fetchLabCategoryDetails = async (categoryId: number): Promise<LabTestCategory> => {
  const res = await api.get(`/labs/categories/${categoryId}/`);
  return unwrap<LabTestCategory>(res.data);
};

export const updateLabCategory = async (categoryId: number, data: LabTestCategory): Promise<LabTestCategory> => {
  const res = await api.put(`/labs/categories/${categoryId}/`, data);
  return unwrap<LabTestCategory>(res.data);
};

export const deleteLabCategory = async (categoryId: number) => {
  const res = await api.delete(`/labs/categories/${categoryId}/`);
  return res.data;
};

// --- Test API ---
export const fetchLabTests = async (params?: any): Promise<LabTest[]> => {
  const res = await api.get("/labs/tests/", { params });
  return unwrap<LabTest[]>(res.data);
};

export const fetchLabTestDetails = async (testId: number): Promise<LabTest> => {
  const res = await api.get(`/labs/tests/${testId}/`);
  return unwrap<LabTest>(res.data);
};

export const createLabTest = async (data: LabTest): Promise<LabTest> => {
  const res = await api.post("/labs/tests/", data);
  return unwrap<LabTest>(res.data);
};

export const updateLabTest = async (testId: number, data: LabTest): Promise<LabTest> => {
  const res = await api.put(`/labs/tests/${testId}/`, data);
  return unwrap<LabTest>(res.data);
};

export const deleteLabTest = async (testId: number) => {
  const res = await api.delete(`/labs/tests/${testId}/`);
  return res.data;
};

// --- Test Parameter API ---
export const fetchTestParameters = async (params?: any): Promise<TestParameter[]> => {
  const res = await api.get("/labs/test-parameters/", { params });
  return unwrap<TestParameter[]>(res.data);
};

export const createTestParameter = async (data: TestParameter): Promise<TestParameter> => {
  const res = await api.post("/labs/test-parameters/", data);
  return unwrap<TestParameter>(res.data);
};

export const updateTestParameter = async (parameterId: number, data: TestParameter): Promise<TestParameter> => {
  const res = await api.put(`/labs/test-parameters/${parameterId}/`, data);
  return unwrap<TestParameter>(res.data);
};

export const deleteTestParameter = async (parameterId: number) => {
  const res = await api.delete(`/labs/test-parameters/${parameterId}/`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// LAB BOOKING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CollectionAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

export interface LabSlot {
  slot_id: number;
  lab_id: string;
  slot_date: string;       // YYYY-MM-DD
  start_time: string;      // HH:MM:SS
  end_time: string;
  booked_count: number;
  is_active: boolean;
}

export type BookingStatus = "BOOKED" | "COMPLETED" | "CANCELLED";
export type CollectionType = "lab_visit" | "home";

/** Present on lab `my-bookings` responses for display at the lab. */
export interface LabBookingPatient {
  email: string;
  full_name: string;
  date_of_birth?: string | null;
  mobile?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  blood_group?: string | null;
  gender?: string | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface LabBooking {
  booking_id: string;
  patient_id: string;
  lab_id: string;
  slot_id: number;
  test_id: number;
  collection_type: CollectionType;
  /** API may return a JSON string for home collection. */
  collection_address?: CollectionAddress | string | null;
  booking_status: BookingStatus;
  patient?: LabBookingPatient | null;
  subtotal: string;
  home_collection_charge: string;
  discount_amount: string;
  total_amount: string;
  notes?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  test_name: string;
  test_code: string;
  sample_type: string;
  fasting_required: boolean;
  slot_date: string;
  start_time: string;
  end_time: string;
  lab_name: string;
}

export interface LabReport {
  result_id: number;
  booking_id: string;
  report_file_url: string;
  report_type: string;
  result_notes?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
}

export interface LabTestParameterResult {
  parameter_id?: number;
  parameter_name: string;
  unit?: string;
  normal_range?: string;
  patient_value: string;
  is_abnormal?: boolean;
}

export interface CreateBookingPayload {
  lab_id: string;
  slot_id: number;
  test_id: number;
  collection_type: CollectionType;
  collection_address?: CollectionAddress | null;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAB BOOKING API
// ─────────────────────────────────────────────────────────────────────────────

/** Patient: create a new booking */
export const createLabBooking = async (
  payload: CreateBookingPayload,
): Promise<LabBooking> => {
  const res = await api.post("/labs/bookings/", payload);
  return unwrap<LabBooking>(res.data);
};

/** Patient: list own bookings */
export const fetchMyLabBookings = async (): Promise<LabBooking[]> => {
  const res = await api.get("/labs/bookings/");
  return unwrap<LabBooking[]>(res.data);
};

/** Any authorised role: fetch single booking */
export const fetchLabBooking = async (bookingId: string): Promise<LabBooking> => {
  const res = await api.get(`/labs/bookings/${bookingId}/`);
  return unwrap<LabBooking>(res.data);
};

/** Patient / Lab / Admin: cancel a booking */
export const cancelLabBooking = async (
  bookingId: string,
  cancellationReason?: string,
): Promise<LabBooking> => {
  const res = await api.post(`/labs/bookings/${bookingId}/cancel/`, {
    cancellation_reason: cancellationReason ?? "",
  });
  return unwrap<LabBooking>(res.data);
};

/** Lab / Admin: mark booking as completed */
export const completeLabBooking = async (bookingId: string): Promise<LabBooking> => {
  const res = await api.post(`/labs/bookings/${bookingId}/complete/`);
  return unwrap<LabBooking>(res.data);
};

export const completeLabBookingWithReport = async (
  bookingId: string,
  payload: {
    report_file: File;
    report_type?: string;
    result_notes?: string;
    parameter_results: LabTestParameterResult[];
  },
): Promise<LabBooking> => {
  const formData = new FormData();
  formData.append("report_file", payload.report_file);
  formData.append("report_type", payload.report_type ?? "pdf");
  if (payload.result_notes) formData.append("result_notes", payload.result_notes);
  formData.append("parameter_results", JSON.stringify(payload.parameter_results));

  const res = await api.post(`/labs/bookings/${bookingId}/complete/`, formData);
  return unwrap<LabBooking>(res.data);
};

/** Lab: list own incoming bookings */
export const fetchLabOwnBookings = async (): Promise<LabBooking[]> => {
  const res = await api.get("/labs/my-bookings/");
  return unwrap<LabBooking[]>(res.data);
};

/** Reports */
export const fetchBookingReports = async (bookingId: string): Promise<LabReport[]> => {
  const res = await api.get(`/labs/bookings/${bookingId}/reports/`);
  return unwrap<LabReport[]>(res.data);
};

export const uploadBookingReport = async (
  bookingId: string,
  payload: { report_file_url: string; report_type?: string; result_notes?: string },
): Promise<LabReport> => {
  const res = await api.post(`/labs/bookings/${bookingId}/reports/`, payload);
  return unwrap<LabReport>(res.data);
};

export const fetchLabSlots = async (
  labId: string,
  date: string,
): Promise<LabSlot[]> => {
  const res = await api.get("/labs/slots/", { params: { lab_id: labId, date } });
  return unwrap<LabSlot[]>(res.data);
};

export const generateLabSlots = async (days: number): Promise<{ slots_created: number }> => {
  const res = await api.post("/labs/slots/generate/", { days });
  return unwrap<{ slots_created: number }>(res.data);
};
