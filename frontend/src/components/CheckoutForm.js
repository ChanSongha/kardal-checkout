import { useState } from 'react';

export default function CheckoutForm() {
  const [formData, setFormData] = useState({
    cardNumber: '', expiry: '', cvv: '', amount: ''
  });
  const [result, setResult] = useState(null);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('http://localhost:5001/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Checkout</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input className="w-full border p-2" name="cardNumber" placeholder="Card Number" onChange={handleChange} required />
        <input className="w-full border p-2" name="expiry" placeholder="MM/YY" onChange={handleChange} required />
        <input className="w-full border p-2" name="cvv" placeholder="CVV" onChange={handleChange} required />
        <input className="w-full border p-2" name="amount" placeholder="Amount" onChange={handleChange} required />
        <button className="bg-blue-500 text-white px-4 py-2" type="submit">Pay Now</button>
      </form>
      {result && <div className="mt-4 text-green-600">{result.message}</div>}
    </div>
  );
}
