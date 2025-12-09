// src/pages/Booking/Confirmation.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Printer } from 'lucide-react';
import Navbar from '../../components/customer/Navbar';
import Footer from '../../components/customer/Footer';

// FadeIn Animation Component
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state || {}; 
  
  // Initialize state based on localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Theme Logic - FIXED: Now updates localStorage so the preference sticks
  useEffect(() => {
    if (darkMode) { 
      document.documentElement.classList.add('dark'); 
      localStorage.setItem('theme', 'dark'); // Saves preference
      document.body.style.backgroundColor = '#0c0c0c'; 
    } else { 
      document.documentElement.classList.remove('dark'); 
      localStorage.setItem('theme', 'light'); // Saves preference
      document.body.style.backgroundColor = '#FAFAFA'; 
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    highlight: 'text-[#C9A25D]',
  };

  // Redirect if no data
  if (!bookingData.name) {
    setTimeout(() => navigate('/'), 3000);
    return (
      <div className={`h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}>
        <p className="text-xs tracking-widest uppercase animate-pulse">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-500 ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white flex flex-col`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={true} />

      {/* Main Content - Centered Full Page */}
      <main className="flex-grow flex items-center justify-center py-32 px-4 md:px-6">
        <div className="max-w-3xl w-full">
          
          <FadeIn>
            <div className="flex flex-col items-center text-center mb-10">
              {/* Gold Check Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-[#C9A25D]/30 bg-[#C9A25D]/5 mb-8 shadow-[0_0_25px_-5px_rgba(201,162,93,0.3)]`}>
                <CheckCircle className="w-8 h-8 text-[#C9A25D]" strokeWidth={1} />
              </div>

              <h1 className="font-serif text-4xl md:text-5xl mb-4 tracking-wide">Request Received</h1>
              <p className={`text-base md:text-lg ${theme.subText} max-w-lg leading-relaxed`}>
                Thank you, <span className={`${theme.text} font-medium`}>{bookingData.name}</span>. We have recorded your inquiry. A proposal will be sent shortly.
              </p>
            </div>
          </FadeIn>

          {/* Receipt / Summary Card */}
          <FadeIn delay={200}>
            <div className={`relative ${theme.cardBg} border ${theme.border} rounded-sm overflow-hidden transition-colors duration-500 group hover:border-[#C9A25D]/50 shadow-sm`}>
              
              {/* Gold Accent Line */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A25D]"></div>
              
              {/* Card Header */}
              <div className={`px-8 py-6 border-b ${theme.border} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                 <div>
                   <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Reference ID</p>
                   <p className={`font-serif text-2xl md:text-3xl ${theme.highlight} tracking-wide`}>{bookingData.refId}</p>
                 </div>
                 <div className="flex flex-col items-end">
                   <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Status</p>
                   <div className={`flex items-center gap-2 px-3 py-1.5 border border-[#C9A25D]/30 rounded-sm bg-[#C9A25D]/5`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A25D] animate-pulse"></div>
                      <span className="text-xs uppercase tracking-widest font-bold text-[#C9A25D]">Under Review</span>
                   </div>
                 </div>
              </div>

              {/* Card Body */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                 
                 {/* Column 1 */}
                 <div className="space-y-6">
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Event Type</span>
                        <span className={`text-base font-medium ${theme.text}`}>{bookingData.eventType}</span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Venue</span>
                        <span className={`text-base font-medium ${theme.text}`}>{bookingData.venue || "To Be Determined"}</span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Contact Email</span>
                        <span className={`text-base font-medium ${theme.text}`}>{bookingData.email}</span>
                    </div>
                 </div>

                 {/* Column 2 */}
                 <div className="space-y-6">
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Date & Time</span>
                        <div className={`text-base font-medium ${theme.text} flex items-center gap-2`}>
                            {bookingData.date}
                            <span className="text-[#C9A25D]">•</span>
                            {bookingData.startTime} - {bookingData.endTime}
                        </div>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Guest Count</span>
                        <span className={`text-base font-medium ${theme.text}`}>{bookingData.guests} Pax</span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Service Style</span>
                        <span className={`text-base font-medium ${theme.text}`}>{bookingData.serviceStyle || "Standard Service"}</span>
                    </div>
                 </div>

                 {/* Full Width Note */}
                 {bookingData.notes && (
                   <div className={`col-span-1 md:col-span-2 pt-6 border-t border-dashed ${theme.border}`}>
                      <span className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Additional Notes</span>
                      <p className={`text-sm italic ${theme.subText} leading-relaxed`}>"{bookingData.notes}"</p>
                   </div>
                 )}
              </div>
            </div>
          </FadeIn>

          {/* Actions */}
          <FadeIn delay={400}>
            <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.print()} 
                className={`group flex items-center justify-center gap-3 px-8 py-4 border ${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all duration-300 text-xs uppercase tracking-[0.2em] font-medium`}
              >
                <Printer size={16} /> 
                <span>Print Receipt</span>
              </button>
              
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center justify-center gap-3 px-10 py-4 bg-[#1c1c1c] text-white hover:bg-[#C9A25D] transition-all duration-300 text-xs uppercase tracking-[0.2em] shadow-xl font-medium"
              >
                <span>Return Home</span>
                <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="mt-10 text-center">
                <p className="text-xs uppercase tracking-widest text-stone-500 opacity-60">
                    Need to make changes? <a href="#" className="underline hover:text-[#C9A25D] transition-colors">Contact Support</a>
                </p>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Confirmation;