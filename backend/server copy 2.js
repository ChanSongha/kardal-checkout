const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🎉 Kardal Checkout Backend is running!");
});

// 🧾 Payment Endpoint
app.post("/api/payment", async (req, res) => {
  try {
    console.log("\n==============================");
    console.log("📥 [Incoming Request]:", new Date().toISOString());
    console.log("👉 Payload from frontend:", req.body);

    const { cardNumber, expiry, cvv, amount } = req.body;

    // Convert expiry to YYMM
    const [mm, yy] = expiry.split("/");
    const expirationDate = `${yy}${mm}`;

    const now = new Date();
    const pad = (v) => v.toString().padStart(2, "0");

    const transmissionDateTime = `${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const localTransactionDate = `${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}`;
    const localTransactionTime = `${pad(now.getHours())}${pad(
      now.getMinutes()
    )}${pad(now.getSeconds())}`;
    const systemTraceAuditNumber = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const retrievalReferenceNumber = Math.floor(
      100000000000 + Math.random() * 900000000000
    ).toString();

    const payload = {
      messageType: "1200",
      processingCode: "000000",
      amount: parseInt(parseFloat(amount) * 100).toString(),
      transmissionDateTime,
      systemTraceAuditNumber,
      localTransactionTime,
      localTransactionDate,
      expirationDate,
      merchantType: "6011",
      posEntryMode: "012",
      cardNumber,
      cvv,
      terminalId: "TERM1234",
      merchantId: "M123456789",
      currencyCode: "840",
      acquiringInstitutionId: "123456",
      retrievalReferenceNumber,
      cardAcceptorNameLocation: "KARDAL*SONGHA KESS2025",
    };

    console.log("📤 [M2M Payload Sent]:", payload);

    const response = await axios.post(
      "https://dev-m2m.kesspay.io/napspayment/authorization",
      payload,
      {
        headers: {
          "X-API-Key": "ea026d587af74420903d42c365e2d0db",
          "X-Product": "MXPLUS",
          "Content-Type": "application/json",
          "X-Version": "1.0",
          "User-Agent": "NAPS",
        },
      }
    );

    console.log("✅ [M2M API Success]:", response.data);
    console.log("==============================\n");

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "❌ [M2M API Error]:",
      error?.response?.data || error.message
    );
    console.log("==============================\n");
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
