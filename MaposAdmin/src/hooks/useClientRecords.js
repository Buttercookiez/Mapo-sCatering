// src/hooks/useClientRecords.js
import { useState, useEffect } from "react";
import { 
  subscribeToClients, 
  subscribeToBookings, 
  subscribeToTransactions 
} from "../services/clientRecordsService";

const useClientRecords = () => {
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We use this to track if all 3 listeners have responded at least once
  const [initialLoadStatus, setInitialLoadStatus] = useState({
    clients: false,
    bookings: false,
    transactions: false
  });

  useEffect(() => {
    // 1. Subscribe to Clients
    const unsubscribeClients = subscribeToClients(
      (data) => {
        setClients(data);
        setInitialLoadStatus(prev => ({ ...prev, clients: true }));
      },
      (err) => setError(err)
    );

    // 2. Subscribe to Bookings
    const unsubscribeBookings = subscribeToBookings(
      (data) => {
        setBookings(data);
        setInitialLoadStatus(prev => ({ ...prev, bookings: true }));
      },
      (err) => setError(err)
    );

    // 3. Subscribe to Transactions
    const unsubscribeTransactions = subscribeToTransactions(
      (data) => {
        setTransactions(data);
        setInitialLoadStatus(prev => ({ ...prev, transactions: true }));
      },
      (err) => setError(err)
    );

    // Cleanup function: Unsubscribe from all listeners when component unmounts
    return () => {
      unsubscribeClients();
      unsubscribeBookings();
      unsubscribeTransactions();
    };
  }, []);

  // Check if everything is loaded
  useEffect(() => {
    if (initialLoadStatus.clients && initialLoadStatus.bookings && initialLoadStatus.transactions) {
      setLoading(false);
    }
  }, [initialLoadStatus]);

  return { clients, bookings, transactions, loading, error };
};

export default useClientRecords;