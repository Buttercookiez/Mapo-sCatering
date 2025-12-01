const express = require("express");
const router = express.Router();

// Import controllers
const { 
    createInquiry, 
    getInquiryDetails, 
    getBooking, 
    sendProposalEmail, 
    updateInquiryStatus, 
    getPackagesByEventType 
} = require("../controllers/inquiryController");

// ==============================================
// 1. SPECIFIC ROUTES (MUST BE AT THE TOP)
// ==============================================

// This MUST be before /:refId so "packages" isn't treated as an ID
router.get("/packages", getPackagesByEventType); 

router.post("/send-proposal", sendProposalEmail);

// ==============================================
// 2. GENERAL ROUTES
// ==============================================
router.post("/", createInquiry);
router.get("/", getBooking);

// ==============================================
// 3. DYNAMIC ROUTES (MUST BE AT THE BOTTOM)
// ==============================================

// These act like wildcards. They catch anything else (like BK-001).
// If you put these at the top, they block specific routes.
router.patch("/:refId", updateInquiryStatus);
router.get("/:refId", getInquiryDetails);

module.exports = router;