const {db, admin } = require("../firestore/firebase"); 

const COLLECTION = "inventory";

// Helper: Standardized Error Response
const handleError = (res, error, message = "Internal Server Error") => {
  console.error(`[Inventory Error]: ${message}`, error);
  res.status(500).json({ success: false, error: message, details: error.message });
};

// 1. ADD Item
exports.addItem = async (req, res) => {
  try {
    const { sku, name, category, stock, price } = req.body;

    // Basic Validation
    if (!name || !stock || stock.quantityTotal === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields (name, stock.quantityTotal)" });
    }

    const newItem = {
      sku: sku || `SKU-${Date.now()}`, // Fallback generation
      name,
      category: category || "Uncategorized",
      stock: {
        quantityTotal: Number(stock.quantityTotal),
        quantityInUse: Number(stock.quantityInUse) || 0,
        threshold: Number(stock.threshold) || 10,
        unit: stock.unit || "Pcs"
      },
      price: Number(price) || 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(COLLECTION).add(newItem);
    
    res.status(201).json({ success: true, id: docRef.id, message: "Item added successfully" });
  } catch (error) {
    handleError(res, error, "Failed to add item");
  }
};

// 2. EDIT Item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if item exists
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    // Construct update object (handling nested 'stock' updates carefully)
    // Using dot notation for nested fields to avoid overwriting the whole object if partial
    const finalUpdates = {
      ...updates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // If stock is being updated, ensure numbers are numbers
    if (updates.stock) {
      if (updates.stock.quantityTotal) finalUpdates['stock.quantityTotal'] = Number(updates.stock.quantityTotal);
      if (updates.stock.quantityInUse) finalUpdates['stock.quantityInUse'] = Number(updates.stock.quantityInUse);
      if (updates.stock.threshold) finalUpdates['stock.threshold'] = Number(updates.stock.threshold);
      if (updates.stock.unit) finalUpdates['stock.unit'] = updates.stock.unit;
      delete finalUpdates.stock; // Remove the object so we use dot notation
    }

    await docRef.update(finalUpdates);

    res.status(200).json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    handleError(res, error, "Failed to update item");
  }
};

// 3. DELETE Item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(COLLECTION).doc(id).delete();
    res.status(200).json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    handleError(res, error, "Failed to delete item");
  }
};