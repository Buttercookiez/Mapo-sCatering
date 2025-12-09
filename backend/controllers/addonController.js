const { db, admin } = require('../firestore/firebase');

// COLLECTION REFERENCE
const ADDONS_COLLECTION = "addons";

// --- 1. CREATE ADD-ON ---
const createAddon = async (req, res) => {
  try {
    const data = req.body;

    // Validation
    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ error: "Name, Price, and Category are required." });
    }

    // Generate a readable ID (Slug) based on Category + Name
    // Example: Category "Food", Name "Lechon" -> ID "food-lechon"
    const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanCategory = data.category.toLowerCase();
    const customId = `${cleanCategory}-${cleanName}`;

    // Check if ID already exists to prevent overwrite
    const docRef = db.collection(ADDONS_COLLECTION).doc(customId);
    const doc = await docRef.get();

    let finalId = customId;
    if (doc.exists) {
      // If exists, append a timestamp to make it unique
      finalId = `${customId}-${Date.now()}`;
    }

    const newAddon = {
      ...data,
      id: finalId, // Save ID inside the document too
      price: Number(data.price), // Ensure price is a number
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection(ADDONS_COLLECTION).doc(finalId).set(newAddon);

    res.status(201).json({ message: "Add-on created successfully", id: finalId, ...newAddon });
  } catch (error) {
    console.error("Error creating add-on:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. UPDATE ADD-ON ---
const updateAddon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Ensure price is number if it exists in update
    if (data.price) {
        data.price = Number(data.price);
    }

    await db.collection(ADDONS_COLLECTION).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ message: "Add-on updated successfully" });
  } catch (error) {
    console.error("Error updating add-on:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 3. DELETE ADD-ON ---
const deleteAddon = async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection(ADDONS_COLLECTION).doc(id).delete();

    res.status(200).json({ message: "Add-on deleted successfully" });
  } catch (error) {
    console.error("Error deleting add-on:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 4. GET ALL ADD-ONS (Optional: Frontend uses Realtime listener, but good for testing) ---
const getAllAddons = async (req, res) => {
    try {
        const snapshot = await db.collection(ADDONS_COLLECTION).orderBy('category', 'asc').get();
        const addons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createAddon, updateAddon, deleteAddon, getAllAddons };