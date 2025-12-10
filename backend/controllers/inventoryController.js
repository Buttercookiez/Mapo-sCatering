const { db, admin } = require("../firestore/firebase"); 

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
      sku: sku || `SKU-${Date.now()}`,
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

// 2. EDIT Item (FIXED "0" VALUE BUG)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    // Prepare updates with timestamp
    const finalUpdates = {
      ...updates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Handle nested 'stock' object specifically
    // We transform { stock: { quantityTotal: 5 } } into { "stock.quantityTotal": 5 }
    // This prevents overwriting the entire 'stock' map if you only want to update one field
    if (updates.stock) {
      if (updates.stock.quantityTotal !== undefined) {
          finalUpdates['stock.quantityTotal'] = Number(updates.stock.quantityTotal);
      }
      if (updates.stock.quantityInUse !== undefined) {
          finalUpdates['stock.quantityInUse'] = Number(updates.stock.quantityInUse);
      }
      if (updates.stock.threshold !== undefined) {
          finalUpdates['stock.threshold'] = Number(updates.stock.threshold);
      }
      if (updates.stock.unit !== undefined) {
          finalUpdates['stock.unit'] = updates.stock.unit;
      } 
      
      // IMPORTANT: Remove the raw 'stock' object so we don't overwrite the map
      delete finalUpdates.stock; 
    }

    await docRef.update(finalUpdates);

    res.status(200).json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    handleError(res, error, "Failed to update item");
  }
};

// 3. DELETE Itemput
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(COLLECTION).doc(id).delete();
    res.status(200).json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    handleError(res, error, "Failed to delete item");
  }
};

// 4. NEW: Handle Stock Movement (Checkout/Return + Log)
exports.moveStock = async (req, res) => {
  try {
    const { itemId, action, quantity, lostQuantity, notes } = req.body;
    // action: 'checkout' or 'return'
    
    const qty = Number(quantity) || 0;
    const lost = Number(lostQuantity) || 0;

    await db.runTransaction(async (t) => {
      const itemRef = db.collection("inventory").doc(itemId);
      const itemDoc = await t.get(itemRef);

      if (!itemDoc.exists) throw "Item not found";

      const currentStock = itemDoc.data().stock;
      let newInUse = currentStock.quantityInUse || 0;
      let newTotal = currentStock.quantityTotal || 0;

      // --- LOGIC ---
      if (action === 'checkout') {
        // Deploying items
        if ((newTotal - newInUse) < qty) throw "Not enough items available";
        newInUse += qty;
      } 
      else if (action === 'return') {
        // Returning items
        const totalReturning = qty + lost; // Total items coming back from event
        if (newInUse < totalReturning) throw "Cannot return more than what is in use";

        newInUse -= totalReturning; // All these leave the "In Use" status
        newTotal -= lost;           // Only the lost ones leave the "Total" inventory
      }

      // 1. Update Inventory Item
      t.update(itemRef, {
        "stock.quantityInUse": newInUse,
        "stock.quantityTotal": newTotal,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Create Log Entry
      const logRef = db.collection("inventory_logs").doc();
      t.set(logRef, {
        itemId,
        itemName: itemDoc.data().name,
        action, // 'checkout' or 'return'
        quantityMoved: qty,
        quantityLost: lost,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        notes: notes || ""
      });
    });

    res.status(200).json({ success: true, message: "Stock moved and logged successfully" });

  } catch (error) {
    console.error("Stock Move Error:", error);
    res.status(500).json({ success: false, error: error.message || error });
  }
};