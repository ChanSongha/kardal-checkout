const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// ✅ CORS configuration
const corsOptions = {
  origin: [
    "https://kardal-checkout.vercel.app",
    "https://kardal-checkout-git-main-chansonghas-projects.vercel.app",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions)); // apply once globally
app.options("/api/payment", cors(corsOptions)); // preflight for specific route

app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("🎉 Kardal Checkout Backend is running!");
});

// ✅ ENV fallback URLs
const CAPTURE_ENDPOINT =
  process.env.M2M_CAPTURE_URL ||
  "https://gwpreapi.naps.ma:8085/napspayment/capture";
const TOKEN_ENDPOINT =
  process.env.M2M_TOKEN_URL ||
  "https://dev-m2m.kesspay.io/napspayment/createtocken24";
const AUTHORIZATION_ENDPOINT =
  process.env.M2M_AUTH_URL ||
  "https://dev-m2m.kesspay.io/napspayment/authorization";

// ✅ Merchant Info
const institution_id = "11010";
const cx_user = "NAPS";
const cx_password =
  "2e6a98abb5b23339ad14601d3bedc1d23847498cb18daf8cfc98c2a2095ec8";
const merchant_id = "0000001";
const merchant_name = "SecPay";
const website_name = "1122";
const website_id = "2233";
const successURL = "https://kardal.com/success";
const failURL = "https://kardal.com/fail";

// ✅ Helpers
function generateMac(...args) {
  return crypto.createHash("md5").update(args.join("")).digest("hex");
}

function generateCaptureOrderId(authOrderId) {
  const suffix = "-CAP";
  const maxBaseLength = 27 - suffix.length;
  const baseOrderId =
    authOrderId.length > maxBaseLength
      ? authOrderId.slice(0, maxBaseLength)
      : authOrderId;
  return `${baseOrderId}${suffix}`;
}

// ✅ Main API Route
app.post("/api/payment", async (req, res) => {
  // Log frontend payload
  console.log("📥 Received from frontend:", JSON.stringify(req.body, null, 2));

  try {
    // Request token from M2M
    console.log("🔑 Requesting token...");

    const tokenResp = await axios.post(TOKEN_ENDPOINT, {
      institution_id,
      cx_user,
      cx_password,
      cx_reason: "00",
      mac_value: generateMac(institution_id, cx_user, cx_password),
    });

    console.log("✅ Token response:", tokenResp.data);

    const securtoken_24 = tokenResp.data.securtoken_24;
    if (!securtoken_24) {
      console.error("❌ No securtoken_24 in response");
      return res.status(500).json({ error: "Missing securtoken_24" });
    }

    const orderId = "ORD" + Date.now();
    const auth_mac_value = generateMac(orderId, req.body.amount, securtoken_24);

    const authPayload = {
      capture: req.body.capture,
      transactiontype: "0",
      currency: req.body.currency,
      orderid: orderId,
      recurring: "N",
      auth3ds: req.body.auth3ds,
      amount: req.body.amount,
      securtoken24: securtoken_24,
      mac_value: auth_mac_value,
      merchantid: merchant_id,
      merchantname: merchant_name,
      websitename: website_name,
      websiteid: website_id,
      successURL,
      failURL,
      cardnumber: req.body.cardNumber,
      expirydate: req.body.expiry.replace("/", ""),
      holdername: "Oem Chansongha",
      cvv: req.body.cvv,
      fname: "Oem",
      lname: "Chansongha",
      email: "oem@example.com",
      phone: "85512345678",
    };

    console.log(
      "📤 Sending auth payload:",
      JSON.stringify(authPayload, null, 2)
    );

    const authResp = await axios.post(AUTHORIZATION_ENDPOINT, authPayload);
    console.log("✅ Authorization response:", authResp.data);

    return res.status(200).json({
      status: "success",
      message: "Authorized",
      data: authResp.data,
    });
  } catch (error) {
    console.error(
      "❌ Authorization Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      error: "Authorization failed",
      details: error.response?.data || error.message,
    });
  }
});

// ✅ Final: Listen on injected port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
// test deploy
// re-deploy sync
