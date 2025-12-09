import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarService } from '../services/calendarService';

export const useCalendar = () => {
  const [events, setEvents] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ref to track if the initial load is done (to prevent spinner on background updates)
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);

    try {
      const data = await calendarService.fetchCalendarData();
      
      const processedEvents = (data.events || []).map(ev => ({
        ...ev,
        dateObj: new Date(ev.date)
      }));

      // Optimization: Only update state if stringified data changed to avoid re-renders
      setEvents(prev => JSON.stringify(prev) !== JSON.stringify(processedEvents) ? processedEvents : prev);
      setBlockedDates(prev => JSON.stringify(prev) !== JSON.stringify(data.blockedDates) ? data.blockedDates : prev);

    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, []);

  // Set up Interval for Auto-Refresh (Polling)
  useEffect(() => {
    fetchData(); // Fetch immediately
    const interval = setInterval(() => {
        fetchData(); // Silent fetch every 5 seconds
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleBlockDate = async (dateObj) => {
    const dateStr = dateObj.toLocaleDateString('en-CA'); 

    // Optimistic Update
    const isAlreadyBlocked = blockedDates.includes(dateStr);
    setBlockedDates(prev => 
      isAlreadyBlocked ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );

    try {
      await calendarService.toggleBlockDate(dateStr);
      // We don't need to manually refresh here because the interval will catch it, 
      // or we can call fetchData() if we want instant confirmation.
    } catch (error) {
      console.error("Failed to toggle block:", error);
      // Revert if failed
      setBlockedDates(prev => 
        isAlreadyBlocked ? [...prev, dateStr] : prev.filter(d => d !== dateStr)
      );
    }
  };

  return {
    events,
    blockedDates,
    loading,
    refreshCalendar: fetchData,
    toggleBlockDate
  };
};