const express = require("express");
const router = express.Router();

// Import controllers
const { 
    createInquiry, 
    getInquiryDetails, 
    getBooking, 
    sendProposalEmail, 
    updateInquiryStatus, 
    getPackagesByEventType,
    verifyProposal,    
    confirmSelection  ,
    getAllPayments,
    verifyPayment
} = require("../controllers/inquiryController");

// ==============================================
// 1. SPECIFIC ROUTES (MUST BE AT THE TOP)
// ==============================================

// This MUST be before /:refId so "packages" isn't treated as an ID
router.get("/packages", getPackagesByEventType); 
router.post("/send-proposal", sendProposalEmail);

// 🚨 ADD THE PROPOSAL ROUTES HERE 🚨
// This handles the link verification when the client clicks the email link
router.get("/proposals/verify/:token", verifyProposal);   
// This handles the client's package selection confirmation
router.post("/proposals/confirm", confirmSelection);       

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
router.patch("/payments/:paymentId/verify", verifyPayment);


module.exports = router;