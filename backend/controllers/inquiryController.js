// controllers/inquiryController.js
const db = require("../firestore/firebase"); // Ensure this path matches your project
const nodemailer = require("nodemailer");

// --- CONFIG: Email Transporter ---
// REPLACE 'user' and 'pass' with your actual Gmail and App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// --- 1. CREATE INQUIRY ---
const createInquiry = async (req, res) => {
    try {
        const data = req.body;

        // Generate Custom Reference ID (BK-001)
        const snapshot = await db.collection("inquiries")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        let newNumber = 1;

        if (!snapshot.empty) {
            const lastDoc = snapshot.docs[0].data();
            if (lastDoc.refId) {
                const lastRefId = lastDoc.refId;
                const lastNumber = parseInt(lastRefId.split("-")[1]);
                if (!isNaN(lastNumber)) {
                    newNumber = lastNumber + 1;
                }
            }
        }

        const formattedNumber = newNumber.toString().padStart(3, "0");
        const refId = `BK-${formattedNumber}`;

        // Prepare Batch Write
        const batch = db.batch();
        const inquiryRef = db.collection("inquiries").doc(); 
        
        batch.set(inquiryRef, {
            refId: refId,
            fullName: data.name,
            email: data.email,
            phone: data.phone,
            dateOfEvent: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            estimatedGuests: parseInt(data.guests) || 0,
            estimatedBudget: parseFloat(data.budget) || 0,
            eventType: data.eventType,
            serviceStyle: data.serviceStyle,
            venueName: data.venue,          
            venueId: data.venueId,          
            venueType: data.venueType,      
            initialNotes: data.notes,
            status: "Pending",
            createdAt: new Date().toISOString()
        });

        // Create associated empty documents
        const paymentsRef = db.collection("payments").doc(refId);
        batch.set(paymentsRef, {
            refId: refId,
            linkedInquiryId: inquiryRef.id,
            totalCost: null,
            reservationFee: null,
            downpayment: null,
            balance: null,
            paymentStatus: "Unpaid",
            history: []
        });

        const proposalsRef = db.collection("proposals").doc(refId);
        batch.set(proposalsRef, {
            refId: refId,
            linkedInquiryId: inquiryRef.id,
            selectedPackage: null,
            items: [],
            costBreakdown: { food: null, serviceCharge: null, grandTotal: null },
            isApproved: false
        });

        const notesRef = db.collection("notes").doc(refId);
        batch.set(notesRef, {
            refId: refId,
            linkedInquiryId: inquiryRef.id,
            internalNotes: null,
            timeline: [{ date: new Date().toISOString().split('T')[0], user: "System", action: "Inquiry Received" }]
        });

        await batch.commit();

        res.status(200).json({ 
            success: true,
            refId: refId, 
            message: "Inquiry created successfully!" 
        });

    } catch (error) {
        console.error("Error saving inquiry:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET INQUIRY DETAILS ---
const getInquiryDetails = async (req, res) => {
    try {
        const { refId  } = req.params; 

        const inquirySnapshot = await db.collection("inquiries").where("refId", "==", refId ).limit(1).get();

        if (inquirySnapshot.empty) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }

        const inquiryData = inquirySnapshot.docs[0].data();
        const docId = inquirySnapshot.docs[0].id; 

        const paymentSnap = await db.collection("payments").doc(refId).get();
        const proposalSnap = await db.collection("proposals").doc(refId).get();
        const notesSnap = await db.collection("notes").doc(refId).get();

        const combinedData = {
            id: docId, 
            ...inquiryData, 
            payment: paymentSnap.exists ? paymentSnap.data() : {},
            proposal: proposalSnap.exists ? proposalSnap.data() : {},
            notes: notesSnap.exists ? notesSnap.data() : {}
        };

        res.status(200).json(combinedData);

    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. GET BOOKING LIST ---
const getBooking = async (req, res) => {
    try {
        const snapshot = await db.collection('inquiries').orderBy("createdAt", "desc").get();

        const inquiries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                refId: data.refId,
                fullName: data.fullName,
                dateOfEvent: data.dateOfEvent,
                eventType: data.eventType,
                estimatedGuests: data.estimatedGuests,
                venueName: data.venueName 
            };
        });

        res.json(inquiries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
};

// --- 4. SEND PROPOSAL EMAIL (UPDATED) ---
const sendProposalEmail = async (req, res) => {
    const { 
        clientEmail, 
        clientName, 
        refId, 
        totalCost, 
        breakdown, 
        details 
    } = req.body;

    // Use the variable from .env, or fallback to localhost if missing
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; 
    const paymentLink = `${FRONTEND_URL}/client-proposal/${refId}`;

    console.log("Sending to:", clientEmail);
    console.log("Using Link:", paymentLink);

    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0;">
                <div style="background-color: #1c1c1c; padding: 20px; text-align: center;">
                    <h2 style="color: #C9A25D; margin: 0; text-transform: uppercase;">Proposal Ready</h2>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
                    <p>Your event proposal for <strong>${details.date}</strong> is ready.</p>
                    
                    <div style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #C9A25D; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Total Estimate:</strong> ₱ ${Number(totalCost).toLocaleString()}</p>
                    </div>

                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${paymentLink}" 
                           target="_blank"
                           style="background-color: #C9A25D; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
                           Review & Pay Now
                        </a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />

                    <p style="font-size: 12px; color: #666;">
                        Link: <a href="${paymentLink}">${paymentLink}</a>
                    </p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Mapos Catering" <${process.env.EMAIL_USER}>`, // Uses env var
            to: clientEmail, 
            subject: `Action Required: Proposal for ${refId}`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Proposal sent successfully" });

    } catch (error) {
        console.error("Email send error:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

module.exports = { createInquiry, getInquiryDetails, getBooking, sendProposalEmail };