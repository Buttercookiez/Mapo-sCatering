// src/pages/Finance/Financials.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DollarSign, Download, 
  Trash2, Wallet, Coins, CalendarRange, 
  BarChart3, ChevronLeft, ChevronRight, PieChart
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

import { useInventory } from '../../hooks/useInventory';
import { useBookings } from '../../hooks/useBooking';

// --- Animation Component ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Financials = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Finance');
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- Forecast Filter State ---
  const [forecastFilter, setForecastFilter] = useState('Month'); // 'Day', 'Week', 'Month'
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { inventoryData, logsData } = useInventory();
  const { bookings, isLoading: bookingsLoading } = useBookings();

  // --- THEME ---
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
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    hoverBg: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
  };

  // --- DATE NAVIGATION HANDLERS ---
  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (forecastFilter === 'Month') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (forecastFilter === 'Month') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // ==========================================
  // 1. BUSINESS INTELLIGENCE LOGIC
  // ==========================================

  // A. Inventory Loss Calculation
  const realWasteValue = useMemo(() => {
    if (!logsData || !inventoryData) return 0;
    return logsData.reduce((total, log) => {
      if (log.quantityLost > 0) {
        const item = inventoryData.find(i => i.id === log.itemId);
        const price = item ? (item.price || 0) : 0;
        return total + (log.quantityLost * price);
      }
      return total;
    }, 0);
  }, [logsData, inventoryData]);

  // B. Financial Data Aggregation
  const analytics = useMemo(() => {
    if (!bookings) return { 
        records: [], 
        forecastChartData: [], 
        categoryStats: {}, 
        totals: { contract: 0, collected: 0, receivables: 0, expenses: 0, profit: 0, pax: 0 } 
    };

    const records = [];
    const categoryStats = {};   
    let totalPax = 0;

    // --- PREPARE CHART BUCKETS ---
    let chartBuckets = [];
    const viewYear = selectedDate.getFullYear();
    const viewMonth = selectedDate.getMonth(); 

    // Helper to create bucket
    const createBucket = (label, sortKey) => ({ 
        label, 
        sortKey, 
        receivable: 0, 
        revenue: 0, 
        profit: 0 
    });

    if (forecastFilter === 'Month') {
        for (let i = 0; i < 12; i++) {
            const label = new Date(viewYear, i, 1).toLocaleString('default', { month: 'short' });
            chartBuckets.push(createBucket(label, i));
        }
    } else if (forecastFilter === 'Day') {
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            chartBuckets.push(createBucket(`${i}`, i));
        }
    } else if (forecastFilter === 'Week') {
        for (let i = 1; i <= 5; i++) {
            chartBuckets.push(createBucket(`Week ${i}`, i));
        }
    }

    const activeBookings = bookings.filter(b => 
        b.status !== "Cancelled" && b.status !== "Rejected"
    );

    activeBookings.forEach(b => {
        // Core Financials
        const contractPrice = b.billing?.totalCost || 0;
        const collected = b.billing?.amountPaid || 0;
        const balance = b.billing?.remainingBalance !== undefined 
            ? b.billing.remainingBalance 
            : (contractPrice - collected);
        
        const opsCost = b.billing?.operationalCost || 0;
        const netProfit = contractPrice - opsCost;
        
        const hasOpsData = opsCost > 0;
        const margin = (hasOpsData && contractPrice > 0) 
            ? ((netProfit / contractPrice) * 100).toFixed(1)
            : null;

        // Chart Logic
        const eventDate = new Date(b.dateOfEvent);
        
        if (!isNaN(eventDate)) {
            const eventYear = eventDate.getFullYear();
            const eventMonth = eventDate.getMonth();
            const eventDay = eventDate.getDate();
            
            // Logic to determine which bucket this booking belongs to
            let bucketIndex = -1;

            if (forecastFilter === 'Month') {
                if (eventYear === viewYear) bucketIndex = eventMonth;
            } else {
                if (eventYear === viewYear && eventMonth === viewMonth) {
                    if (forecastFilter === 'Day') {
                        bucketIndex = eventDay - 1;
                    } else if (forecastFilter === 'Week') {
                        const weekNum = Math.ceil(eventDay / 7); 
                        bucketIndex = Math.min(weekNum, 5) - 1; 
                    }
                }
            }

            // Add to bucket if valid
            if (bucketIndex >= 0 && chartBuckets[bucketIndex]) {
                chartBuckets[bucketIndex].revenue += contractPrice;
                chartBuckets[bucketIndex].profit += netProfit;
                if (balance > 0) {
                    chartBuckets[bucketIndex].receivable += balance;
                }
            }
        }

        // Category Stats & Totals Logic
        const type = b.eventType || "Other";
        if (!categoryStats[type]) categoryStats[type] = { count: 0, revenue: 0 };
        categoryStats[type].count += 1;
        categoryStats[type].revenue += contractPrice;

        totalPax += parseInt(b.estimatedGuests || 0);

        records.push({
            id: b.refId,
            client: b.fullName,
            event: type,
            date: b.dateOfEvent,
            dateObj: eventDate,
            contractPrice,
            collected,
            balance,
            opsCost,   
            netProfit, 
            margin,
            hasOpsData,
            status: b.status
        });
    });

    records.sort((a, b) => a.dateObj - b.dateObj);

    return {
        records,
        forecastChartData: chartBuckets,
        categoryStats,
        totals: {
            contract: records.reduce((acc, r) => acc + r.contractPrice, 0),
            collected: records.reduce((acc, r) => acc + r.collected, 0),
            receivables: records.reduce((acc, r) => acc + r.balance, 0),
            expenses: records.reduce((acc, r) => acc + r.opsCost, 0),
            profit: records.reduce((acc, r) => acc + r.netProfit, 0),
            pax: totalPax
        }
    };
  }, [bookings, forecastFilter, selectedDate]);

  const { totals, forecastChartData, categoryStats } = analytics;
  
  const topCategory = Object.keys(categoryStats).reduce((a, b) => 
    (categoryStats[a]?.revenue > categoryStats[b]?.revenue ? a : b), "N/A"
  );
  
  const globalMargin = totals.contract > 0 ? ((totals.profit / totals.contract) * 100).toFixed(0) : 0;

  const getDisplayDate = () => {
    if (forecastFilter === 'Month') return selectedDate.getFullYear();
    return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}>
      {/* --- CUSTOM SCROLLBAR STYLES --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2a2a2a; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C9A25D; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b08d55; 
        }
      `}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Financial Intelligence" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="font-serif text-3xl italic">Financial Intelligence</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>Profitability, Forecasts & Asset Analysis</p>
            </div>
            <div className="flex gap-3">
              <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] transition-colors bg-transparent`}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             {/* Scorecards */}
            <FadeIn delay={0}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} h-32 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors`}>
                    <div className="flex justify-between items-start"><span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Liquidity</span><Wallet size={16} className="text-emerald-500" /></div>
                    <div><h3 className="font-serif text-3xl">₱{totals.collected.toLocaleString()}</h3><span className="text-[10px] text-emerald-500 font-medium">Cash Collected</span></div>
                </div>
            </FadeIn>
            <FadeIn delay={100}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} h-32 flex flex-col justify-between group hover:border-[#C9A25D]/30 transition-colors`}>
                    <div className="flex justify-between items-start"><span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Pipeline</span><Coins size={16} className="text-[#C9A25D]" /></div>
                    <div><h3 className="font-serif text-3xl">₱{totals.receivables.toLocaleString()}</h3><span className="text-[10px] text-[#C9A25D] font-medium">Accounts Receivable</span></div>
                </div>
            </FadeIn>
            <FadeIn delay={200}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} h-32 flex flex-col justify-between group hover:border-blue-400/30 transition-colors`}>
                    <div className="flex justify-between items-start"><span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Profitability</span><BarChart3 size={16} className="text-blue-400" /></div>
                    <div><h3 className="font-serif text-3xl">₱{totals.profit.toLocaleString()}</h3><div className="flex items-center gap-2"><span className="text-[10px] text-blue-400 font-medium">Net Profit</span><span className={`text-[9px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 border border-blue-400/20`}>{globalMargin}% Margin</span></div></div>
                </div>
            </FadeIn>
            <FadeIn delay={300}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} h-32 flex flex-col justify-between group hover:border-rose-500/30 transition-colors`}>
                    <div className="flex justify-between items-start"><span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>Leakage</span><Trash2 size={16} className="text-rose-500" /></div>
                    <div><h3 className="font-serif text-3xl">₱{realWasteValue.toLocaleString()}</h3><span className="text-[10px] text-rose-500 font-medium">Inventory Loss</span></div>
                </div>
            </FadeIn>
          </div>

          {/* --- CHARTS SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* CASH FLOW & REVENUE FORECAST CHART */}
            <div className="lg:col-span-2">
              <FadeIn delay={400}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full min-h-[350px] flex flex-col`}>
                  
                  {/* CHART HEADER */}
                  <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                    <div>
                        <h3 className="font-serif text-2xl italic">Financial Forecast</h3>
                        <p className={`text-[10px] uppercase tracking-wider ${theme.subText} mt-1`}>
                            Revenue, Profit & Cash Flow for <span className="text-[#C9A25D] font-bold">{getDisplayDate()}</span>
                        </p>
                        
                        {/* LEGEND */}
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600"></div>
                                <span className={`text-[10px] uppercase tracking-wider ${theme.subText}`}>Revenue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span className={`text-[10px] uppercase tracking-wider ${theme.subText}`}>Net Profit</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#C9A25D]"></div>
                                <span className={`text-[10px] uppercase tracking-wider ${theme.subText}`}>Receivable</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                        {/* Date Navigation */}
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrev} className="p-1 text-stone-400 hover:text-white transition-colors bg-stone-800/50 rounded hover:bg-stone-700">
                                <ChevronLeft size={14}/>
                            </button>
                            <div className="px-3 text-[10px] font-bold uppercase min-w-[80px] text-center text-stone-300 tracking-wider">
                                {getDisplayDate()}
                            </div>
                            <button onClick={handleNext} className="p-1 text-stone-400 hover:text-white transition-colors bg-stone-800/50 rounded hover:bg-stone-700">
                                <ChevronRight size={14}/>
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className={`flex bg-stone-200 dark:bg-stone-800 p-1 rounded-sm`}>
                            {['Day', 'Week', 'Month'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setForecastFilter(filter)}
                                    className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all ${
                                        forecastFilter === filter 
                                        ? 'bg-white dark:bg-[#1c1c1c] text-[#C9A25D] shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>
                  
                  {/* CHART VISUALIZATION */}
                  <div className="flex-1 flex items-end gap-2 w-full px-2 overflow-x-auto pb-2 custom-scrollbar">
                     {forecastChartData.every(i => i.revenue === 0) ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-stone-500">
                            <CalendarRange size={32} className="mb-2 opacity-20" />
                            <span className="text-xs">No financial activity for this period.</span>
                         </div>
                     ) : (
                         forecastChartData.map((item, i) => {
                           // Scale everything relative to the highest Revenue in the set
                           const maxVal = Math.max(...forecastChartData.map(m => m.revenue)) || 1;
                           
                           // Calculate heights percentages
                           const hRev = (item.revenue / maxVal) * 100;
                           const hProf = (item.profit / maxVal) * 100;
                           const hRec = (item.receivable / maxVal) * 100;
                           
                           // Avoid division by zero for margin
                           const marginPct = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0;
                           
                           return (
                             <div key={i} className="flex-1 min-w-[40px] flex flex-col justify-end h-full group relative hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded transition-colors px-1 pt-4">
                                
                                {/* TOOLTIP (Hover) */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-stone-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none border border-stone-700">
                                    <div className="font-bold mb-1 border-b border-stone-700 pb-1 text-[#C9A25D]">{item.label}</div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        <span className="text-stone-400">Revenue:</span>
                                        <span className="text-right">₱{(item.revenue/1000).toFixed(1)}k</span>
                                        
                                        <span className="text-blue-400">Net Profit:</span>
                                        <span className="text-right text-blue-400">₱{(item.profit/1000).toFixed(1)}k</span>
                                        
                                        <span className="text-stone-500">Margin:</span>
                                        <span className="text-right text-stone-300">{marginPct}%</span>

                                        <span className="text-[#C9A25D]">Due:</span>
                                        <span className="text-right text-[#C9A25D]">₱{(item.receivable/1000).toFixed(1)}k</span>
                                    </div>
                                </div>
                                
                                {/* BARS CONTAINER */}
                                <div className="relative w-full h-40 flex items-end justify-center gap-[2px]">
                                   
                                   {/* 1. Revenue Bar (Grey) */}
                                   <div 
                                      style={{ height: `${hRev}%` }} 
                                      className={`w-1.5 md:w-2.5 rounded-t-sm transition-all duration-700 bg-stone-300 dark:bg-stone-700 group-hover:bg-stone-400 dark:group-hover:bg-stone-600`}
                                   ></div>

                                   {/* 2. Profit Bar (Blue) */}
                                   <div 
                                      style={{ height: `${hProf}%` }} 
                                      className={`w-1.5 md:w-2.5 rounded-t-sm transition-all duration-700 delay-75 bg-blue-400/80 group-hover:bg-blue-400`}
                                   ></div>

                                   {/* 3. Receivable Bar (Gold) */}
                                   <div 
                                      style={{ height: `${hRec}%` }} 
                                      className={`w-1.5 md:w-2.5 rounded-t-sm transition-all duration-700 delay-150 ${item.receivable > 0 ? 'bg-[#C9A25D]' : 'bg-transparent'}`}
                                   ></div>

                                </div>

                                {/* X-AXIS LABEL */}
                                <span className={`text-[9px] text-center mt-3 font-medium text-stone-500 group-hover:text-stone-300 transition-colors whitespace-nowrap overflow-hidden text-ellipsis`}>
                                    {item.label}
                                </span>
                             </div>
                           );
                         })
                     )}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* REVENUE BY CATEGORY */}
            <div className="lg:col-span-1">
              <FadeIn delay={500}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl italic">Top Performers</h3>
                    <PieChart className="text-stone-400" size={20} />
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm mb-6">
                        <span className="text-[9px] uppercase tracking-widest text-stone-400">Highest Grossing Category</span>
                        <div className="flex items-center justify-between mt-2">
                            <span className="font-serif text-xl">{topCategory}</span>
                            <span className="text-sm font-bold text-[#C9A25D]">
                                ₱{categoryStats[topCategory]?.revenue.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(categoryStats).map(([cat, stats], i) => {
                            const totalRev = totals.contract || 1;
                            const percent = ((stats.revenue / totalRev) * 100).toFixed(0);
                            return (
                                <div key={i} className="group">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium">{cat} <span className="text-stone-400">({stats.count})</span></span>
                                        <span className="text-stone-500">{percent}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${percent}%` }} className="h-full bg-stone-400 dark:bg-stone-600 group-hover:bg-[#C9A25D] transition-colors duration-300"></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* --- TRANSACTION LEDGER --- */}
          <FadeIn delay={600}>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                <div>
                   <h3 className="font-serif text-2xl italic">Operational Ledger</h3>
                   <p className={`text-[10px] uppercase tracking-wider ${theme.subText} mt-1`}>Active Bookings & P&L Status</p>
                </div>
              </div>

              {/* Table Header */}
              <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 select-none`}>
                <div className="col-span-3">Client & Event</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2 text-right">Revenue</div>
                <div className="col-span-1.5 text-right">Expense</div>
                <div className="col-span-1.5 text-right">Net</div>
                <div className="col-span-1.5 text-right">Margin</div>
                <div className="col-span-1.5 text-center">Balance</div>
              </div>

              {/* Table Body */}
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                {bookingsLoading ? (
                    <div className="p-10 flex justify-center text-[#C9A25D]">Loading Data...</div>
                ) : analytics.records.map((rec) => (
                    <div key={rec.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors duration-300`}>
                      <div className="col-span-3">
                        <span className={`font-serif text-md block leading-tight ${theme.text}`}>{rec.client}</span>
                        <span className={`text-[10px] ${theme.subText} block mt-1 uppercase tracking-wider`}>{rec.event}</span>
                      </div>
                      <div className={`col-span-1 text-xs ${theme.subText} truncate`}>{rec.date}</div>
                      <div className={`col-span-2 text-right text-sm font-medium ${theme.text}`}>₱{rec.contractPrice.toLocaleString()}</div>
                      <div className={`col-span-1.5 text-right text-sm text-rose-400`}>{rec.hasOpsData ? `(₱${rec.opsCost.toLocaleString()})` : '-'}</div>
                      <div className={`col-span-1.5 text-right font-serif text-md text-emerald-500`}>{rec.hasOpsData ? `₱${rec.netProfit.toLocaleString()}` : '-'}</div>
                      <div className={`col-span-1.5 text-right`}>
                         {rec.margin !== null ? (
                             <span className={`text-[10px] px-2 py-1 rounded border ${Number(rec.margin) > 40 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}>
                                 {rec.margin}%
                             </span>
                         ) : (<span className="text-[10px] text-stone-400">-</span>)}
                      </div>
                      <div className="col-span-1.5 flex justify-center">
                         {rec.balance === 0 ? (
                             <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center" title="Fully Paid"><DollarSign size={12} /></div>
                         ) : (
                             <span className="text-[9px] uppercase font-bold text-amber-500 tracking-widest border border-amber-500/30 px-2 py-1 rounded" title={`Due: ₱${rec.balance.toLocaleString()}`}>Due</span>
                         )}
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

export default Financials;