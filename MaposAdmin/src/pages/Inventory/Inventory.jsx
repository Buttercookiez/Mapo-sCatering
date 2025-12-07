// src/pages/Inventory/Inventory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowUpDown, AlertTriangle, 
  Package, Tag, Download, X, ChevronDown, 
  Trash2, Pencil, Search, Loader2,
  ArrowRightLeft, History, FileText // New Icons
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
  const [viewMode, setViewMode] = useState('assets'); // 'assets' | 'logs' <--- NEW VIEW STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);

  // Get logsData from hook
  const { inventoryData, logsData, loading, error, addItem, updateItem, deleteItem, moveStock } = useInventory();
  const safeInventory = inventoryData || [];
  const safeLogs = logsData || [];

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

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
            <div className={`border ${theme.border} ${theme.cardBg} min-h-[600px] flex flex-col`}>
              
              {/* Toolbar with Toggle */}
              <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="font-serif text-2xl italic">Inventory System</h3>
                        <p className={`text-xs ${theme.subText} mt-1`}>Manage assets and track history.</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* VIEW TOGGLE */}
                    <div className={`flex p-1 rounded-sm border ${theme.border}`}>
                        <button onClick={() => setViewMode('assets')} className={`px-4 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${viewMode === 'assets' ? 'bg-[#C9A25D] text-white' : `${theme.subText} hover:bg-stone-100 dark:hover:bg-stone-800`}`}>Assets</button>
                        <button onClick={() => setViewMode('logs')} className={`px-4 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${viewMode === 'logs' ? 'bg-[#C9A25D] text-white' : `${theme.subText} hover:bg-stone-100 dark:hover:bg-stone-800`}`}>History Logs</button>
                    </div>

                    {viewMode === 'assets' && (
                        <>
                        <div className={`flex flex-wrap gap-1 p-1 rounded-sm border ${theme.border} ${darkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
                            {categories.map(cat => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all rounded-sm ${categoryFilter === cat ? 'bg-[#C9A25D] text-white shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>{cat}</button>
                            ))}
                        </div>
                        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#1c1c1c] text-white px-4 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors"><Plus size={14} /> Add Item</button>
                        </>
                    )}
                </div>
              </div>

              {/* ASSETS TABLE VIEW */}
              {viewMode === 'assets' && (
                  <>
                    <div className={`grid grid-cols-12 gap-4 px-8 py-5 border-y ${theme.border} ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} text-[11px] uppercase tracking-[0.2em] font-semibold`}>
                        <div className="col-span-4 md:col-span-3">Item Name</div>
                        <div className="col-span-2 hidden md:block">SKU</div>
                        <div className="col-span-2 hidden md:block">Category</div>
                        <div className="col-span-4 md:col-span-3">Stock Usage</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className={`divide-y divide-stone-100 dark:divide-stone-800 flex-1`}>
                        {loading ? ( <div className="h-64 flex flex-col items-center justify-center text-stone-400"><Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" /><p className="text-xs uppercase">Loading...</p></div> ) 
                        : filteredItems.length === 0 ? ( <div className="py-20 text-center"><Package size={40} className="mx-auto text-stone-300 mb-4" /><p className="text-stone-400 italic">No items found.</p></div> ) 
                        : ( filteredItems.map((item) => {
                            const stock = item.stock || {};
                            const qtyTotal = stock.quantityTotal || 0;
                            const qtyInUse = stock.quantityInUse || 0;
                            const qtyAvailable = qtyTotal - qtyInUse;
                            const threshold = stock.threshold || 0;
                            const inUsePct = qtyTotal > 0 ? (qtyInUse / qtyTotal) * 100 : 0;

                            return (
                            <div key={item.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors border-b border-stone-100/50 dark:border-stone-800/50`}>
                                <div className="col-span-4 md:col-span-3"><span className={`font-serif text-lg block leading-tight ${theme.text}`}>{item.name}</span><span className="text-[10px] text-stone-400 md:hidden block">{item.sku}</span></div>
                                <div className={`col-span-2 hidden md:block text-xs ${theme.subText} font-mono`}>{item.sku}</div>
                                <div className="col-span-2 hidden md:block"><span className={`text-[10px] uppercase px-2 py-1 border rounded-sm ${theme.border} text-stone-500`}>{item.category}</span></div>
                                <div className="col-span-4 md:col-span-3">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className={qtyAvailable <= threshold ? 'text-red-400 font-bold' : theme.text}>{qtyAvailable} <span className="text-[10px] text-stone-400">Avail</span></span>
                                    <span className="text-[#C9A25D]">{qtyInUse} <span className="text-[10px] text-stone-400">In Use</span></span>
                                </div>
                                <div className={`w-full h-1.5 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'} rounded-full overflow-hidden flex`}>
                                    <div className="h-full bg-[#C9A25D] transition-all duration-1000" style={{ width: `${inUsePct}%` }}></div>
                                </div>
                                {qtyAvailable <= threshold && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Low Stock</p>}
                                </div>
                                <div className="col-span-4 md:col-span-2 flex justify-end items-center gap-2">
                                <button onClick={() => handleOpenStock(item)} className={`p-1.5 rounded-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${theme.subText}`}><ArrowRightLeft size={14} /></button>
                                <button onClick={() => handleOpenEdit(item)} className={`p-1.5 rounded-sm hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}><Pencil size={14} /></button>
                                <button onClick={() => deleteItem(item.id)} className={`p-1.5 rounded-sm hover:bg-red-500 hover:text-white transition-colors ${theme.subText}`}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            );
                        }))}
                    </div>
                  </>
              )}

              {/* LOGS TABLE VIEW (NEW) */}
              {viewMode === 'logs' && (
                  <>
                     <div className={`grid grid-cols-12 gap-4 px-8 py-5 border-y ${theme.border} ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} text-[11px] uppercase tracking-[0.2em] font-semibold`}>
                        <div className="col-span-3">Timestamp</div>
                        <div className="col-span-3">Item</div>
                        <div className="col-span-2">Action</div>
                        <div className="col-span-2 text-right">Quantity</div>
                        <div className="col-span-2 text-right">Loss/Waste</div>
                    </div>
                    <div className={`divide-y divide-stone-100 dark:divide-stone-800 flex-1`}>
                        {safeLogs.length === 0 ? ( <div className="py-20 text-center"><History size={40} className="mx-auto text-stone-300 mb-4" /><p className="text-stone-400 italic">No history available.</p></div> ) 
                        : ( safeLogs.map((log) => (
                            <div key={log.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center ${theme.hoverBg} border-b border-stone-100/50 dark:border-stone-800/50`}>
                                <div className={`col-span-3 text-xs ${theme.subText}`}>{log.date ? log.date.toLocaleString() : 'Just now'}</div>
                                <div className={`col-span-3 font-medium ${theme.text}`}>{log.itemName}</div>
                                <div className="col-span-2">
                                    <span className={`text-[10px] uppercase px-2 py-1 rounded-sm border ${log.action === 'checkout' ? 'border-[#C9A25D]/30 text-[#C9A25D]' : 'border-emerald-500/30 text-emerald-500'}`}>
                                        {log.action}
                                    </span>
                                </div>
                                <div className={`col-span-2 text-right font-mono text-xs ${theme.text}`}>{log.quantityMoved}</div>
                                <div className={`col-span-2 text-right font-mono text-xs ${log.quantityLost > 0 ? 'text-red-500 font-bold' : theme.subText}`}>
                                    {log.quantityLost > 0 ? `-${log.quantityLost}` : '-'}
                                </div>
                            </div>
                        )))}
                    </div>
                  </>
              )}
              
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