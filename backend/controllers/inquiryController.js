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
        packageOptions, 
        details 
    } = req.body;

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; 
    const selectionLink = `${FRONTEND_URL}/proposal-selection/${refId}`;
    const eventDate = details?.date || "Date TBD";

    // Generate the 3-column HTML cards
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
                    
                    <!-- 3 COLUMN LAYOUT -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; margin-bottom: 20px;">
                        <tr>
                            ${cardsHtml}
                        </tr>
                    </table>

                    <!-- UPDATED SECTION STARTS HERE -->
                    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        <a href="${selectionLink}" 
                           style="background-color: #C9A25D; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; border-radius: 4px; display: inline-block;">
                           Proceed to Selection
                        </a>
                        <p style="font-size: 12px; color: #777; margin-top: 15px; font-style: italic; line-height: 1.5;">
                            If you would like to proceed with one of these packages, please click the button above to confirm your selection. Otherwise, you may disregard this email.
                        </p>
                    </div>
                    <!-- UPDATED SECTION ENDS HERE -->

                </div>
                
                <div style="text-align: center; padding: 20px; font-size: 11px; color: #aaa;">
                    &copy; ${new Date().getFullYear()} Mapos Catering Services. All rights reserved.
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

const getPackagesByEventType = async (req, res) => {
    try {
        const { eventType } = req.query; // Get ?eventType=Wedding

        if (!eventType) {
            return res.status(400).json({ error: "Event type is required" });
        }

        // Fetch packages matching the event type
        const snapshot = await db.collection("packages")
            .where("eventType", "==", eventType)
            .get();

        if (snapshot.empty) {
            // Fallback: If "Corporate Gala" not found, try generic "Other"
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

module.exports = {
    createInquiry,
    getInquiryDetails,
    getBooking,
    sendProposalEmail,
    updateInquiryStatus,
    getPackagesByEventType
};