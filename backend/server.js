// Load environment variables
const dotenv = require("dotenv");
dotenv.config();

// Core modules
const express = require("express");
const cors = require("cors");
const app = express();

// Middleware - FIXED ORDER
app.use(express.json())
app.use(cors());

// Routes
const inquiryRoute = require("./routes/inquiryRoute");
const inventoryRoute = require("./routes/inventoryRoute");

// Use routes
app.use("/api/inquiries", inquiryRoute);
app.use("/api/inventory", inventoryRoute);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`   Server running on port ${PORT}`);
});