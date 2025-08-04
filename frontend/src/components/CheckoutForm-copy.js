import React, { useState } from "react";

export default function CheckoutForm() {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    amount: "",
    capture: "Y", // ✅ default to "Y"
  });

  const [resultMessage, setResultMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch("http://localhost:5001/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.data && data.data.status === "Approved") {
        setResultMessage(
          `✅ Payment Approved! Auth Code: ${data.data.authnumber}`
        );
      } else {
        setResultMessage(
          `❌ Payment Failed. Status: ${data.data?.status || "Unknown"}`
        );
      }
    } catch (error) {
      console.error("❌ Payment Error:", error);
      setResultMessage("❌ An error occurred while processing the payment.");
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Checkout</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          name="cardNumber"
          placeholder="Card Number"
          onChange={handleChange}
          required
        />
        <input
          className="w-full border p-2"
          name="expiry"
          placeholder="MM/YY"
          onChange={handleChange}
          required
        />
        <input
          className="w-full border p-2"
          name="cvv"
          placeholder="CVV"
          onChange={handleChange}
          required
        />
        <input
          className="w-full border p-2"
          name="amount"
          placeholder="Amount (e.g., 100)"
          onChange={handleChange}
          required
        />

        {/* ✅ Capture selector */}
        <select
          className="w-full border p-2"
          name="capture"
          value={formData.capture}
          onChange={handleChange}
        >
          <option value="Y">Immediate Capture (Y)</option>
          <option value="N">Authorize Only (N)</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Pay Now"}
        </button>
      </form>

      {resultMessage && (
        <div className="mt-4 p-2 border rounded text-center">
          {resultMessage}
        </div>
      )}
    </div>
  );
}
