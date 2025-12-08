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

// Send Proposal
export const sendProposalEmail = async (payload) => {
  try {
    const response = await api.post(`/inquiries/send-proposal`, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending proposal email:", error);
    throw error;
  }
};

// === ADD THIS NEW FUNCTION BELOW ===

// Update Booking Status (Confirmed, Rejected, etc.)
export const updateBookingStatus = async (refId, status) => {
  try {
    // We use PATCH because we are only updating one field (the status)
    const response = await api.patch(`/inquiries/${refId}`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating status for ${refId}:`, error);
    throw error;
  }
};

export const getPackagesByEvent = async (eventType) => {
  try {
    // URL encodes spaces (e.g., "Corporate Gala" -> "Corporate%20Gala")
    const response = await api.get(`/inquiries/packages?eventType=${encodeURIComponent(eventType)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching packages:", error);
    return []; // Return empty array on error
  }
};

export const rejectBooking = async (payload) => {
  // payload: { refId, clientEmail, clientName, reason }
  const response = await api.post("/inquiries/reject", payload);
  return response.data;
};