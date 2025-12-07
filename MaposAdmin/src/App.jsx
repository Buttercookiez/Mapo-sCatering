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

// Styles
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* --- Redirect root to dashboard --- */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* --- Admin/Management Routes --- */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Calendar />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/package" element={<PackageEditor />} />
        <Route path="/clients" element={<ClientRecords />} />
        <Route path="/bookings" element={<BookingsAndProposals />} /> 
        <Route path="/transactions" element={<Transaction/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
