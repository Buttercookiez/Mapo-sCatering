import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase"; 
import api from "../api/api"; 

// READ
export const subscribeToAddons = (onUpdate, onError) => {
  const q = query(collection(db, "addons"), orderBy("category", "asc"));

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

// WRITE
export const addonService = {
  create: async (data) => {
    const response = await api.post('/addons', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/addons/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/addons/${id}`);
    return response.data;
  }
};