"use client";

import { useState, useEffect } from "react";

export default function PremiumButton() {
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Replace with logged-in user's data
  const email = "user@example.com";
  const name = "John Doe";

  // Automatically check premium status on component mount
  useEffect(() => {
    checkPremium();
  }, []);

  // 1️⃣ Check premium status from backend
  const checkPremium = async () => {
    try {
      const res = await fetch(`/api/check-premium?email=${email}`);
      const data = await res.json();
      setPremium(data.premium || false);
      setLoading(false);
    } catch (err) {
      console.error("Check premium failed:", err);
      setLoading(false);
    }
  };

  // 2️⃣ Trigger Razorpay payment
  const pay = async () => {
    try {
      // Call your backend to create Razorpay order
      const orderRes = await fetch("/api/create-order", { method: "POST" });
      const orderData = await orderRes.json();

      const options = {
        key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Razorpay Key ID
        amount: orderData.amount,
        currency: "INR",
        name: "NAVIK Premium",
        description: "Premium Subscription",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3️⃣ Verify payment
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment Successful! You are now premium ✅");
            checkPremium(); // update premium status
          } else {
            alert("Payment verification failed ❌");
          }
        },
        prefill: { name, email },
        theme: { color: "#111827" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Something went wrong. Try again.");
    }
  };

  if (loading) return <p>Loading premium status...</p>;

  return (
    <div>
      <button
        onClick={pay}
        disabled={premium}
        style={{
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          backgroundColor: premium ? "#ccc" : "#111827",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: premium ? "not-allowed" : "pointer",
        }}
      >
        {premium ? "You are Premium ✅" : "Buy Premium"}
      </button>
    </div>
  );
}
