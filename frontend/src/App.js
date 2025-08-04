import React, { useState } from "react";
import CheckoutForm from "./components/CheckoutForm";
import CaptureForm from "./components/CaptureForm";

function App() {
  const [showCapture, setShowCapture] = useState(false);

  return (
    <div className="App p-4">
      <h1 className="text-2xl font-bold mb-4">Kardal Payment Portal</h1>

      <button
        onClick={() => setShowCapture(!showCapture)}
        className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        {showCapture
          ? "🔄 Switch to Checkout Form"
          : "🔄 Switch to Capture Form"}
      </button>

      {showCapture ? <CaptureForm /> : <CheckoutForm />}
    </div>
  );
}

export default App;
