import { useState } from "react";
import { useRazorpay } from "react-razorpay";

import "./App.css";

function App() {
  const { Razorpay } = useRazorpay();

  const [bookingId, setBookingId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const openCheckout = () => {
    if (!bookingId || !orderId || !amount) {
      alert("Enter Booking ID, Order ID and Amount");
      return;
    }

    if (!keyId) {
      alert("Razorpay Key ID is missing");
      return;
    }

    const options = {
      key: keyId,
      amount: Number(amount),
      currency: "INR" as const,
      name: "SeatFlow",
      description: "SeatFlow Event Booking",
      order_id: orderId,

      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        console.log("✅ PAYMENT SUCCESS");
        console.log("Razorpay response:", response);
        console.log("Booking ID:", bookingId);

        alert(
          "Payment completed successfully! Check the browser console."
        );
      },

      modal: {
        ondismiss: () => {
          console.log("Checkout closed");
        },
      },

      prefill: {
        name: "SeatFlow Customer",
      },

      theme: {
        color: "#111827",
      },
    };

    console.log("Opening Razorpay with:", {
      key: keyId,
      amount: Number(amount),
      currency: "INR",
      order_id: orderId,
    });

    const razorpay = new Razorpay(options);

    razorpay.on(
      "payment.failed",
      (response: {
        error: {
          code: string;
          description: string;
          source: string;
          step: string;
          reason: string;
          metadata: {
            order_id: string;
            payment_id: string;
          };
        };
      }) => {
        console.error("❌ PAYMENT FAILED");
       console.error(
  "Razorpay error:",
  JSON.stringify(response.error, null, 2)
);

console.error("Error code:", response.error.code);
console.error("Description:", response.error.description);
console.error("Source:", response.error.source);
console.error("Step:", response.error.step);
console.error("Reason:", response.error.reason);
console.error("Order ID:", response.error.metadata?.order_id);
console.error("Payment ID:", response.error.metadata?.payment_id);

        alert(
          `Payment failed: ${response.error.description}`
        );
      }
    );

    razorpay.open();
  };

  return (
    <main className="payment-page">
      <div className="payment-card">
        <h1>SeatFlow</h1>

        <p>Razorpay Test Checkout</p>

        <label htmlFor="bookingId">
          Booking ID
        </label>

        <input
          id="bookingId"
          value={bookingId}
          onChange={(e) =>
            setBookingId(e.target.value)
          }
          placeholder="68xxxxxxxx"
        />

        <label htmlFor="orderId">
          Razorpay Order ID
        </label>

        <input
          id="orderId"
          value={orderId}
          onChange={(e) =>
            setOrderId(e.target.value)
          }
          placeholder="order_xxxxxxxxx"
        />

        <label htmlFor="amount">
          Amount (paise)
        </label>

        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          placeholder="50000"
        />

        <button
          type="button"
          onClick={openCheckout}
        >
          Pay with Razorpay
        </button>
      </div>
    </main>
  );
}

export default App;