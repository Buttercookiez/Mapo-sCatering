// src/pages/Finance/Financials.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Download, 
  Plus, ArrowUpRight, ArrowDownRight,
  Package, Trash2, AlertCircle, X,
  Wallet, Coins // New Icons
} from 'lucide-react';

// Layout
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// HOOKS
import { useInventory } from '../../hooks/useInventory';
import { useBookings } from '../../hooks/useBooking'; // <--- 1. IMPORT BOOKINGS

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
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // --- 2. GET REAL DATA ---
  const { inventoryData, logsData } = useInventory();
  const { bookings, isLoading: bookingsLoading } = useBookings();

  // Theme Persistence
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
    accent: 'text-[#C9A25D]',
    hoverBg: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
    inputBg: darkMode ? 'bg-[#1c1c1c]' : 'bg-stone-50',
  };

  // ==========================================
  // 3. FINANCIAL LOGIC & CALCULATIONS
  // ==========================================

  // A. Inventory Asset & Waste Value
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

  const totalAssetValue = useMemo(() => {
    if (!inventoryData) return 0;
    return inventoryData.reduce((acc, item) => {
      const qty = item.stock?.quantityTotal || 0;
      const price = item.price || 0;
      return acc + (qty * price);
    }, 0);
  }, [inventoryData]);

  // B. Booking Revenue & Cash Flow
  // We transform bookings into financial records
  const financialRecords = useMemo(() => {
    if (!bookings) return [];

    // Filter out inactive bookings
    const activeBookings = bookings.filter(b => 
        b.status !== "Cancelled" && b.status !== "Rejected"
    );

    return activeBookings.map(b => {
        const contractPrice = b.totalCost || 0;
        let collected = 0;

        // Logic: Calculate how much cash we actually have based on status
        if (b.billing?.fullPaymentStatus === 'Paid') {
            collected = contractPrice; // Full Amount
        } else if (b.billing?.paymentStatus === 'Paid') {
            collected = 5000; // Reservation Fee Only
        }

        const balance = contractPrice - collected;

        return {
            id: b.refId,
            client: b.fullName,
            event: b.eventType,
            date: b.dateOfEvent,
            contractPrice: contractPrice,
            collected: collected,
            balance: balance,
            status: b.status
        };
    });
  }, [bookings]);

  // C. Aggregates
  const totalContractValue = financialRecords.reduce((acc, curr) => acc + curr.contractPrice, 0);
  const totalCollected = financialRecords.reduce((acc, curr) => acc + curr.collected, 0);
  const totalReceivables = financialRecords.reduce((acc, curr) => acc + curr.balance, 0);

  // ==========================================

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}>
      
      {/* Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar 
          activeTab="Financial Overview"
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="font-serif text-3xl italic">Financial Intelligence</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>Revenue, Receivables & Asset Analysis</p>
            </div>
            <div className="flex gap-3">
              <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] transition-colors bg-transparent`}>
                <Download size={14} /> Export Report
              </button>
            </div>
          </div>

          {/* --- SCOREBOARD --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { 
                label: 'Cash Collected', 
                value: `₱${totalCollected.toLocaleString()}`, 
                sub: 'Liquid Revenue', 
                icon: Wallet, 
                color: 'text-emerald-500' 
              },
              { 
                label: 'Accounts Receivable', 
                value: `₱${totalReceivables.toLocaleString()}`, 
                sub: 'Pending Collection', 
                icon: Coins, 
                color: 'text-[#C9A25D]' 
              },
              { 
                label: 'Total Contract Value', 
                value: `₱${totalContractValue.toLocaleString()}`, 
                sub: 'Gross Booking Value', 
                icon: DollarSign, 
                color: 'text-stone-400' 
              },
              { 
                label: 'Inventory Loss', 
                value: `₱${realWasteValue.toLocaleString()}`, 
                sub: 'Asset Depreciation', 
                icon: Trash2, 
                color: 'text-rose-500' 
              },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} group hover:border-[#C9A25D]/30 transition-all duration-500 flex flex-col justify-between h-32`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                    <stat.icon size={16} strokeWidth={1} className={`${stat.color} opacity-80`} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-3xl md:text-4xl">{stat.value}</h3>
                    <span className={`text-[10px] font-medium opacity-60 flex items-center gap-1`}>
                      {stat.label === 'Inventory Loss' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                      {stat.sub}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* --- CHARTS SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Chart A: Revenue Flow */}
            <div className="lg:col-span-2">
              <FadeIn delay={300}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full min-h-[400px] flex flex-col`}>
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-serif text-2xl italic">Revenue Flow</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C9A25D]"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Collected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Pending</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Bar Chart */}
                  <div className="flex-1 flex items-end justify-start gap-4 w-full px-2 overflow-x-auto pb-2 custom-scrollbar">
                     {financialRecords.slice(0, 8).map((rec, i) => {
                       // Calculate percentages for bar height
                       const maxVal = Math.max(...financialRecords.map(r => r.contractPrice)) || 1;
                       const collectedH = (rec.collected / maxVal) * 100;
                       const balanceH = (rec.balance / maxVal) * 100;

                       return (
                         <div key={i} className="flex-1 min-w-[40px] flex flex-col justify-end h-full group relative">
                            <div className="relative w-full rounded-t-sm overflow-hidden flex flex-col-reverse h-64 bg-stone-50 dark:bg-stone-900/50">
                               {/* Collected Portion */}
                               <div style={{ height: `${collectedH}%` }} className="w-full bg-[#C9A25D] opacity-90 transition-all duration-700"></div>
                               {/* Balance Portion */}
                               <div style={{ height: `${balanceH}%` }} className="w-full bg-stone-300 dark:bg-stone-700 transition-all duration-700"></div>
                            </div>
                            <span className={`text-[9px] text-center mt-3 truncate w-full block ${theme.subText}`}>{rec.client.split(' ')[0]}</span>
                         </div>
                       );
                     })}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Chart B: Asset Loss (Inventory) */}
            <div className="lg:col-span-1">
              <FadeIn delay={400}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full flex flex-col justify-center`}>
                  <h3 className="font-serif text-2xl italic mb-2">Loss Ratio</h3>
                  <p className={`text-xs ${theme.subText} mb-8`}>Lost Items vs. Total Asset Value</p>
                  
                  <div className="relative aspect-square max-w-[220px] mx-auto mb-8">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path className="text-stone-100 dark:text-stone-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        <path
                          className="text-rose-500 transition-all duration-1000 ease-out"
                          strokeDasharray={`${(totalAssetValue + realWasteValue) > 0 ? ((realWasteValue / (totalAssetValue + realWasteValue)) * 100).toFixed(1) : 0}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="font-serif text-4xl text-rose-500">
                            {(totalAssetValue + realWasteValue) > 0 
                              ? ((realWasteValue / (totalAssetValue + realWasteValue)) * 100).toFixed(1) 
                              : 0}%
                         </span>
                         <span className={`text-[9px] uppercase tracking-widest mt-1 ${theme.subText}`}>Asset Loss</span>
                      </div>
                  </div>

                  <div className={`p-4 border ${theme.border} ${darkMode ? 'bg-stone-900/50' : 'bg-stone-50'} rounded-sm`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-500 mt-1" size={16} />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide">Depreciation Alert</p>
                        <p className={`font-serif text-lg ${theme.text} mt-1`}>₱ {realWasteValue.toLocaleString()}</p>
                        <p className={`text-[10px] ${theme.subText}`}>Total calculated loss from inventory logs.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* --- TRANSACTION LOG --- */}
          <FadeIn delay={500}>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                <div>
                   <h3 className="font-serif text-2xl italic">Booking Transaction Ledger</h3>
                   <p className={`text-[10px] uppercase tracking-wider ${theme.subText} mt-1`}>Real-time financial status of active bookings</p>
                </div>
              </div>

              {/* Table Header */}
              <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 select-none`}>
                <div className="col-span-3">Client & Event</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Contract Price</div>
                <div className="col-span-2 text-right">Collected</div>
                <div className="col-span-2 text-right">Balance Due</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              {/* Table Body */}
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                {bookingsLoading ? (
                    <div className="p-10 flex justify-center text-[#C9A25D]">Loading Data...</div>
                ) : financialRecords.map((rec) => (
                    <div key={rec.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors duration-300`}>
                      
                      <div className="col-span-3">
                        <span className={`font-serif text-md block leading-tight ${theme.text}`}>{rec.client}</span>
                        <span className={`text-[10px] ${theme.subText} block mt-1 uppercase tracking-wider`}>{rec.event}</span>
                      </div>
                      
                      <div className={`col-span-2 text-xs ${theme.subText}`}>{rec.date}</div>
                      
                      <div className={`col-span-2 text-right text-sm font-medium ${theme.text}`}>₱{rec.contractPrice.toLocaleString()}</div>
                      
                      <div className={`col-span-2 text-right text-sm text-emerald-500`}>₱{rec.collected.toLocaleString()}</div>
                      
                      <div className={`col-span-2 text-right font-serif text-md ${rec.balance > 0 ? 'text-rose-500' : 'text-stone-400'}`}>
                        ₱{rec.balance.toLocaleString()}
                      </div>
                      
                      <div className="col-span-1 flex justify-center">
                         <span className={`text-[9px] px-2 py-1 rounded border uppercase tracking-widest ${
                             rec.balance === 0 
                             ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' 
                             : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                         }`}>
                             {rec.balance === 0 ? 'Paid' : 'Due'}
                         </span>
                      </div>
                    </div>
                  ))}
                  
                  {!bookingsLoading && financialRecords.length === 0 && (
                      <div className="p-10 text-center text-stone-500 text-xs uppercase tracking-widest">No active financial records found.</div>
                  )}
              </div>
            </div>
          </FadeIn>

        </div>
      </main>
    </div>
  );
};

export default Financials;