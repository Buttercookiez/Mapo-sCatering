import { useState, useEffect } from "react";
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

  return { 
    bookings, 
    isLoading, 
    error,
    // Add your write methods here if needed, just like useInventory:
    // addBooking, 
    // updateBookingStatus 
  };
};