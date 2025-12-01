import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; 

export const getBookingByRefId = async (refId) => {
  try {
    const response = await axios.get(`${API_URL}/inquiries/${refId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching booking ${refId}:`, error);
    throw error;
  }
};

export const sendProposalEmail = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/inquiries/send-proposal`, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending proposal:", error);
    throw error;
  }
};

// --- ADD THESE NEW FUNCTIONS ---

// 1. Verify the Token (Runs when page loads)
export const verifyProposalToken = async (token) => {
  try {
    // URL becomes: http://localhost:5000/api/inquiries/proposals/verify/:token
    const response = await axios.get(`${API_URL}/inquiries/proposals/verify/${token}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying proposal:", error);
    throw error;
  }
};

// 2. Confirm the Selection (Runs when client clicks "Select")
export const confirmProposalSelection = async (payload) => {
  try {
    // Payload should be: { token, selectedPackage }
    const response = await axios.post(`${API_URL}/inquiries/proposals/confirm`, payload);
    return response.data;
  } catch (error) {
    console.error("Error confirming selection:", error);
    throw error;
  }
};