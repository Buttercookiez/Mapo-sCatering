import { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
// Added 'limit' and 'orderBy' to imports
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  // 1. Initialize Read State from LocalStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mapos_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    // --- QUERY DEFINITIONS ---
    
    // A. Pending Payments (Limit to last 20 to prevent overload)
    const qPayments = query(
      collection(db, "payments"),
      where("status", "==", "Pending"),
      orderBy("submittedAt", "desc"),
      limit(20) 
    );

    // B. Active Bookings
    // CRITICAL FIX: Added orderBy and limit to prevent caching thousands of old completed events
    const qBookings = query(
      collection(db, "bookings"),
      where("bookingStatus", "in", ["Pending", "Ongoing", "Completed"]),
      orderBy("createdAt", "desc"), 
      limit(50) 
    );

    // --- LISTENER 1: PAYMENTS ---
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `pay-${doc.id}`,
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
    }, (error) => {
      console.error("Payment Listener Error:", error);
    });

    // --- LISTENER 2: BOOKINGS ---
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookingNotifs = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Use createdAt as fallback for date
        const dateRef = data.updatedAt || data.createdAt || new Date().toISOString();
        
        // Condition 1: New Inquiry
        if (data.bookingStatus === "Pending") {
          bookingNotifs.push({
            id: `bk-new-${doc.id}`,
            title: "New Client Inquiry",
            desc: `${data.profile?.name} inquired for ${data.eventDetails?.venue || 'an event'}.`,
            time: formatTimeAgo(data.createdAt),
            type: "info",
            rawDate: new Date(data.createdAt),
            link: '/bookings',
            data: { openBookingId: doc.id }
          });
        }

        // Condition 2: Ongoing Event
        if (data.bookingStatus === "Ongoing") {
          bookingNotifs.push({
            id: `bk-ongoing-${doc.id}`,
            title: "Event Happening Now",
            desc: `${data.profile?.name}'s event is currently ongoing.`,
            time: "Ongoing",
            type: "success",
            rawDate: new Date(),
            link: '/events', // Assuming you have an events page, or redirect to bookings
            data: { openBookingId: doc.id }
          });
        }

        // Condition 3: Missing OpEx
        const opCost = data.billing?.operationalCost;
        if (data.bookingStatus === "Completed" && (!opCost || opCost === 0)) {
          bookingNotifs.push({
            id: `bk-opex-${doc.id}`,
            title: "Missing Operational Cost",
            desc: `Event for ${data.profile?.name} is done. Please enter expenses.`,
            time: formatTimeAgo(dateRef),
            type: "alert",
            rawDate: new Date(dateRef),
            link: '/bookings',
            data: { openBookingId: doc.id }
          });
        }
      });
      updateCombinedNotifications(bookingNotifs, 'bookings');
    }, (error) => {
      console.error("Booking Listener Error:", error);
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
  }, []);

  // --- ACTIONS ---
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

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace("about ", "");
  } catch (e) { return ""; }
};

export default useRealtimeNotifications;