// controllers/inquiryController.js
const crypto = require('crypto'); // Built-in Node library
const db = require("../firestore/firebase").db;
const nodemailer = require("nodemailer");

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

// --- 4. SEND PROPOSAL EMAIL ---
const sendProposalEmail = async (req, res) => {
    const {
        clientEmail,
        clientName,
        refId,
        packageOptions,
        details
    } = req.body;

    // --- SECURITY FIX: Generate Token HERE, not globally ---
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days
    // ------------------------------------------------------

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    const selectionLink = `${FRONTEND_URL}/proposal-selection/${token}`;
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

    // 2. GENERATE EMAIL HTML
    const cardsHtml = packageOptions.map((pkg, index) => {
        const bgColor = index === 1 ? "#fffbf2" : "#ffffff";
        const borderColor = index === 1 ? "#C9A25D" : "#e0e0e0";

        return `
            <td width="33%" valign="top" style="padding: 5px;">
                <div style="border: 1px solid ${borderColor}; background-color: ${bgColor}; border-radius: 4px; overflow: hidden; height: 100%;">
                    <div style="background-color: ${index === 1 ? '#C9A25D' : '#333'}; color: white; padding: 8px; font-size: 10px; font-weight: bold; text-align: center; text-transform: uppercase;">
                        ${pkg.tier}
                    </div>
                    <div style="padding: 15px; text-align: center;">
                        <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #333;">${pkg.name}</h4>
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #C9A25D;">₱${pkg.pricePerHead}</p>
                        <p style="font-size: 10px; color: #888; margin-bottom: 10px;">per head</p>
                        <hr style="border: 0; border-top: 1px dashed #eee; margin: 10px 0;">
                        <ul style="padding: 0; margin: 0; list-style-type: none; font-size: 11px; color: #555; text-align: left;">
                            ${pkg.inclusions.map(inc => `<li style="margin-bottom: 4px;">✓ ${inc}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            </td>
        `;
    }).join("");

    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #333; background-color: #f9f9f9; padding: 20px;">
                <div style="background-color: #1c1c1c; padding: 30px; text-align: center; border-radius: 4px 4px 0 0;">
                    <h2 style="color: #C9A25D; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Your Event Proposal</h2>
                    <p style="color: #888; font-size: 12px; margin-top: 5px;">Ref: ${refId}</p>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0;">
                    <p>Hi <strong>${clientName || "Client"}</strong>,</p>
                    <p>We are excited to host your event on <strong>${eventDate}</strong>! Based on your requirements, we have prepared three exclusive packages for you to choose from.</p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; margin-bottom: 20px;">
                        <tr>${cardsHtml}</tr>
                    </table>
                    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        <a href="${selectionLink}" 
                           style="background-color: #C9A25D; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; border-radius: 4px; display: inline-block;">
                           Proceed to Selection
                        </a>
                        <p style="font-size: 12px; color: #777; margin-top: 15px; font-style: italic; line-height: 1.5;">
                            If you would like to proceed with one of these packages, please click the button above to confirm your selection. Otherwise, you may disregard this email.
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

// --- 7. VERIFY PROPOSAL TOKEN (UPDATED) ---
const verifyProposal = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Get Proposal
        const proposalSnap = await db.collection("proposals")
            .where("token", "==", token)
            .limit(1)
            .get();

        if (proposalSnap.empty) {
            return res.status(404).json({ success: false, message: "Invalid proposal link." });
        }

        const proposalData = proposalSnap.docs[0].data();

        if (new Date(proposalData.expiresAt) < new Date()) {
            return res.status(410).json({ success: false, message: "This link has expired." });
        }

        // 2. Get Linked Booking Data (For Add-ons, Pax, and Payment Status)
        const bookingSnap = await db.collection("bookings")
            .where("bookingId", "==", proposalData.refId)
            .limit(1)
            .get();

        let bookingDetails = {};
        if (!bookingSnap.empty) {
            const bData = bookingSnap.docs[0].data();
            bookingDetails = {
                pax: bData.eventDetails?.pax || 0,
                venue: bData.eventDetails?.venue || "TBD",
                startTime: bData.eventDetails?.startTime,
                endTime: bData.eventDetails?.endTime,
                // Assuming addOns in DB is an array of objects like [{name: "Lechon", price: 8000}]
                // If it's just strings, you'll need to assign prices in frontend or backend.
                addOns: bData.eventDetails?.addOns || [],
                // Get current payment status
                amountPaid: bData.billing?.amountPaid || 0,
                paymentStatus: bData.billing?.paymentStatus || "Unpaid"
            };
        }

        res.json({
            success: true,
            clientName: proposalData.clientName,
            eventDate: proposalData.eventDate,
            options: proposalData.options, // The packages
            refId: proposalData.refId,
            status: proposalData.status,
            selectedPackage: proposalData.selectedPackage, // In case they revisit
            ...bookingDetails // Spread the booking details (pax, addons, billing)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// --- 8. CONFIRM SELECTION (CLIENT SIDE) ---
// This is called when the client clicks "Select" on the website
const confirmSelection = async (req, res) => {
    try {
        const { token, selectedPackage } = req.body;

        const snapshot = await db.collection("proposals").where("token", "==", token).limit(1).get();

        if (snapshot.empty) return res.status(404).json({ message: "Invalid token" });

        const proposalDoc = snapshot.docs[0];
        const proposalData = proposalDoc.data();

        // 1. Update Proposal Status
        await proposalDoc.ref.update({
            status: "Confirmed",
            selectedPackage: selectedPackage,
            confirmedAt: new Date().toISOString()
        });

        // 2. Update the Main Booking (so Admin sees it)
        const bookingSnap = await db.collection("bookings")
            .where("bookingId", "==", proposalData.refId)
            .limit(1)
            .get();

        if (!bookingSnap.empty) {
            await bookingSnap.docs[0].ref.update({
                "eventDetails.package": selectedPackage.name,
                bookingStatus: "Client Responded"
            });
        }

        res.status(200).json({ success: true, message: "Package confirmed!" });

    } catch (error) {
        console.error("Error confirming selection:", error);
        res.status(500).json({ message: "Failed to confirm selection." });
    }
};

module.exports = {
    createInquiry,
    getInquiryDetails,
    getBooking,
    sendProposalEmail,
    updateInquiryStatus,
    getPackagesByEventType,
    verifyProposal,    // Renamed for clarity
    confirmSelection   // Added this missing function
};