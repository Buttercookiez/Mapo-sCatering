// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CheckSquare, AlertCircle, DollarSign, ArrowUpRight, Loader2
} from 'lucide-react';

// Import Hooks
import { useCalendar } from '../../hooks/useCalendar';

// Import Layout Components
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- Shared Animation Component ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Dashboard = () => {
  // --- 1. Theme & Layout State ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState("");

  // --- 2. Calendar Data Integration ---
  const { events, loading: calendarLoading } = useCalendar();

  // Handle Theme Side Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    sidebarBg: darkMode ? 'bg-[#111]' : 'bg-white',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    accent: 'text-[#C9A25D]',
    hoverBg: darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100',
    rowHover: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
  };

  // --- 3. Process Events (Filter Future & Search) ---
  const getProcessedEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // 1. Filter: Only future/today events, Not Cancelled
    let upcoming = events.filter(e => {
        const eventDate = e.dateObj || new Date(e.date); // Handle both formats if necessary
        const isNotCancelled = e.status !== 'Cancelled' && e.status !== 'Rejected';
        return eventDate >= today && isNotCancelled;
    });

    // 2. Sort: Closest date first
    upcoming.sort((a, b) => (a.dateObj || new Date(a.date)) - (b.dateObj || new Date(b.date)));

    // 3. Search Filter
    if (searchQuery) {
        upcoming = upcoming.filter(event => 
            event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || // Client Name/Title
            event.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // 4. Limit to top 5 for dashboard
    return upcoming.slice(0, 5);
  };

  const dashboardEvents = getProcessedEvents();

  // Helper for Date Display (e.g., "24 OCT")
  const formatDateDisplay = (dateObj) => {
    if (!dateObj) return { day: '--', month: '---' };
    const d = new Date(dateObj);
    return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleString('default', { month: 'short' }).toUpperCase()
    };
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}>
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Navbar */}
        <DashboardNavbar 
          activeTab={activeTab}
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth no-scrollbar">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Revenue', value: '₱124,500', trend: '+12%', icon: DollarSign },
              { label: 'Active Events', value: events.length.toString().padStart(2, '0'), trend: 'Total Booked', icon: Calendar },
              { label: 'Pending Inquiries', value: '14', trend: 'Needs Action', icon: CheckSquare },
              { label: 'Inventory Alert', value: '03', trend: 'Low Stock', icon: AlertCircle },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-8 border ${theme.border} ${theme.cardBg} group hover:border-[#C9A25D]/30 transition-colors duration-500 h-full flex flex-col justify-between`}>
                   <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                      <stat.icon size={18} strokeWidth={1} className="text-[#C9A25D]" />
                   </div>
                   <div>
                      <h3 className="font-serif text-4xl md:text-5xl font-light mb-2">{stat.value}</h3>
                      <span className="text-xs font-medium text-stone-400 flex items-center gap-1">
                         {idx === 3 ? <span className="text-red-400">{stat.trend}</span> : stat.trend}
                         {idx === 0 && <ArrowUpRight size={12} />}
                      </span>
                   </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Upcoming Schedule (Dynamic Data) */}
            <div className="lg:col-span-2">
              <FadeIn delay={400}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full min-h-[400px] flex flex-col`}>
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="font-serif text-2xl italic">Upcoming Schedule</h3>
                    <button className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText} hover:text-[#C9A25D] border-b border-transparent hover:border-[#C9A25D] pb-1 transition-all`}>View Calendar</button>
                  </div>

                  <div className="space-y-2 flex-1">
                    {calendarLoading ? (
                       <div className="h-full flex flex-col items-center justify-center text-stone-400 min-h-[200px]">
                          <Loader2 size={24} className="animate-spin mb-2 text-[#C9A25D]" />
                          <span className="text-xs uppercase tracking-widest">Loading Schedule...</span>
                       </div>
                    ) : dashboardEvents.length > 0 ? (
                      dashboardEvents.map((event) => {
                        const { day, month } = formatDateDisplay(event.dateObj);
                        return (
                          <div 
                            key={event.id} 
                            className={`flex items-center justify-between p-4 border-b ${theme.border} last:border-0 group ${theme.rowHover} transition-colors rounded-sm`}
                          >
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                 <span className="text-xs font-bold uppercase tracking-widest text-[#C9A25D]">{month}</span>
                                 <span className="font-serif text-2xl leading-none">{day}</span>
                              </div>
                              <div>
                                <h4 className={`font-serif text-lg ${theme.text} group-hover:text-[#C9A25D] transition-colors line-clamp-1`}>
                                    {event.title}
                                </h4>
                                <div className={`flex gap-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'} mt-1 uppercase tracking-wide`}>
                                  <span className="truncate max-w-[120px]">{event.type}</span>
                                  <span>•</span>
                                  {/* Assuming 'guests' is part of event object, if not stored in basic event, might need logic */}
                                  <span>{event.time || "All Day"}</span> 
                                </div>
                              </div>
                            </div>
                            <div className={`hidden sm:block px-3 py-1 text-[10px] uppercase tracking-[0.2em] border ${theme.border} rounded-full whitespace-nowrap
                                ${event.status === 'Confirmed' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' : 
                                  event.status === 'Pending' ? 'text-orange-500 border-orange-500/30' :
                                  'text-[#C9A25D] border-[#C9A25D]/30'}`}>
                               {event.status}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 min-h-[200px] border border-dashed border-stone-200 dark:border-stone-800">
                        <span className="text-sm italic">No upcoming events found.</span>
                        {searchQuery && <span className="text-xs mt-1">Try clearing your search.</span>}
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Inventory Watch (Static for now) */}
            <div className="lg:col-span-1">
              <FadeIn delay={500}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full`}>
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="font-serif text-2xl italic">Inventory Watch</h3>
                    <AlertCircle size={18} strokeWidth={1} className="text-red-400" />
                  </div>

                  <div className="space-y-8">
                    {[
                      { item: 'White Truffle Oil', level: 15, color: 'bg-red-400' },
                      { item: 'Gold Leaf Sheets', level: 30, color: 'bg-[#C9A25D]' },
                      { item: 'Basmati Rice (25kg)', level: 45, color: 'bg-stone-400' },
                    ].map((stock, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs uppercase tracking-widest mb-2">
                          <span>{stock.item}</span>
                          <span className={stock.level < 20 ? 'text-red-400' : theme.subText}>{stock.level}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-stone-800' : 'bg-stone-100'}`}>
                          <div 
                            className={`h-full rounded-full ${stock.color}`} 
                            style={{ width: `${stock.level}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className={`mt-12 w-full py-4 border ${theme.border} text-[10px] uppercase tracking-[0.25em] hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] transition-colors duration-300`}>
                    Generate Order List
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Financial Visualization */}
          <FadeIn delay={600}>
            <div className={`border ${theme.border} ${theme.cardBg} p-8 md:p-12`}>
               <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
                  <div>
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText} block mb-2`}>Performance</span>
                    <h3 className="font-serif text-3xl italic">Profit & Expenses</h3>
                  </div>
                  <div className="flex gap-6">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#C9A25D]"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Revenue</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-stone-300"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Cost</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-end justify-between h-64 w-full gap-2 md:gap-4">
                  {[65, 40, 80, 55, 90, 70, 85].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer">
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-stone-900 text-white px-2 py-1 rounded">
                          ${val}k
                       </div>
                       <div style={{ height: `${val}%` }} className="w-full bg-[#C9A25D] opacity-80 group-hover:opacity-100 transition-all duration-500 relative">
                          <div style={{ height: '40%' }} className="absolute bottom-0 left-0 w-full bg-stone-300 dark:bg-stone-700/50"></div>
                       </div>
                       <span className={`text-[10px] text-center mt-4 uppercase tracking-widest ${theme.subText}`}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;