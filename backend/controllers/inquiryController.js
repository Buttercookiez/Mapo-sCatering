// controllers/inquiryController.js
const db = require("../firestore/firebase"); // Ensure this path matches your project
const nodemailer = require("nodemailer");

// --- CONFIG: Email Transporter ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// --- 1. CREATE INQUIRY (Saves to "bookings" & "clients") ---
const createInquiry = async (req, res) => {
    try {
        const data = req.body;
        const batch = db.batch();

        // 1. GENERATE READABLE BOOKING ID (BK-001)
        const bookingSnapshot = await db.collection("bookings")
            .orderBy("bookingId", "desc")
            .limit(1)
            .get();

        let newBookingNum = 1;
        if (!bookingSnapshot.empty) {
            const lastDoc = bookingSnapshot.docs[0].data();
            if (lastDoc.bookingId) {
                const parts = lastDoc.bookingId.split("-"); 
                if (parts.length > 1) {
                    const lastNumber = parseInt(parts[1]);
                    if (!isNaN(lastNumber)) newBookingNum = lastNumber + 1;
                }
            }
        }
        const readableBookingId = `BK-${newBookingNum.toString().padStart(3, "0")}`;

        // 2. HANDLE CLIENT LOGIC
        let readableClientId; 
        let clientDocId; 

        const clientQuery = await db.collection("clients")
            .where("profile.email", "==", data.email)
            .limit(1)
            .get();

        if (!clientQuery.empty) {
            const clientDoc = clientQuery.docs[0];
            clientDocId = clientDoc.id; 
            readableClientId = clientDoc.data().clientId; 
        } else {
            const clientSnapshot = await db.collection("clients")
                .orderBy("clientId", "desc")
                .limit(1)
                .get();

            let newClientNum = 1;
            if (!clientSnapshot.empty) {
                const lastClient = clientSnapshot.docs[0].data();
                if (lastClient.clientId) {
                    const parts = lastClient.clientId.split("-");
                    if (parts.length > 1) {
                        const lastNumber = parseInt(parts[1]);
                        if (!isNaN(lastNumber)) newClientNum = lastNumber + 1;
                    }
                }
            }

            readableClientId = `CL-${newClientNum.toString().padStart(3, "0")}`;
            const newClientRef = db.collection("clients").doc(); 
            clientDocId = newClientRef.id;

            batch.set(newClientRef, {
                clientId: readableClientId,
                profile: {
                    name: data.name,
                    email: data.email,
                    contactNumber: data.phone || ""
                },
                createdAt: new Date().toISOString()
            });
        }

        // 3. CREATE BOOKING DOCUMENT
        const bookingRef = db.collection("bookings").doc(); 

        const bookingData = {
            bookingId: readableBookingId, 
            clientRefId: clientDocId,     
            clientId: readableClientId,   
            bookingStatus: "Pending",     
            
            profile: {
                name: data.name,
                email: data.email,
                contactNumber: data.phone || ""
            },

            eventDetails: {
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                pax: parseInt(data.guests) || 0,
                venue: data.venue,
                venueId: data.venueId || null,
                venueType: data.venueType || "predefined",
                serviceStyle: data.serviceStyle,
                eventType: data.eventType,
                package: null, 
                addOns: data.addOns || []
            },

            billing: {
                totalCost: 0, 
                amountPaid: 0,
                remainingBalance: 0,
                paymentStatus: "Unpaid"
            },

            notes: data.notes || "",
            createdAt: new Date().toISOString()
        };

        batch.set(bookingRef, bookingData);
        await batch.commit();

        res.status(200).json({ 
            success: true,
            refId: readableBookingId, 
            message: "Inquiry received successfully!" 
        });

    } catch (error) {
        console.error("Error saving booking:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET INQUIRY DETAILS (Aligned to 'bookings' collection) ---
const getInquiryDetails = async (req, res) => {
    try {
        const { refId } = req.params; // refId comes in as "BK-XXX"

        // 1. Query "bookings" collection instead of "inquiries"
        const bookingSnapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (bookingSnapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const docData = bookingSnapshot.docs[0].data();
        const docId = bookingSnapshot.docs[0].id; 

        // 2. Fetch related collections (assuming they use the readable RefID as document ID or key)
        const paymentSnap = await db.collection("payments").doc(refId).get();
        const proposalSnap = await db.collection("proposals").doc(refId).get();
        
        // 3. Flatten/Map the data structure for the Frontend
        // The frontend expects fields like 'fullName', 'dateOfEvent', 'status', etc.
        const mappedData = {
            // IDs
            id: docId,
            refId: docData.bookingId,
            
            // Client Info (Mapped from 'profile')
            fullName: docData.profile?.name || "Unknown",
            client: docData.profile?.name || "Unknown",
            email: docData.profile?.email,
            phone: docData.profile?.contactNumber,

            // Event Info (Mapped from 'eventDetails')
            dateOfEvent: docData.eventDetails?.date,
            date: docData.eventDetails?.date, // Fallback
            startTime: docData.eventDetails?.startTime,
            endTime: docData.eventDetails?.endTime,
            estimatedGuests: docData.eventDetails?.pax,
            guests: docData.eventDetails?.pax, // Fallback
            venueName: docData.eventDetails?.venue,
            venue: docData.eventDetails?.venue, // Fallback
            serviceStyle: docData.eventDetails?.serviceStyle,
            eventType: docData.eventDetails?.eventType,
            
            // Status & Billing
            status: docData.bookingStatus, // "Pending", "Confirmed", etc.
            bookingStatus: docData.bookingStatus,
            estimatedBudget: docData.billing?.totalCost || 0,

            // External Collections
            payment: paymentSnap.exists ? paymentSnap.data() : {},
            proposal: proposalSnap.exists ? proposalSnap.data() : {},
            notes: docData.notes || ""
        };

        res.status(200).json(mappedData);

    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. GET BOOKING LIST (Aligned to 'bookings' collection) ---
const getBooking = async (req, res) => {
    try {
        // Query "bookings" instead of "inquiries"
        const snapshot = await db.collection('bookings')
            .orderBy("createdAt", "desc")
            .get();

        const inquiries = snapshot.docs.map(doc => {
            const data = doc.data();
            // Map the nested fields to the flat structure the table view likely needs
            return {
                refId: data.bookingId,
                fullName: data.profile?.name,
                email: data.profile?.email,
                dateOfEvent: data.eventDetails?.date,
                eventType: data.eventDetails?.eventType,
                estimatedGuests: data.eventDetails?.pax,
                venueName: data.eventDetails?.venue,
                status: data.bookingStatus
            };
        });

        res.json(inquiries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// --- 4. SEND PROPOSAL EMAIL ---
const sendProposalEmail = async (req, res) => {
    const { 
        clientEmail, 
        clientName, 
        refId, 
        totalCost, 
        details 
    } = req.body;

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; 
    const paymentLink = `${FRONTEND_URL}/client-proposal/${refId}`;

    console.log(`Sending proposal for ${refId} to ${clientEmail}`);

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
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
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

// --- 5. UPDATE STATUS (Aligned to 'bookings' collection) ---
const updateInquiryStatus = async (req, res) => {
    try {
        const { refId } = req.params; // e.g., "BK-006"
        const { status } = req.body;  // e.g., "Confirmed"

        // 1. Find document in "bookings" by bookingId
        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.error(`[UPDATE] Booking ${refId} not found.`);
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // 2. Get Doc ID and Update
        const docId = snapshot.docs[0].id;
        
        // Update status in the "bookings" collection
        await db.collection("bookings").doc(docId).update({ 
            bookingStatus: status // Updating the field defined in createInquiry
        });

        console.log(`[UPDATE] Updated ${refId} to ${status}`);
        res.status(200).json({ success: true, message: `Status updated to ${status}` });

    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

module.exports = { 
    createInquiry, 
    getInquiryDetails, 
    getBooking, 
    sendProposalEmail, 
    updateInquiryStatus 
};