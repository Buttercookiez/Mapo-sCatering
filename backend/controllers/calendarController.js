// controllers/calendarController.js
const db = require("../firestore/firebase").db;

// --- GET CALENDAR DATA (Events + Blocked Dates) ---
const getCalendarData = async (req, res) => {
    try {
        // 1. Fetch Bookings (Active + Cancelled)
        // We need all of them: 'Reserved', 'Confirmed', 'Paid', 'Ongoing' count towards the limit.
        // We fetch 'Cancelled' so the Admin can see them, but we will filter them out for capacity logic on frontend.
        const bookingSnapshot = await db.collection("bookings")
            .where("bookingStatus", "in", ["Reserved", "Confirmed", "Paid", "Ongoing", "Cancelled"])
            .get();

        const events = bookingSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.bookingId,
                date: data.eventDetails?.date, // stored as "YYYY-MM-DD"
                title: `${data.profile?.name}`,
                status: data.bookingStatus
            };
        });

        // 2. Fetch Manually Blocked Dates
        // We assume the Document ID is the date string "YYYY-MM-DD"
        const blockedSnapshot = await db.collection("blocked_dates").get();
        const blockedDates = blockedSnapshot.docs.map(doc => doc.id); 

        res.status(200).json({
            events,
            blockedDates
        });

    } catch (error) {
        console.error("Error fetching calendar data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch data" });
    }
};

// --- TOGGLE BLOCK DATE (Admin Action) ---
const toggleBlockDate = async (req, res) => {
    try {
        const { date } = req.body; // Expecting "YYYY-MM-DD"
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
    getCalendarData,
    toggleBlockDate
};