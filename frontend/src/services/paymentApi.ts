// frontend/src/services/paymentApi.ts
import { api, handleApiError, getFieldErrors, unwrap } from "./api";
import type {
  CreateOrderResponse,
  RazorpaySuccessResponse,
  VerifyResponse,
} from "../types/payment";

export async function createOrder(
  paymentFor: "APPOINTMENT" | "LAB_TEST",
  referenceId: string | number,
): Promise<CreateOrderResponse> {
  const res = await api.post(
    `/payments/create-order/`,
    {
      payment_for: paymentFor,
      reference_id: String(referenceId),
    },
  );
  return unwrap(res.data);
}

export async function verifyPayment(
  payload: RazorpaySuccessResponse,
): Promise<VerifyResponse> {
  const res = await api.post(
    `/payments/verify/`,
    payload,
  );
  return unwrap(res.data);
}

export async function getPaymentStatus(
  paymentId: string | number,
): Promise<any> {
  const res = await api.get(`/payments/${paymentId}/status/`);
  return unwrap(res.data);
}

export async function getPaymentHistory(params?: {
  limit?: number;
  offset?: number;
  payment_for?: "APPOINTMENT" | "LAB_TEST";
}): Promise<any> {
  const res = await api.get(`/payments/history/`, { params });
  return unwrap(res.data);
}

export { handleApiError, getFieldErrors };