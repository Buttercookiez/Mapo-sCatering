const express = require("express");
const router = express.Router();

const { createInquiry} = require("../controllers/inquiryController");

// POST /api/inquiries
router.post("/", createInquiry);

module.exports = router;
  