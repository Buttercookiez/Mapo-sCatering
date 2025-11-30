import { useState, useEffect } from 'react';
import { 
  subscribeToInventory, 
  apiAddItem, 
  apiUpdateItem, 
  apiDeleteItem 
} from '../services/inventoryService';

export const useInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Realtime Listener
  useEffect(() => {
    const unsubscribe = subscribeToInventory(
      (data) => {
        setInventoryData(data);
        setLoading(false);
      },
      (err) => {
        console.error("Listener Error:", err);
        setError("Failed to sync live data.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Add Item
  const addItem = async (newItem) => {
    try {
      await apiAddItem(newItem);
      return true;
    } catch (err) {
      alert(`Error adding item: ${err}`);
      return false;
    }
  };

  // 3. Update Item (New)
  const updateItem = async (id, updates) => {
    try {
      await apiUpdateItem(id, updates);
      return true;
    } catch (err) {
      alert(`Error updating item: ${err}`);
      return false;
    }
  };

  // 4. Delete Item
  const deleteItem = async (id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiDeleteItem(id);
    } catch (err) {
      alert(`Error deleting item: ${err}`);
    }
  };

  return { inventoryData, loading, error, addItem, updateItem, deleteItem };
};