// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Calendar from './pages/Events/Calendar';
import Finance from './pages/Finance/Financials';
import BookingsAndProposals from './pages/bookingdetails/Bookings'; 
import Inventory from './pages/Inventory/Inventory';
import PackageEditor from './pages/Package/PackageEditor';
import ClientRecords from './pages/ClientRecords/ClientRecords'; 
import Transaction from './pages/Transactions/transactions';
import Login from './pages/Auth/Login';

// Styles
import './App.css';

// --- PROTECTED ROUTE COMPONENT ---
// This checks if the user is logged in. If not, it sends them to Login.
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* --- Public Routes (No Login Required) --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* --- Protected Admin Routes (Login Required) --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/events" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        } />
        
        <Route path="/finance" element={
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        } />
        
        <Route path="/package" element={
          <ProtectedRoute>
            <PackageEditor />
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <ClientRecords />
          </ProtectedRoute>
        } />
        
        <Route path="/bookings" element={
          <ProtectedRoute>
            <BookingsAndProposals />
          </ProtectedRoute>
        } /> 
        
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Transaction/>
          </ProtectedRoute>
        } />

        {/* --- Catch-all: Redirect unknown URLs to Login --- */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;