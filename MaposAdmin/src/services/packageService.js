import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase"; 
import api from "../api/api"; 

// Helper to normalize data from Firestore to App
const normalizeData = (doc) => {
  const data = doc.data();
  
  // FIX: The Screenshot shows inclusions as an Object/Map {0: "...", 1: "..."}
  // We must convert this to an Array for the UI to render it.
  let inclusions = [];
  if (data.inclusions) {
    if (Array.isArray(data.inclusions)) {
      inclusions = data.inclusions;
    } else if (typeof data.inclusions === 'object') {
      inclusions = Object.values(data.inclusions);
    }
  }

  return {
    id: doc.id,
    ...data,
    inclusions, // Normalized to Array
  };
};

export const subscribeToPackages = (onUpdate, onError) => {
  const q = query(collection(db, "packages"), orderBy("lastUpdated", "desc"));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(normalizeData);
    onUpdate(items);
  }, (error) => {
    console.error("Firestore Error:", error);
    if (onError) onError(error);
  });
};

export const packageService = {
  create: async (packageData) => {
    const response = await api.post('/packages', packageData);
    return response.data;
  },
  update: async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};