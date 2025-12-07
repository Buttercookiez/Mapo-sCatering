// src/pages/Finance/Financials.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, FileText, Download, 
  PieChart, ArrowUpRight, Plus, Filter, ArrowUpDown,
  MoreHorizontal, CheckCircle, Clock, AlertCircle,
  X, Trash2, Calculator, Package // Added Package icon
} from 'lucide-react';

// Import Layout Components
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// IMPORT CUSTOM HOOK to get Real Inventory Logs
import { useInventory } from '../../hooks/useInventory';

// --- Animation Component ---
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
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // --- Theme Persistence ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Finance');
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // --- GET DATA FROM INVENTORY SYSTEM ---
  const { inventoryData, logsData } = useInventory();

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    accent: 'text-[#C9A25D]',
    accentBg: 'bg-[#C9A25D]',
    hoverBg: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
    inputBg: darkMode ? 'bg-[#1c1c1c]' : 'bg-stone-50',
  };

  // --- Data: Event Profitability (Manual Entries) ---
  const [profitLogs, setProfitLogs] = useState([
    { id: 1, event: 'Cruz Wedding', date: 'Dec 10', cost: 15000, paid: 25000 },
    { id: 2, event: 'Tech Corp Lunch', date: 'Dec 08', cost: 12000, paid: 20000 },
    { id: 3, event: 'Reyes Birthday', date: 'Dec 05', cost: 18500, paid: 18000 },
  ]);

  // 1. CALCULATE REAL WASTE FROM LOGS
  const realWasteValue = useMemo(() => {
    if (!logsData || !inventoryData) return 0;

    return logsData.reduce((total, log) => {
      if (log.quantityLost > 0) {
        const item = inventoryData.find(i => i.id === log.itemId);
        const price = item ? (item.price || 0) : 0;
        const valueLost = log.quantityLost * price;
        return total + valueLost;
      }
      return total;
    }, 0);
  }, [logsData, inventoryData]);

  // 2. CALCULATE TOTAL ASSET VALUE (For the new Ratio)
  const totalAssetValue = useMemo(() => {
    if (!inventoryData) return 0;
    return inventoryData.reduce((acc, item) => {
      const qty = item.stock?.quantityTotal || 0;
      const price = item.price || 0;
      return acc + (qty * price);
    }, 0);
  }, [inventoryData]);

  // --- Helper: Form State ---
  const [formData, setFormData] = useState({
    event: '', cost: '', paid: '', notes: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveFinancials = () => {
    if(!formData.event || !formData.cost) return;

    const newItem = {
      id: profitLogs.length + 1,
      event: formData.event,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: parseFloat(formData.cost),
      paid: parseFloat(formData.paid)
    };
    
    setProfitLogs([newItem, ...profitLogs]);
    setIsModalOpen(false);
    setFormData({ event: '', cost: '', paid: '', notes: '' });
  };

  // --- Helper: Calculations ---
  const calculateNetProfit = (log) => log.paid - log.cost;
  
  const calculateMargin = (log) => {
    const profit = calculateNetProfit(log);
    return ((profit / log.paid) * 100).toFixed(1);
  };

  // Aggregate Totals
  const totalRevenue = profitLogs.reduce((acc, curr) => acc + curr.paid, 0);
  // Note: We subtract waste from profit for the dashboard summary, but keep revenue pure
  const totalProfit = profitLogs.reduce((acc, curr) => acc + calculateNetProfit(curr), 0) - realWasteValue;

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* --- Sidebar --- */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
      />

      {/* --- Main Content --- */}
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
          
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="font-serif text-3xl italic">Financial Intelligence</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>Profitability & Asset Loss Analysis</p>
            </div>
            <div className="flex gap-3">
              <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] transition-colors bg-transparent`}>
                <Download size={14} /> Report
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors shadow-lg shadow-stone-900/10"
              >
                <Plus size={14} /> Add Event Record
              </button>
            </div>
          </div>

          {/* --- Section 1: The Scoreboard --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, trend: '+12%', icon: DollarSign, color: 'text-[#C9A25D]' },
              { label: 'Real Net Profit', value: `₱${totalProfit.toLocaleString()}`, trend: 'After Loss', icon: TrendingUp, color: 'text-emerald-500' },
              // Show Total Inventory Value for context
              { label: 'Total Inventory Value', value: `₱${totalAssetValue.toLocaleString()}`, trend: 'Current Assets', icon: Package, color: 'text-stone-400' },
              { label: 'Total Value Lost', value: `₱${realWasteValue.toLocaleString()}`, trend: 'From Logs', icon: Trash2, color: 'text-rose-500' },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} group hover:border-[#C9A25D]/30 transition-all duration-500 flex flex-col justify-between h-32`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                    <stat.icon size={16} strokeWidth={1} className={`${stat.color} opacity-80`} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-3xl md:text-4xl">{stat.value}</h3>
                    <span className={`text-[10px] font-medium opacity-60`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* --- Section 2: Analytics --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Chart A: Profit Trend */}
            <div className="lg:col-span-2">
              <FadeIn delay={300}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full min-h-[400px] flex flex-col`}>
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-serif text-2xl italic">Operational Profit</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C9A25D]"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Revenue</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Visual */}
                  <div className="flex-1 flex items-end justify-between gap-4 w-full px-2">
                     {profitLogs.map((log, i) => (
                       <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                          <div className="relative w-full rounded-t-sm overflow-hidden flex flex-col-reverse h-64 bg-stone-100 dark:bg-stone-800/50">
                             <div style={{ height: '60%' }} className="w-full bg-[#C9A25D] opacity-90"></div>
                             <div style={{ height: '40%' }} className="w-full bg-stone-400 dark:bg-stone-600"></div>
                          </div>
                          <span className={`text-[10px] text-center mt-4 uppercase tracking-widest ${theme.subText}`}>{log.date}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Chart B: Waste Analysis (UPDATED) */}
            <div className="lg:col-span-1">
              <FadeIn delay={400}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full flex flex-col justify-center`}>
                  <h3 className="font-serif text-2xl italic mb-2">Loss Impact</h3>
                  <p className={`text-xs ${theme.subText} mb-8`}>Loss vs. Total Inventory Value</p>
                  
                  {/* Dynamic Donut Chart */}
                  <div className="relative aspect-square max-w-[220px] mx-auto mb-8">
                      {/* SVG Ring */}
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Background Ring */}
                        <path className="text-stone-100 dark:text-stone-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        
                        {/* Value Ring - NOW CALCULATED BASED ON ASSET VALUE */}
                        <path
                          className="text-rose-500 transition-all duration-1000 ease-out"
                          strokeDasharray={`${(totalAssetValue + realWasteValue) > 0 ? ((realWasteValue / (totalAssetValue + realWasteValue)) * 100).toFixed(1) : 0}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        />
                      </svg>
                      
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="font-serif text-4xl text-rose-500">
                            {(totalAssetValue + realWasteValue) > 0 
                              ? ((realWasteValue / (totalAssetValue + realWasteValue)) * 100).toFixed(1) 
                              : 0}%
                         </span>
                         <span className={`text-[9px] uppercase tracking-widest mt-1 ${theme.subText}`}>Of Assets Lost</span>
                      </div>
                  </div>

                  {/* Info Box */}
                  <div className={`p-4 border ${theme.border} ${darkMode ? 'bg-stone-900/50' : 'bg-stone-50'} rounded-sm`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-500 mt-1" size={16} />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide">Depreciation</p>
                        <p className={`font-serif text-lg ${theme.text} mt-1`}>Inventory Loss</p>
                        <p className={`text-[10px] ${theme.subText}`}>Value of lost items compared to total equipment value.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* --- Section 3: Event Profitability Log --- */}
          <FadeIn delay={500}>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                <div>
                   <h3 className="font-serif text-2xl italic">Event Profitability Log</h3>
                   <p className={`text-[10px] uppercase tracking-wider ${theme.subText} mt-1`}>Operational P&L (Excludes Inventory Loss)</p>
                </div>
              </div>

              <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 select-none`}>
                <div className="col-span-4">Event Name & Date</div>
                <div className="col-span-2 text-right">Ops Cost</div>
                <div className="col-span-2 text-right">Paid Amount</div>
                <div className="col-span-2 text-right">Net Profit</div>
                <div className="col-span-2 text-right">Margin</div>
              </div>

              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                {profitLogs.map((log) => {
                  const profit = calculateNetProfit(log);
                  return (
                    <div key={log.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors duration-300`}>
                      <div className="col-span-4">
                        <span className={`font-serif text-lg block leading-tight ${theme.text}`}>{log.event}</span>
                        <span className={`text-[10px] ${theme.subText} block mt-1`}>{log.date}</span>
                      </div>
                      <div className={`col-span-2 text-right text-sm ${theme.subText}`}>₱{log.cost.toLocaleString()}</div>
                      <div className={`col-span-2 text-right text-sm ${theme.text}`}>₱{log.paid.toLocaleString()}</div>
                      <div className={`col-span-2 text-right font-serif text-lg text-emerald-500`}>+₱{profit.toLocaleString()}</div>
                      <div className="col-span-2 flex justify-end">
                         <span className={`text-[10px] px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500`}>{calculateMargin(log)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>

        </div>
      </main>

      {/* --- Section 4: The Input Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md ${theme.cardBg} border ${theme.border} shadow-2xl animate-in fade-in zoom-in duration-200`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
              <h3 className="font-serif text-2xl italic">Add Event Financials</h3>
              <button onClick={() => setIsModalOpen(false)} className={`${theme.subText} hover:text-rose-500 transition-colors`}><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-60">Event Name</label>
                <input type="text" name="event" placeholder="e.g. Smith Wedding" value={formData.event} onChange={handleInputChange} className={`w-full p-3 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors`} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase tracking-widest opacity-60">Operational Cost (Staff/Food/Transport)</label>
                 <div className="relative">
                    <span className="absolute left-3 top-3 text-xs opacity-50">₱</span>
                    <input type="number" name="cost" placeholder="0.00" value={formData.cost} onChange={handleInputChange} className={`w-full p-3 pl-6 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors`} />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-60">Amount Paid by Client</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs opacity-50">₱</span>
                  <input type="number" name="paid" placeholder="0.00" value={formData.paid} onChange={handleInputChange} className={`w-full p-3 pl-6 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors`} />
                </div>
              </div>
              <div className="p-3 bg-stone-100 dark:bg-stone-900 rounded-sm border border-stone-200 dark:border-stone-800">
                  <p className="text-[10px] text-stone-500 flex items-center gap-2"><AlertCircle size={12} />Asset loss/waste is now tracked automatically via Inventory Logs.</p>
              </div>
            </div>

            <div className={`p-6 pt-0 flex justify-end gap-3`}>
               <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-xs uppercase tracking-widest hover:underline ${theme.subText}`}>Cancel</button>
               <button onClick={handleSaveFinancials} className="bg-[#C9A25D] text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-[#b08d4d] transition-colors">Save Record</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Financials;