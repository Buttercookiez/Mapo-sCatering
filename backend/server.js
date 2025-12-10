// backend/server.js
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json())
app.use(cors());

// --- IMPORT ROUTES ---
const inquiryRoute = require("./routes/inquiryRoute");
const inventoryRoute = require("./routes/inventoryRoute");
const packageRoute = require("./routes/packageRoute")
const calendarRoutes = require('./routes/calendarRoutes');
const addonRoute = require('./routes/addonRoute');
const authRoute = require('./routes/authRoute'); // <--- NEW

// --- USE ROUTES ---
app.use("/api/inquiries", inquiryRoute);
app.use("/api/inventory", inventoryRoute);
app.use("/api/packages", packageRoute);
app.use('/api/calendar', calendarRoutes);
app.use("/api/addons", addonRoute);
app.use("/api/auth", authRoute); // <--- NEW

const PORT = 5000;
app.listen(PORT, async () => {
  console.log(`   Server running on port ${PORT}`);
});