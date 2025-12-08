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
const FadeIn = ({ children, delay = 0, className = "" }) => {
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
      } ${className}`}
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

// --- UPDATED MODAL: STOCK MOVEMENT (Fixed UI) ---
const StockMovementModal = ({ isOpen, onClose, onSave, item, theme }) => {
  const [action, setAction] = useState('checkout'); // 'checkout' or 'return'
  const [amount, setAmount] = useState('');
  const [lostAmount, setLostAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { 
    setAmount(''); 
    setLostAmount(''); 
    setError(''); 
    setAction('checkout'); 
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Stock Calculations
  const total = item.stock?.quantityTotal || 0;
  const inUse = item.stock?.quantityInUse || 0;
  const available = total - inUse;

  // Helper to set max amount
  const handleSetMax = () => {
    setAmount(action === 'checkout' ? available.toString() : inUse.toString());
    setError('');
  };

  const handleSubmit = () => {
    const val = parseInt(amount) || 0;
    const lostVal = parseInt(lostAmount) || 0;

    if (val <= 0 && lostVal <= 0) { 
      setError("Please enter a quantity greater than 0."); 
      return; 
    }

    if (action === 'checkout') {
      if (val > available) { 
        setError(`Only ${available} items are available.`); 
        return; 
      }
      onSave(item.id, 'checkout', val, 0);
    } else {
      const totalReturning = val + lostVal;
      if (totalReturning > inUse) { 
        setError(`Only ${inUse} are currently out.`); 
        return; 
      }
      onSave(item.id, 'return', val, lostVal);
    }
    onClose();
  };

  // UI Colors
  const accentColor = action === 'checkout' ? 'text-[#C9A25D]' : 'text-emerald-500';
  const borderColor = action === 'checkout' ? 'focus:border-[#C9A25D]' : 'focus:border-emerald-500';
  const btnBg = action === 'checkout' ? 'bg-[#C9A25D] hover:bg-[#b08d4d]' : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Main Modal Card */}
      <div className={`w-full max-w-md ${theme.cardBg} rounded-xl shadow-2xl border ${theme.border} relative z-50 animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <h3 className={`font-serif text-2xl ${theme.text}`}>Manage Stock</h3>
          <p className={`text-sm ${theme.subText} mt-1 font-medium`}>{item.name}</p>
        </div>

        <div className="px-6 py-4 space-y-8">
          
          {/* 1. Toggle Switch */}
          <div className={`flex p-1 rounded-lg border ${theme.border} ${theme.bg}`}>
            <button 
              onClick={() => setAction('checkout')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${action === 'checkout' ? 'bg-[#C9A25D] text-white shadow-md' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Release
            </button>
            <button 
              onClick={() => setAction('return')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${action === 'return' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Restock
            </button>
          </div>

          {/* 2. Context Stats */}
          <div className="flex justify-between text-sm px-2">
            <div className="text-center w-1/2 border-r border-stone-800">
              <span className="block text-[10px] uppercase tracking-widest text-stone-500">Available</span>
              <span className={`block text-lg font-bold mt-1 ${theme.text}`}>{available}</span>
            </div>
            <div className="text-center w-1/2">
              <span className="block text-[10px] uppercase tracking-widest text-stone-500">In Use</span>
              <span className={`block text-lg font-bold mt-1 ${action === 'return' ? 'text-white' : 'text-stone-500'}`}>{inUse}</span>
            </div>
          </div>

          {/* 3. Hero Input Section */}
          <div className="space-y-4">
            
            {/* CSS to hide ugly browser spinners */}
            <style>
              {`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                  -webkit-appearance: none; 
                  margin: 0; 
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
              `}
            </style>

            <div className="relative group">
              <label className={`block text-center text-[10px] uppercase tracking-widest mb-2 ${accentColor}`}>
                {action === 'checkout' ? 'Quantity to Release' : 'Quantity Returning'}
              </label>
              
              <div className="relative w-3/4 mx-auto flex items-center justify-center">
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => { setAmount(e.target.value); setError(''); }} 
                  className={`w-full bg-transparent border-b-2 border-stone-700 ${borderColor} py-2 text-center text-4xl font-bold ${theme.text} focus:outline-none transition-colors placeholder-stone-700`} 
                  placeholder="0" 
                  autoFocus 
                />
                
                {/* Fixed "MAX" Button - Vertically Centered & Spinner Free */}
                <button 
                  onClick={handleSetMax}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] uppercase font-extrabold text-stone-500 hover:text-white bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded-sm transition-all shadow-sm"
                  title="Select All Available"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Lost/Damaged Input (Only for Returns) */}
            {action === 'return' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-3/4 mx-auto flex items-center justify-center gap-4">
                  <label className="text-[10px] uppercase tracking-widest text-red-400 whitespace-nowrap">Lost / Damaged:</label>
                  <input 
                    type="number" 
                    value={lostAmount} 
                    onChange={(e) => { setLostAmount(e.target.value); setError(''); }} 
                    className="w-16 bg-transparent border-b border-red-900 focus:border-red-500 py-1 text-center text-lg font-bold text-red-500 focus:outline-none placeholder-red-900/50" 
                    placeholder="0" 
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded-full border border-red-900/50">
                  <AlertTriangle size={12} /> {error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${theme.border} flex justify-between items-center gap-4`}>
           <button 
             onClick={onClose} 
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-md border ${theme.border} ${theme.text} hover:bg-stone-800 transition-colors`}
           >
             Cancel
           </button>
           <button 
             onClick={handleSubmit} 
             className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-md text-white shadow-lg transition-transform active:scale-95 ${btnBg}`}
           >
             Confirm
           </button>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #57534e; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C9A25D; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #57534e transparent; }
      `}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Inventory Management" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 flex flex-col p-6 md:p-12 pb-12 overflow-hidden gap-8">
          
          {/* STATS ROW */}
          <div className="flex-none">
            <FadeIn>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Asset Count', value: totalItems, sub: 'Across 7 Categories', icon: Package },
                  { label: 'Low Stock Alerts', value: lowStockCount, sub: 'Based on Available Qty', icon: AlertTriangle, isAlert: true },
                  { label: 'Total Asset Value', value: `₱${totalValue.toLocaleString()}`, sub: 'Est. Current Value', icon: Tag },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-6 border ${theme.border} ${theme.cardBg} flex items-start justify-between group hover:border-[#C9A25D]/30 transition-all duration-500`}>
                    <div>
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                      <h3 className={`font-serif text-4xl mt-2 mb-1 ${stat.isAlert && stat.value > 0 ? 'text-red-400' : theme.text} h-10 flex items-center`}>{loading ? <Loader2 className="animate-spin text-[#C9A25D]" size={24} /> : stat.value}</h3>
                      <p className="text-xs text-stone-400">{stat.sub}</p>
                    </div>
                    <div className={`p-2 rounded-full ${theme.bg} ${stat.isAlert && stat.value > 0 ? 'text-red-400' : 'text-[#C9A25D]'}`}><stat.icon size={20} strokeWidth={1} /></div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* TABLES CONTAINER */}
          <div className="flex-1 min-h-0">
            <FadeIn delay={300} className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
                
                {/* ASSETS TABLE */}
                <div className={`lg:col-span-7 flex flex-col border ${theme.border} ${theme.cardBg} shadow-sm rounded-sm overflow-hidden h-full`}>
                  <div className="flex-none p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                      <div><h3 className="font-serif text-2xl italic">Asset Overview</h3><p className={`text-xs ${theme.subText} mt-1`}>Manage equipment & supplies.</p></div>
                      <div className="flex gap-2 relative">
                          <div className="relative" ref={dropdownRef}>
                              <button onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}><Filter size={14} /> {categoryFilter === "All" ? "Filter" : categoryFilter}</button>
                              {isFilterDropdownOpen && (
                                  <div className={`absolute top-full right-0 mt-2 w-48 ${theme.cardBg} border ${theme.border} shadow-xl z-20 py-2 rounded-sm`}>
                                      <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 text-[10px] uppercase tracking-widest text-stone-400 font-bold">Category</div>
                                      {categories.map((cat) => (<button key={cat} onClick={() => { setCategoryFilter(cat); setIsFilterDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-[#C9A25D] hover:text-white flex justify-between items-center ${categoryFilter === cat ? 'text-[#C9A25D] font-bold' : theme.text}`}>{cat}{categoryFilter === cat && <Check size={12} />}</button>))}
                                  </div>
                              )}
                          </div>
                          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#1c1c1c] text-white px-4 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors shadow-md"><Plus size={14} /> Add Item</button>
                      </div>
                  </div>
                  <div className={`flex-none grid grid-cols-12 gap-4 px-6 py-4 border-b ${theme.border} ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-50 text-stone-600'} text-[10px] uppercase tracking-[0.2em] font-semibold sticky top-0`}>
                      <div className="col-span-4">Item Name</div>
                      <div className="col-span-3 hidden md:block">Category</div>
                      <div className="col-span-3">Stock</div>
                      <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <div className={`flex-1 overflow-y-auto custom-scrollbar divide-y divide-stone-100 dark:divide-stone-800`}>
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
                              <div className="col-span-4"><span className={`font-serif text-base block leading-tight ${theme.text}`}>{item.name}</span><span className="text-[10px] text-stone-400 font-mono">{item.sku}</span></div>
                              <div className="col-span-3 hidden md:block"><span className={`text-[9px] uppercase px-2 py-1 border rounded-sm ${theme.border} text-stone-500`}>{item.category}</span></div>
                              <div className="col-span-3">
                                  <div className="flex justify-between text-[10px] mb-1"><span className={qtyAvailable <= threshold ? 'text-red-400 font-bold' : theme.text}>{qtyAvailable} Avail</span><span className="text-[#C9A25D]">{qtyInUse} Out</span></div>
                                  <div className={`w-full h-1 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'} rounded-full overflow-hidden flex`}><div className="h-full bg-[#C9A25D] transition-all duration-1000" style={{ width: `${inUsePct}%` }}></div></div>
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

                {/* LOGS SIDEBAR */}
                <div className={`lg:col-span-3 flex flex-col border ${theme.border} ${theme.cardBg} shadow-sm rounded-sm overflow-hidden h-full`}>
                   <div className="flex-none p-6 border-b border-stone-100 dark:border-stone-800"><h3 className="font-serif text-xl italic flex items-center gap-2"><History size={18} className="text-[#C9A25D]" /> Activity Log</h3></div>
                   <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      {safeLogs.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center text-center opacity-50"><History size={32} className="mb-2" /><p className="text-xs">No recent activity</p></div> ) : (
                          <div className="space-y-0 relative">
                              <div className={`absolute left-[13px] top-4 bottom-4 w-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`}></div>
                              {safeLogs.map((log, i) => (
                                  <div key={log.id || i} className="pl-8 pb-6 relative group">
                                      <div className={`absolute left-[10px] top-1.5 w-[7px] h-[7px] rounded-full z-10 ${log.action === 'checkout' ? 'bg-[#C9A25D]' : 'bg-emerald-500'}`}></div>
                                      <div className="flex justify-between items-start mb-1"><span className={`text-[10px] uppercase font-bold tracking-wider ${log.action === 'checkout' ? 'text-[#C9A25D]' : 'text-emerald-500'}`}>{log.action === 'checkout' ? 'Checked Out' : 'Returned'}</span><div className="flex items-center gap-1 opacity-50 text-[9px]"><Clock size={10} />{log.date ? new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div></div>
                                      <p className={`text-xs font-medium ${theme.text} mb-1 line-clamp-1`}>{log.itemName}</p>
                                      <div className="flex items-center gap-3 text-[10px]"><span className={`${theme.subText} font-mono`}>Qty: <span className={theme.text}>{log.quantityMoved}</span></span>{log.quantityLost > 0 && (<span className="text-red-400 font-bold flex items-center gap-1"><AlertTriangle size={10} /> -{log.quantityLost} Lost</span>)}</div>
                                  </div>
                              ))}
                          </div>
                      )}
                   </div>
                </div>

              </div>
            </FadeIn>
          </div>

        </div>
      </main>

      <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSave={handleSaveItem} theme={theme} categories={categories} initialData={editingItem} />
      <StockMovementModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleStockUpdate} item={stockItem} theme={theme} />
    </div>
  );
};

export default Inventory;