import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, X, CheckCircle, AlertCircle, Info, Loader2, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useRealtimeNotifications from '../../hooks/useRealtimeNotifications'; // Adjust path

const DashboardNavbar = ({ activeTab, theme, darkMode, setDarkMode }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Destructure the new return values from the Hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();
  
  const navigate = useNavigate();

  // Close notifications on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsNotifOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Handle Click: Navigate AND Mark as Read
  const handleNotificationClick = (note) => {
    // 1. Mark this specific notification as read
    markAsRead(note.id);
    
    // 2. Close panel
    setIsNotifOpen(false); 

    // 3. Navigate logic
    if (note.linkData?.verifyId) {
        navigate('/transactions', { state: { verifyId: note.linkData.verifyId } });
    } else if (note.linkData?.openBookingId) {
        navigate('/bookings', { state: { openBookingId: note.linkData.openBookingId } });
    }
  };

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
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A25D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A25D]"></span>
              </span>
            )}
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
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isNotifOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsNotifOpen(false)}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l ${theme.border} ${theme.bg} ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          
          {/* Panel Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div className="flex items-center gap-2">
              <div>
                <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Updates</span>
                <h3 className="text-xl font-serif italic">Notifications</h3>
              </div>
              {unreadCount > 0 ? (
                <span className="bg-[#C9A25D] text-white text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              ) : (
                <span className="bg-stone-200 dark:bg-stone-800 text-stone-500 text-[10px] px-2 py-0.5 rounded-full">
                  All caught up
                </span>
              )}
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
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                    <CheckCircle className="text-stone-300 mb-2" size={30} />
                    <p className={`text-sm ${theme.subText}`}>No notifications</p>
                </div>
            ) : (
                notifications.map((note) => (
                <div 
                    key={note.id} 
                    onClick={() => handleNotificationClick(note)}
                    // Conditional Styling based on 'note.isRead'
                    className={`
                      relative p-4 rounded-lg border transition-all duration-300 group cursor-pointer 
                      ${note.isRead 
                        ? `border-transparent opacity-60 hover:opacity-100 bg-stone-100/50 dark:bg-stone-800/30` 
                        : `${theme.border} bg-white dark:bg-[#141414] hover:border-[#C9A25D]/50 shadow-sm`
                      }
                    `}
                >
                    {/* Unread Indicator Dot */}
                    {!note.isRead && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-[#C9A25D] rounded-full"></span>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${note.isRead ? 'grayscale opacity-70' : ''}`}>
                          {note.type === 'alert' && <AlertCircle size={16} className="text-red-400" />}
                          {note.type === 'success' && <Loader2 size={16} className="text-emerald-400 animate-spin-slow" />}
                          {note.type === 'info' && <Info size={16} className="text-[#C9A25D]" />}
                      </div>
                      
                      <div className="flex flex-col gap-1 w-full pr-4">
                          <div className="flex justify-between items-start w-full">
                            <span className={`text-sm font-medium ${note.isRead ? theme.subText : theme.text}`}>{note.title}</span>
                            <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">{note.time}</span>
                          </div>
                          <p className={`text-xs ${theme.subText} leading-relaxed line-clamp-2`}>{note.desc}</p>
                      </div>
                    </div>
                </div>
                ))
            )}
          </div>

          {/* Panel Footer - MARK ALL AS READ */}
          <div className={`p-6 border-t ${theme.border}`}>
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`w-full py-3 text-xs uppercase tracking-widest border ${theme.border} 
                flex items-center justify-center gap-2 transition-all duration-300
                ${unreadCount === 0 
                  ? 'opacity-50 cursor-not-allowed bg-transparent text-stone-400' 
                  : 'hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] text-stone-500'
                }
              `}
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default DashboardNavbar;