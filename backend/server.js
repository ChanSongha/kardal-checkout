const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/payment", (req, res) => {
  const { cardNumber, expiry, cvv, amount } = req.body;

  const mockResponse = {
    status: "success",
    transactionId: "TX-" + Date.now(),
    message: "Payment processed successfully",
  };

  res.status(200).json(mockResponse);
});
app.get("/", (req, res) => {
  res.send("🎉 Kardal Checkout Backend is running!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
