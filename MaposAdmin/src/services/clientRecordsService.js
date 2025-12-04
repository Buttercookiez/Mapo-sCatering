// src/services/clientRecordsService.js
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where 
} from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust path to your firebase config

// --- SUBSCRIBERS (Real-time) ---
export const subscribeToClients = (onUpdate, onError) => {
  const q = query(
    collection(db, "clients"), 
    orderBy("profile.name", "asc")
  );

  return onSnapshot(q, 
    (snapshot) => {
      const clients = snapshot.docs.map((doc) => ({
        id: doc.id, // Firestore Doc ID
        ...doc.data(),
      }));
      onUpdate(clients);
    }, 
    (error) => {
      console.error("Error fetching clients:", error);
      if (onError) onError(error);
    }
  );
};

export const subscribeToBookings = (onUpdate, onError) => {
  // You might want to filter this by date later, but for now we fetch all
  const q = query(
    collection(db, "bookings"),
    orderBy("eventDetails.date", "desc") 
  );

  return onSnapshot(q, 
    (snapshot) => {
      const bookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(bookings);
    },
    (error) => {
      console.error("Error fetching bookings:", error);
      if (onError) onError(error);
    }
  );
};

export const subscribeToTransactions = (onUpdate, onError) => {
  const q = query(
    collection(db, "transactions"),
    orderBy("date", "desc")
  );

  return onSnapshot(q, 
    (snapshot) => {
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(transactions);
    },
    (error) => {
      console.error("Error fetching transactions:", error);
      if (onError) onError(error);
    }
  );
};