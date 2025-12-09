// controllers/inquiryController.js
const crypto = require('crypto'); // Built-in Node library
const db = require("../firestore/firebase").db;
const nodemailer = require("nodemailer");
const cron = require('node-cron'); // Import node-cron
const { differenceInDays, parseISO, subDays, format } = require('date-fns'); 

// --- CONFIG: Email Transporter ---
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
        const batch = db.batch();

        // Generate Readable ID
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

        // Client Logic
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

        // Create Booking
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
                addOns: {}
            },
            billing: {
                totalCost: 0,
                fiftyPercentPaymentStatus: "Unpaid",
                fullPaymentStatus: "Unpaid",
                amountPaid: 0,
                remainingBalance: 0,    
                paymentStatus: "Unpaid"
            },
            notes: "",
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

// --- 2. GET INQUIRY DETAILS ---
const getInquiryDetails = async (req, res) => {
    try {
        const { refId } = req.params;

        const bookingSnapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (bookingSnapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const docData = bookingSnapshot.docs[0].data();
        const docId = bookingSnapshot.docs[0].id;

        const paymentSnap = await db.collection("payments").doc(refId).get();
        const proposalSnap = await db.collection("proposals").doc(refId).get();

        const mappedData = {
            id: docId,
            refId: docData.bookingId,
            fullName: docData.profile?.name || "Unknown",
            client: docData.profile?.name || "Unknown",
            email: docData.profile?.email,
            phone: docData.profile?.contactNumber,
            dateOfEvent: docData.eventDetails?.date,
            date: docData.eventDetails?.date,
            startTime: docData.eventDetails?.startTime,
            endTime: docData.eventDetails?.endTime,
            estimatedGuests: docData.eventDetails?.pax,
            guests: docData.eventDetails?.pax,
            venueName: docData.eventDetails?.venue,
            venue: docData.eventDetails?.venue,
            serviceStyle: docData.eventDetails?.serviceStyle,
            eventType: docData.eventDetails?.eventType,
            status: docData.bookingStatus,
            bookingStatus: docData.bookingStatus,
            estimatedBudget: docData.billing?.totalCost || 0,
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

// --- 3. GET BOOKING LIST ---
const getBooking = async (req, res) => {
    try {
        const snapshot = await db.collection('bookings')
            .orderBy("createdAt", "desc")
            .get();

        const inquiries = snapshot.docs.map(doc => {
            const data = doc.data();
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


// --- 4. SEND PROPOSAL EMAIL (UPDATED FOR INDEX SELECTION) ---
const sendProposalEmail = async (req, res) => {
    const {
        clientEmail,
        clientName,
        refId,
        packageOptions, 
        details
    } = req.body;

    // --- Generate Security Token ---
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Base URL for the selection page
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    const baseSelectionLink = `${FRONTEND_URL}/proposal-selection/${token}`;
    const eventDate = details?.date || "Date TBD";

    // 1. SAVE PROPOSAL TO DB
    try {
        await db.collection("proposals").doc(refId).set({
            refId: refId,
            token: token,
            expiresAt: expiresAt.toISOString(),
            clientName: clientName,
            clientEmail: clientEmail,
            eventDate: eventDate,
            options: packageOptions,
            status: "Sent",
            createdAt: new Date().toISOString()
        }, { merge: true });

        console.log(`[DB] Saved proposal options for ${refId}`);
    } catch (dbError) {
        console.error("Failed to save proposal to DB:", dbError);
        return res.status(500).json({ success: false, message: "Database save failed." });
    }

    try {
        const bookingRef = db.collection("bookings").where("bookingId", "==", refId);
        const snapshot = await bookingRef.get();
        
        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await db.collection("bookings").doc(docId).update({
                bookingStatus: "Proposal Sent", // You likely already have this
                lastProposalSentAt: new Date().toISOString(), // <--- ADD THIS LINE
                updatedAt: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error("Failed to update booking timestamp", err);
    }


    // 2. GENERATE EMAIL HTML
    const cardsHtml = packageOptions.map((pkg, index) => {
        // COLORS
        const headerColor = "#333333";   // Dark Grey Header
        const bodyBg = "#fdfdfd";        // Off-white body
        const borderColor = "#e0e0e0";   // Light grey border
        const btnBg = "#d8d8d8";         // Grey Button
        const priceColor = "#C9A25D";    // Gold Price

        // --- UPDATED LOGIC: Append index to URL ---
        // This creates links like: .../proposal-selection/TOKEN?pkgIndex=0
        const specificLink = `${baseSelectionLink}?pkgIndex=${index}`;

        return `
        <td width="33%" valign="top" style="padding: 0 5px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                
                <!-- 1. CARD CONTENT -->
                <tr>
                    <td valign="top" style="border: 1px solid ${borderColor}; background-color: ${bodyBg};">
                        
                        <!-- Header -->
                        <div style="background-color: ${headerColor}; color: white; padding: 12px 5px; font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                            PACKAGE
                        </div>

                        <!-- Body: Fixed Height for Alignment -->
                        <div style="padding: 15px; text-align: center; height: 320px; vertical-align: top; overflow: hidden;">
                            
                            <h4 style="margin: 10px 0 5px 0; font-size: 14px; color: #333; line-height: 1.4; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                ${pkg.name}
                            </h4>
                            
                            <p style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: ${priceColor};">
                                ₱${pkg.pricePerHead}
                            </p>
                            
                            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;">
                            
                            <ul style="padding: 0 0 0 10px; margin: 0; list-style-type: none; font-size: 12px; color: #555; text-align: left; line-height: 1.6;">
                                ${pkg.inclusions.map(inc => `<li style="margin-bottom: 4px;">• ${inc}</li>`).join("")}
                            </ul>
                        </div>
                    </td>
                </tr>

                <!-- 2. GAP -->
                <tr>
                    <td height="8" style="font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- 3. BUTTON -->
                <tr>
                    <td valign="top">
                        <!-- UPDATED HREF TO USE 'specificLink' -->
                        <a href="${specificLink}" target="_blank" style="display: block; background-color: ${btnBg}; color: #333; padding: 12px 0; text-align: center; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px;">
                            SELECT
                        </a>
                    </td>
                </tr>

            </table>
        </td>
    `;
    }).join("");

    try {
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; background-color: #f9f9f9; padding: 20px;">
            
            <!-- HEADER -->
            <div style="background-color: #1c1c1c; padding: 30px; text-align: center; border-radius: 4px 4px 0 0;">
                <h2 style="color: #C9A25D; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Your Event Proposal</h2>
                <p style="color: #888; font-size: 12px; margin-top: 5px;">Ref: ${refId}</p>
            </div>

            <!-- BODY -->
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0;">
                <p>Hi <strong>${clientName || "Client"}</strong>,</p>
                <p>We are excited to host your event on <strong>${eventDate}</strong>! Based on your requirements, we have prepared three exclusive packages for you to choose from.</p>
                
                <!-- PACKAGES TABLE -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px; margin-bottom: 20px;">
                    <tr>
                        ${cardsHtml}
                    </tr>
                </table>

                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                     <p style="font-size: 12px; color: #777; margin-top: 15px; font-style: italic; line-height: 1.5;">
                        Click the "SELECT" button below your preferred package to proceed.
                    </p>
                </div>
            </div>
        </div>
    `;

        const mailOptions = {
            from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            subject: `Choose Your Package: Proposal for ${refId}`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Proposal sent successfully" });

    } catch (error) {
        console.error("[EMAIL ERROR]", error);
        res.status(500).json({ success: false, message: "Failed to send email." });
    }
};

// --- 5. UPDATE STATUS (ADMIN MANUAL) ---
const updateInquiryStatus = async (req, res) => {
    try {
        const { refId } = req.params;
        const { status } = req.body;

        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const docId = snapshot.docs[0].id;
        await db.collection("bookings").doc(docId).update({
            bookingStatus: status
        });

        res.status(200).json({ success: true, message: `Status updated to ${status}` });

    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

// --- 6. GET PACKAGES ---
const getPackagesByEventType = async (req, res) => {
    try {
        const { eventType } = req.query;

        if (!eventType) {
            return res.status(400).json({ error: "Event type is required" });
        }

        const snapshot = await db.collection("packages")
            .where("eventType", "==", eventType)
            .get();

        if (snapshot.empty) {
            const fallbackSnap = await db.collection("packages")
                .where("eventType", "==", "Other")
                .get();
            const fallbackData = fallbackSnap.docs.map(doc => doc.data());
            return res.json(fallbackData);
        }

        const packages = snapshot.docs.map(doc => doc.data());
        res.json(packages);

    } catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({ error: "Failed to fetch packages" });
    }
};


//  7. VERIFY PROPOSAL TOKEN 
const verifyProposal = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Get Proposal Data
        const proposalSnap = await db.collection("proposals").where("token", "==", token).limit(1).get();
        if (proposalSnap.empty) return res.status(404).json({ success: false, message: "Invalid link." });

        const proposalData = proposalSnap.docs[0].data();

        // 2. Get Booking Data
        const bookingSnap = await db.collection("bookings").where("bookingId", "==", proposalData.refId).limit(1).get();
        
        let bookingDetails = {
            pax: 0,
            venue: "TBD",
            startTime: "-",
            endTime: "-",
            eventType: "TBD",
            serviceStyle: "TBD",
            bookingStatus: "Pending"
        };
        
        if (!bookingSnap.empty) {
            const bData = bookingSnap.docs[0].data();
            bookingDetails = {
                pax: bData.eventDetails?.pax || 0,
                venue: bData.eventDetails?.venue || "TBD",
                startTime: bData.eventDetails?.startTime || "-",
                endTime: bData.eventDetails?.endTime || "-",
                eventType: bData.eventDetails?.eventType || "TBD",
                serviceStyle: bData.eventDetails?.serviceStyle || "TBD",
                bookingStatus: bData.bookingStatus || "Pending"
            };
        }

        // 3. Send combined data
        res.json({
            success: true,
            // Proposal Data
            clientName: proposalData.clientName,
            clientEmail: proposalData.clientEmail, 
            eventDate: proposalData.eventDate,
            options: proposalData.options,
            refId: proposalData.refId,
            selectedPackage: proposalData.selectedPackage,
            
            // Booking Details (These are required for the invoice)
            pax: bookingDetails.pax,
            venue: bookingDetails.venue,
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            eventType: bookingDetails.eventType,
            serviceStyle: bookingDetails.serviceStyle,
            
            // Status
            currentStatus: bookingDetails.bookingStatus 
        });

    } catch (error) {
        console.error("Verify Proposal Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


// --- 8. CONFIRM SELECTION (UPDATED) ---
const confirmSelection = async (req, res) => {
    try {
        const { 
            token, 
            selectedPackage, 
            selectedAddOns, // <--- Receive Add-ons
            paymentDetails, 
            clientNotes 
        } = req.body;

        const snapshot = await db.collection("proposals").where("token", "==", token).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "Invalid token" });

        const proposalDoc = snapshot.docs[0];
        const refId = proposalDoc.data().refId;
        const batch = db.batch();

        // 1. Get the Booking Document
        const bookingSnap = await db.collection("bookings").where("bookingId", "==", refId).limit(1).get();
        
        if (!bookingSnap.empty) {
            const bookingDoc = bookingSnap.docs[0];
            const currentData = bookingDoc.data();
            
            // Format Notes: Append new client notes to existing notes without overwriting
            let updatedNotes = currentData.notes || "";
            if (clientNotes) {
                const timeStamp = new Date().toLocaleDateString();
                updatedNotes += `\n\n[Client Note - ${timeStamp}]: ${clientNotes}`;
            }

            // Calculate New Total Cost (Package Price + Add-ons)
            // Ensure inputs are numbers
            const pkgPrice = Number(selectedPackage.pricePerHead) * Number(currentData.eventDetails.pax || 0);
            const addOnsTotal = Array.isArray(selectedAddOns) 
                ? selectedAddOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
                : 0;
            const newTotalCost = pkgPrice + addOnsTotal;

            // UPDATE THE BOOKING DOCUMENT
            batch.update(bookingDoc.ref, {
                "bookingStatus": "Verifying", 
                "notes": updatedNotes,
                
                // Update Package Name
                "eventDetails.package": selectedPackage.name,
                
                // --- SAVE ADD-ONS HERE ---
                "eventDetails.addOns": selectedAddOns || [], 

                // Update Billing
                "billing.totalCost": newTotalCost,
                "billing.remainingBalance": newTotalCost - (currentData.billing.amountPaid || 0), // Adjust logic if they just paid

                updatedAt: new Date().toISOString()
            });
        }

        // 2. Create Payment Record
        const newPaymentRef = db.collection("payments").doc(); 
        batch.set(newPaymentRef, {
            paymentId: newPaymentRef.id,
            bookingId: refId,
            clientName: proposalDoc.data().clientName,
            clientEmail: proposalDoc.data().clientEmail,
            amount: 5000, 
            accountName: paymentDetails?.accountName,
            accountNumber: paymentDetails?.accountNumber,
            referenceNumber: paymentDetails?.refNumber,
            status: "Pending",
            notes: clientNotes || "", // Save notes in payment record too for easy reference
            submittedAt: new Date().toISOString()
        });

        // 3. Mark Proposal as Accepted (Optional but good for tracking)
        batch.update(proposalDoc.ref, {
            status: "Accepted",
            selectedPackageName: selectedPackage.name,
            acceptedAt: new Date().toISOString()
        });

        await batch.commit();
        res.status(200).json({ success: true, message: "Submitted for verification." });

    } catch (error) {
        console.error("Confirm Selection Error:", error);
        res.status(500).json({ message: "Failed to confirm." });
    }
};

// --- 9. GET ALL PAYMENTS (For Admin Transaction.jsx) ---
const getAllPayments = async (req, res) => {
    try {
        const snapshot = await db.collection("payments")
            .orderBy("submittedAt", "desc")
            .get();

        const payments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                bookingId: data.bookingId,
                clientName: data.clientName,
                email: data.clientEmail || "", // Fallback
                accountName: data.accountName,
                accountNumber: data.accountNumber,
                refNumber: data.referenceNumber,
                amount: data.amount,
                date: data.submittedAt, // Formatted in frontend
                status: data.status // 'Pending', 'Verified', 'Rejected'
            };
        });

        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ success: false, message: "Failed to fetch transactions." });
    }
};

// --- 10. VERIFY PAYMENT (Sends Email) ---
const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const paymentDocRef = db.collection("payments").doc(paymentId);
        const paymentDoc = await paymentDocRef.get();
        
        if (!paymentDoc.exists) return res.status(404).json({ message: "Payment not found" });
        
        const payData = paymentDoc.data();

        // 1. Update Payment
        await paymentDocRef.update({ status: "Verified" });

        // 2. Update Booking
        const bookingSnap = await db.collection("bookings").where("bookingId", "==", payData.bookingId).limit(1).get();
        
        if (!bookingSnap.empty) {
            const bookingDoc = bookingSnap.docs[0];
            const bookingData = bookingDoc.data();
            
            // Calculate balance
            // Note: In real app, you should recalculate based on pax * package + addOns
            // Here we just mark as Paid/Reserved
            
            await bookingDoc.ref.update({
                bookingStatus: "Reserved",
                "billing.paymentStatus": "Paid"
            });

            // 3. Send Email
            const eventDate = bookingData.eventDetails?.date || "TBD";
            await sendConfirmationEmail(payData.clientEmail, payData.clientName, payData.bookingId, eventDate);
        }

        res.status(200).json({ success: true, message: "Verified & Email Sent" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

// --- EMAIL HELPER ---
const sendConfirmationEmail = async (clientEmail, clientName, refId, eventDate) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <div style="background-color: #1c1c1c; padding: 20px; text-align: center; color: #C9A25D;">
                <h2 style="margin:0;">RESERVATION CONFIRMED</h2>
            </div>
            <div style="border: 1px solid #ddd; padding: 20px; background-color: #fff;">
                <p>Dear <strong>${clientName}</strong>,</p>
                <p>We have successfully received your reservation fee.</p>
                <p>Your event on <strong>${eventDate}</strong> is now officially <strong>BOOKED</strong> and secured.</p>
                <br/>
                <p><strong>Reference ID:</strong> ${refId}</p>
                <p>Thank you for choosing Mapos Catering.</p>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
        to: clientEmail,
        subject: `Booking Confirmed - ${refId}`,
        html: htmlContent
    });
};

// --- 11. REJECT BOOKING & SEND EMAIL ---
const rejectBooking = async (req, res) => {
    const { refId, reason, clientEmail, clientName } = req.body;

    try {
        // 1. Find the booking document
        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const docId = snapshot.docs[0].id;

        // 2. Update Firestore Status
        await db.collection("bookings").doc(docId).update({
            bookingStatus: "Rejected",
            rejectionReason: reason, // Store the reason for records
            updatedAt: new Date().toISOString()
        });

        // 3. Send Rejection Email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #e0e0e0;">
                <div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin:0;">Booking Status Update</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Dear <strong>${clientName}</strong>,</p>
                    <p>Thank you for your interest in Mapos Catering.</p>
                    <p>We have reviewed your inquiry (Ref: <strong>${refId}</strong>) for the requested date.</p>
                    
                    <p>We regret to inform you that we are unable to accommodate your booking at this time.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
                        <strong>Reason:</strong><br/>
                        ${reason}
                    </div>

                    <p>We apologize for any inconvenience this may cause and hope to have the opportunity to serve you in the future.</p>
                    <br/>
                    <p>Sincerely,</p>
                    <p><strong>The Mapos Catering Team</strong></p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            subject: `Update Regarding Your Inquiry - ${refId}`,
            html: htmlContent
        });

        res.status(200).json({ success: true, message: "Booking rejected and email sent." });

    } catch (error) {
        console.error("Rejection Error:", error);
        res.status(500).json({ success: false, message: "Failed to process rejection." });
    }
};

// --- NEW: MARK 50% PAYMENT ---
const mark50PercentPayment = async (req, res) => {
    try {
        const { refId } = req.body;

        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        // 1. Calculate Financials
        const totalCost = data.billing?.totalCost || 0;
        const reservationFee = 5000; // Fixed fee
        
        // The Net Balance before any partial payment
        const netBalance = totalCost - reservationFee;
        
        // 50% of the Net Balance
        const fiftyPercentAmount = netBalance / 2;

        // New Amount Paid (Reservation + 50%)
        const newAmountPaid = reservationFee + fiftyPercentAmount;
        
        // New Remaining Balance
        const newRemainingBalance = totalCost - newAmountPaid;

        // 2. Update Database
        await db.collection("bookings").doc(doc.id).update({
            "billing.fiftyPercentPaymentStatus": "Paid", // Custom flag
            "billing.amountPaid": newAmountPaid,
            "billing.remainingBalance": newRemainingBalance,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: "50% payment recorded." });

    } catch (error) {
        console.error("50% Payment Error:", error);
        res.status(500).json({ success: false, message: "Failed to update payment." });
    }
};

// --- NEW: MARK FULL PAYMENT ---
const markFullPayment = async (req, res) => {
    try {
        const { refId } = req.body;

        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const doc = snapshot.docs[0];

        // Update Database
        await db.collection("bookings").doc(doc.id).update({
            // 1. Set the specific Full Payment flag
            "billing.fullPaymentStatus": "Paid",
            
            // 2. Clear the remaining balance
            "billing.remainingBalance": 0,
            
            // 3. Ensure paymentStatus remains "Paid" (to keep reservation valid)
            "billing.paymentStatus": "Paid",

            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: "Full payment recorded." });

    } catch (error) {
        console.error("Full Payment Error:", error);
        res.status(500).json({ success: false, message: "Failed to update payment." });
    }
};

const getConfirmedEvents = async (req, res) => {
    try {
        // Fetch bookings where status is "Reserved" (which happens after Payment Verification)
        const snapshot = await db.collection("bookings")
            .where("bookingStatus", "==", "Reserved") 
            .get();

        const events = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.bookingId,
                // Combine date string to a usable format
                date: data.eventDetails?.date, 
                title: `${data.profile?.name} - ${data.eventDetails?.eventType}`, // e.g., "John Doe - Wedding"
                type: data.eventDetails?.eventType || "Social",
                time: data.eventDetails?.startTime || "TBD",
                guests: data.eventDetails?.pax || 0,
                location: data.eventDetails?.venue || "TBD"
            };
        });

        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ success: false, message: "Failed to fetch events" });
    }
};

// --- 1. SEND PAYMENT REMINDER (Manual Trigger) ---
const sendPaymentReminder = async (req, res) => {
    try {
        const { refId } = req.body;

        const snapshot = await db.collection("bookings").where("bookingId", "==", refId).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "Booking not found" });

        const data = snapshot.docs[0].data();
        
        // Calculate Financials
        const total = data.billing?.totalCost || 0;
        const paid = data.billing?.amountPaid || 0; 
        const balance = total - paid;
        
        // Check Payment Status
        const is50PercentPaid = data.billing?.fiftyPercentPaymentStatus === "Paid";
        const isFullyPaid = data.billing?.fullPaymentStatus === "Paid";

        // Calculate 50% Target Amount
        const reservationFee = 5000;
        const netBalance = total - reservationFee;
        const fiftyPercentTarget = reservationFee + (netBalance / 2);

        // --- DATE CALCULATIONS ---
        const eventDate = new Date(data.eventDetails.date);
        const deadlineDate = subDays(eventDate, 4); 
        
        // 1. Format the Deadline
        const formattedDeadline = format(deadlineDate, 'MMMM dd, yyyy'); 
        
        // 2. Format the Event Date (NEW) - e.g., "December 23, 2025"
        const formattedEventDate = format(eventDate, 'MMMM dd, yyyy');

        let emailSubject = `Payment Reminder: Due ${formattedDeadline}`;
        let messageBody = "";

        if (!is50PercentPaid) {
            const amountDueFor50 = fiftyPercentTarget - paid;
            messageBody = `
                <div style="background-color: #fef2f2; padding: 15px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #ef4444; font-weight: bold;">Action Required: 50% Partial Payment</p>
                    <p style="margin: 10px 0 0;"><strong>Minimum Amount Due:</strong> ₱${amountDueFor50.toLocaleString()}</p>
                    <p style="margin: 5px 0 0;"><strong>Deadline:</strong> ${formattedDeadline}</p>
                </div>
                <p style="color: #ef4444; font-size: 12px; font-style: italic;">
                    <strong>Important:</strong> Failure to settle at least 50% of the balance by the deadline will result in automatic cancellation.
                </p>
            `;
        } else if (!isFullyPaid) {
            messageBody = `
                <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #C9A25D;">
                    <p style="margin: 0;"><strong>Remaining Balance:</strong> ₱${balance.toLocaleString()}</p>
                    <p style="margin: 10px 0 0;">Please settle the remaining balance at your earliest convenience or upon arrival.</p>
                </div>
            `;
            emailSubject = `Payment Reminder: Remaining Balance`;
        } else {
            return res.status(400).json({ message: "Booking is already fully paid." });
        }

        // Email Content Wrapper
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; max-width: 600px;">
                <h2 style="color: #C9A25D;">Payment Reminder</h2>
                <p>Dear <strong>${data.profile.name}</strong>,</p>
                
                <!-- UPDATED LINE BELOW -->
                <p>This is a reminder regarding your upcoming event on <strong>${formattedEventDate}</strong>.</p>
                
                ${messageBody}

                <p>Please contact us immediately if you have already sent payment.</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
            to: data.profile.email,
            subject: emailSubject,
            html: htmlContent
        });

        res.status(200).json({ success: true, message: "Reminder sent successfully." });

    } catch (error) {
        console.error("Reminder Error:", error);
        res.status(500).json({ success: false, message: "Failed to send reminder." });
    }
};

// --- AUTOMATED CRON JOB: CHECK OVERDUE PAYMENTS ---
// This function doesn't take req/res, it runs internally
const checkOverdueBookings = async () => {
    console.log("Running Auto-Cancellation Check...");
    try {
        const today = new Date();
        
        // Get all bookings that are Reserved but NOT Fully Paid
        // Note: You might need to adjust query based on your exact status strings
        const snapshot = await db.collection("bookings")
            .where("bookingStatus", "in", ["Reserved", "Confirmed"]) 
            .get();

        const batch = db.batch();
        let cancelCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Skip if already fully paid
            if (data.billing?.fullPaymentStatus === "Paid") continue;

            const eventDate = new Date(data.eventDetails.date);
            const daysUntilEvent = differenceInDays(eventDate, today);

            // LOGIC: If less than 4 days left AND not paid
            if (daysUntilEvent < 4 && daysUntilEvent >= 0) {
                console.log(`Cancelling Booking ${data.bookingId} (Event in ${daysUntilEvent} days)`);
                
                // 1. Update DB to Cancelled
                batch.update(doc.ref, {
                    bookingStatus: "Cancelled",
                    cancellationReason: "System Auto-Cancel: Payment not settled 5 days before event.",
                    updatedAt: new Date().toISOString()
                });

                // 2. Send Cancellation Email
                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #ef4444;">Booking Cancelled</h2>
                        <p>Dear ${data.profile.name},</p>
                        <p>We regret to inform you that your booking (Ref: <strong>${data.bookingId}</strong>) has been automatically cancelled.</p>
                        <p><strong>Reason:</strong> Failure to settle remaining balance 5 days prior to the event date.</p>
                        <p>If you believe this is an error, please contact us immediately.</p>
                    </div>
                `;

                // We don't await email inside loop to prevent blocking, just fire it
                transporter.sendMail({
                    from: `"Mapos Catering" <${process.env.EMAIL_USER}>`,
                    to: data.profile.email,
                    subject: `Booking Cancelled - ${data.bookingId}`,
                    html: htmlContent
                }).catch(e => console.error("Email fail", e));

                cancelCount++;
            }
        }

        if (cancelCount > 0) {
            await batch.commit();
            console.log(`Auto-cancelled ${cancelCount} bookings.`);
        } else {
            console.log("No bookings require cancellation.");
        }

    } catch (error) {
        console.error("Cron Job Error:", error);
    }
};

// --- NEW: UPDATE OPERATIONAL COST ---
const updateOperationalCost = async (req, res) => {
    try {
        const { refId, cost } = req.body;

        const snapshot = await db.collection("bookings")
            .where("bookingId", "==", refId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const doc = snapshot.docs[0];

        await db.collection("bookings").doc(doc.id).update({
            "billing.operationalCost": Number(cost),
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ success: true, message: "Cost updated." });

    } catch (error) {
        console.error("Cost Update Error:", error);
        res.status(500).json({ success: false, message: "Failed to update cost." });
    }
};

// --- HELPER: Parse 12 Hour Time (e.g., "11:00 PM" -> 23, 0) ---
const parseTime12h = (timeStr) => {
    if (!timeStr) return { hours: 0, minutes: 0 }; // Default to start of day
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return { hours: parseInt(hours, 10), minutes: parseInt(minutes, 10) };
};

// --- 14. AUTOMATED CRON JOB: HANDLE ONGOING & COMPLETED ---
const updateEventStatuses = async () => {
    console.log("Running Event Status Check...");
    try {
        const now = new Date();

        // 1. Get All Active Bookings (Reserved, Confirmed, Paid, OR Ongoing)
        const snapshot = await db.collection("bookings")
            .where("bookingStatus", "in", ["Reserved", "Confirmed", "Paid", "Ongoing"]) 
            .get();

        const batch = db.batch();
        let updateCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const currentStatus = data.bookingStatus;
            
            const dateStr = data.eventDetails?.date;      
            const startTimeStr = data.eventDetails?.startTime; 
            const endTimeStr = data.eventDetails?.endTime;     

            if (!dateStr || !startTimeStr || !endTimeStr) continue;

            // 2. Construct Start Date Object
            const eventStart = new Date(dateStr);
            const startT = parseTime12h(startTimeStr);
            eventStart.setHours(startT.hours, startT.minutes, 0);

            // 3. Construct End Date Object
            const eventEnd = new Date(dateStr); 
            const endT = parseTime12h(endTimeStr);
            eventEnd.setHours(endT.hours, endT.minutes, 0);

            // 4. CROSS-DAY LOGIC (e.g., 11 PM to 5 AM)
            if (eventEnd < eventStart) {
                eventEnd.setDate(eventEnd.getDate() + 1);
            }

            // ============================================
            // 5. STATUS LOGIC
            // ============================================

            // CASE A: MARK AS COMPLETED (Now is PAST End Time)
            if (now >= eventEnd) {
                if (currentStatus !== "Completed") {
                    console.log(`Marking Completed: ${data.bookingId}`);
                    batch.update(doc.ref, { 
                        bookingStatus: "Completed",
                        updatedAt: new Date().toISOString() 
                    });
                    updateCount++;
                }
            } 
            // CASE B: MARK AS ONGOING (Now is BETWEEN Start and End)
            else if (now >= eventStart && now < eventEnd) {
                if (currentStatus !== "Ongoing") {
                    console.log(`Marking Ongoing: ${data.bookingId}`);
                    batch.update(doc.ref, { 
                        bookingStatus: "Ongoing",
                        updatedAt: new Date().toISOString() 
                    });
                    updateCount++;
                }
            }
        }

        if (updateCount > 0) {
            await batch.commit();
            console.log(`Updated status for ${updateCount} events.`);
        }

    } catch (error) {
        console.error("Event Status Cron Error:", error);
    }
};



// --- INITIALIZE CRON JOB ---
// Schedule to run every day at 12:00 AM (Midnight)
cron.schedule('0 0 * * *', () => {
    checkOverdueBookings();
});

// --- SCHEDULE: RUN EVERY 10 MINUTES ---
// Since events start at specific times, we check frequently.
cron.schedule('*/10 * * * *', () => {
    updateEventStatuses();
});

module.exports = {
    createInquiry,
    getInquiryDetails,
    getBooking,
    sendProposalEmail,
    updateInquiryStatus,
    getPackagesByEventType,
    verifyProposal,
    confirmSelection,
    getAllPayments,
    verifyPayment,
    sendConfirmationEmail,
    rejectBooking,
    markFullPayment,
    sendPaymentReminder,
    checkOverdueBookings,
    mark50PercentPayment,
    updateOperationalCost,
    updateEventStatuses
};