import { useState, useEffect } from 'react';
import { 
  subscribeToInventory, 
  subscribeToLogs,
  apiAddItem, 
  apiUpdateItem, 
  apiDeleteItem,
  apiMoveStock 
} from '../services/inventoryService';

export const useInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Realtime Listener
  useEffect(() => {
    const unsubInv = subscribeToInventory(
      (data) => { setInventoryData(data); setLoading(false); },
      (err) => { console.error(err); setError("Sync Error"); setLoading(false); }
    );
    
    // 2. Logs Listener (NEW)
    const unsubLogs = subscribeToLogs(
      (data) => { setLogsData(data); },
      (err) => console.error("Log Sync Error:", err)
    );

    return () => {
      unsubInv();
      unsubLogs();
    };
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

  // 5. NEW: Move Stock Wrapper
  const moveStock = async (itemId, action, quantity, lostQuantity = 0, notes = "") => {
    try {
      await apiMoveStock({ itemId, action, quantity, lostQuantity, notes });
      return true;
    } catch (err) {
      alert(`Error moving stock: ${err}`);
      return false;
    }
  };

  return { inventoryData, loading, error, addItem, updateItem, deleteItem, moveStock, logsData };
};  