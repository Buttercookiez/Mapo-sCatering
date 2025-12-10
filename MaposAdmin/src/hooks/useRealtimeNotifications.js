// src/hooks/useRealtimeNotifications.js
import { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  // 1. Initialize State from LocalStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mapos_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    // --- QUERY DEFINITIONS ---
    
    // 1. Payments: Get last 20 pending payments
    const qPayments = query(
      collection(db, "payments"),
      where("status", "==", "Pending"),
      orderBy("submittedAt", "desc"),
      limit(20)
    );

    // 2. Bookings: Get last 50 active/recent bookings
    // Note: You might need to create a Firestore Index for this query. 
    // Check your browser console; if it asks for an index, click the link provided.
    const qBookings = query(
      collection(db, "bookings"),
      where("bookingStatus", "in", ["Pending", "Ongoing", "Completed"]),
      orderBy("createdAt", "desc"), // Ensure we only listen to recent ones
      limit(50) 
    );

    // --- LISTENER: PAYMENTS ---
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `pay-${doc.id}`,
          title: "Payment Approval Needed",
          desc: `${data.clientName || 'Client'} sent ₱${Number(data.amount || 0).toLocaleString()}. Ref: ${data.referenceNumber || 'N/A'}`,
          time: data.submittedAt ? formatTimeAgo(data.submittedAt) : "Just now",
          type: "alert",
          rawDate: data.submittedAt ? new Date(data.submittedAt) : new Date(),
          linkData: { verifyId: doc.id } 
        };
      });
      updateCombinedNotifications(paymentNotifs, 'payments');
    }, (error) => {
      console.warn("Payment Notification Listener Error:", error);
      // Prevents app crash on permission/index errors
    });

    // --- LISTENER: BOOKINGS ---
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookingNotifs = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const updatedAt = data.updatedAt || data.createdAt;
        
        // 1. Pending Inquiry
        if (data.bookingStatus === "Pending") {
          bookingNotifs.push({
            id: `bk-new-${doc.id}`,
            title: "New Client Inquiry",
            desc: `${data.profile?.name || 'Unknown'} inquired for ${data.eventDetails?.venue || 'an event'}.`,
            time: formatTimeAgo(data.createdAt),
            type: "info",
            rawDate: data.createdAt ? new Date(data.createdAt) : new Date(),
            linkData: { openBookingId: doc.id }
          });
        }

        // 2. Ongoing Event
        if (data.bookingStatus === "Ongoing") {
          bookingNotifs.push({
            id: `bk-ongoing-${doc.id}`,
            title: "Event Happening Now",
            desc: `${data.profile?.name || 'Unknown'}'s event is currently ongoing.`,
            time: "Ongoing",
            type: "success",
            rawDate: new Date(), // Always top
            linkData: { openBookingId: doc.id }
          });
        }

        // 3. Completed (Needs OpEx)
        const opCost = data.billing?.operationalCost;
        if (data.bookingStatus === "Completed" && (!opCost || opCost === 0)) {
          bookingNotifs.push({
            id: `bk-opex-${doc.id}`,
            title: "Missing Operational Cost",
            desc: `Event for ${data.profile?.name || 'Client'} is done. Please enter expenses.`,
            time: formatTimeAgo(updatedAt),
            type: "alert",
            rawDate: updatedAt ? new Date(updatedAt) : new Date(),
            linkData: { openBookingId: doc.id }
          });
        }
      });
      updateCombinedNotifications(bookingNotifs, 'bookings');
    }, (error) => {
       console.warn("Booking Notification Listener Error:", error);
       // If you see "The query requires an index" in console, click the link!
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

// Helper
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace("about ", "");
  } catch (e) {
    return "";
  }
};

export default useRealtimeNotifications;