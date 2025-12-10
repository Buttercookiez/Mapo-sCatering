// src/pages/ClientRecords/ClientRecords.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, ChevronRight, ArrowLeft, 
  Mail, Phone, MoreHorizontal, Loader2, AlertTriangle,
  CreditCard, CheckCircle, PieChart, Coins
} from 'lucide-react';

import useClientRecords from '../../hooks/useClientRecords';
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- STYLES FOR HIDING SCROLLBAR ---
const NoScrollbarStyle = () => (
  <style>{`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `}</style>
);

// --- ANIMATION WRAPPER ---
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

// --- COMPONENT 1: CLIENT LIST ---
const ClientList = ({ clients, bookings, onSelectClient, theme, darkMode, loading, error }) => {
  
  const getClientSpend = (clientId) => {
    if (!bookings) return 0;
    return bookings
      .filter(b => b.clientId === clientId)
      .reduce((acc, curr) => acc + (curr.billing?.amountPaid || 0), 0);
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-12 pb-12 overflow-hidden">
      <div className="flex-none flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className={`font-serif text-3xl italic ${theme.text}`}>Client Records</h2>
          <p className={`text-xs mt-1 ${theme.subText}`}>Manage customer profiles and history.</p>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
          {/* Header */}
          <div className={`flex-none grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} ${darkMode ? 'text-stone-400' : 'text-stone-600'} text-[11px] uppercase tracking-[0.2em] font-semibold select-none`}>
            <div className="col-span-4">Name / Contact</div>
            <div className="col-span-4 hidden md:block">Email</div>
            <div className="col-span-4 md:col-span-2 text-right">Total Paid</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* List Body - REPLACED custom-scrollbar with no-scrollbar */}
          <div className={`flex-1 overflow-y-auto no-scrollbar ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
            {loading ? (
               <div className="h-full flex flex-col items-center justify-center text-stone-400">
                  <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                  <p className="text-xs uppercase tracking-widest">Loading Records...</p>
               </div>
            ) : error ? (
               <div className="h-full flex flex-col items-center justify-center text-red-400">
                  <AlertTriangle size={32} className="mb-4" />
                  <p className="text-xs uppercase tracking-widest">Failed to load data</p>
               </div>
            ) : clients.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center">
                 <p className={`text-sm ${theme.subText}`}>No clients found.</p>
               </div>
            ) : (
               <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                  {clients.map((client) => (
                    <div key={client.id} onClick={() => onSelectClient(client)} className={`grid grid-cols-12 gap-4 px-8 py-6 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}>
                      <div className="col-span-4">
                        <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>{client.profile?.name}</span>
                        <span className="text-[10px] text-stone-400 block mt-1">{client.profile?.contactNumber}</span>
                      </div>
                      <div className={`col-span-4 hidden md:block text-xs ${theme.subText}`}>{client.profile?.email}</div>
                      <div className={`col-span-4 md:col-span-2 text-right font-medium font-serif text-lg ${theme.text}`}>
                          ₱ {getClientSpend(client.clientId).toLocaleString()}
                      </div>
                      <div className="col-span-2 flex justify-end items-center gap-4">
                        <ChevronRight size={16} className="text-stone-300 group-hover:text-[#C9A25D] transition-colors"/>
                      </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </div>
    </div>
  );
};

// --- COMPONENT 2: CLIENT DETAILS ---
const ClientDetails = ({ client, clientBookings, clientTransactions, onBack, theme, darkMode, loading }) => {
  const [activeTab, setActiveTab] = useState('bookings');

  const totalLifetimeSpend = clientBookings
    .reduce((sum, b) => sum + (b.billing?.amountPaid || 0), 0);

  return (
    <div className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar h-full flex flex-col ${theme.bg}`}>
      
      {/* Top Header */}
      <div className={`h-16 flex items-center justify-between px-6 md:px-8 border-b ${theme.border} ${theme.cardBg} sticky top-0 z-20`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 hover:text-[#C9A25D] rounded-full transition-colors ${theme.subText}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-2"></div>
          <div><h2 className={`font-serif text-xl ${theme.text}`}>{client.profile?.name}</h2></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* LEFT: Profile Info - has no-scrollbar */}
        <div className={`w-full lg:w-96 border-r ${theme.border} ${theme.cardBg} p-8 lg:p-10 overflow-y-auto scroll-smooth no-scrollbar z-10`}>
           <div className={`flex flex-col items-center text-center mb-10 pb-10 border-b border-dashed ${theme.border}`}>
             <div className={`w-24 h-24 rounded-full flex items-center justify-center text-[#C9A25D] text-4xl font-serif italic mb-5 border ${theme.border} bg-stone-50 dark:bg-stone-900 shadow-sm leading-none pt-1`}>
                 {client.profile?.name?.charAt(0)}
             </div>
             <h4 className={`font-serif text-2xl mb-1 ${theme.text}`}>{client.profile?.name}</h4>
             <p className={`text-xs uppercase tracking-widest ${theme.subText}`}>{client.clientId}</p>
           </div>

           <div className="space-y-4">
             <div className={`flex justify-between items-center text-xs`}>
                <span className={theme.subText}>Email</span>
                <span className={theme.text}>{client.profile?.email}</span>
             </div>
             <div className={`flex justify-between items-center text-xs`}>
                <span className={theme.subText}>Phone</span>
                <span className={theme.text}>{client.profile?.contactNumber}</span>
             </div>
             <div className={`flex justify-between items-center text-xs pt-4 border-t ${theme.border}`}>
                <span className={theme.subText}>Total Spend</span>
                <span className={`font-serif text-lg text-[#C9A25D]`}>₱ {totalLifetimeSpend.toLocaleString()}</span>
             </div>
           </div>
        </div>

        {/* RIGHT: Tabs & Data */}
        <div className={`flex-1 flex flex-col ${theme.bg} overflow-hidden`}>
           <FadeIn>
              <div className="h-full flex flex-col p-6 lg:p-10">
                
                {/* Tabs Nav */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 border-b ${theme.border} pb-6">
                   <div>
                      <h3 className={`font-serif text-3xl italic ${theme.text}`}>History</h3>
                   </div>
                   <div className={`flex bg-stone-100 dark:bg-stone-800/50 p-1 rounded-sm`}>
                     <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2 text-[10px] uppercase tracking-widest font-medium transition-all rounded-sm ${activeTab === 'bookings' ? 'bg-white dark:bg-[#1c1c1c] text-[#C9A25D] shadow-sm' : 'text-stone-500 hover:text-stone-400'}`}>Bookings</button>
                     <button onClick={() => setActiveTab('transactions')} className={`px-6 py-2 text-[10px] uppercase tracking-widest font-medium transition-all rounded-sm ${activeTab === 'transactions' ? 'bg-white dark:bg-[#1c1c1c] text-[#C9A25D] shadow-sm' : 'text-stone-500 hover:text-stone-400'}`}>Transactions</button>
                   </div>
                </div>
                
                {/* --- TAB CONTENT: BOOKINGS --- */}
                {activeTab === 'bookings' && (
                  <div className={`flex-1 border ${theme.border} ${theme.cardBg} rounded-sm overflow-hidden flex flex-col shadow-sm`}>
                     <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} bg-stone-50 dark:bg-[#1f1f1f] ${darkMode ? 'text-stone-400' : 'text-stone-500'} text-[10px] uppercase tracking-[0.2em] font-semibold sticky top-0 z-10`}>
                        <div className="col-span-2">Booking ID</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-3">Event</div>
                        <div className="col-span-2 text-right">Payment Status</div>
                        <div className="col-span-2 text-right">Status</div>
                     </div>
                     {/* ADDED no-scrollbar HERE */}
                     <div className={`flex-1 overflow-y-auto no-scrollbar divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                         {clientBookings.length === 0 ? (
                             <div className="p-8 text-center text-xs text-stone-500">No bookings found for this client.</div>
                         ) : clientBookings.map((booking, i) => {
                             
                             const isFullPaid = booking.billing?.fullPaymentStatus === 'Paid';
                             const is50Paid = booking.billing?.fiftyPercentPaymentStatus === 'Paid';
                             const isResPaid = booking.billing?.paymentStatus === 'Paid';

                             return (
                              <div key={i} className={`grid grid-cols-12 gap-4 items-center px-8 py-5 ${theme.hoverBg} transition-colors duration-300`}>
                                 <div className="col-span-2 text-xs font-mono text-stone-400">{booking.bookingId || booking.refId}</div>
                                 <div className="col-span-3 text-sm font-medium">{booking.eventDetails?.date}</div>
                                 <div className={`col-span-3 text-sm ${theme.subText}`}>{booking.eventDetails?.eventType}</div>
                                 
                                 <div className="col-span-2 text-right flex justify-end gap-1">
                                    {isFullPaid ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase"><CheckCircle size={10} /> Full</span>
                                    ) : is50Paid ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold uppercase"><PieChart size={10} /> 50%</span>
                                    ) : isResPaid ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded font-bold uppercase">Reserved</span>
                                    ) : (
                                        <span className="text-[10px] text-stone-400 uppercase">Unpaid</span>
                                    )}
                                 </div>

                                 <div className="col-span-2 flex justify-end">
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border font-medium ${
                                      booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'Reserved' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' :
                                      booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'Rejected' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' :
                                      'text-stone-500 bg-stone-100 border-stone-200'
                                    }`}>
                                       {booking.bookingStatus}
                                    </span>
                                 </div>
                              </div>
                            );
                         })}
                     </div>
                  </div>
                )}

                {/* --- TRANSACTIONS TAB --- */}
                {activeTab === 'transactions' && (
                  <div className={`flex-1 border ${theme.border} ${theme.cardBg} rounded-sm overflow-hidden flex flex-col shadow-sm`}>
                     <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} bg-stone-50 dark:bg-[#1f1f1f] ${darkMode ? 'text-stone-400' : 'text-stone-500'} text-[10px] uppercase tracking-[0.2em] font-semibold sticky top-0 z-10`}>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-4">Payment Info</div>
                        <div className="col-span-3 text-right">Amount</div>
                        <div className="col-span-2 text-right">Status</div>
                     </div>
                     {/* ADDED no-scrollbar HERE */}
                     <div className={`flex-1 overflow-y-auto no-scrollbar divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                         {clientTransactions.length === 0 ? (
                             <div className="p-8 text-center text-xs text-stone-500">No transactions found for this client.</div>
                         ) : clientTransactions.map((t, i) => (
                          <div key={i} className={`grid grid-cols-12 gap-4 items-center px-8 py-5 ${theme.hoverBg}`}>
                             <div className={`col-span-3 text-sm font-medium ${theme.text}`}>{t.date}</div>
                             <div className={`col-span-4 text-sm ${theme.subText} flex flex-col`}>
                                <div className="flex items-center gap-2"><CreditCard size={12} /><span>{t.accountName}</span></div>
                                <span className="text-[10px] text-stone-400">Ref: {t.refNumber}</span>
                             </div>
                             <div className={`col-span-3 text-right font-serif text-base ${theme.text}`}>₱ {t.amount?.toLocaleString()}</div>
                             <div className="col-span-2 flex justify-end">
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border font-medium ${
                                  t.status === 'Paid' || t.status === 'Verified' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-stone-500'
                                }`}>
                                   {t.status}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

              </div>
           </FadeIn>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const ClientRecords = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('list');
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { clients, bookings, transactions, loading, error } = useClientRecords();

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

  const filteredClientBookings = selectedClient 
    ? (bookings || []).filter(b => b.clientId === selectedClient.clientId) 
    : [];

  const filteredClientTransactions = selectedClient
    ? (transactions || []).filter(t => 
        t.bookingId && filteredClientBookings.some(b => b.bookingId === t.bookingId)
      )
    : [];
  
  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text}`}>
      {/* Inject Styles */}
      <NoScrollbarStyle />
      
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Client Records" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {currentView === 'list' ? (
          <ClientList 
            clients={(clients || []).filter(c => c.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
            bookings={bookings}
            onSelectClient={(client) => { setSelectedClient(client); setCurrentView('details'); }}
            theme={theme} darkMode={darkMode} loading={loading} error={error}
          />
        ) : (
          <ClientDetails 
            client={selectedClient} 
            clientBookings={filteredClientBookings}
            clientTransactions={filteredClientTransactions}
            onBack={() => setCurrentView('list')} 
            theme={theme} darkMode={darkMode} loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default ClientRecords;