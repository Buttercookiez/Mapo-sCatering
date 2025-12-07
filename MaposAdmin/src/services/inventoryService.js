// src/services/inventoryService.js
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust path if needed
import api from "../api/api"; // <--- Import your custom axios instance

// --- READ: Realtime Listener (Stays the same) ---
export const subscribeToInventory = (onUpdate, onError) => {
  const q = query(collection(db, "inventory"), orderBy("lastUpdated", "desc"));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    onUpdate(items);
  }, onError);
};

export const subscribeToLogs = (onUpdate, onError) => {
  const q = query(
    collection(db, "inventory_logs"), 
    orderBy("timestamp", "desc"), 
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // specific helper to format timestamp if it exists
      date: doc.data().timestamp?.toDate() || new Date() 
    }));
    onUpdate(logs);
  }, onError);
};

// --- WRITE: Node.js API Calls (Using 'api' instance) ---

export const apiAddItem = async (itemData) => {
  try {
    // Your api base is ".../api", so we append "/inventory/add"
    const response = await api.post("/inventory", itemData);            
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

export const apiUpdateItem = async (id, updates) => {
  try {
    const response = await api.put(`/inventory/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

export const apiDeleteItem = async (id) => {
  try {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

// Add this function
export const apiMoveStock = async (payload) => {
  try {
    const response = await api.post("/inventory/move", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};