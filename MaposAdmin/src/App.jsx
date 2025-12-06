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

// --- Simple Placeholder Component ---
const AdminPlaceholder = ({ title }) => (
  <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA] text-stone-900">
    <div className="text-center">
      <h1 className="font-serif text-4xl mb-4 italic">{title}</h1>
      <p className="text-xs tracking-widest uppercase text-stone-500">Module Under Development</p>
      <a href="/dashboard" className="block mt-8 text-xs underline hover:text-[#C9A25D]">Back to Dashboard</a>
    </div>
  </div>
);

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
