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
  const packageRoute = require("./routes/packageRoute")

  // Use routes
  app.use("/api/inquiries", inquiryRoute);
  app.use("/api/inventory", inventoryRoute);
  app.use("/api/packages", packageRoute);

  // Start server
  const PORT = 5000;
  app.listen(PORT, async () => {
    console.log(`   Server running on port ${PORT}`);
  });
