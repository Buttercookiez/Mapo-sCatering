// backend/controllers/kitchenController.js

// 1. Import the DB instance from your firebase.js
// DO NOT import anything from 'firebase/firestore' here!
const db = require('../firestore/firebase'); 

// --- GET ALL INVENTORY ---
const getInventory = async (req, res) => {
  try {
    // Admin SDK Syntax: db.collection('name').get()
    const snapshot = await db.collection('inventory').get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(list);
  } catch (error) {
    console.error("Error getting inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- ADD NEW INGREDIENT ---
const addIngredient = async (req, res) => {
  try {
    const newItem = req.body; 
    
    // Admin SDK Syntax: .add() is a method of the collection
    await db.collection('inventory').add(newItem);

    res.status(200).json({ message: 'Ingredient added successfully' });
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- UPDATE STOCK ---
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;      
    const { current } = req.body;   

    // Admin SDK Syntax: .doc(id).update()
    await db.collection('inventory').doc(id).update({ 
      current: current 
    });

    res.status(200).json({ message: 'Stock updated' });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- GET DAILY ORDERS ---
const getDailyOrders = async (req, res) => {
  try {
    const { date } = req.query; 

    const snapshot = await db.collection('inquiries')
      .where('dateOfEvent', '==', date)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();

      const style = data.serviceStyle ? data.serviceStyle.toLowerCase() : "";
      const pkgId = style.includes('plated') ? 2 : 3;

      return {
        id: doc.id,
        client: data.fullName,
        date: data.dateOfEvent,
        guests: parseInt(data.estimatedGuests || 0),
        type: data.eventType,
        venue: "Venue TBD", 
        time: data.startTime,
        refId: data.refId,
        packageId: pkgId 
      };
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getInventory,
  addIngredient,
  updateStock,
  getDailyOrders
};