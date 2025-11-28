// src/pages/Transactions/Transactions.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Download, CreditCard, Check, X, Search 
} from 'lucide-react';

// --- FIXED IMPORTS ---
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- 1. ANIMATION COMPONENT ---
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

// --- 2. MAIN COMPONENT ---
const Transactions = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Verified, Rejected

  // Mock Transaction Data
  const [transactions, setTransactions] = useState([
    { id: 1, refNumber: 'REF-992831', accountName: 'Sofia Alcantara', accountNumber: '0917-123-4567', email: 'sofia.alcantara@gmail.com', amount: 25000.00, date: 'Oct 28, 2024', status: 'Pending' },
    { id: 2, refNumber: 'REF-882102', accountName: 'Marco De Luca', accountNumber: '1029-3847-22', email: 'marco.deluca@corp.ph', amount: 150000.00, date: 'Oct 27, 2024', status: 'Verified' },
    { id: 3, refNumber: 'REF-773401', accountName: 'Isabella Gomez', accountNumber: '0918-555-0000', email: 'isa.gomez@yahoo.com', amount: 5000.00, date: 'Oct 26, 2024', status: 'Pending' },
    { id: 4, refNumber: 'REF-112394', accountName: 'TechSolutions Inc', accountNumber: '0011-2233-44', email: 'finance@techsolutions.com', amount: 85000.00, date: 'Oct 25, 2024', status: 'Rejected' },
    { id: 5, refNumber: 'REF-445123', accountName: 'Rafael Santos', accountNumber: '0922-111-2222', email: 'raf.santos@gmail.com', amount: 12500.00, date: 'Oct 24, 2024', status: 'Verified' },
  ]);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-300',
    hoverBg: 'hover:bg-[#C9A25D]/5', 
  };

  // --- INSTANT VERIFY HANDLER ---
  const handleVerify = (id, e) => {
    e.stopPropagation(); // Prevent row click if any
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'Verified' } : t
    ));
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' ? true : t.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar 
            activeTab="Transactions" 
            theme={theme} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
        />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className={`font-serif text-3xl italic ${theme.text}`}>Transaction History</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>Verify payments and track financial records.</p>
            </div>
            
            <div className="flex gap-3">
               <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-6 mb-6 border-b border-stone-200 dark:border-stone-800">
             {['All', 'Pending', 'Verified', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`pb-3 text-xs uppercase tracking-widest transition-colors border-b-2 ${
                    filterStatus === status 
                    ? 'border-[#C9A25D] text-[#C9A25D]' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {status}
                </button>
             ))}
          </div>

          {/* TABLE */}
          <FadeIn>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px] overflow-x-auto`}>
              
              {/* Table Header: UPDATED ORDER */}
              <div className={`
                grid grid-cols-12 gap-4 px-6 py-4 min-w-[1000px]
                border-y ${theme.border} 
                ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} 
                text-[10px] uppercase tracking-[0.15em] font-semibold
              `}>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Account Name</div>
                <div className="col-span-2">Account Number</div>
                <div className="col-span-2">Ref Number</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Table Body */}
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'} min-w-[1000px]`}>
                {filteredTransactions.map((trx) => (
                  <div 
                    key={trx.id} 
                    className={`grid grid-cols-12 gap-4 px-6 py-5 items-center group transition-colors duration-300 ${theme.cardBg} ${theme.hoverBg}`}
                  >
                    
                    {/* 1. Email */}
                    <div className={`col-span-3 text-sm ${theme.subText} truncate pr-4`}>
                      {trx.email}
                    </div>

                    {/* 2. Account Name */}
                    <div className={`col-span-2 text-sm font-medium ${theme.text}`}>
                      {trx.accountName}
                    </div>

                    {/* 3. Account Number */}
                    <div className={`col-span-2 text-sm ${theme.subText} font-mono`}>
                      {trx.accountNumber}
                    </div>

                    {/* 4. Ref Number */}
                    <div className="col-span-2 flex flex-col">
                       <span className={`font-mono text-xs ${theme.text}`}>{trx.refNumber}</span>
                       <span className="text-[9px] text-stone-400 mt-0.5">{trx.date}</span>
                    </div>

                    {/* 5. Amount */}
                    <div className={`col-span-1 text-right font-serif text-base ${theme.text}`}>
                      ₱{trx.amount.toLocaleString()}
                    </div>

                    {/* 6. Status */}
                    <div className="col-span-1 flex justify-center">
                       <span className={`
                         px-2 py-1 rounded-sm text-[9px] uppercase tracking-widest border
                         ${trx.status === 'Verified' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 
                           trx.status === 'Pending' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 
                           'text-red-500 bg-red-500/10 border-red-500/20'}
                       `}>
                         {trx.status}
                       </span>
                    </div>

                    {/* 7. Action (Verify Button) */}
                    <div className="col-span-1 flex justify-center">
                      {trx.status === 'Pending' ? (
                        <button 
                          onClick={(e) => handleVerify(trx.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A25D] text-white hover:bg-[#b08d4d] transition-colors rounded-sm shadow-sm hover:shadow-md"
                        >
                          <span className="text-[9px] uppercase tracking-widest font-semibold">Verify</span>
                        </button>
                      ) : trx.status === 'Verified' ? (
                        <div className="text-emerald-500" title="Verified">
                           <Check size={18} />
                        </div>
                      ) : (
                        <div className="text-red-500" title="Rejected">
                           <X size={18} />
                        </div>
                      )}
                    </div>

                  </div>
                ))}

                {filteredTransactions.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="inline-block p-4 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mb-4">
                      <CreditCard size={24} />
                    </div>
                    <p className={`text-sm ${theme.subText}`}>No transactions found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
};

export default Transactions;