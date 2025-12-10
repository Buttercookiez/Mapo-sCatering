import { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  // 1. Initialize Read State
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mapos_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    // --- 1. PAYMENTS QUERY (Unchanged - this works well) ---
    const qPayments = query(
      collection(db, "payments"),
      where("status", "==", "Pending"),
      orderBy("submittedAt", "desc"),
      limit(20) 
    );

    // --- 2. BOOKINGS QUERY (UPDATED) ---
    // Added: "Verifying", "Reserved", "Cancelled" to the list
    const qBookings = query(
      collection(db, "bookings"),
      where("bookingStatus", "in", [
        "Pending",    // New Inquiry
        "Verifying",  // Client Accepted Proposal (MISSING BEFORE)
        "Reserved",   // Payment Verified (MISSING BEFORE)
        "Ongoing",    // Happening Now
        "Completed",  // Needs OpEx
        "Cancelled"   // System Auto-Cancel (MISSING BEFORE)
      ]),
      orderBy("createdAt", "desc"), 
      limit(50) 
    );

    // --- LISTENER 1: PAYMENTS ---
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `pay-${doc.id}`, // Unique ID per payment doc
          title: "Payment Approval Needed",
          desc: `${data.clientName} sent ₱${data.amount?.toLocaleString()}. Ref: ${data.refNumber || data.referenceNumber}`,
          time: data.submittedAt ? formatTimeAgo(data.submittedAt) : "Just now",
          type: "alert", 
          rawDate: data.submittedAt ? new Date(data.submittedAt) : new Date(),
          link: '/transactions',
          data: { verifyId: doc.id }
        };
      });
      updateCombinedNotifications(paymentNotifs, 'payments');
    });

    // --- LISTENER 2: BOOKINGS (UPDATED LOGIC) ---
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookingNotifs = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const dateRef = data.updatedAt || data.createdAt || new Date().toISOString();
        
        // --- 1. NEW INQUIRY ---
        if (data.bookingStatus === "Pending") {
          bookingNotifs.push({
            id: `bk-new-${doc.id}`,
            title: "New Client Inquiry",
            desc: `${data.profile?.name} inquired for ${data.eventDetails?.venue || 'an event'}.`,
            time: formatTimeAgo(data.createdAt),
            type: "info",
            rawDate: new Date(data.createdAt),
            linkData: { openBookingId: doc.id }
          });
        }

        // --- 2. PROPOSAL ACCEPTED (Client Selected Package) ---
        // Matches controller: confirmSelection
        if (data.bookingStatus === "Verifying") {
          bookingNotifs.push({
            id: `bk-verify-${doc.id}`, // Unique ID for this stage
            title: "Proposal Accepted",
            desc: `${data.profile?.name} selected a package. Please verify details.`,
            time: formatTimeAgo(data.updatedAt),
            type: "alert", // High priority
            rawDate: new Date(data.updatedAt),
            linkData: { openBookingId: doc.id }
          });
        }

        // --- 3. RESERVATION CONFIRMED ---
        // Matches controller: verifyPayment
        if (data.bookingStatus === "Reserved") {
           // We only show this if it happened recently (e.g., last 3 days) to avoid clutter
           // or rely on "Mark as read"
           bookingNotifs.push({
            id: `bk-res-${doc.id}`,
            title: "Reservation Confirmed",
            desc: `${data.profile?.name}'s event is officially booked.`,
            time: formatTimeAgo(data.updatedAt),
            type: "success",
            rawDate: new Date(data.updatedAt),
            linkData: { openBookingId: doc.id }
          });
        }

        // --- 4. ONGOING EVENT ---
        // Matches controller: updateEventStatuses
        if (data.bookingStatus === "Ongoing") {
          bookingNotifs.push({
            id: `bk-ongoing-${doc.id}`,
            title: "Event Happening Now",
            desc: `${data.profile?.name}'s event is currently ongoing.`,
            time: "Ongoing",
            type: "success",
            rawDate: new Date(),
            linkData: { openBookingId: doc.id }
          });
        }

        // --- 5. SYSTEM AUTO-CANCELLATION ---
        // Matches controller: checkOverdueBookings
        if (data.bookingStatus === "Cancelled" && data.cancellationReason?.includes("System")) {
           bookingNotifs.push({
            id: `bk-cancel-${doc.id}`,
            title: "System Auto-Cancellation",
            desc: `Booking for ${data.profile?.name} was cancelled due to non-payment.`,
            time: formatTimeAgo(data.updatedAt),
            type: "alert",
            rawDate: new Date(data.updatedAt),
            linkData: { openBookingId: doc.id }
          });
        }

        // --- 6. MISSING OPEX (Completed) ---
        const opCost = data.billing?.operationalCost;
        if (data.bookingStatus === "Completed" && (!opCost || opCost === 0)) {
          bookingNotifs.push({
            id: `bk-opex-${doc.id}`,
            title: "Missing Operational Cost",
            desc: `Event for ${data.profile?.name} is done. Please enter expenses.`,
            time: formatTimeAgo(dateRef),
            type: "alert",
            rawDate: new Date(dateRef),
            linkData: { openBookingId: doc.id }
          });
        }
      });
      updateCombinedNotifications(bookingNotifs, 'bookings');
    });

    // --- MERGE LOGIC ---
    let currentPayments = [];
    let currentBookings = [];

    const updateCombinedNotifications = (newData, source) => {
      if (source === 'payments') currentPayments = newData;
      if (source === 'bookings') currentBookings = newData;

      const combined = [...currentPayments, ...currentBookings].sort((a, b) => {
        return b.rawDate - a.rawDate;
      });
      
      setNotifications(combined);
    };

    return () => {
      unsubPayments();
      unsubBookings();
    };
  }, []); // Remove dependencies to ensure singular subscription

  // --- ACTIONS (Unchanged) ---
  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem('mapos_read_notifications', JSON.stringify(newReadIds));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const uniqueIds = [...new Set([...readIds, ...allIds])];
    setReadIds(uniqueIds);
    localStorage.setItem('mapos_read_notifications', JSON.stringify(uniqueIds));
  };

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const notificationsWithStatus = notifications.map(n => ({
    ...n,
    isRead: readIds.includes(n.id)
  }));

  return { 
    notifications: notificationsWithStatus, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  };
};

// Helper
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace("about ", "");
  } catch (e) { return ""; }
};

export default useRealtimeNotifications;