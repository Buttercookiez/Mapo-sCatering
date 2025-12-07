// src/pages/Finance/Financials.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, TrendingUp, FileText, Download, 
  PieChart, ArrowUpRight, Plus, Filter, ArrowUpDown,
  MoreHorizontal, CheckCircle, Clock, AlertCircle,
  X, Trash2, Calculator // New icons
} from 'lucide-react';

// Import Layout Components (Assumed existing)
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

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
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal State

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

  // --- Data: Event Profitability (New Requirement) ---
  const [profitLogs, setProfitLogs] = useState([
    { id: 1, event: 'Cruz Wedding', date: 'Dec 10', cost: 15000, waste: 2000, paid: 25000 },
    { id: 2, event: 'Tech Corp Lunch', date: 'Dec 08', cost: 12000, waste: 500, paid: 20000 },
    { id: 3, event: 'Reyes Birthday', date: 'Dec 05', cost: 18500, waste: 3200, paid: 18000 }, // Loss example
  ]);

  // --- Data: Analytics (New Requirement) ---
  // Mocking visual data for the chart
  const analyticsData = [
    { label: 'Event A', rev: 100, cost: 40, waste: 10 },
    { label: 'Event B', rev: 80, cost: 50, waste: 5 },
    { label: 'Event C', rev: 120, cost: 60, waste: 15 },
    { label: 'Event D', rev: 90, cost: 45, waste: 8 },
    { label: 'Event E', rev: 110, cost: 55, waste: 12 },
  ];

  // --- Helper: Form State ---
  const [formData, setFormData] = useState({
    event: '', cost: '', waste: '', paid: '', notes: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveFinancials = () => {
    // Basic validation
    if(!formData.event || !formData.cost) return;

    const newItem = {
      id: profitLogs.length + 1,
      event: formData.event,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: parseFloat(formData.cost),
      waste: parseFloat(formData.waste) || 0,
      paid: parseFloat(formData.paid)
    };
    
    setProfitLogs([newItem, ...profitLogs]);
    setIsModalOpen(false);
    setFormData({ event: '', cost: '', waste: '', paid: '', notes: '' });
  };

  // --- Helper: Calculations ---
  const calculateNetProfit = (log) => log.paid - (log.cost + log.waste);
  const calculateMargin = (log) => {
    const profit = calculateNetProfit(log);
    return ((profit / log.paid) * 100).toFixed(1);
  };

  // Aggregate Totals for Scoreboard
  const totalRevenue = profitLogs.reduce((acc, curr) => acc + curr.paid, 0);
  const totalWaste = profitLogs.reduce((acc, curr) => acc + curr.waste, 0);
  const totalProfit = profitLogs.reduce((acc, curr) => acc + calculateNetProfit(curr), 0);

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}>
      
      {/* CSS Injection for Fonts/Utilities */}
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
              <p className={`text-xs mt-1 ${theme.subText}`}>Profitability, Waste & Cost Analysis</p>
            </div>
            <div className="flex gap-3">
              <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] transition-colors bg-transparent`}>
                <Download size={14} /> Report
              </button>
              {/* Trigger Modal Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors shadow-lg shadow-stone-900/10"
              >
                <Plus size={14} /> Add Post-Event Financials
              </button>
            </div>
          </div>

          {/* --- Section 1: The Scoreboard (Updated with Waste) --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, trend: '+12%', icon: DollarSign, color: 'text-[#C9A25D]' },
              { label: 'Net Profit', value: `₱${totalProfit.toLocaleString()}`, trend: '+8%', icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Avg Margin', value: '32%', trend: 'Healthy', icon: PieChart, color: 'text-stone-400' },
              // NEW: Waste Card
              { label: 'Lost to Waste', value: `₱${totalWaste.toLocaleString()}`, trend: '-2% vs last mo', icon: Trash2, color: 'text-rose-500' },
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

          {/* --- Section 2: Analytics (Profit Trend & Waste Stack) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Chart A: Profit Trend (Simulated) */}
            <div className="lg:col-span-2">
              <FadeIn delay={300}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full min-h-[400px] flex flex-col`}>
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-serif text-2xl italic">Profitability Trend</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                        <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Profit</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Bar Chart */}
                  <div className="flex-1 flex items-end justify-between gap-4 w-full px-2">
                    {analyticsData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] p-2 rounded z-10">
                          Rev: ₱{data.rev}k
                        </div>
                        {/* Stacked Bar Container */}
                        <div className="relative w-full rounded-t-sm overflow-hidden flex flex-col-reverse h-64 bg-stone-100 dark:bg-stone-800/50">
                          {/* Cost Layer */}
                          <div style={{ height: `${data.cost}%` }} className="w-full bg-stone-400 dark:bg-stone-600 transition-all duration-700"></div>
                          {/* Waste Layer */}
                          <div style={{ height: `${data.waste}%` }} className="w-full bg-rose-400/80 transition-all duration-700"></div>
                          {/* Profit Layer (Remaining) */}
                          <div style={{ height: `${data.rev - data.cost - data.waste}%` }} className="w-full bg-[#C9A25D] opacity-90 transition-all duration-700"></div>
                        </div>
                        <span className={`text-[10px] text-center mt-4 uppercase tracking-widest ${theme.subText}`}>
                          {data.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 text-center text-[10px] ${theme.subText} uppercase tracking-widest`}>
                     Gold: Profit • Gray: Ops Cost • Rose: Waste
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Chart B: Waste Analysis */}
            <div className="lg:col-span-1">
              <FadeIn delay={400}>
                <div className={`border ${theme.border} ${theme.cardBg} p-8 h-full flex flex-col justify-center`}>
                  <h3 className="font-serif text-2xl italic mb-2">Waste Impact</h3>
                  <p className={`text-xs ${theme.subText} mb-8`}>Return to inventory vs Spoilage</p>
                  
                  <div className="relative aspect-square max-w-[200px] mx-auto mb-8">
                     {/* CSS Pie Chart Ring */}
                     <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Background Ring */}
                        <path className="text-stone-100 dark:text-stone-800" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" stroke="currentColor" strokeWidth="3" 
                        />
                        {/* Profit Ring */}
                        <path className="text-[#C9A25D]" 
                          strokeDasharray="70, 100" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" stroke="currentColor" strokeWidth="3" 
                        />
                        {/* Waste Ring */}
                        <path className="text-rose-500" 
                          strokeDasharray="10, 100" strokeDashoffset="-70"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" stroke="currentColor" strokeWidth="3" 
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-serif text-3xl">10%</span>
                        <span className="text-[9px] uppercase tracking-widest text-rose-500">Waste Ratio</span>
                     </div>
                  </div>

                  <div className={`p-4 border ${theme.border} ${darkMode ? 'bg-stone-900/50' : 'bg-stone-50'} rounded-sm`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-500 mt-1" size={16} />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide">High Waste Alert</p>
                        <p className={`font-serif text-lg ${theme.text} mt-1`}>Perishable Goods</p>
                        <p className={`text-[10px] ${theme.subText}`}>Main contributor to lost value.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* --- Section 3: Event Profitability Log (The New Table) --- */}
          <FadeIn delay={500}>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
              <div className="p-6 md:p-8 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                <div>
                   <h3 className="font-serif text-2xl italic">Event Profitability Log</h3>
                   <p className={`text-[10px] uppercase tracking-wider ${theme.subText} mt-1`}>Post-Event Reconciliation</p>
                </div>
                <button className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText} hover:text-[#C9A25D] transition-colors`}>
                  View All
                </button>
              </div>

              {/* Table Header */}
              <div className={`
                grid grid-cols-12 gap-4 px-8 py-4 
                border-b ${theme.border} 
                text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 select-none
              `}>
                <div className="col-span-3">Event Name & Date</div>
                <div className="col-span-2 text-right">Ops Cost</div>
                <div className="col-span-2 text-right text-rose-500">Waste Value</div>
                <div className="col-span-2 text-right">Paid Amount</div>
                <div className="col-span-2 text-right">Net Profit</div>
                <div className="col-span-1 text-right">Margin</div>
              </div>

              {/* Rows */}
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                {profitLogs.map((log) => {
                  const profit = calculateNetProfit(log);
                  const isLoss = profit < 0;
                  
                  return (
                    <div key={log.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors duration-300`}>
                      {/* Event */}
                      <div className="col-span-3">
                        <span className={`font-serif text-lg block leading-tight ${theme.text}`}>
                          {log.event}
                        </span>
                        <span className={`text-[10px] ${theme.subText} block mt-1`}>{log.date}</span>
                      </div>

                      {/* Cost */}
                      <div className={`col-span-2 text-right text-sm ${theme.subText}`}>
                        ₱{log.cost.toLocaleString()}
                      </div>

                      {/* Waste (New) */}
                      <div className="col-span-2 text-right text-sm text-rose-500/80 font-medium">
                        - ₱{log.waste.toLocaleString()}
                      </div>

                      {/* Paid */}
                      <div className={`col-span-2 text-right text-sm ${theme.text}`}>
                        ₱{log.paid.toLocaleString()}
                      </div>

                      {/* Profit (Calculated) */}
                      <div className={`col-span-2 text-right font-serif text-lg ${isLoss ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isLoss ? '-' : '+'}₱{Math.abs(profit).toLocaleString()}
                      </div>

                      {/* Margin */}
                      <div className="col-span-1 flex justify-end">
                         <span className={`text-[10px] px-2 py-1 rounded border ${isLoss ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'}`}>
                           {calculateMargin(log)}%
                         </span>
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
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
              <h3 className="font-serif text-2xl italic">Add Post-Event Financials</h3>
              <button onClick={() => setIsModalOpen(false)} className={`${theme.subText} hover:text-rose-500 transition-colors`}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-60">Select Event</label>
                <select 
                  name="event"
                  value={formData.event}
                  onChange={handleInputChange}
                  className={`w-full p-3 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors appearance-none`}
                >
                  <option value="">-- Select Completed Event --</option>
                  <option value="Garcia Corporate Lunch">Garcia Corporate Lunch - Dec 11</option>
                  <option value="Villanueva Debut">Villanueva Debut - Dec 12</option>
                  <option value="City Hall Catering">City Hall Catering - Dec 14</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] uppercase tracking-widest opacity-60">Ops Cost</label>
                   <div className="relative">
                      <span className="absolute left-3 top-3 text-xs opacity-50">₱</span>
                      <input 
                        type="number" name="cost" placeholder="0.00"
                        value={formData.cost} onChange={handleInputChange}
                        className={`w-full p-3 pl-6 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors`}
                      />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] uppercase tracking-widest text-rose-500 opacity-90">Waste Value</label>
                   <div className="relative">
                      <span className="absolute left-3 top-3 text-xs text-rose-500 opacity-50">₱</span>
                      <input 
                        type="number" name="waste" placeholder="0.00"
                        value={formData.waste} onChange={handleInputChange}
                        className={`w-full p-3 pl-6 text-sm border-rose-500/30 border bg-rose-500/5 outline-none focus:border-rose-500 transition-colors`}
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-60">Amount Paid by Client</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs opacity-50">₱</span>
                  <input 
                    type="number" name="paid" placeholder="0.00"
                    value={formData.paid} onChange={handleInputChange}
                    className={`w-full p-3 pl-6 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest opacity-60">Notes</label>
                <textarea 
                  name="notes" rows="3"
                  value={formData.notes} onChange={handleInputChange}
                  className={`w-full p-3 text-sm border ${theme.border} ${theme.inputBg} outline-none focus:border-[#C9A25D] transition-colors resize-none`}
                  placeholder="Explain waste or extra costs..."
                ></textarea>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-6 pt-0 flex justify-end gap-3`}>
               <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-xs uppercase tracking-widest hover:underline ${theme.subText}`}>Cancel</button>
               <button 
                onClick={handleSaveFinancials}
                className="bg-[#C9A25D] text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-[#b08d4d] transition-colors"
               >
                 Save Record
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Financials;