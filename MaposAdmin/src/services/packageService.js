// src/services/packageService.js
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase"; // Ensure this is your CLIENT-SIDE firebase config
import api from "../api/api"; // Your custom axios instance

// --- READ: Realtime Listener ---
// We export this separately so hooks can use it easily
export const subscribeToPackages = (onUpdate, onError) => {
  const q = query(collection(db, "packages"), orderBy("lastUpdated", "desc"));

  // Returns the unsubscribe function
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    onUpdate(items);
  }, (error) => {
    console.error("Firestore Error:", error);
    if (onError) onError(error);
  });
};

// --- WRITES: REST API Calls (Mutations) ---
export const packageService = {
  // CREATE
  create: async (packageData) => {
    const response = await api.post('/packages', packageData);
    return response.data;
  },

  // UPDATE
  update: async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data;
  },

  // DELETE
  delete: async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};