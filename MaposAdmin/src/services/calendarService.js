// src/services/calendarService.js
import api from '../api/api'; 

export const calendarService = {
  // 1. Toggle a Blocked Date (Still uses API because it's an Admin Write Action)
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

  // 2. Get Single Event Details
  // Reuse your inquiry endpoint: GET http://localhost:5000/api/inquiries/:id
  getEventDetails: async (refId) => {
    try {
      if (!refId) throw new Error("No Event ID provided");
      
      // Make sure this matches your Route file. 
      // If your server.js uses app.use('/api/inquiries', inquiryRoutes)
      // Then this must be /inquiries/
      const response = await api.get(`/inquiries/${refId}`);
      return response.data;
    } catch (error) {
      console.error("Service Error (Get Details):", error);
      throw error;
    }
  }
};