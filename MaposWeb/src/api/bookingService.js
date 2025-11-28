// src/api/bookingService.js
import axios from 'axios';

// 1. Setup your base URL (Change port if your backend runs on 5000 or 8080)
const API_URL = 'http://localhost:5000/api'; 
// OR if you use a custom axios instance file:
// import api from './api'; 

export const getBookingByRefId = async (refId) => {
  try {
    // This matches your backend route GET /:refId
    const response = await axios.get(`${API_URL}/inquiries/${refId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching booking ${refId}:`, error);
    throw error;
  }
};

export const sendProposalEmail = async (payload) => {
  try {
    // This matches your backend route POST /send-proposal
    const response = await axios.post(`${API_URL}/inquiries/send-proposal`, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending proposal:", error);
    throw error;
  }
};