const express = require("express");
const router = express.Router();

// Import the new function
const { createInquiry, getInquiryDetails, getBooking, sendProposalEmail, updateInquiryStatus } = require("../controllers/inquiryController");

// POST /api/inquiries/send-proposal (Must be before /:refId to avoid conflict)
router.post("/send-proposal", sendProposalEmail);

router.post("/", createInquiry);
router.get("/", getBooking);
router.get("/:refId", getInquiryDetails); 
router.patch("/:refId", updateInquiryStatus); 

module.exports = router;