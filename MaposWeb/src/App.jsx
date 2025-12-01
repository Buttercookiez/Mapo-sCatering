// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Customer Pages
import Homepage from './pages/Customer/Homepage';
import Menu from './pages/Customer/Menu';
import Venue from './pages/Customer/Venue';
import Booking from './pages/Customer/Booking';
import Confirmation from './pages/Customer/Confirmation';
import ClientProposal from './pages/Customer/ClientProposal'; // <--- Import the new page
import ProposalSelection from './pages/Customer/ProposalSelection'; // <--- Import the new page



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
        {/* --- Customer Routes --- */}
        <Route path="/" element={<Homepage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/venue" element={<Venue />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/client-proposal/:refId" element={<ClientProposal />} /> {/* New Route */}
        
        
        
        {/* Placeholders for remaining Sidebar links */}
        <Route path="/clients" element={<AdminPlaceholder title="Client Records" />} />
        <Route path="/tasks" element={<AdminPlaceholder title="Task Manager" />} />
        <Route path="/venue-status" element={<AdminPlaceholder title="Venue Status" />} />
        <Route path="/finance/reports" element={<AdminPlaceholder title="Profit Reports" />} />
        <Route path="/proposal-selection/:token" element={<ProposalSelection />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;