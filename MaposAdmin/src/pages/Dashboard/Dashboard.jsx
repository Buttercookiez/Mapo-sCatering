import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, CheckSquare, AlertCircle, DollarSign, ArrowUpRight, Loader2, PieChart
} from 'lucide-react';

// Import Hooks
import { useCalendar } from '../../hooks/useCalendar';
import { useBookings } from '../../hooks/useBooking';
import { useInventory } from '../../hooks/useInventory';

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

// --- ANIMATED DONUT CHART COMPONENT ---
const AssetDonutChart = ({ data, size = 160, strokeWidth = 20, theme }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercent = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-stone-400">
        <PieChart className="mb-2 opacity-20" size={40} />
        No Asset Data
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* SVG CHART */}
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeLength = percent * circumference;
            
            // Calculate starting rotation for this segment
            const strokeDashoffset = -cumulativePercent * circumference;
            
            // Determine dasharray:
            // 1. First value is the length of the visible stroke.
            // 2. Second value is the gap (circumference) to hide the rest.
            // If !isLoaded, length is 0 (invisible).
            const strokeDasharray = `${isLoaded ? strokeLength : 0} ${circumference}`;
            
            cumulativePercent += percent;

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth} // Expand on hover
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt" // 'butt' allows sharp edges for exact pie slices
                className="transition-all duration-[1500ms] ease-out cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1 // Dim others on hover
                }}
              />
            );
          })}
          
          {/* Inner Circle Background (Hole) */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius - strokeWidth / 2 - 2} 
            fill="transparent" 
          />
        </svg>

        {/* Center Text (Total Items) - Optional cosmetic addition */}
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ pointerEvents: 'none' }}
        >
          <span className={`text-3xl font-serif ${theme.text}`}>{total}</span>
          <span className={`text-[8px] uppercase tracking-widest ${theme.subText}`}>Items</span>
        </div>
      </div>
      
      {/* ANIMATED LEGEND */}
      <div className="mt-8 w-full space-y-3 px-2">
        {data.map((item, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between text-xs uppercase tracking-widest transition-all duration-700 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${800 + (i * 100)}ms` }} // Staggered delay
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
             <div className="flex items-center gap-3">
                <span 
                  className={`w-2 h-2 rounded-full transition-transform duration-300 ${hoveredIndex === i ? 'scale-150' : ''}`} 
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className={`${theme.subText} ${hoveredIndex === i ? theme.text : ''} transition-colors`}>{item.label}</span>
             </div>
             <span className={`font-bold ${theme.text}`}>{item.value}</span>
          </div>
        ))}
      </div>
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

  // --- 2. Data Integration ---
  const { events, loading: calendarLoading } = useCalendar();
  const { bookings, totalRevenue, isLoading: bookingsLoading } = useBookings();
  const { inventoryData, logsData, loading: inventoryLoading } = useInventory();

  // --- 3. Calculate Inventory Stats (Memoized) ---
  const inventoryStats = useMemo(() => {
    if (!inventoryData) return [];

    const inUse = inventoryData.reduce((acc, item) => acc + (item.stock?.quantityInUse || 0), 0);
    const totalOwned = inventoryData.reduce((acc, item) => acc + (item.stock?.quantityTotal || 0), 0);
    const available = totalOwned - inUse;
    const lost = logsData ? logsData.reduce((acc, log) => acc + (log.quantityLost || 0), 0) : 0;

    return [
      { label: 'Available', value: available, color: darkMode ? '#44403c' : '#d6d3d1' }, // Stone-700 / Stone-300
      { label: 'Checked Out', value: inUse, color: '#C9A25D' }, // Gold
      { label: 'Lost / Damaged', value: lost, color: '#ef4444' }, // Red-500
    ];
  }, [inventoryData, logsData, darkMode]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  // --- Process Events ---
  const getProcessedEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    let upcoming = events.filter(e => {
        const eventDate = e.dateObj || new Date(e.date); 
        return eventDate >= today && e.status !== 'Cancelled' && e.status !== 'Rejected';
    });
    upcoming.sort((a, b) => (a.dateObj || new Date(a.date)) - (b.dateObj || new Date(b.date)));
    if (searchQuery) {
        upcoming = upcoming.filter(event => event.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return upcoming.slice(0, 5);
  };
  const dashboardEvents = getProcessedEvents();

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
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab={activeTab} theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth no-scrollbar">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Revenue', value: bookingsLoading ? <Loader2 className="animate-spin text-[#C9A25D]"/> : formatCurrency(totalRevenue), trend: '+12%', icon: DollarSign },
              { label: 'Active Events', value: calendarLoading ? <Loader2 className="animate-spin text-[#C9A25D]"/> : events.length.toString().padStart(2, '0'), trend: 'Total Booked', icon: Calendar },
              { label: 'Pending Inquiries', value: bookingsLoading ? <Loader2 className="animate-spin text-[#C9A25D]"/> : bookings.filter(b => b.status === 'Pending').length.toString().padStart(2, '0'), trend: 'Needs Action', icon: CheckSquare },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-8 border ${theme.border} ${theme.cardBg} group hover:border-[#C9A25D]/30 transition-colors duration-500 h-full flex flex-col justify-between`}>
                   <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                      <stat.icon size={18} strokeWidth={1} className="text-[#C9A25D]" />
                   </div>
                   <div>
                      <div className="min-h-[48px] flex items-center mb-2">
                        {typeof stat.value === 'string' ? <h3 className="font-serif text-4xl md:text-5xl font-light">{stat.value}</h3> : stat.value}
                      </div>
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
            
            {/* Upcoming Schedule */}
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
                          <div key={event.id} className={`flex items-center justify-between p-4 border-b ${theme.border} last:border-0 group ${theme.rowHover} transition-colors rounded-sm`}>
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                 <span className="text-xs font-bold uppercase tracking-widest text-[#C9A25D]">{month}</span>
                                 <span className="font-serif text-2xl leading-none">{day}</span>
                              </div>
                              <div>
                                <h4 className={`font-serif text-lg ${theme.text} group-hover:text-[#C9A25D] transition-colors line-clamp-1`}>{event.title}</h4>
                                <div className={`flex gap-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'} mt-1 uppercase tracking-wide`}>
                                  <span className="truncate max-w-[120px]">{event.type}</span>
                                  <span>•</span>
                                  <span>{event.time || "All Day"}</span> 
                                </div>
                              </div>
                            </div>
                            <div className={`hidden sm:block px-3 py-1 text-[10px] uppercase tracking-[0.2em] border ${theme.border} rounded-full whitespace-nowrap ${event.status === 'Confirmed' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' : event.status === 'Pending' ? 'text-orange-500 border-orange-500/30' : 'text-[#C9A25D] border-[#C9A25D]/30'}`}>{event.status}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 min-h-[200px] border border-dashed border-stone-200 dark:border-stone-800">
                        <span className="text-sm italic">No upcoming events found.</span>
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Inventory Activity Pie Chart */}
            <div className="lg:col-span-1">
              <FadeIn delay={500}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full`}>
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="font-serif text-2xl italic">Asset Activity</h3>
                    <AlertCircle size={18} strokeWidth={1} className={theme.subText} />
                  </div>

                  {/* Chart Container */}
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    {inventoryLoading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#C9A25D] mb-2" size={32}/>
                        <span className="text-[10px] uppercase tracking-widest text-stone-500">Syncing Assets...</span>
                      </div>
                    ) : (
                      <AssetDonutChart data={inventoryStats} theme={theme} size={200} strokeWidth={25} />
                    )}
                  </div>

                  <button className={`mt-8 w-full py-4 border ${theme.border} text-[10px] uppercase tracking-[0.25em] hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] transition-colors duration-300`}>
                    View Full Inventory
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
                     <div className="flex items-center gap-2"><span className="w-2 h-2 bg-[#C9A25D]"></span><span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Revenue</span></div>
                     <div className="flex items-center gap-2"><span className="w-2 h-2 bg-stone-300"></span><span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Cost</span></div>
                  </div>
               </div>
               <div className="flex items-end justify-between h-64 w-full gap-2 md:gap-4">
                  {[65, 40, 80, 55, 90, 70, 85].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer">
                       <div style={{ height: `${val}%` }} className="w-full bg-[#C9A25D] opacity-80 group-hover:opacity-100 transition-all duration-500 relative">
                          <div style={{ height: '40%' }} className="absolute bottom-0 left-0 w-full bg-stone-300 dark:bg-stone-700/50"></div>
                       </div>
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