// src/pages/Inventory/Inventory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowUpDown, AlertTriangle, 
  Package, Tag, X, ChevronDown, 
  Trash2, Pencil, Loader2,
  ArrowRightLeft, History, Filter, Check, Clock
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';
import { useInventory } from '../../hooks/useInventory';

// --- ANIMATION HELPER ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
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

// --- MODAL: ITEM ADD/EDIT ---
const ItemModal = ({ isOpen, onClose, onSave, theme, categories, initialData }) => {
  const [formData, setFormData] = useState({ name: '', category: '', price: '', quantity: '', unit: 'Pcs', threshold: '' });
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        price: initialData.price || '',
        quantity: initialData.stock?.quantityTotal || '',
        unit: initialData.stock?.unit || 'Pcs',
        threshold: initialData.stock?.threshold || ''
      });
    } else {
      setFormData({ name: '', category: '', price: '', quantity: '', unit: 'Pcs', threshold: '' });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!formData.name || !formData.quantity) return;
    const payload = {
      name: formData.name,
      category: formData.category || 'Miscellaneous',
      price: Number(formData.price) || 0,
      stock: {
        quantityTotal: Number(formData.quantity),
        quantityInUse: initialData?.stock?.quantityInUse || 0,
        threshold: Number(formData.threshold) || 10,
        unit: formData.unit
      }
    };
    onSave(payload, initialData?.id);
    onClose();
  };

  if (!isOpen) return null;

  const inputBase = `w-full bg-transparent border-b ${theme.border} py-3 pl-0 text-sm ${theme.text} placeholder-stone-400 focus:outline-none focus:border-[#C9A25D] transition-colors relative z-10`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className={`w-full max-w-xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col relative z-50 animate-in fade-in zoom-in duration-200`}>
        <div className={`p-8 border-b ${theme.border} flex justify-between items-center`}>
          <h2 className={`font-serif text-3xl ${theme.text}`}>{initialData ? 'Edit Asset' : 'Add Item'}</h2>
          <button onClick={onClose}><X size={20} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"/></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2"><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Item Name" className={inputBase} /></div>
            <div className="relative md:col-span-2 z-20">
               <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                  <span className={formData.category ? theme.text : "text-stone-400"}>{formData.category || "Select Category"}</span>
                  <ChevronDown className="w-4 h-4 text-stone-400" />
               </button>
               {categoryOpen && (
                 <div className={`absolute top-full left-0 w-full mt-1 p-2 shadow-xl z-50 border ${theme.border} ${theme.cardBg} max-h-48 overflow-y-auto`}>
                   {categories.map(cat => (
                     <div key={cat} onClick={() => { setFormData(p => ({...p, category: cat})); setCategoryOpen(false); }} className={`text-xs p-2 hover:bg-[#C9A25D] hover:text-white cursor-pointer ${theme.text}`}>{cat}</div>
                   ))}
                 </div>
               )}
            </div>
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price per unit" className={inputBase} />
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Total Stock Quantity" className={inputBase} />
            <div className="flex gap-4">
               <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit" className={`${inputBase} w-1/3`} />
               <input type="number" name="threshold" value={formData.threshold} onChange={handleChange} placeholder="Alert Level" className={`${inputBase} w-2/3`} />
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${theme.border} flex justify-end gap-4`}>
          <button onClick={onClose} className={`px-6 py-3 text-xs uppercase border ${theme.border} ${theme.text}`}>Cancel</button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-[#1c1c1c] text-white text-xs uppercase hover:bg-[#C9A25D] transition-colors">{initialData ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL: STOCK MOVEMENT ---
const StockMovementModal = ({ isOpen, onClose, onSave, item, theme }) => {
  const [action, setAction] = useState('checkout');
  const [amount, setAmount] = useState('');
  const [lostAmount, setLostAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setAmount(''); setLostAmount(''); setError(''); setAction('checkout'); }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const total = item.stock?.quantityTotal || 0;
  const inUse = item.stock?.quantityInUse || 0;
  const available = total - inUse;

  const handleSubmit = () => {
    const val = parseInt(amount) || 0;
    const lostVal = parseInt(lostAmount) || 0;

    if (val <= 0 && lostVal <= 0) { setError("Please enter a valid quantity."); return; }

    if (action === 'checkout') {
      if (val > available) { setError(`Only ${available} available.`); return; }
      onSave(item.id, 'checkout', val, 0);
    } else {
      const totalReturning = val + lostVal;
      if (totalReturning > inUse) { setError(`Only ${inUse} are currently out.`); return; }
      onSave(item.id, 'return', val, lostVal);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className={`w-full max-w-md ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} relative z-50 animate-in fade-in zoom-in duration-200`}>
        <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
          <div><h3 className={`font-serif text-2xl ${theme.text}`}>Stock Movement</h3><p className={`text-xs ${theme.subText} mt-1`}>{item.name}</p></div>
          <button onClick={onClose}><X size={18} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"/></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 border ${theme.border} bg-stone-50 dark:bg-stone-900/50 text-center rounded-sm`}>
              <span className="text-[10px] uppercase tracking-widest text-stone-400">Available</span><p className={`text-xl font-medium ${theme.text} mt-1`}>{available}</p>
            </div>
            <div className={`p-3 border ${theme.border} bg-[#C9A25D]/10 text-center rounded-sm`}>
              <span className="text-[10px] uppercase tracking-widest text-[#C9A25D]">In Use</span><p className="text-xl font-medium text-[#C9A25D] mt-1">{inUse}</p>
            </div>
          </div>
          <div className={`flex p-1 border ${theme.border} rounded-sm`}>
            <button onClick={() => setAction('checkout')} className={`flex-1 py-2 text-xs uppercase tracking-wider transition-colors ${action === 'checkout' ? 'bg-[#C9A25D] text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>Check Out</button>
            <button onClick={() => setAction('return')} className={`flex-1 py-2 text-xs uppercase tracking-wider transition-colors ${action === 'return' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>Return</button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>{action === 'checkout' ? 'Quantity to Deploy' : 'Returned (Good)'}</label>
              <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} className={`w-full bg-transparent border-b ${theme.border} py-2 text-lg ${theme.text} focus:outline-none focus:border-[#C9A25D]`} placeholder="0" autoFocus />
            </div>
            {action === 'return' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] uppercase tracking-widest text-red-400 flex items-center gap-2"><AlertTriangle size={12}/> Damaged / Lost</label>
                <input type="number" value={lostAmount} onChange={(e) => { setLostAmount(e.target.value); setError(''); }} className="w-full bg-red-500/5 border-b border-red-500/30 py-2 text-lg text-red-500 placeholder-red-500/30 focus:outline-none focus:border-red-500" placeholder="0" />
              </div>
            )}
            {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={12}/> {error}</p>}
          </div>
        </div>
        <div className={`p-6 pt-0 flex justify-end gap-3`}>
           <button onClick={onClose} className={`px-4 py-2 text-xs uppercase ${theme.subText} hover:underline`}>Cancel</button>
           <button onClick={handleSubmit} className={`px-6 py-2 text-xs uppercase text-white transition-colors ${action === 'checkout' ? 'bg-[#C9A25D]' : 'bg-emerald-600'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const Inventory = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Inventory');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // States for UI Interaction
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Hook Data
  const { inventoryData, logsData, loading, error, addItem, updateItem, deleteItem, moveStock } = useInventory();
  const safeInventory = inventoryData || [];
  const safeLogs = logsData || [];

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    hoverBg: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
  };

  const categories = ["All", "Furniture", "Linens", "Dining", "Equipment", "Decorations", "Structures", "Miscellaneous"];

  const handleOpenAdd = () => { setEditingItem(null); setIsItemModalOpen(true); };
  const handleOpenEdit = (item) => { setEditingItem(item); setIsItemModalOpen(true); };
  const handleOpenStock = (item) => { setStockItem(item); setIsStockModalOpen(true); };
  
  const handleSaveItem = async (itemData, id) => {
    if (id) await updateItem(id, itemData);
    else await addItem({ ...itemData, sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}` });
  };

  const handleStockUpdate = async (itemId, action, quantity, lostQuantity) => {
    await moveStock(itemId, action, quantity, lostQuantity);
  };

  const filteredItems = safeInventory.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalItems = safeInventory.length;
  const lowStockCount = safeInventory.filter(i => ((i.stock?.quantityTotal || 0) - (i.stock?.quantityInUse || 0)) <= (i.stock?.threshold || 0)).length;
  const totalValue = safeInventory.reduce((acc, item) => acc + ((item.price || 0) * (item.stock?.quantityTotal || 0)), 0);

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap'); .font-serif { font-family: 'Cormorant Garamond', serif; } .font-sans { font-family: 'Inter', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Inventory Management" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Asset Count', value: totalItems, sub: 'Across 7 Categories', icon: Package },
              { label: 'Low Stock Alerts', value: lowStockCount, sub: 'Based on Available Qty', icon: AlertTriangle, isAlert: true },
              { label: 'Total Asset Value', value: `₱${totalValue.toLocaleString()}`, sub: 'Est. Current Value', icon: Tag },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} flex items-start justify-between group hover:border-[#C9A25D]/30 transition-all duration-500`}>
                  <div>
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                    <h3 className={`font-serif text-4xl mt-2 mb-1 ${stat.isAlert && stat.value > 0 ? 'text-red-400' : theme.text} h-10 flex items-center`}>{loading ? <Loader2 className="animate-spin text-[#C9A25D]" size={24} /> : stat.value}</h3>
                    <p className="text-xs text-stone-400">{stat.sub}</p>
                  </div>
                  <div className={`p-2 rounded-full ${theme.bg} ${stat.isAlert && stat.value > 0 ? 'text-red-400' : 'text-[#C9A25D]'}`}><stat.icon size={20} strokeWidth={1} /></div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={300}>
            {/* GRID LAYOUT: 70% ASSETS / 30% LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-[600px]">
              
              {/* --- LEFT: ASSETS TABLE (70%) --- */}
              <div className={`lg:col-span-7 flex flex-col border ${theme.border} ${theme.cardBg} shadow-sm rounded-sm overflow-hidden`}>
                
                {/* Assets Header */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                    <div>
                        <h3 className="font-serif text-2xl italic">Asset Overview</h3>
                        <p className={`text-xs ${theme.subText} mt-1`}>Manage equipment & supplies.</p>
                    </div>
                    
                    <div className="flex gap-2 relative">
                        {/* FILTER DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}
                            >
                                <Filter size={14} /> 
                                {categoryFilter === "All" ? "Filter" : categoryFilter}
                            </button>
                            {isFilterDropdownOpen && (
                                <div className={`absolute top-full right-0 mt-2 w-48 ${theme.cardBg} border ${theme.border} shadow-xl z-20 py-2 rounded-sm`}>
                                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 text-[10px] uppercase tracking-widest text-stone-400 font-bold">Category</div>
                                    {categories.map((cat) => (
                                        <button 
                                            key={cat}
                                            onClick={() => { setCategoryFilter(cat); setIsFilterDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-[#C9A25D] hover:text-white flex justify-between items-center ${categoryFilter === cat ? 'text-[#C9A25D] font-bold' : theme.text}`}
                                        >
                                            {cat}
                                            {categoryFilter === cat && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ADD BUTTON */}
                        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#1c1c1c] text-white px-4 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors shadow-md">
                            <Plus size={14} /> Add Item
                        </button>
                    </div>
                </div>

                {/* Assets Table */}
                <div className="flex-1 flex flex-col">
                    <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b ${theme.border} ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-50 text-stone-600'} text-[10px] uppercase tracking-[0.2em] font-semibold sticky top-0`}>
                        <div className="col-span-4">Item Name</div>
                        <div className="col-span-3 hidden md:block">Category</div>
                        <div className="col-span-3">Stock</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className={`divide-y divide-stone-100 dark:divide-stone-800 overflow-y-auto flex-1 h-0`}>
                        {loading ? ( <div className="h-full flex flex-col items-center justify-center text-stone-400"><Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" /><p className="text-xs uppercase">Loading Assets...</p></div> ) 
                        : filteredItems.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center text-center"><Package size={40} className="mx-auto text-stone-300 mb-4" /><p className="text-stone-400 italic">No items found.</p></div> ) 
                        : ( filteredItems.map((item) => {
                            const stock = item.stock || {};
                            const qtyTotal = stock.quantityTotal || 0;
                            const qtyInUse = stock.quantityInUse || 0;
                            const qtyAvailable = qtyTotal - qtyInUse;
                            const threshold = stock.threshold || 0;
                            const inUsePct = qtyTotal > 0 ? (qtyInUse / qtyTotal) * 100 : 0;

                            return (
                            <div key={item.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center group ${theme.hoverBg} transition-colors`}>
                                <div className="col-span-4">
                                    <span className={`font-serif text-base block leading-tight ${theme.text}`}>{item.name}</span>
                                    <span className="text-[10px] text-stone-400 font-mono">{item.sku}</span>
                                </div>
                                <div className="col-span-3 hidden md:block"><span className={`text-[9px] uppercase px-2 py-1 border rounded-sm ${theme.border} text-stone-500`}>{item.category}</span></div>
                                <div className="col-span-3">
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className={qtyAvailable <= threshold ? 'text-red-400 font-bold' : theme.text}>{qtyAvailable} Avail</span>
                                        <span className="text-[#C9A25D]">{qtyInUse} Out</span>
                                    </div>
                                    <div className={`w-full h-1 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'} rounded-full overflow-hidden flex`}>
                                        <div className="h-full bg-[#C9A25D] transition-all duration-1000" style={{ width: `${inUsePct}%` }}></div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-end items-center gap-1">
                                    <button onClick={() => handleOpenStock(item)} className={`p-1.5 rounded-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${theme.subText}`} title="Move Stock"><ArrowRightLeft size={14} /></button>
                                    <button onClick={() => handleOpenEdit(item)} className={`p-1.5 rounded-sm hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`} title="Edit"><Pencil size={14} /></button>
                                    <button onClick={() => deleteItem(item.id)} className={`p-1.5 rounded-sm hover:bg-red-500 hover:text-white transition-colors ${theme.subText}`} title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            );
                        }))}
                    </div>
                </div>
              </div>

              {/* --- RIGHT: LOGS SIDEBAR (30%) --- */}
              <div className={`lg:col-span-3 flex flex-col border ${theme.border} ${theme.cardBg} shadow-sm rounded-sm overflow-hidden`}>
                 <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="font-serif text-xl italic flex items-center gap-2"><History size={18} className="text-[#C9A25D]" /> Activity Log</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {safeLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <History size={32} className="mb-2" />
                            <p className="text-xs">No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-0 relative">
                            {/* Vertical Line */}
                            <div className={`absolute left-[13px] top-4 bottom-4 w-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

                            {safeLogs.map((log, i) => (
                                <div key={log.id || i} className="pl-8 pb-6 relative group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[10px] top-1.5 w-[7px] h-[7px] rounded-full z-10 
                                        ${log.action === 'checkout' ? 'bg-[#C9A25D]' : 'bg-emerald-500'}`}>
                                    </div>

                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${log.action === 'checkout' ? 'text-[#C9A25D]' : 'text-emerald-500'}`}>
                                            {log.action === 'checkout' ? 'Checked Out' : 'Returned'}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-50 text-[9px]">
                                            <Clock size={10} />
                                            {log.date ? new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </div>
                                    </div>
                                    
                                    <p className={`text-xs font-medium ${theme.text} mb-1 line-clamp-1`}>{log.itemName}</p>
                                    
                                    <div className="flex items-center gap-3 text-[10px]">
                                        <span className={`${theme.subText} font-mono`}>
                                            Qty: <span className={theme.text}>{log.quantityMoved}</span>
                                        </span>
                                        {log.quantityLost > 0 && (
                                            <span className="text-red-400 font-bold flex items-center gap-1">
                                                <AlertTriangle size={10} /> -{log.quantityLost} Lost
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

            </div>
          </FadeIn>
        </div>
      </main>

      <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSave={handleSaveItem} theme={theme} categories={categories} initialData={editingItem} />
      <StockMovementModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleStockUpdate} item={stockItem} theme={theme} />
    </div>
  );
};

export default Inventory;