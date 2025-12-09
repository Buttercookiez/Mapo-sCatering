import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const DashboardNavbar = ({ activeTab, theme, darkMode, setDarkMode, searchQuery, setSearchQuery }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // --- Mock Notification Data ---
  const notifications = [
    { id: 1, title: "New Inventory Alert", desc: "Truffle Oil is running low (3 bottles left).", time: "10 min ago", type: "alert" },
    { id: 2, title: "New Reservation", desc: "Table 4 booked by J. Doe for 7:00 PM.", time: "1 hr ago", type: "info" },
    { id: 3, title: "Invoice Paid", desc: "Supplier payment #INV-2024 verified.", time: "3 hrs ago", type: "success" },
    { id: 4, title: "Staff Schedule", desc: "Chef Gordon requested leave for Dec 24.", time: "5 hrs ago", type: "info" },
  ];

  // Close notifications on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsNotifOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <header className={`h-24 flex items-center justify-between px-8 md:px-12 border-b ${theme.border} ${theme.bg} transition-colors duration-500 relative z-20`}>
        
        {/* Title Area */}
        <div className="flex flex-col">
           <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Overview</span>
           <h2 className="text-2xl font-serif italic text-nowrap">{activeTab}</h2>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
        
          {/* Notification Bell Trigger */}
          <button 
            onClick={() => setIsNotifOpen(true)}
            className={`relative p-2 ${theme.subText} hover:text-[#C9A25D] transition-colors`}
          >
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C9A25D] rounded-full animate-pulse"></span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className={`p-2 rounded-full ${theme.subText} hover:text-[#C9A25D] transition-colors`}
          >
             {darkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* --- SLIDING NOTIFICATION PANEL --- */}
      
      {/* Backdrop (Darken background when open) */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isNotifOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsNotifOpen(false)}
      />

      {/* Slide-out Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l ${theme.border} ${theme.bg} ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          
          {/* Panel Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div>
              <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Updates</span>
              <h3 className="text-xl font-serif italic">Notifications</h3>
            </div>
            <button 
              onClick={() => setIsNotifOpen(false)}
              className={`${theme.subText} hover:text-[#C9A25D] transition-colors`}
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notifications.map((note) => (
              <div 
                key={note.id} 
                className={`p-4 rounded-lg border ${theme.border} hover:border-[#C9A25D]/50 transition-colors group cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon based on type */}
                  <div className="mt-0.5">
                    {note.type === 'alert' && <AlertCircle size={16} className="text-red-400" />}
                    {note.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
                    {note.type === 'info' && <Info size={16} className="text-[#C9A25D]" />}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-sm font-medium ${theme.text}`}>{note.title}</span>
                      <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">{note.time}</span>
                    </div>
                    <p className={`text-xs ${theme.subText} leading-relaxed`}>{note.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel Footer */}
          <div className={`p-6 border-t ${theme.border}`}>
            <button className={`w-full py-3 text-xs uppercase tracking-widest border ${theme.border} hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] transition-all duration-300`}>
              Mark all as read
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default DashboardNavbar;