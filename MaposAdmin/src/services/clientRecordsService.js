// src/services/clientRecordsService.js
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { db } from "../config/firebase"; 

// --- SUBSCRIBERS (Real-time) ---

export const subscribeToClients = (onUpdate, onError) => {
  const q = query(collection(db, "clients"), orderBy("profile.name", "asc"));
  return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(clients);
    }, (error) => { console.error("Error fetching clients:", error); if (onError) onError(error); }
  );
};

export const subscribeToBookings = (onUpdate, onError) => {
  const q = query(collection(db, "bookings"), orderBy("eventDetails.date", "desc"));
  return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      onUpdate(bookings);
    }, (error) => { console.error("Error fetching bookings:", error); if (onError) onError(error); }
  );  
};

// --- FIX: Use 'payments' collection ---
export const subscribeToTransactions = (onUpdate, onError) => {
  // Use 'submittedAt' for sorting as per your screenshot
  const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"));

  return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          transactId: data.paymentId || doc.id, // Fallback if paymentId missing
          date: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : "N/A",
          clientId: null, // Payments might not have direct clientId link, we link via bookingId later
          bookingId: data.bookingId,
          amount: data.amount,
          status: data.status,
          accountName: data.accountName,
          refNumber: data.referenceNumber,
          // Add any other fields you need
          ...data 
        };
      });
      onUpdate(transactions);
    }, (error) => { console.error("Error fetching payments:", error); if (onError) onError(error); }
  );
};