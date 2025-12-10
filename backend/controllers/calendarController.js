// controllers/calendarController.js
const db = require("../firestore/firebase").db;

// --- 1. GET PUBLIC CALENDAR DATA (Restore this for Booking.jsx) ---
const getPublicCalendarData = async (req, res) => {
    try {
        // A. Fetch Active Bookings (for capacity calculation)
        const bookingSnapshot = await db.collection("bookings")
            .where("bookingStatus", "in", ["Reserved", "Confirmed", "Paid", "Ongoing"])
            .get();

        const events = bookingSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.eventDetails?.date, // stored as "YYYY-MM-DD"
                status: data.bookingStatus
            };
        });

        // B. Fetch Manually Blocked Dates (Admin blocks)
        const blockedSnapshot = await db.collection("blocked_dates").get();
        const blockedDates = blockedSnapshot.docs.map(doc => doc.id); 

        res.status(200).json({
            events,
            blockedDates
        });

    } catch (error) {
        console.error("Error fetching public calendar:", error);
        res.status(500).json({ success: false, message: "Failed to fetch data" });
    }
};

// --- 2. TOGGLE BLOCK DATE (Admin Action) ---
const toggleBlockDate = async (req, res) => {
    try {
        const { date } = req.body; 
        if (!date) return res.status(400).json({ message: "Date required" });

        const docRef = db.collection("blocked_dates").doc(date);
        const doc = await docRef.get();

        if (doc.exists) {
            await docRef.delete();
            res.json({ success: true, action: "unblocked", date });
        } else {
            await docRef.set({ blockedAt: new Date().toISOString() });
            res.json({ success: true, action: "blocked", date });
        }
    } catch (error) {
        console.error("Error toggling block:", error);
        res.status(500).json({ success: false, message: "Failed to update block" });
    }
};

module.exports = {
    getPublicCalendarData, // <--- Make sure this is exported
    toggleBlockDate
};