// Load environment variables
const dotenv = require("dotenv");
dotenv.config();

// Core modules
const express = require("express");
const cors = require("cors");
const app = express();

// Middleware - FIXED ORDER
app.use(cors());

// Parse JSON for all routes EXCEPT webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/paymongo/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
const inquiryRoute = require("./routes/inquiryRoute");
const paymongoRoute = require("./routes/paymongoRoute");

// Use routes
app.use("/api/inquiries", inquiryRoute);
app.use("/api/paymongo", paymongoRoute);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`   Server running on port ${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/paymongo/create-checkout-session`);
  console.log(`   POST http://localhost:${PORT}/api/paymongo/webhook`);
});