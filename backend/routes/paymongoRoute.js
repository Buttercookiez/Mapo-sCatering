const express = require("express");
const axios = require("axios");
const router = express.Router();
const crypto = require("crypto");

// Secret keys
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

// Validate environment variables
if (!PAYMONGO_SECRET_KEY) {
  console.error("❌ PAYMONGO_SECRET_KEY is not set!");
}

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", async (req, res) => {
  console.log("🔔 Checkout session endpoint hit!");
  console.log("Request body:", req.body);
  
  const { amount, description } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ 
      error: "Missing required fields: amount and description" 
    });
  }

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        data: {
          attributes: {
            currency: "PHP",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/failed",
            line_items: [
              {
                name: description,
                amount: amount * 100, // in centavos
                currency: "PHP",
                quantity: 1
              }
            ],
            payment_method_types: ["gcash"]
          }
        }
      },
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64"),
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Checkout session created successfully");
    res.json({
      checkout_url: response.data.data.attributes.checkout_url
    });
  } catch (error) {
    console.error("❌ PayMongo Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Checkout creation failed",
      details: error.response?.data || error.message 
    });
  }
});

// WEBHOOK - Handle raw body
router.post("/webhook", express.raw({ type: 'application/json' }), (req, res) => {
  console.log("🔔 Webhook endpoint hit!");
  
  const signature = req.headers["paymongo-signature"];
  const rawBody = req.body;

  if (!WEBHOOK_SECRET) {
    console.error("❌ Webhook secret not configured");
    return res.status(500).send("Webhook not configured");
  }

  const computed = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (computed !== signature) {
    console.error("❌ Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(rawBody.toString());

  if (event.data.attributes.type === "checkout_session.paid") {
    console.log("💰 Payment success!", event.data.attributes.data);
    // TODO: Update your database here
  }

  res.status(200).send("OK");
});

console.log("✅ PayMongo routes module loaded");

module.exports = router;
