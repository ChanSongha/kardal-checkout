import React, { useState } from "react";

export default function CaptureForm() {
  const [formData, setFormData] = useState({
    orderid: "",
    paymentid: "",
    amount: "",
    authnumber: "",
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
      const res = await fetch("http://localhost:5001/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.data && data.data.status === "Approved") {
        setResultMessage(
          `✅ Capture Approved! Capture Auth Code: ${data.data.authnumber}`
        );
      } else {
        setResultMessage(
          `❌ Capture Failed. Status: ${data.data?.status || "Unknown"}`
        );
      }
    } catch (error) {
      console.error("❌ Capture Error:", error);
      setResultMessage("❌ An error occurred during capture.");
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Capture Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          name="orderid"
          placeholder="New Order ID (e.g., ORD123456789)"
          onChange={handleChange}
          required
        />
        <input
          className="w-full border p-2"
          name="paymentid"
          placeholder="Payment ID (from authorization)"
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
        <input
          className="w-full border p-2"
          name="authnumber"
          placeholder="Auth Number (from authorization)"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          disabled={isLoading}
        >
          {isLoading ? "Processing Capture..." : "Capture Payment"}
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
