// src/pages/Events/Calendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, 
  Users, MoreHorizontal, X, Trash2, Save, ChevronDown,
  Lock, Ban, Loader2 
} from 'lucide-react';

// Import Layout Components
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- ANIMATION COMPONENT ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// --- 1. VIEW EVENT DETAILS MODAL (DEFINED FIRST) ---
const ViewEventModal = ({ isOpen, onClose, eventId, theme }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      // Fetches full details using the Booking Reference ID
      axios.get(`http://localhost:5000/api/inquiries/${eventId}`)
        .then(res => {
          setDetails(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch details", err);
          setLoading(false);
        });
    } else {
      setDetails(null);
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const formatMoney = (amount) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col max-h-[90vh]`}>
        
        {/* HEADER */}
        <div className={`p-6 border-b ${theme.border} flex justify-between items-start`}>
          <div>
            <h2 className={`font-serif text-2xl italic ${theme.text}`}>Event Details</h2>
            <p className={`text-xs uppercase tracking-widest mt-1 ${theme.subText}`}>Ref: {eventId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center text-stone-500">
                <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                <p className="text-xs uppercase tracking-widest">Retrieving Information...</p>
             </div>
          ) : details ? (
            <div className="space-y-8">
              
              {/* STATUS & TITLE */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                 <div>
                    <h1 className={`font-serif text-3xl text-[#C9A25D]`}>{details.fullName}</h1>
                    <p className={`text-sm ${theme.text} mt-1`}>{details.eventType} • {details.dateOfEvent}</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold border rounded-sm mb-2
                      ${details.status === 'Confirmed' || details.status === 'Reserved' ? 'text-emerald-500 border-emerald-900 bg-emerald-900/10' : 
                        details.status === 'Cancelled' ? 'text-red-500 border-red-900 bg-red-900/10' : 
                        'text-amber-500 border-amber-900 bg-amber-900/10'}`}>
                      {details.status}
                    </span>
                 </div>
              </div>

              {/* LOGISTICS GRID */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border ${theme.border} bg-stone-50/5 dark:bg-stone-900/50 rounded-sm`}>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <Clock size={16} className="text-[#C9A25D] mt-0.5" />
                       <div>
                          <p className="text-[9px] uppercase tracking-widest text-stone-500">Time</p>
                          <p className={`text-sm ${theme.text}`}>{details.startTime} - {details.endTime}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <MapPin size={16} className="text-[#C9A25D] mt-0.5" />
                       <div>
                          <p className="text-[9px] uppercase tracking-widest text-stone-500">Venue</p>
                          <p className={`text-sm ${theme.text}`}>{details.venueName || "TBD"}</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <Users size={16} className="text-[#C9A25D] mt-0.5" />
                       <div>
                          <p className="text-[9px] uppercase tracking-widest text-stone-500">Guests</p>
                          <p className={`text-sm ${theme.text}`}>{details.estimatedGuests} Pax</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <MoreHorizontal size={16} className="text-[#C9A25D] mt-0.5" />
                       <div>
                          <p className="text-[9px] uppercase tracking-widest text-stone-500">Service Style</p>
                          <p className={`text-sm ${theme.text}`}>{details.serviceStyle || "Standard"}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* FINANCIALS */}
              <div>
                <h3 className={`font-serif text-xl italic mb-4 ${theme.text} border-b ${theme.border} pb-2`}>Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Package Info */}
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Selected Package</p>
                      <p className="text-lg font-medium text-[#C9A25D]">{details.proposal?.selectedPackageName || details.package || "Custom Package"}</p>
                      
                      {details.proposal?.options && (
                        <div className="mt-4">
                           <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2">Add-ons / Inclusions</p>
                           <ul className="space-y-1">
                              <li className={`text-xs ${theme.subText}`}>• Standard Setup</li>
                              <li className={`text-xs ${theme.subText}`}>• Service Staff</li>
                           </ul>
                        </div>
                      )}
                   </div>

                   {/* Cost Breakdown */}
                   <div className={`bg-[#1c1c1c] p-6 border ${theme.border} rounded-sm`}>
                      <div className="flex justify-between mb-2">
                         <span className="text-xs text-stone-400 uppercase tracking-wider">Total Cost</span>
                         <span className={`font-serif text-lg ${theme.text}`}>{formatMoney(details.estimatedBudget)}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                         <span className="text-xs text-stone-400 uppercase tracking-wider">Amount Paid</span>
                         <span className="font-serif text-lg text-emerald-500">{formatMoney(details.payment?.amount)}</span>
                      </div>
                      <div className="h-[1px] bg-stone-700 w-full mb-4"></div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs text-[#C9A25D] uppercase tracking-widest font-bold">Balance Due</span>
                         <span className="font-serif text-2xl text-[#C9A25D]">
                           {formatMoney(details.estimatedBudget - (details.payment?.amount || 0))}
                         </span>
                      </div>
                   </div>
                </div>
              </div>

              {/* CONTACT */}
              <div>
                 <h3 className={`font-serif text-xl italic mb-4 ${theme.text} border-b ${theme.border} pb-2`}>Client Contact</h3>
                 <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                       <span className="block text-[9px] uppercase tracking-widest text-stone-500">Email</span>
                       <span className={theme.text}>{details.email}</span>
                    </div>
                    <div>
                       <span className="block text-[9px] uppercase tracking-widest text-stone-500">Phone</span>
                       <span className={theme.text}>{details.phone || "N/A"}</span>
                    </div>
                 </div>
              </div>

            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-red-400">
                Failed to load data.
             </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`p-6 border-t ${theme.border} flex justify-end gap-3`}>
           <button onClick={onClose} className={`px-6 py-2 border ${theme.border} text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors rounded-sm ${theme.text}`}>
              Close
           </button>
        </div>

      </div>
    </div>
  );
};

// --- 2. ADD/EDIT EVENT MODAL ---
const EventModal = ({ isOpen, onClose, onSave, eventToEdit, theme }) => {
  const [formData, setFormData] = useState({
    title: '', type: 'Wedding', time: '', guests: '', location: 'Grand Ballroom'
  });
  const [typeOpen, setTypeOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const generateTimeSlots = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 || i === 12 ? 12 : i % 12;
      const period = i < 12 ? 'AM' : 'PM';
      times.push(`${hour}:00 ${period}`);
      times.push(`${hour}:30 ${period}`);
    }
    return times;
  };
  const timeSlots = generateTimeSlots();
  const eventTypes = ['Wedding', 'Corporate', 'Social', 'Tasting', 'Kitchen'];

  useEffect(() => {
    if (eventToEdit) {
      setFormData(eventToEdit);
    } else {
      setFormData({ title: '', type: 'Wedding', time: '', guests: '', location: 'Grand Ballroom' });
    }
  }, [eventToEdit, isOpen]);

  const inputBase = `w-full bg-transparent border-b ${theme.border} py-3 pl-0 text-sm ${theme.text} placeholder-stone-400 focus:outline-none focus:border-[#C9A25D] transition-colors`;
  const dropdownContainer = `absolute top-full left-0 w-full mt-1 p-2 shadow-xl rounded-sm z-50 transition-all duration-300 origin-top border ${theme.border} ${theme.cardBg} max-h-48 overflow-y-auto no-scrollbar`;

  const handleSubmit = () => {
    onSave({ ...formData, id: eventToEdit ? eventToEdit.id : Date.now() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col`}>
        <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
          <h3 className={`font-serif text-xl ${theme.text}`}>{eventToEdit ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div><input type="text" placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputBase} /></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
               <button type="button" onClick={() => setTypeOpen(!typeOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                  <span className={formData.type ? theme.text : "text-stone-400"}>{formData.type || "Type"}</span>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${typeOpen ? 'rotate-180' : ''}`} />
               </button>
               <div className={`${dropdownContainer} ${typeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                  <div className="flex flex-col gap-1">{eventTypes.map(t => (<div key={t} onClick={() => { setFormData({...formData, type: t}); setTypeOpen(false); }} className={`text-xs p-2 hover:bg-[#C9A25D] hover:text-white cursor-pointer transition-colors rounded-sm ${theme.text}`}>{t}</div>))}</div>
               </div>
            </div>
            <div className="relative">
               <button type="button" onClick={() => setTimeOpen(!timeOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                  <div className="flex items-center gap-2"><Clock size={14} className="text-stone-400"/><span className={formData.time ? theme.text : "text-stone-400"}>{formData.time || "Time"}</span></div>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${timeOpen ? 'rotate-180' : ''}`} />
               </button>
               <div className={`${dropdownContainer} ${timeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                  <div className="grid grid-cols-1 gap-1">{timeSlots.map(t => (<div key={t} onClick={() => { setFormData({...formData, time: t}); setTimeOpen(false); }} className={`text-xs p-2 hover:bg-[#C9A25D] hover:text-white cursor-pointer transition-colors rounded-sm ${theme.text} text-center`}>{t}</div>))}</div>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative"><div className={`flex items-center border-b ${theme.border}`}><Users size={14} className="text-stone-400 mr-2" /><input type="number" placeholder="Guests" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className={`w-full bg-transparent py-3 text-sm ${theme.text} placeholder-stone-400 focus:outline-none no-spinner`} /></div></div>
            <div className="relative"><div className={`flex items-center border-b ${theme.border}`}><MapPin size={14} className="text-stone-400 mr-2" /><input type="text" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`w-full bg-transparent py-3 text-sm ${theme.text} placeholder-stone-400 focus:outline-none`} /></div></div>
          </div>
        </div>
        <div className={`p-6 border-t ${theme.border} flex justify-end gap-3`}>
          {eventToEdit && (<button className="px-4 py-2 text-red-500 text-xs uppercase tracking-wider border border-red-200 hover:bg-red-50 transition-colors mr-auto flex items-center gap-2"><Trash2 size={14}/> Delete</button>)}
          <button onClick={handleSubmit} className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm flex items-center gap-2"><Save size={14}/> Save</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN CALENDAR PAGE ---
const CalendarPage = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Calendar');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // NEW: View Event Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const MAX_EVENTS = 4;
  const [blockedDates, setBlockedDates] = useState([
    new Date(2025, 11, 25).toDateString(), 
    new Date(2025, 0, 1).toDateString()    
  ]);

  const [events, setEvents] = useState([]);

  // FETCH DATA
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/calendar/events');
      const dbEvents = response.data.map(ev => ({
        ...ev,
        date: new Date(ev.date) 
      }));
      setEvents(dbEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500); 
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Theme Logic
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
    pastText: darkMode ? 'text-stone-700' : 'text-stone-300',
  };

  const getEventsForDay = (date) => events.filter(e => e.date.toDateString() === date.toDateString());
  const isDateBlocked = (date) => blockedDates.includes(date.toDateString());
  const isDateFull = (date) => getEventsForDay(date).length >= MAX_EVENTS;

  const toggleBlockDate = () => {
    const dateStr = selectedDate.toDateString();
    if (blockedDates.includes(dateStr)) {
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setBlockedDates(prev => [...prev, dateStr]);
    }
  };

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === eventData.id ? { ...e, ...eventData, date: selectedDate } : e));
    } else {
      if (isDateBlocked(selectedDate) || isDateFull(selectedDate)) return;
      setEvents(prev => [...prev, { ...eventData, date: selectedDate }]);
    }
  };

  const handleViewEvent = (id) => {
    setSelectedEventId(id);
    setViewModalOpen(true);
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0); 
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`h-24 md:h-32 border-b border-r ${theme.border} ${darkMode ? 'bg-black/20' : 'bg-stone-50/50'}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayEvents = getEventsForDay(dateObj);
      const isToday = today.toDateString() === dateObj.toDateString();
      const isSelected = selectedDate.toDateString() === dateObj.toDateString();
      const isPast = dateObj < today;
      const isBlocked = isDateBlocked(dateObj);
      const isFull = dayEvents.length >= MAX_EVENTS;

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(dateObj)}
          className={`
            relative h-24 md:h-32 border-b border-r ${theme.border} p-2 cursor-pointer transition-colors duration-300
            ${isSelected ? (darkMode ? 'bg-stone-800' : 'bg-white ring-2 ring-inset ring-[#C9A25D]') : ''}
            ${!isSelected && isBlocked ? (darkMode ? 'bg-stripes-dark opacity-50' : 'bg-stone-100 opacity-80') : ''}
            ${!isSelected && isFull && !isBlocked ? 'bg-red-50/5 dark:bg-red-900/10' : ''}
            ${!isSelected && !isPast && !isBlocked ? theme.hoverBg : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-serif w-7 h-7 flex items-center justify-center rounded-full
              ${isToday ? 'bg-[#C9A25D] text-white shadow-md' : ''}
              ${!isToday && isPast ? theme.pastText : theme.text}
              ${isBlocked ? 'text-stone-400' : ''}
            `}>
              {day}
            </span>
            <div className="flex gap-1">
              {isBlocked && <Lock size={12} className="text-stone-400" />}
              {!isBlocked && dayEvents.length > 0 && (
                 <span className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-[#C9A25D]'} ${isPast ? 'opacity-30' : ''}`}>
                   {dayEvents.length}/{MAX_EVENTS}
                 </span>
              )}
            </div>
          </div>

          <div className={`mt-2 space-y-1 ${isPast ? 'opacity-30 grayscale' : ''}`}>
             {isBlocked ? (
               <div className="text-[10px] uppercase tracking-widest text-center mt-4 text-stone-500 font-bold">Blocked</div>
             ) : (
                dayEvents.slice(0, 3).map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${ev.type === 'Wedding' ? 'bg-[#C9A25D]' : ev.type === 'Kitchen' ? 'bg-red-400' : ev.type === 'Tasting' ? 'bg-blue-400' : 'bg-stone-400'}`}></div>
                    <span className={`text-[9px] truncate w-full ${theme.subText} hidden md:block`}>{ev.title}</span>
                  </div>
                ))
             )}
          </div>
        </div>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const selectedIsBlocked = isDateBlocked(selectedDate);
  const selectedIsFull = isDateFull(selectedDate);
  const selectedEventCount = getEventsForDay(selectedDate).length;

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-spinner::-webkit-outer-spin-button, .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .bg-stripes-dark { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #1c1c1c 10px, #1c1c1c 20px); }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #57534e; border-radius: 2px; }
        `}
      </style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Events Calendar" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar relative">
          
          {isLoading ? (
            // --- LOADING BUFFER ---
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
               <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
               <p className="text-xs uppercase tracking-widest">Loading Events...</p>
            </div>
          ) : (
            // --- CALENDAR CONTENT ---
            <FadeIn>
              <div className="flex flex-col lg:flex-row gap-8 h-full">
                
                {/* --- LEFT: Calendar Grid --- */}
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
                        <button onClick={() => changeMonth(-1)} className={`p-2 hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}><ChevronLeft size={18} strokeWidth={1} /></button>
                        <div className={`w-[1px] ${theme.border}`}></div>
                        <button onClick={() => changeMonth(1)} className={`p-2 hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}><ChevronRight size={18} strokeWidth={1} /></button>
                      </div>
                    </div>
                  </div>

                  <div className={`border-t border-l ${theme.border} ${theme.cardBg}`}>
                    <div className="grid grid-cols-7">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className={`py-3 text-center text-[10px] tracking-[0.2em] border-b border-r ${theme.border} ${darkMode ? 'bg-[#141414] text-stone-500' : 'bg-stone-50 text-stone-500'}`}>{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">{renderCalendarGrid()}</div>
                  </div>
                </div>

                {/* --- RIGHT: Agenda / Details Panel --- */}
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className={`h-full border ${theme.border} ${theme.cardBg} p-6 flex flex-col`}>
                    
                    <div className="mb-6">
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Selected Date</span>
                      <h3 className="font-serif text-3xl mt-2">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedIsBlocked && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-stone-200 dark:bg-stone-800 text-stone-500 rounded-sm flex items-center gap-1">
                            <Lock size={10} /> Holiday / Blocked
                          </span>
                        )}
                        {!selectedIsBlocked && selectedIsFull && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-sm flex items-center gap-1">
                            <Ban size={10} /> Fully Booked
                          </span>
                        )}
                        {!selectedIsBlocked && !selectedIsFull && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[#C9A25D]/10 text-[#C9A25D] rounded-sm">
                            {selectedEventCount} / {MAX_EVENTS} Slots Used
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <button 
                        onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
                        disabled={selectedIsBlocked || selectedIsFull}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] uppercase tracking-widest transition-colors
                          ${selectedIsBlocked || selectedIsFull 
                            ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed' 
                            : 'bg-[#1c1c1c] text-white hover:bg-[#C9A25D]'}
                        `}
                      >
                        <Plus size={14} /> Add Event
                      </button>

                      <button 
                        onClick={toggleBlockDate}
                        className={`
                          px-3 py-3 border ${theme.border} transition-colors
                          ${selectedIsBlocked 
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-600 hover:bg-stone-300' 
                            : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-400 hover:text-red-500'}
                        `}
                        title={selectedIsBlocked ? "Unblock Date" : "Block Date"}
                      >
                        {selectedIsBlocked ? <Lock size={16} /> : <Ban size={16} />}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                      {selectedIsBlocked ? (
                        <div className="h-40 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800">
                          <Lock size={24} className="mb-2 opacity-50"/>
                          <span className="font-serif italic text-lg">Date Locked</span>
                          <span className="text-[10px] uppercase tracking-wider mt-1">No events allowed</span>
                        </div>
                      ) : getEventsForDay(selectedDate).length > 0 ? (
                        getEventsForDay(selectedDate).map((event) => (
                          <div 
                            key={event.id} 
                            onClick={() => handleViewEvent(event.id)} 
                            className={`p-4 border ${theme.border} hover:border-[#C9A25D]/50 transition-all group relative cursor-pointer`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${event.type === 'Wedding' ? 'text-[#C9A25D] border-[#C9A25D]/30' : 'text-stone-400 border-stone-400/30'}`}>{event.type}</span>
                              <button onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsModalOpen(true); }} className="text-stone-400 hover:text-[#C9A25D] p-1"><MoreHorizontal size={14} /></button>
                            </div>
                            <h4 className="font-serif text-lg leading-tight mb-3 group-hover:text-[#C9A25D] transition-colors">{event.title}</h4>
                            <div className="space-y-2">
                              <div className={`flex items-center gap-2 text-xs ${theme.subText}`}><Clock size={12} /> {event.time}</div>
                              {event.guests > 0 && (<div className={`flex items-center gap-2 text-xs ${theme.subText}`}><Users size={12} /> {event.guests} Guests</div>)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800">
                          <span className="font-serif italic text-lg">No events</span>
                          <span className="text-[10px] uppercase tracking-wider mt-1">Schedule Open</span>
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

      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} eventToEdit={editingEvent} theme={theme} />
      
      {/* NEW: VIEW EVENT MODAL RENDER */}
      <ViewEventModal 
          isOpen={viewModalOpen} 
          onClose={() => setViewModalOpen(false)} 
          eventId={selectedEventId} 
          theme={theme} 
       />
    </div>
  );
};

export default CalendarPage;