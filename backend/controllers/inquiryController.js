const db = require("../firestore/firebase");

exports.createInquiry = async (req, res) => {
    try {
        const data = req.body;

        // Get the last inquiry sorted by refId descending
        const snapshot = await db.collection("inquiries")
            .orderBy("refId", "desc")
            .limit(1)
            .get();

        let newNumber = 1;

        if (!snapshot.empty) {
            const lastRefId = snapshot.docs[0].data().refId;
            const lastNumber = parseInt(lastRefId.split("-")[1]);
            newNumber = lastNumber + 1;
        }

        const formattedNumber = newNumber.toString().padStart(3, "0");
        const refId = `BK-${formattedNumber}`;

        // Save inquiry
        await db.collection("inquiries").add({
            refId: refId,
            fullName: data.name,
            email: data.email,
            phone: data.phone,
            dateOfEvent: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            estimatedGuests: data.guests,
            estimatedBudget: data.budget,
            eventType: data.eventType,
            serviceStyle: data.serviceStyle,
            notes: data.notes,
            timestamp: new Date()
        });

        res.status(200).json({ refId, message: "Inquiry saved!" });

    } catch (error) {
        res.status(500).json({ message: "Error saving inquiry", error });
    }
};