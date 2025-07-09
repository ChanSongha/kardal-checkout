const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ ENV config
const M2M_API_KEY =
  process.env.M2M_API_KEY || "ea026d587af74420903d42c365e2d0db";
const M2M_GATEWAY = "https://gwpreapi.naps.ma:8085";

const institution_id = "11010";
const cx_user = "NAPS";
const cx_password =
  "2e6a98abb5b23339ad14601d3bedc1d23847498cb18daf8fc98c2a2095ec8"; // plaintext or hashed as needed
const merchant_id = "1010101";
const merchant_name = "Songha Phu";
const website_name = "9999";
const successURL = "https://kardal.com/success";
const failURL = "https://kardal.com/fail";

function md5(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

app.post("/api/payment", async (req, res) => {
  try {
    const { cardNumber, expiry, cvv, amount, holderName, email, phone } =
      req.body;

    // Step 1: Create Token 24
    const token_mac_value = md5(institution_id + cx_user);

    const tokenResp = await axios.post(
      `${M2M_GATEWAY}/napspayment/createtocken24`,
      {
        institution_id,
        cx_user,
        cx_password,
        cx_reason: "00",
        mac_value: token_mac_value,
      }
    );
    console.log("🔐 Full token response:", tokenResp.data);
    const securtoken24 = tokenResp.data.securtoken24;
    if (!securtoken24)
      throw new Error("Missing securtoken24 from token response");

    // Step 2: Prepare Authorization Payload
    const orderid = "ORD" + Date.now();
    const payment_mac_value = md5(orderid + amount);

    const payload = {
      capture: "Y",
      transactiontype: "0",
      currency: "840",
      orderid,
      recurring: "N",
      auth3ds: "N",
      amount,
      securtoken24,
      mac_value: payment_mac_value,

      merchantid: merchant_id,
      merchantname: merchant_name,
      websitename: website_name,
      websiteid: website_name,
      successURL,
      failURL,

      cardnumber: cardNumber,
      expirydate: expiry.replace("/", ""), // e.g. 12/25 → 1225
      holdername: holderName || "Oem Chansongha",
      cvv,

      fname: "Oem",
      lname: "Chansongha",
      email,
      phone,
    };

    const response = await axios.post(
      `${M2M_GATEWAY}/napspayment/authorization`,
      payload,
      {
        headers: {
          "X-API-Key": M2M_API_KEY,
          "X-Product": "MXPLUS",
          "Content-Type": "application/json",
          "X-Version": "1.0",
          "User-Agent": "NAPS",
        },
      }
    );

    console.log("✅ M2M Payment Response:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ M2M API ERROR:", error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data || error.message });
  }
});

app.get("/", (req, res) => {
  res.send("🎉 Kardal Checkout Backend is running!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
