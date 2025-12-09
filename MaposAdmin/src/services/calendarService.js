// src/services/calendarService.js
import api from '../api/api'; 

export const calendarService = {
  // 1. Fetch Events and Blocked Dates
  // Calls: GET http://localhost:5000/api/calendar/data
  fetchCalendarData: async () => {
    try {
      const response = await api.get('/calendar/data');
      return response.data;
    } catch (error) {
      console.error("Service Error (Fetch Data):", error);
      throw error;
    }
  },

  // 2. Toggle a Blocked Date
  // Calls: POST http://localhost:5000/api/calendar/toggle-block
  toggleBlockDate: async (dateStr) => {
    try {
      const response = await api.post('/calendar/toggle-block', { date: dateStr });
      return response.data;
    } catch (error) {
      console.error("Service Error (Toggle Block):", error);
      throw error;
    }
  },

  // 3. Get Single Event Details
  // Reuse your inquiry endpoint: GET http://localhost:5000/api/inquiries/:id
  getEventDetails: async (refId) => {
    try {
      const response = await api.get(`/inquiries/${refId}`);
      return response.data;
    } catch (error) {
      console.error("Service Error (Get Details):", error);
      throw error;
    }
  }
};