// src/pages/ClientRecords/ClientRecords.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, ChevronRight, ArrowLeft, Calendar, 
  Users, Mail, Phone, Plus, MoreHorizontal, 
  User, FileText, DollarSign, Star, Clock, MapPin, X,
  Briefcase, ArrowUpRight, ArrowUpDown, Package, Download 
} from 'lucide-react';

// --- FIXED IMPORTS (Matching your folder structure) ---
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- 1. ANIMATION COMPONENT (Fixed Ref Warning) ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // 1. Copy ref to a variable to avoid cleanup warning
    const currentRef = ref.current; 
    
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );

    if (currentRef) observer.observe(currentRef);

    // 2. Use the variable in the cleanup function
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// --- 2. NEW CLIENT MODAL ---
const NewClientModal = ({ isOpen, onClose, onSave, theme }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', address: '', notes: ''
  });

  const inputBase = `w-full bg-transparent border-b ${theme.border} py-3 pl-0 text-sm ${theme.text} placeholder-stone-400 focus:outline-none focus:border-[#C9A25D] transition-colors`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newClient = {
      id: `CL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      totalSpend: 0,
      lastActive: 'Just Now',
      status: 'Active',
      address: formData.address,
      notes: formData.notes
    };
    onSave(newClient);
    onClose();
    setFormData({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col`}>
        <div className={`p-8 border-b ${theme.border} flex justify-between items-center sticky top-0 ${theme.cardBg} z-20`}>
          <div>
            <h2 className={`font-serif text-3xl ${theme.text}`}>Add New Client</h2>
            <p className={`text-xs ${theme.subText} mt-1`}>Create a new customer profile.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500"><X size={20}/></button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className={inputBase} />
            <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Company / Organization (Optional)" className={inputBase} />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={inputBase} />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className={inputBase} />
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address / Location" className={`${inputBase} md:col-span-2`} />
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Initial Notes..." className={`${inputBase} md:col-span-2 resize-none h-24`} />
          </div>
        </div>

        <div className={`p-6 border-t ${theme.border} flex justify-end gap-4`}>
          <button onClick={onClose} className={`px-6 py-3 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`}>Cancel</button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-lg">Save Client</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. CLIENT LIST COMPONENT ---
const ClientList = ({ clients, onSelectClient, onOpenNewClient, theme, darkMode }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className={`font-serif text-3xl italic ${theme.text}`}>Client Records</h2>
          <p className={`text-xs mt-1 ${theme.subText}`}>Manage customer profiles and history.</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}>
            <Filter size={14} /> Filter
          </button>
          <button 
            onClick={onOpenNewClient}
            className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm"
          >
            <Plus size={14} /> Add Client
          </button>
        </div>
      </div>

      <FadeIn>
        <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
          {/* TABLE HEADER */}
          <div className={`
            grid grid-cols-12 gap-4 px-8 py-5 
            border-y ${theme.border} 
            ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} 
            text-[11px] uppercase tracking-[0.2em] font-semibold
          `}>
            <div className="col-span-4 md:col-span-3">Name / Contact</div>
            <div className="col-span-3 hidden md:block">Email</div>
            <div className="col-span-2 hidden md:block">Last Active</div>
            <div className="col-span-4 md:col-span-2 text-right">Total Spend</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
            {clients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => onSelectClient(client)}
                className={`grid grid-cols-12 gap-4 px-8 py-6 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}
              >
                <div className="col-span-4 md:col-span-3">
                  <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>{client.name}</span>
                  <span className="text-[10px] text-stone-400 block mt-1">{client.phone}</span>
                </div>
                <div className={`col-span-3 hidden md:block text-xs ${theme.subText}`}>{client.email}</div>
                <div className={`col-span-2 hidden md:block text-xs ${theme.subText}`}>{client.lastActive}</div>
                <div className={`col-span-4 md:col-span-2 text-right font-medium font-serif text-lg ${theme.text}`}>₱ {client.totalSpend.toLocaleString()}</div>
                <div className="col-span-2 flex justify-end items-center gap-4">
                  <button className={`p-2 hover:text-[#C9A25D] transition-colors ${theme.subText}`}>
                    <MoreHorizontal size={16} />
                  </button>
                  <ChevronRight size={16} className="text-stone-300 group-hover:text-[#C9A25D] transition-colors"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

// --- 4. CLIENT DETAILS COMPONENT ---
const ClientDetails = ({ client, onBack, activeDetailTab, setActiveDetailTab, theme, darkMode }) => {
  const detailTabs = ['Profile', 'Booking History', 'Notes'];

  // Mock History Data
  const history = [
    { id: 'BK-042', date: 'Oct 24, 2024', event: 'Wedding', amount: 250000, status: 'Confirmed' },
    { id: 'BK-012', date: 'Jan 15, 2023', event: 'Birthday', amount: 80000, status: 'Completed' },
    { id: 'BK-008', date: 'Dec 10, 2022', event: 'Corporate', amount: 150000, status: 'Completed' },
  ];

  return (
    <div className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar h-full flex flex-col ${theme.bg}`}>
      
      {/* Top Bar */}
      <div className={`h-16 flex items-center justify-between px-6 md:px-8 border-b ${theme.border} ${theme.cardBg} sticky top-0 z-20`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 hover:text-[#C9A25D] rounded-full transition-colors ${theme.subText}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-2"></div>
          <div>
            <h2 className={`font-serif text-xl ${theme.text}`}>{client.name}</h2>
          </div>
        </div>
        <div className="flex gap-3 items-center">
           <span className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm border font-medium ${client.status === 'Active' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-stone-500 border-stone-200'}`}>
             {client.status}
           </span>
           <button className={`p-2 hover:text-[#C9A25D] transition-colors ${theme.subText}`}><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* LEFT: Static Info Card */}
        <div className={`w-full lg:w-96 border-r ${theme.border} ${theme.cardBg} p-8 lg:p-10 overflow-y-auto scroll-smooth no-scrollbar z-10`}>
           
           <div className={`flex flex-col items-center text-center mb-10 pb-10 border-b border-dashed ${theme.border}`}>
              {/* Fixed Alignment for Profile Letter */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-[#C9A25D] text-4xl font-serif italic mb-5 border ${theme.border} bg-stone-50 dark:bg-stone-900 shadow-sm leading-none pt-1`}>
                 {client.name.charAt(0)}
              </div>
              <h4 className={`font-serif text-2xl mb-2 ${theme.text}`}>{client.name}</h4>
              <p className={`text-xs uppercase tracking-widest ${theme.subText}`}>{client.company || 'Individual Client'}</p>
              
              {/* Contact Buttons */}
              <div className="flex gap-3 mt-8 w-full">
                 <button className={`flex-1 flex items-center justify-center gap-2 py-3 border ${theme.border} rounded-sm hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all text-[10px] uppercase tracking-widest font-medium ${theme.subText}`}>
                    <Mail size={14} /> Email
                 </button>
                 <button className={`flex-1 flex items-center justify-center gap-2 py-3 border ${theme.border} rounded-sm hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all text-[10px] uppercase tracking-widest font-medium ${theme.subText}`}>
                    <Phone size={14} /> Call
                 </button>
              </div>
           </div>

           <div className="space-y-8">
              {/* Address Icon: Matched Style */}
              <div className="flex items-start gap-4">
                 <div className={`p-2 rounded-full bg-[#C9A25D]/10 text-[#C9A25D]`}>
                    <MapPin size={18} strokeWidth={1.5} />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Address</p>
                    <p className={`text-sm leading-relaxed ${theme.text}`}>{client.address || 'No address provided'}</p>
                 </div>
              </div>
              
              {/* IMPROVED TOTAL SPEND UI */}
              <div className="flex items-start gap-4">
                 <div className={`p-2 rounded-full bg-[#C9A25D]/10 text-[#C9A25D]`}>
                    <DollarSign size={18} strokeWidth={1.5} />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Lifetime Spend</p>
                    <div className={`flex items-start ${theme.text}`}>
                        <span className="text-sm mr-1 font-medium text-stone-400 mt-1">₱</span>
                        <span className="font-serif text-3xl leading-none">{client.totalSpend.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              {/* Last Active Icon: Matched Style */}
              <div className="flex items-start gap-4">
                 <div className={`p-2 rounded-full bg-[#C9A25D]/10 text-[#C9A25D]`}>
                    <Clock size={18} strokeWidth={1.5} />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Last Active</p>
                    <p className={`text-sm ${theme.text}`}>{client.lastActive}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: Tabs Workspace */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
           <div className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-8 overflow-x-auto no-scrollbar`}>
              {detailTabs.map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`px-8 py-5 text-xs uppercase tracking-[0.2em] border-b-2 transition-colors font-medium whitespace-nowrap ${
                      activeDetailTab === tab 
                      ? 'border-[#C9A25D] text-[#C9A25D]' 
                      : `border-transparent ${theme.subText} hover:text-stone-600 dark:hover:text-stone-300`
                    }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
              <FadeIn key={activeDetailTab}>
                 
                 {activeDetailTab === 'Profile' && (
                    <div className="max-w-5xl mx-auto">
                       <h3 className={`font-serif text-2xl mb-8 ${theme.text}`}>General Information</h3>
                       <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Full Name</p>
                             <p className={`text-base font-medium ${theme.text} border-b ${theme.border} pb-2`}>{client.name}</p>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Email Address</p>
                             <p className={`text-base font-medium ${theme.text} border-b ${theme.border} pb-2`}>{client.email}</p>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Phone Number</p>
                             <p className={`text-base font-medium ${theme.text} border-b ${theme.border} pb-2`}>{client.phone}</p>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Company</p>
                             <p className={`text-base font-medium ${theme.text} border-b ${theme.border} pb-2`}>{client.company || 'N/A'}</p>
                          </div>
                          <div className="md:col-span-2">
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Full Address</p>
                             <p className={`text-base font-medium ${theme.text} border-b ${theme.border} pb-2`}>{client.address || 'N/A'}</p>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'Booking History' && (
                    <div className="max-w-5xl mx-auto">
                       <div className="flex justify-between items-center mb-8">
                          <h3 className={`font-serif text-2xl ${theme.text}`}>Past Events</h3>
                          <button className={`flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#C9A25D] hover:underline`}>
                             <Download size={12} /> Export History
                          </button>
                       </div>
                       
                       <div className={`border ${theme.border} ${theme.cardBg} rounded-sm overflow-hidden`}>
                          {/* Styled Header matching Inventory/Finance */}
                          <div className={`
                            grid grid-cols-12 gap-4 px-8 py-5 
                            border-b ${theme.border} 
                            ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} 
                            text-[11px] uppercase tracking-[0.2em] font-semibold
                          `}>
                              <div className="col-span-2">Ref ID</div>
                              <div className="col-span-3">Date</div>
                              <div className="col-span-3">Event Type</div>
                              <div className="col-span-2 text-right">Amount</div>
                              <div className="col-span-2 text-right">Status</div>
                          </div>
                          
                          <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                             {history.map((event, i) => (
                               <div key={i} className={`grid grid-cols-12 gap-4 items-center px-8 py-5 ${theme.hoverBg} transition-colors duration-300`}>
                                  <div className="col-span-2 text-xs font-mono text-stone-500 tracking-wider">{event.id}</div>
                                  <div className={`col-span-3 text-sm font-medium ${theme.text}`}>{event.date}</div>
                                  <div className={`col-span-3 text-sm ${theme.subText} flex items-center gap-2`}>
                                     <span className={`w-1.5 h-1.5 rounded-full ${event.event === 'Wedding' ? 'bg-rose-400' : 'bg-blue-400'}`}></span>
                                     {event.event}
                                  </div>
                                  <div className={`col-span-2 text-right font-serif ${theme.text}`}>₱ {event.amount.toLocaleString()}</div>
                                  <div className="col-span-2 flex justify-end">
                                     <span className="text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-sm border border-emerald-500/20 font-medium">
                                        {event.status}
                                     </span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'Notes' && (
                    <div className="max-w-4xl mx-auto">
                       <h3 className={`font-serif text-2xl mb-6 ${theme.text}`}>Internal Notes</h3>
                       <div className="relative">
                          <textarea 
                              className={`w-full h-64 border ${theme.border} ${theme.cardBg} p-6 text-sm ${theme.text} focus:outline-none focus:border-[#C9A25D] rounded-sm resize-none leading-relaxed`} 
                              defaultValue={client.notes} 
                              placeholder="Add notes about this client..."
                          />
                          <div className="absolute bottom-4 right-4">
                              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1c1c1c] text-white text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-md">
                                <Plus size={14}/> Save Note
                              </button>
                          </div>
                       </div>
                    </div>
                 )}

              </FadeIn>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. MAIN PAGE COMPONENT ---
const ClientRecords = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });

  const [currentView, setCurrentView] = useState('list');
  const [activeDetailTab, setActiveDetailTab] = useState('Profile');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Data
  const [clients, setClients] = useState([
    { id: 'CL-1001', name: 'Sofia Alcantara', email: 'sofia@mail.com', phone: '+63 917 123 4567', company: '', totalSpend: 250000, lastActive: '2 days ago', status: 'Active', address: 'Makati City' },
    { id: 'CL-1002', name: 'TechSolutions Inc.', email: 'hr@techsolutions.com', phone: '(02) 8888 1234', company: 'TechSolutions', totalSpend: 150000, lastActive: '1 week ago', status: 'Active', address: 'BGC, Taguig' },
    { id: 'CL-1003', name: 'Isabella Gomez', email: 'isa.gomez@mail.com', phone: '+63 918 555 6789', company: '', totalSpend: 80000, lastActive: '3 days ago', status: 'Inactive', address: 'Quezon City' },
  ]);

  const handleSaveClient = (newClient) => {
    setClients(prev => [newClient, ...prev]);
  };

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
    accent: 'text-[#C9A25D]',
    hoverBg: 'hover:bg-[#C9A25D]/5', 
  };

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
        <DashboardNavbar activeTab="Client Records" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {currentView === 'list' ? (
          <ClientList 
            clients={clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
            onSelectClient={(client) => { setSelectedClient(client); setCurrentView('details'); }}
            onOpenNewClient={() => setIsNewClientOpen(true)}
            theme={theme}
            darkMode={darkMode}
          />
        ) : (
          <ClientDetails 
            client={selectedClient || clients[0]} 
            onBack={() => setCurrentView('list')}
            activeDetailTab={activeDetailTab}
            setActiveDetailTab={setActiveDetailTab}
            theme={theme}
            darkMode={darkMode}
          />
        )}
      </main>

      <NewClientModal 
         isOpen={isNewClientOpen} 
         onClose={() => setIsNewClientOpen(false)} 
         onSave={handleSaveClient}
         theme={theme}
      />
    </div>
  );
};

export default ClientRecords;