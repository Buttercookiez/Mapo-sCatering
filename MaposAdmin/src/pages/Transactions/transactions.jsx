// src/pages/Transactions/Transactions.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Filter, Download, CreditCard, Check, X, Search, Loader2 
} from 'lucide-react';

// FIREBASE IMPORTS FOR REAL-TIME
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from '../../config/firebase'; // Point this to your CLIENT-SIDE firebase config

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

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

const Transactions = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Real-time State
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // To show loading on specific button

  // Theme Management
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

  // --- 1. REAL-TIME LISTENER ---
  useEffect(() => {
    // 1. Fetch Realtime Data
    const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.clientEmail || "N/A",
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          refNumber: data.referenceNumber,
          date: data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : "N/A",
          status: data.status,
        };
      });
      setTransactions(liveData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);


  // --- 2. ACTION HANDLER (Calls Backend) ---
  const handleVerify = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Verify payment and send confirmation email to client?")) {
        setProcessingId(id);
        try {
            // Updated Endpoint
            await axios.patch(`http://localhost:5000/api/inquiries/payments/${id}/verify`);
        } catch (error) {
            console.error(error);
            alert("Failed to verify.");
        } finally {
            setProcessingId(null);
        }
    }
  };

  // --- 3. FILTER LOGIC ---
  const filteredTransactions = transactions.filter(t => 
    (t.refNumber?.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (t.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.accountName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Transactions" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className={`font-serif text-3xl italic ${theme.text}`}>Verification Queue</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>Verify payments to book dates.</p>
            </div>
          </div>

          <FadeIn>
            <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px] overflow-x-auto`}>
              
              {/* TABLE HEADER - Removed Status & Amount */}
              <div className={`grid grid-cols-12 gap-4 px-6 py-4 min-w-[800px] border-y ${theme.border} ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} text-[10px] uppercase tracking-[0.15em] font-semibold`}>
                <div className="col-span-3">Email</div>
                <div className="col-span-3">Account Name</div>
                <div className="col-span-2">Account Number</div>
                <div className="col-span-3">Ref Number</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* TABLE BODY */}
              <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'} min-w-[800px]`}>
                {isLoading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#C9A25D]"/></div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="py-20 text-center text-stone-500">No pending transactions.</div>
                ) : (
                    filteredTransactions.map((trx) => (
                    <div key={trx.id} className={`grid grid-cols-12 gap-4 px-6 py-5 items-center ${theme.cardBg} ${theme.hoverBg}`}>
                      
                      <div className={`col-span-3 text-sm ${theme.subText} truncate`}>{trx.email}</div>
                      <div className={`col-span-3 text-sm font-medium ${theme.text}`}>{trx.accountName}</div>
                      <div className={`col-span-2 text-sm ${theme.subText} font-mono`}>{trx.accountNumber}</div>

                      <div className="col-span-3 flex flex-col">
                        <span className={`font-mono text-xs ${theme.text}`}>{trx.refNumber}</span>
                        <span className="text-[9px] text-stone-400">{trx.date}</span>
                      </div>

                      {/* ACTION COLUMN - Verify Button Only */}
                      <div className="col-span-1 flex justify-center">
                        {processingId === trx.id ? (
                            <Loader2 size={16} className="animate-spin text-[#C9A25D]" />
                        ) : trx.status === 'Pending' ? (
                          <button 
                            onClick={(e) => handleVerify(trx.id, e)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A25D] text-white hover:bg-[#b08d4d] transition-colors rounded-sm shadow-sm"
                          >
                            <span className="text-[9px] uppercase tracking-widest font-semibold">Verify</span>
                            <Check size={12} />
                          </button>
                        ) : (
                          <div className="text-emerald-500 flex items-center gap-1">
                            <Check size={16} />
                            <span className="text-[9px] uppercase tracking-widest">Done</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))
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