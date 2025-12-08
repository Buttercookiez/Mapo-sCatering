import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import api from "../api/api";

/**
 * Subscribes to a SINGLE booking document for real-time updates.
 * * @param {string} id - The Firestore Document ID
 * @param {function} onUpdate - Callback for successful data
 * @param {function} onError - Callback for errors
 * @returns {function} unsubscribe - Function to stop the listener
 */
export const subscribeToBookingDetails = (id, onUpdate, onError) => {
  if (!id) {
    if (onError) onError("No ID provided");
    return () => {};
  }

  const docRef = doc(db, "bookings", id); // Ensure collection name matches your DB

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // --- DATA MAPPING ---
        // Flatten nested DB objects to match UI Props
        const mappedData = {
          id: docSnap.id,
          refId: data.bookingId || docSnap.id,
          
          // 1. Profile
          client: data.profile?.name || "Unknown Client",
          phone: data.profile?.contactNumber || "No Contact",
          email: data.profile?.email || "No Email",

          // 2. Event Details
          date: data.eventDetails?.date || "TBD",
          guests: data.eventDetails?.pax || 0,
          type: data.eventDetails?.eventType || "Event",
          venue: data.eventDetails?.venue || "TBD",
          timeStart: data.eventDetails?.startTime || "TBD",
          timeEnd: data.eventDetails?.endTime || "TBD",
          serviceStyle: data.eventDetails?.serviceStyle || "Plated",
          dietary: data.eventDetails?.notes || "",

          // 3. Status & Meta
          status: data.bookingStatus || "Pending",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),

          // 4. Financials
          budget: data.billing?.totalCost || 0,
          reservationFee: data.billing?.amountPaid || 0, 
          // Logic: If amountPaid > 0, status is Paid, else Unpaid
          reservationStatus: (data.billing?.amountPaid > 0) ? "Paid" : "Unpaid",
          
          paymentMethod: "Bank Transfer", 
          balance: data.billing?.remainingBalance || 0,
          
          // Keep raw data accessible
          ...data 
        };

        onUpdate(mappedData);
      } else {
        if (onError) onError("Booking document not found");
      }
    },
    (error) => {
      console.error("Error fetching details:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

