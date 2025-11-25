const express = require("express");
const cors = require("cors");


const inquiryRoute = require("./routes/inquiryRoute");
const bookingRoute = require("./routes/bookingRoute");

const app = express();
app.use(cors());
app.use(express.json());

// Use routes
app.use("/api/inquiries", inquiryRoute);
app.use("/api/inquiries-summary", bookingRoute);

app.listen(5000, () => console.log("Server running on port 5000"));
