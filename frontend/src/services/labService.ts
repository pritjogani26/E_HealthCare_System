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
