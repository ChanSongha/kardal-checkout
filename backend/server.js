const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// ✅ Only ONE `origin` key
app.use(
  cors({
    origin: [
      "https://kardal-checkout.vercel.app",
      "https://kardal-checkout-git-main-chansonghas-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5001;

// Add near the top if not present:
const CAPTURE_ENDPOINT =
  process.env.M2M_CAPTURE_URL ||
  "https://gwpreapi.naps.ma:8085/napspayment/capture";

// ENV Vars or hardcoded fallback values
const TOKEN_ENDPOINT =
  process.env.M2M_TOKEN_URL ||
  "https://dev-m2m.kesspay.io/napspayment/createtocken24";
const AUTHORIZATION_ENDPOINT =
  process.env.M2M_AUTH_URL ||
  "https://dev-m2m.kesspay.io/napspayment/authorization";

const institution_id = "11010";
const cx_user = "NAPS";
const cx_password =
  "2e6a98abb5b23339ad14601d3bedc1d23847498cb18daf8cfc98c2a2095ec8"; // plain password
const merchant_id = "0000001";
const merchant_name = "SecPay";
const website_name = "1122";
const website_id = "2233";
const successURL = "https://kardal.com/success";
const failURL = "https://kardal.com/fail";

// Generate MAC using MD5
function generateMac(...args) {
  return crypto.createHash("md5").update(args.join("")).digest("hex");
}
//generateCaptureOrderId(authOrderId)
function generateCaptureOrderId(authOrderId) {
  const suffix = "-CAP";

  if (authOrderId.endsWith(suffix)) {
    return authOrderId;
  }

  const maxBaseLength = 27 - suffix.length;
  const baseOrderId =
    authOrderId.length > maxBaseLength
      ? authOrderId.slice(0, maxBaseLength)
      : authOrderId;

  return `${baseOrderId}${suffix}`;
}

// API route
app.post("/api/payment", async (req, res) => {
  const { cardNumber, expiry, cvv, amount, capture, auth3ds, currency } =
    req.body;

  console.log("📥 Received from frontend:", req.body);

  const orderId = "ORD" + Date.now();

  let formattedAmount;

  if (currency === "840") {
    // USD → send as-is, keep decimals if provided (e.g., 3.1, 100)
    formattedAmount = Number(amount).toString();
  } else if (currency === "116") {
    // KHR → no decimals, round down
    formattedAmount = Math.floor(Number(amount)).toString();
  } else {
    // fallback → no decimals, round down
    formattedAmount = Math.floor(Number(amount)).toString();
  }

  console.log(`✅ Processed amount for currency ${currency}:`, formattedAmount);

  const expirationDate = expiry.replace("/", "");

  const token_mac_value = generateMac(institution_id, cx_user, cx_password);

  try {
    console.log("📥 Requesting token...");

    const tokenResp = await axios.post(TOKEN_ENDPOINT, {
      institution_id,
      cx_user,
      cx_password,
      cx_reason: "00",
      mac_value: token_mac_value,
    });

    console.log("🔐 Full token response:", tokenResp.data);

    const securtoken_24 = tokenResp.data.securtoken_24;
    if (!securtoken_24) {
      console.error(
        "❌ M2M API ERROR: Missing securtoken24 from token response"
      );
      return res.status(500).json({ error: "Failed to get securtoken24" });
    }

    const auth_mac_value = generateMac(orderId, formattedAmount, securtoken_24);

    const authPayload = {
      capture: capture === "N" ? "N" : "Y",
      transactiontype: "0",
      currency,
      orderid: orderId,
      recurring: "N",
      auth3ds: auth3ds === "N" ? "N" : "Y",
      amount: formattedAmount,
      securtoken24: securtoken_24,
      mac_value: auth_mac_value,

      merchantid: merchant_id,
      merchantname: merchant_name,
      websitename: website_name,
      websiteid: website_id,
      successURL,
      failURL,

      cardnumber: cardNumber,
      expirydate: expirationDate,
      holdername: "Oem Chansongha",
      cvv,

      fname: "Oem",
      lname: "Chansongha",
      email: "oem@example.com",
      phone: "85512345678",
    };

    console.log("📤 Sending authorization payload:", authPayload);

    const authResp = await axios.post(AUTHORIZATION_ENDPOINT, authPayload);
    console.log("✅ Authorization response:", authResp.data);

    res.status(200).json({
      status: "success",
      message: "Payment authorized",
      data: authResp.data,
    });
  } catch (error) {
    console.error("❌ M2M API ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "Authorization failed",
      details: error.response?.data || error.message,
    });
  }
});

// app.post("/api/capture", async (req, res) => {
//   const { orderid, paymentid, amount, authnumber } = req.body;

//   const formattedAmount = parseInt(amount) * 100 + ""; // e.g., "10000"

//   try {
//     console.log("📥 Requesting capture token...");
//     const token_mac_value = generateMac(institution_id, cx_user, cx_password);

//     const tokenResp = await axios.post(TOKEN_ENDPOINT, {
//       institution_id,
//       cx_user,
//       cx_password,
//       cx_reason: "00",
//       mac_value: token_mac_value,
//     });

//     console.log("🔐 Capture token response:", tokenResp.data);

//     const securtoken24 = tokenResp.data.securtoken_24;
//     if (!securtoken24) {
//       console.error("❌ M2M API ERROR: Missing securtoken24 for capture");
//       return res.status(500).json({ error: "Failed to get securtoken24" });
//     }

//     const capture_mac_value = generateMac(orderid, formattedAmount);

//     //Generated unique capture orderid:
//     const { orderid: authOrderId, paymentid, amount, authnumber } = req.body;

//     const captureOrderId = generateCaptureOrderId(authOrderId);

//     console.log("✨ Generated unique capture orderid:", captureOrderId);

//     const capturePayload = {
//       orderid: captureOrderId, // ✅ use the new unique orderid here
//       paymentid,
//       amount: parseInt(amount) * 100 + "",
//       authnumber,
//       securtoken24, // from token step
//       mac_value: generateMac(captureOrderId, amount),
//       merchantid: merchant_id,
//       merchantname: merchant_name,
//       websitename: website_name,
//       websiteid: website_id,
//       fname: "Oem",
//       lname: "Chansongha",
//       email: "oem@example.com",
//     };

//     console.log("📤 Sending capture payload:", capturePayload);

//     const captureResp = await axios.post(CAPTURE_ENDPOINT, capturePayload, {
//       headers: {
//         "X-API-Key": process.env.M2M_API_KEY,
//         "X-Product": "MXPLUS",
//         "Content-Type": "application/json",
//         "X-Version": "1.0",
//         "User-Agent": "NAPS",
//       },
//     });

//     console.log("✅ Capture response:", captureResp.data);

//     res.status(200).json({
//       status: "success",
//       message: "Capture completed",
//       data: captureResp.data,
//     });
//   } catch (error) {
//     console.error(
//       "❌ Capture API ERROR:",
//       error.response?.data || error.message
//     );
//     res.status(500).json({
//       error: "Capture failed",
//       details: error.response?.data || error.message,
//     });
//   }
// });

// Health check endpoint
app.get("/", (req, res) => {
  res.send("🎉 Kardal Checkout Backend is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
