import { useCallback } from "react";

const loadScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const useRazorpay = () => {
  const openCheckout = useCallback(
    async (
      orderData: {
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        description: string;
        patientName: string;
        patientEmail: string;
        patientPhone: string;
      },
      onSuccess: (res: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void,
      onFailure: (err: unknown) => void
    ) => {
      const loaded = await loadScript();
      if (!loaded) {
        onFailure(new Error("Razorpay SDK failed to load"));
        return;
      }

      const options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "E-Healthcare",
        description: orderData.description,
        order_id:    orderData.order_id,
        prefill: {
          name:  orderData.patientName,
          email: orderData.patientEmail,
          contact: orderData.patientPhone,
        },
        theme: { color: "#0d6efd" },
        handler: onSuccess,
        modal: {
          ondismiss: () => onFailure(new Error("Payment cancelled by user")),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: unknown) => onFailure(res));
      rzp.open();
    },
    []
  );

  return { openCheckout };
};