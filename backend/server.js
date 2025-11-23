const express = require("express");
const cors = require("cors");
const db = require("./firebase");

const app = express();
app.use(cors());
app.use(express.json());

// POST route to save form data
app.post("/api/inquiries", async (req, res) => {
  try {
    const data = req.body;

    // Get the last inquiry sorted by refId descending
    const snapshot = await db.collection("inquiries")
      .orderBy("refId", "desc")
      .limit(1)
      .get();

    let newNumber = 1;
    if (!snapshot.empty) {
      const lastRefId = snapshot.docs[0].data().refId; // e.g., "BK-042"
      const lastNumber = parseInt(lastRefId.split("-")[1]);
      newNumber = lastNumber + 1;
    }

    const formattedNumber = newNumber.toString().padStart(3, "0"); // e.g., 043
    const refId = `BK-${formattedNumber}`;

    // Create the inquiry document
    const docRef = await db.collection("inquiries").add({
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

    res.status(200).json({ refId: refId, message: "Inquiry saved!" });
  } catch (error) {
    res.status(500).json({ message: "Error saving inquiry", error });
  }
});


// GET route to fetch all inquiries
app.get("/api/inquiries", async (req, res) => {
  try {
    const snapshot = await db.collection("inquiries").orderBy("timestamp", "desc").get();

    const inquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inquiries", error });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
