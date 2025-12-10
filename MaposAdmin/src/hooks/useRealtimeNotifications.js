import { useState, useEffect } from 'react';
import { db } from '../config/firebase'; // Adjust path to your firebase config
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  // 1. Initialize State from LocalStorage
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('mapos_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // --- QUERY DEFINITIONS ---
    const qPayments = query(
      collection(db, "payments"),
      where("status", "==", "Pending"),
      orderBy("submittedAt", "desc")
    );

    const qBookings = query(
      collection(db, "bookings"),
      where("bookingStatus", "in", ["Pending", "Ongoing", "Completed"])
    );

    // --- LISTENER: PAYMENTS ---
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentNotifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `pay-${doc.id}`,
          title: "Payment Approval Needed",
          desc: `${data.clientName} sent ₱${data.amount?.toLocaleString()}. Ref: ${data.referenceNumber}`,
          time: data.submittedAt ? formatTimeAgo(data.submittedAt) : "Just now",
          type: "alert",
          rawDate: new Date(data.submittedAt),
          linkData: { verifyId: doc.id } // Store link data for click handler
        };
      });
      updateCombinedNotifications(paymentNotifs, 'payments');
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
            desc: `${data.profile?.name} inquired for ${data.eventDetails?.venue || 'an event'}.`,
            time: formatTimeAgo(data.createdAt),
            type: "info",
            rawDate: new Date(data.createdAt),
            linkData: { openBookingId: doc.id }
          });
        }

        // 2. Ongoing Event
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

        // 3. Completed (Needs OpEx)
        const opCost = data.billing?.operationalCost;
        if (data.bookingStatus === "Completed" && (!opCost || opCost === 0)) {
          bookingNotifs.push({
            id: `bk-opex-${doc.id}`,
            title: "Missing Operational Cost",
            desc: `Event for ${data.profile?.name} is done. Please enter expenses.`,
            time: formatTimeAgo(updatedAt),
            type: "alert",
            rawDate: new Date(updatedAt),
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
  }, []);

  // --- ACTIONS ---

  // Mark a single notification as read
  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem('mapos_read_notifications', JSON.stringify(newReadIds));
    }
  };

  // Mark all visible notifications as read
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    // Merge with existing read IDs to ensure we don't lose history of older ones if needed
    const uniqueIds = [...new Set([...readIds, ...allIds])];
    setReadIds(uniqueIds);
    localStorage.setItem('mapos_read_notifications', JSON.stringify(uniqueIds));
  };

  // --- DERIVED STATE ---
  // Return the raw notifications list, but also return the count of UNREAD items
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  // Add the 'isRead' property to the notifications for the UI to use
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