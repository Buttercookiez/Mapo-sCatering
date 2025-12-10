import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Clock,
  Lock, Ban, Loader2
} from 'lucide-react';

// Import Hooks & Services
import { useCalendar } from '../../hooks/useCalendar';

// Import Components
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';
import ViewEventModal from './ViewEventModal'; // Adjust path based on where you put File 1

// --- ANIMATION WRAPPER ---
const FadeIn = ({ children }) => (
  <div className="animate-in fade-in duration-500 fill-mode-forwards">{children}</div>
);

// --- MAIN CALENDAR PAGE ---
const CalendarPage = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Calendar');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Hook Data
  const { events, blockedDates, loading, toggleBlockDate } = useCalendar();
  const MAX_EVENTS = 4;

  // --- HELPERS ---
  const getEventsForDay = (date) => events.filter(e => e.dateObj.toDateString() === date.toDateString());
  const getActiveEventsForDay = (date) => getEventsForDay(date).filter(e => e.status !== 'Cancelled' && e.status !== 'Rejected');

  const isDateBlocked = (date) => blockedDates.includes(date.toLocaleDateString('en-CA'));
  const isDateFull = (date) => getActiveEventsForDay(date).length >= MAX_EVENTS;

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    hoverBg: darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100',
  };

  // Handler to Open Modal
  const handleEventClick = (event) => {
    // We use refId (Firestore Doc ID) for the API call in the modal
    if (event.refId) {
      setSelectedEventId(event.refId);
      setViewModalOpen(true);
    } else {
      console.error("Event missing refId", event);
    }
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty Slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`h-24 md:h-32 border-b border-r ${theme.border} ${darkMode ? 'bg-black/20' : 'bg-stone-50/50'}`} />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);

      const allEvents = getEventsForDay(dateObj);
      const activeCount = getActiveEventsForDay(dateObj).length;

      const isBlocked = isDateBlocked(dateObj);
      const isFull = activeCount >= MAX_EVENTS;
      const isSelected = selectedDate.toDateString() === dateObj.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateObj)}
          className={`
            relative h-24 md:h-32 border-b border-r ${theme.border} p-2 cursor-pointer transition-colors duration-300
            ${isSelected ? (darkMode ? 'bg-stone-800' : 'bg-white ring-2 ring-inset ring-[#C9A25D]') : ''}
            ${!isSelected && isBlocked ? (darkMode ? 'bg-[#1a1a1a] opacity-60 bg-stripes-dark' : 'bg-stone-100 opacity-80') : ''}
            ${!isSelected && isFull && !isBlocked ? 'bg-red-50/5 dark:bg-red-900/10' : ''}
            ${!isSelected && !isBlocked ? theme.hoverBg : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-serif w-7 h-7 flex items-center justify-center rounded-full ${isSelected ? 'bg-[#C9A25D] text-white' : theme.text}`}>
              {day}
            </span>
            <div className="flex gap-1">
              {isBlocked && <Lock size={12} className="text-stone-400" />}
              {!isBlocked && activeCount > 0 && (
                <span className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-[#C9A25D]'}`}>
                  {activeCount}/{MAX_EVENTS}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {isBlocked ? (
              <div className="text-[10px] uppercase tracking-widest text-center mt-4 text-stone-500 font-bold">Blocked</div>
            ) : (
              allEvents.slice(0, MAX_EVENTS).map((ev, idx) => {
                const isCancelled = ev.status === 'Cancelled' || ev.status === 'Rejected';
                return (
                  <div key={idx} className={`flex items-center gap-1 ${isCancelled ? 'opacity-50' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-[#C9A25D]'}`}></div>
                    <span className={`text-[9px] truncate w-full ${theme.subText} ${isCancelled ? 'line-through text-red-400' : ''}`}>
                      {ev.title}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text}`}>

      {/* --- UPDATED STYLE BLOCK --- */}
      <style>{`
        .bg-stripes-dark { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #262626 10px, #262626 20px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #57534e; border-radius: 2px; }
      `}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Events Calendar" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} />

        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
              <p className="text-xs uppercase tracking-widest">Syncing Calendar...</p>
            </div>
          ) : (
            <FadeIn>
              <div className="flex flex-col lg:flex-row gap-8 h-full">

                {/* --- LEFT: CALENDAR GRID --- */}
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Schedule</span>
                      <h2 className="font-serif text-3xl md:text-4xl italic mt-1">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex border ${theme.border} rounded-sm overflow-hidden`}>
                        <button onClick={() => changeMonth(-1)} className={`p-2 hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}><ChevronLeft size={18} /></button>
                        <div className={`w-[1px] ${theme.border}`}></div>
                        <button onClick={() => changeMonth(1)} className={`p-2 hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}><ChevronRight size={18} /></button>
                      </div>
                    </div>
                  </div>

                  <div className={`border-t border-l ${theme.border} ${theme.cardBg}`}>
                    <div className="grid grid-cols-7">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className={`py-3 text-center text-[10px] tracking-[0.2em] border-b border-r ${theme.border}`}>{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">{renderCalendarGrid()}</div>
                  </div>
                </div>

                {/* --- RIGHT: SIDE PANEL --- */}
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className={`h-full border ${theme.border} ${theme.cardBg} p-6 flex flex-col`}>

                    <div className="mb-6">
                      <h3 className="font-serif text-3xl mt-2">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>

                      {/* STATUS BADGES */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {isDateBlocked(selectedDate) ? (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-stone-200 dark:bg-stone-800 text-stone-500 rounded-sm flex items-center gap-1">
                            <Lock size={10} /> Admin Blocked
                          </span>
                        ) : isDateFull(selectedDate) ? (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-sm flex items-center gap-1">
                            <Ban size={10} /> Fully Booked
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#C9A25D]/10 text-[#C9A25D] rounded-sm">
                            {getActiveEventsForDay(selectedDate).length} / {MAX_EVENTS} Slots Used
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => toggleBlockDate(selectedDate)}
                        className={`flex-1 py-3 text-[10px] uppercase tracking-widest border transition-colors flex items-center justify-center gap-2
                           ${isDateBlocked(selectedDate)
                            ? 'bg-stone-800 text-white border-stone-800 hover:bg-stone-700'
                            : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                      >
                        {isDateBlocked(selectedDate) ? <><Lock size={14} /> Unblock Date</> : <><Ban size={14} /> Block Date</>}
                      </button>
                    </div>

                    {/* EVENT LIST - Uses 'no-scrollbar' class */}
                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                      {getEventsForDay(selectedDate).length > 0 ? (
                        getEventsForDay(selectedDate).map((event) => {
                          const isCancelled = event.status === 'Cancelled' || event.status === 'Rejected';
                          return (
                            <div
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className={`p-4 border transition-all group relative cursor-pointer
                                ${isCancelled
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10 opacity-70'
                                  : `${theme.border} hover:border-[#C9A25D]/50`}
                              `}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${isCancelled ? 'text-red-500 border-red-500' : 'text-[#C9A25D] border-[#C9A25D]/30'}`}>
                                  {isCancelled ? 'Cancelled' : event.type}
                                </span>
                              </div>
                              <h4 className={`font-serif text-lg leading-tight mb-3 ${isCancelled ? 'line-through text-stone-500' : 'group-hover:text-[#C9A25D]'}`}>
                                {event.title}
                              </h4>
                              {!isCancelled && (
                                <div className="space-y-2">
                                  <div className={`flex items-center gap-2 text-xs ${theme.subText}`}><Clock size={12} /> {event.time}</div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800">
                          <span className="font-serif italic text-lg">No events</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </main>

      {/* MODALS */}
      <ViewEventModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        eventId={selectedEventId}
        theme={theme}
        darkMode={darkMode}
      />
    </div>
  );
};

export default CalendarPage;