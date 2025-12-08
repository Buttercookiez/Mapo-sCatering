import { useState, useEffect } from "react";
import { subscribeToBookingDetails } from "../services/bookingDetailsService";

export const useBookingDetails = (bookingId) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Reset state when ID changes
    setLoading(true);
    setError(null);
    setBooking(null);

    if (!bookingId) {
      setLoading(false);
      return;
    }

    // 2. Start Subscription
    const unsubscribe = subscribeToBookingDetails(
      bookingId,
      (data) => {
        setBooking(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load booking details.");
        setLoading(false);
      }
    );

    // 3. Cleanup on Unmount or ID Change
    return () => {
      unsubscribe();
    };
  }, [bookingId]);

  return { booking, loading, error };
};