import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase'; // <--- ADJUST THIS PATH to your firebase config file
import { calendarService } from '../services/calendarService';

export const useCalendar = () => {
  const [events, setEvents] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Real-time Listener for Bookings
    // We fetch "Reserved", "Confirmed", "Paid", "Ongoing", "Cancelled"
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef, 
      where("bookingStatus", "in", ["Reserved", "Confirmed", "Paid", "Ongoing", "Cancelled"])
    );

    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
      const loadedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.bookingId,       // The human-readable ID (e.g., #BK-123)
          refId: doc.id,            // The Firestore Document ID (Required for Modal Details)
          date: data.eventDetails?.date, 
          dateObj: new Date(data.eventDetails?.date),
          title: data.profile?.name || "Unknown Client",
          status: data.bookingStatus,
          type: data.packageDetails?.packageName || "Event", // Optional fallback
          time: `${data.eventDetails?.startTime} - ${data.eventDetails?.endTime}`
        };
      });
      setEvents(loadedEvents);
    }, (error) => {
      console.error("Error listening to bookings:", error);
    });

    // 2. Real-time Listener for Blocked Dates
    const blockedRef = collection(db, "blocked_dates");
    const unsubscribeBlocked = onSnapshot(blockedRef, (snapshot) => {
      const loadedBlocked = snapshot.docs.map(doc => doc.id); // Assuming Doc ID is the date string
      setBlockedDates(loadedBlocked);
      setLoading(false); // Stop loading once data arrives
    }, (error) => {
      console.error("Error listening to blocked dates:", error);
      setLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeBlocked();
    };
  }, []);

  // Admin Action: Toggle Block Date via API
  const toggleBlockDate = async (dateObj) => {
    const dateStr = dateObj.toLocaleDateString('en-CA'); 

    // Optimistic UI Update (Client side immediate feedback)
    const isAlreadyBlocked = blockedDates.includes(dateStr);
    setBlockedDates(prev => 
      isAlreadyBlocked ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );

    try {
      // Call Backend API to update Firestore
      await calendarService.toggleBlockDate(dateStr);
      // No need to fetch; the onSnapshot listener will verify the change automatically
    } catch (error) {
      console.error("Failed to toggle block:", error);
      // Revert if API fails
      setBlockedDates(prev => 
        isAlreadyBlocked ? [...prev, dateStr] : prev.filter(d => d !== dateStr)
      );
    }
  };

  return {
    events,
    blockedDates,
    loading,
    toggleBlockDate
  };
};