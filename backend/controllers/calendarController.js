// controllers/calendarController.js
const db = require("../firestore/firebase").db;

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
    toggleBlockDate
};