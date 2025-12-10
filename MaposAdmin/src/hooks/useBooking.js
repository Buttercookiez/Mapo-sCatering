import { useState, useEffect, useMemo } from "react";
import { subscribeToBookings } from "../services/bookingService"; 
// Import other write functions if you need them (e.g., apiCreateBooking)

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Realtime Subscription ---
  useEffect(() => {
    // 1. Subscribe
    const unsubscribe = subscribeToBookings(
      (data) => {
        setBookings(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Booking Sync Error:", err);
        setError("Failed to sync bookings");
        setIsLoading(false);
      }
    );

    // 2. Cleanup on Unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // --- NEW: Calculate Total Revenue ---
  const totalRevenue = useMemo(() => {
    return bookings.reduce((total, booking) => {
      // Convert to number to be safe, default to 0
      const cost = Number(booking.billing?.totalCost) || 0;
      return total + cost;
    }, 0);
  }, [bookings]); // Re-calculates whenever 'bookings' updates from Firebase

  return { 
    bookings, 
    totalRevenue, // Export the calculated total
    isLoading, 
    error,
    // Add your write methods here if needed:
    // addBooking, 
    // updateBookingStatus 
  };
};