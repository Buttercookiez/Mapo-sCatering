import { useState, useEffect } from "react";
import { subscribeToAddons } from "../services/addonsService";

export const useAddons = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Start listening to Firestore
    const unsubscribe = subscribeToAddons(
      (data) => {
        setAddons(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { addons, loading, error };
};