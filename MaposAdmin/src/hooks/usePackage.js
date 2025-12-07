import { useState, useEffect } from 'react';
import { subscribeToPackages } from '../services/packageService';

const usePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Call the service function
    // We pass setPackages as the callback to run when data changes
    const unsubscribe = subscribeToPackages(
      (data) => {
        setPackages(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { packages, loading, error };
};

export default usePackages;