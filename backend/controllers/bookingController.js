const db = require("../firestore/firebase");

exports.getBooking = async (req, res) => {
    try {
    const snapshot = await db.collection('inquiries').get();

    const inquiries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        refId: data.refId,
        fullName: data.fullName,
        dateOfEvent: data.dateOfEvent,
        eventType: data.eventType,
        estimatedGuests: data.estimatedGuests
      };
    });

    res.json(inquiries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
};