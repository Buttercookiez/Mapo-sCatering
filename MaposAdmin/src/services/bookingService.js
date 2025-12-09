import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase"; 
import api from "../api/api"; 

// ==========================================
// 1. READ: Real-time Listeners
// ==========================================

export const subscribeToBookings = (onUpdate, onError) => {
  const q = query(
    collection(db, "bookings"), 
    orderBy("createdAt", "desc") 
  );
  
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        id: doc.id, 
        refId: data.bookingId || doc.id,
        status: data.bookingStatus || "Pending",
        
        // Profile
        fullName: data.profile?.name || "Unknown",
        email: data.profile?.email || "",
        phone: data.profile?.contactNumber || "",
        
        // Event Details
        dateOfEvent: data.eventDetails?.date || "TBD",
        eventType: data.eventDetails?.eventType || "Event",
        estimatedGuests: data.eventDetails?.pax || 0,
        startTime: data.eventDetails?.startTime,
        endTime: data.eventDetails?.endTime,
        venue: data.eventDetails?.venue,
        
        // --- BILLING (UPDATED TO MATCH DB IMAGE) ---
        billing: {
            totalCost: data.billing?.totalCost || 0,
            amountPaid: data.billing?.amountPaid || 0,
            remainingBalance: data.billing?.remainingBalance ?? data.billing?.totalCost ?? 0, // Fallback logic
            
            // Status Flags
            paymentStatus: data.billing?.paymentStatus || "Unpaid", // Reservation Fee
            fiftyPercentPaymentStatus: data.billing?.fiftyPercentPaymentStatus || "Unpaid",
            fullPaymentStatus: data.billing?.fullPaymentStatus || "Unpaid"
        },

        // Timestamp
        createdAt: data.createdAt,

        ...data 
      };
    });
    
    onUpdate(bookings);
  }, (error) => {
    console.error("Sync Error:", error);
    if (onError) onError(error);
  });
};


export const updateBookingStatus = async (refId, status) => {
  // CRITICAL FIX: 
  // 1. Your server route is mounted at "/inquiries" (not /bookings)
  // 2. Your router uses .patch() (not .put)
  // 3. Your controller expects the Readable ID (BK-001) in the URL
  
  const response = await api.patch(`/inquiries/${refId}`, { status });
  return response.data;
};

// 2. SEND PROPOSAL
export const sendProposalEmail = async (payload) => {
  // Matching router.post("/send-proposal", ...) inside inquiryRoute
  const response = await api.post("/inquiries/send-proposal", payload);
  return response.data;
};
// ... keep your WRITE functions (apiCreateBooking, etc.) the same below