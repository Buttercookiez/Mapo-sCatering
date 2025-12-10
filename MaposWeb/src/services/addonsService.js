import { db } from "../config/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export const subscribeToAddons = (onData, onError) => {
  // Reference to the 'addons' collection shown in your screenshot
  const addonsRef = collection(db, "addons");
  
  // Optional: Order by category or name if you like
  const q = query(addonsRef, orderBy("name"));

  // onSnapshot provides real-time updates
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id, // e.g., "service-clown"
          ...data,
          // Fallback image if your DB doesn't have an 'image' field yet
          image: data.image || "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400" 
        };
      });
      onData(items);
    }, 
    (error) => {
      console.error("Error fetching addons:", error);
      if (onError) onError(error);
    }
  );

  // Return the unsubscribe function to clean up listeners
  return unsubscribe;
};