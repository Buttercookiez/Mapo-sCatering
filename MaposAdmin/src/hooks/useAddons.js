import { useState, useEffect } from 'react';
import { subscribeToAddons } from '../services/addonService';

const useAddons = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAddons(
      (data) => {
        setAddons(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { addons, loading, error };
};

export default useAddons;