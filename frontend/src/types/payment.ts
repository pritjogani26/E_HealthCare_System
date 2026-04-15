export interface CreateOrderResponse {
  order_id: string;
  amount: number;          // in paise
  currency: string;
  key_id: string;
  payment_for: "APPOINTMENT" | "LAB_TEST";
  reference_id: string;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyResponse {
  payment_id: string;
  payment_for: string;
  reference_id: string;
}