const { db, admin } = require('../firestore/firebase');

// COLLECTION REFERENCE
const PACKAGES_COLLECTION = "packages";

// --- ADD PACKAGE ---
const addPackage = async (req, res) => {
  try {
    const { id, ...data } = req.body;
    
    // Use the ID provided by frontend, or generate one if missing
    // .set() is used instead of .add() to specify our own custom ID
    await db.collection(PACKAGES_COLLECTION).doc(id).set({
      ...data,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: "Package added successfully", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- UPDATE PACKAGE ---
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    await db.collection(PACKAGES_COLLECTION).doc(id).update({
      ...data,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: "Package updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- DELETE PACKAGE ---
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection(PACKAGES_COLLECTION).doc(id).delete();

    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addPackage, updatePackage, deletePackage };