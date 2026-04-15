import React, { useState } from "react";
import { useRazorpay } from "../hooks/useRazorpay";
import { createOrder, verifyPayment } from "../services/paymentApi";

interface Props {
  paymentFor: "APPOINTMENT" | "LAB_TEST";
  referenceId: string | number;
  label?: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  onSuccess?: (referenceId: string) => void;
  onError?: (err: string) => void;
}

type State = "idle" | "loading" | "success" | "error";

const PaymentButton: React.FC<Props> = ({
  paymentFor,
  referenceId,
  label = "Pay Now",
  patientName,
  patientEmail,
  patientPhone,
  onSuccess,
  onError,
}) => {
  const [state, setState] = useState<State>("idle");
  const [errMsg, setErrMsg] = useState("");
  const { openCheckout } = useRazorpay();

  const handlePay = async () => {
    setState("loading");
    setErrMsg("");

    try {
      // Step 1: Create order on backend
      const order = await createOrder(paymentFor, referenceId);

      // Step 2: Open Razorpay checkout
      await openCheckout(
        {
          order_id:    order.order_id,
          amount:      order.amount,
          currency:    order.currency,
          key_id:      order.key_id,
          description: paymentFor === "APPOINTMENT"
            ? "Doctor Consultation Fee"
            : "Lab Test Booking",
          patientName,
          patientEmail,
          patientPhone,
        },
        async (rzRes) => {
          try {
            // Step 3: Verify on backend
            const result = await verifyPayment({
              razorpay_order_id:   rzRes.razorpay_order_id,
              razorpay_payment_id: rzRes.razorpay_payment_id,
              razorpay_signature:  rzRes.razorpay_signature,
            });

            if (result.payment_id) {
              setState("success");
              onSuccess?.(result.reference_id);
            } else {
              throw new Error("Verification failed");
            }
          } catch {
            setState("error");
            setErrMsg("Payment verification failed. Contact support.");
            onError?.("Verification failed");
          }
        },
        (err) => {
          setState("error");
          const msg = err instanceof Error ? err.message : "Payment failed";
          setErrMsg(msg);
          onError?.(msg);
        }
      );
    } catch {
      setState("error");
      setErrMsg("Could not initiate payment. Try again.");
      onError?.("Order creation failed");
    }
  };

  if (state === "success") {
    return (
      <div style={{ color: "green", fontWeight: 500 }}>
        ✓ Payment successful! Booking confirmed.
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={state === "loading"}
        style={{
          padding: "10px 24px",
          backgroundColor: state === "loading" ? "#aaa" : "#0d6efd",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: state === "loading" ? "not-allowed" : "pointer",
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        {state === "loading" ? "Processing…" : label}
      </button>
      {state === "error" && errMsg && (
        <p style={{ color: "red", marginTop: 8, fontSize: 13 }}>{errMsg}</p>
      )}
    </div>
  );
};

export default PaymentButton;