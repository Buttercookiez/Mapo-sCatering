import api from './api'; // Your axios instance

// Fetch Booking
export const getBookingByRefId = async (refId) => {
  try {
    const response = await api.get(`/inquiries/${refId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching booking ${refId}:`, error);
    throw error;
  } 
};

// NEW: Send Proposal
export const sendProposalEmail = async (payload) => {
  try {
    // Matches the backend route we made
    const response = await api.post(`/inquiries/send-proposal`, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending proposal email:", error);
    throw error;
  }
};