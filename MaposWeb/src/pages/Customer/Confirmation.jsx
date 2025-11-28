import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Home, Mail } from 'lucide-react';
import Navbar from '../../components/customer/Navbar';
import Footer from '../../components/customer/Footer';

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state || {}; // Get data passed from Booking.jsx
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) { 
      document.documentElement.classList.add('dark'); 
      document.body.style.backgroundColor = '#0c0c0c'; 
    } else { 
      document.documentElement.classList.remove('dark'); 
      document.body.style.backgroundColor = '#FAFAFA'; 
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
  };

  // Redirect if no data (e.g. user typed url manually)
  if (!bookingData.name) {
    setTimeout(() => navigate('/'), 3000);
    return (
      <div className={`h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}>
        <p className="text-xs tracking-widest uppercase">Redirecting to Home...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-500 ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white flex flex-col`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={true} />

      <main className="flex-grow flex items-center justify-center py-32 px-6">
        <div className="max-w-2xl w-full text-center">
          
          {/* Success Icon (Static, No Bounce) */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl mb-6">Request Received</h1>
          <p className={`text-sm md:text-base ${theme.subText} max-w-lg mx-auto leading-relaxed mb-10`}>
            Thank you, <strong>{bookingData.name}</strong>. We have received your inquiry for the <strong>{bookingData.eventType}</strong> on {bookingData.date}. 
            A proposal will be sent to <u>{bookingData.email}</u> shortly.
          </p>

          {/* Summary Card */}
          <div className={`text-left p-8 border ${theme.border} ${theme.cardBg} rounded-sm mb-10 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C9A25D]"></div>
            <div className="flex justify-between items-start mb-6">
               <div>
                 <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Reference Number</p>
                 <p className="font-mono text-lg tracking-wider">{bookingData.refId}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Status</p>
                 <span className="text-xs font-bold text-amber-500 uppercase tracking-wider border border-amber-500/30 px-2 py-1 rounded-sm bg-amber-500/5">Under Review</span>
               </div>
            </div>

            <div className={`grid grid-cols-2 gap-y-6 gap-x-4 text-sm border-t ${theme.border} pt-6`}>
               <div>
                  <span className="block text-[10px] uppercase text-stone-400 mb-1">Event Type</span>
                  <span className="font-medium">{bookingData.eventType}</span>
               </div>
               <div>
                  <span className="block text-[10px] uppercase text-stone-400 mb-1">Date & Time</span>
                  <span className="font-medium">{bookingData.date} <span className="text-stone-400">|</span> {bookingData.startTime}</span>
               </div>
               <div>
                  <span className="block text-[10px] uppercase text-stone-400 mb-1">Guest Count</span>
                  <span className="font-medium">{bookingData.guests} Pax</span>
               </div>
               <div>
                  <span className="block text-[10px] uppercase text-stone-400 mb-1">Service Style</span>
                  <span className="font-medium">{bookingData.serviceStyle || "Not specified"}</span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => window.print()} className={`flex items-center justify-center gap-2 px-8 py-3 border ${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all text-xs uppercase tracking-widest`}>
              <Download size={16} /> Save Receipt
            </button>
            <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 px-8 py-3 bg-[#1c1c1c] text-white hover:bg-[#C9A25D] transition-all text-xs uppercase tracking-widest shadow-lg">
              <Home size={16} /> Back to Home
            </button>
          </div>

          <p className={`mt-12 text-xs ${theme.subText}`}>
            Questions? Contact us at <a href="mailto:hello@mapos.com" className="underline hover:text-[#C9A25D]">hello@mapos.com</a>
          </p>

        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Confirmation;