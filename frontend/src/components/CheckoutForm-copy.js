import React, { useState } from "react";

export default function CheckoutForm() {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    amount: "",
    auth3ds: "Y", // default to Y
    currency: "840", // default to USD (840), KHR is 116
  });

  const [resultMessage, setResultMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResultMessage(null);

    // 💥 Frontend fix: if KHR, ensure integer, no decimal
    let adjustedAmount = formData.amount;
    if (formData.currency === "116") {
      adjustedAmount = parseInt(formData.amount).toString();
    }

    const payload = {
      ...formData,
      amount: adjustedAmount,
      capture: "N", // always authorize-only mode
    };

    console.log("✅ Sending payload:", payload);

    try {
      const res = await fetch("http://localhost:5001/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Checkout</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">Card Number:</label>
          <input
            className="w-full border p-2"
            name="cardNumber"
            placeholder="e.g., 5321962054348950"
            value={formData.cardNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Expiry Date (MM/YY):</label>
          <input
            className="w-full border p-2"
            name="expiry"
            placeholder="MM/YY"
            value={formData.expiry}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1">CVV:</label>
          <input
            className="w-full border p-2"
            name="cvv"
            placeholder="e.g., 123"
            value={formData.cvv}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Amount:</label>
          <input
            className="w-full border p-2"
            name="amount"
            placeholder="e.g., 100"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Currency:</label>
          <select
            className="w-full border p-2"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
          >
            <option value="840">USD (840)</option>
            <option value="116">KHR (116)</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">3DS:</label>
          <select
            className="w-full border p-2"
            name="auth3ds"
            value={formData.auth3ds}
            onChange={handleChange}
          >
            <option value="Y">3DS Enabled (Y)</option>
            <option value="N">3DS Disabled (N)</option>
          </select>
        </div>

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
