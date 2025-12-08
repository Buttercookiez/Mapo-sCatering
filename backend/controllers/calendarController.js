const db = require("../firestore/firebase").db;

// --- GET VERIFIED EVENTS ---
const getCalendarEvents = async (req, res) => {
    try {
        // Fetch only bookings that have been verified/paid (Status: 'Reserved')
        const snapshot = await db.collection("bookings")
            .where("bookingStatus", "==", "Reserved")
            .get();

        const events = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Format data specifically for the React Calendar component
            return {
                id: data.bookingId,
                date: data.eventDetails?.date, // Expecting "YYYY-MM-DD" string
                title: `${data.profile?.name} - ${data.eventDetails?.eventType}`, // e.g. "Juan Dela Cruz - Wedding"
                type: data.eventDetails?.eventType || "Social",
                time: data.eventDetails?.startTime || "TBD",
                guests: data.eventDetails?.pax || 0,
                location: data.eventDetails?.venue || "TBD",
                status: data.bookingStatus
            };
        });

        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ success: false, message: "Failed to fetch events" });
    }
};

module.exports = {
    getCalendarEvents
};