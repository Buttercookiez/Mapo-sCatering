import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowUpDown, AlertTriangle, 
  Package, Tag, Download, X, ChevronDown, 
  Trash2, Pencil, Search, Loader2 
} from 'lucide-react';

// --- FIXED IMPORTS ---
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';
import { useInventory } from '../../hooks/useInventory';

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

// --- 2. REUSABLE ITEM MODAL (ADD & EDIT) ---
const ItemModal = ({ isOpen, onClose, onSave, theme, categories, initialData }) => {
  const [formData, setFormData] = useState({
    name: '', category: '', price: '',
    quantity: '', unit: 'Pcs', threshold: ''
  });
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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

      <div className={`w-full max-w-xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col relative z-50`}>
        <div className={`p-8 border-b ${theme.border} flex justify-between items-center sticky top-0 ${theme.cardBg} z-20`}>
          <div>
            <h2 className={`font-serif text-3xl ${theme.text}`}>{initialData ? 'Edit Asset' : 'Add Item'}</h2>
            <p className={`text-xs ${theme.subText} mt-1`}>{initialData ? 'Update details below.' : 'Register new inventory.'}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"/></button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Item Name" className={inputBase} />
            </div>
            
            <div className="relative md:col-span-2 z-20">
               <button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                  <span className={formData.category ? theme.text : "text-stone-400"}>{formData.category || "Select Category"}</span>
                  <ChevronDown className="w-4 h-4 text-stone-400" />
               </button>
               
               <div className={`
                 absolute top-full left-0 w-full mt-1 p-2 shadow-xl z-50 border ${theme.border} ${theme.cardBg} max-h-48 overflow-y-auto transition-all duration-200 origin-top
                 ${categoryOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-0 pointer-events-none'}
               `}>
                  {categories.map(cat => (
                    <div 
                      key={cat} 
                      onClick={() => { setFormData(p => ({...p, category: cat})); setCategoryOpen(false); }} 
                      className={`text-xs p-2 hover:bg-[#C9A25D] hover:text-white cursor-pointer ${theme.text}`}
                    >
                      {cat}
                    </div>
                  ))}
               </div>
            </div>

            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" className={inputBase} />
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Stock Quantity" className={inputBase} />
            
            <div className="flex gap-4">
               <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit" className={`${inputBase} w-1/3`} />
               <input type="number" name="threshold" value={formData.threshold} onChange={handleChange} placeholder="Alert Threshold" className={`${inputBase} w-2/3`} />
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

// --- 3. MAIN COMPONENT ---
const Inventory = () => {
  // Persistence & Theme State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const [activeTab, setActiveTab] = useState('Inventory');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 

  // Custom Hook
  const { inventoryData, loading, error, addItem, updateItem, deleteItem } = useInventory();

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
    accent: 'text-[#C9A25D]',
    hoverBg: darkMode ? 'hover:bg-stone-900' : 'hover:bg-stone-50',
  };

  const categories = ["All", "Furniture", "Linens", "Dining", "Equipment", "Decorations", "Structures", "Miscellaneous"];

  // --- Handlers ---
  const handleOpenAdd = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (item) => { setEditingItem(item); setIsModalOpen(true); };

  const handleSave = async (itemData, id) => {
    if (id) {
      await updateItem(id, itemData);
    } else {
      const newItem = {
        ...itemData,
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`, 
      };
      await addItem(newItem);
    }
  };

  // --- Calculations ---
  // Ensure inventoryData is an array to prevent crashes during loading
  const safeInventory = inventoryData || [];

  const filteredItems = safeInventory.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = safeInventory.filter(i => 
    (i.stock?.quantityTotal || 0) <= (i.stock?.threshold || 0)
  ).length;
  
  const totalItems = safeInventory.length;
  
  const totalValue = safeInventory.reduce((acc, item) => {
    return acc + ((item.price || 0) * (item.stock?.quantityTotal || 0));
  }, 0);

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

      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Navbar */}
        <DashboardNavbar 
          activeTab="Inventory Management"
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
          
          {/* 1. Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Asset Count', value: totalItems, sub: 'Across 7 Categories', icon: Package },
              { label: 'Low Stock Alerts', value: lowStockCount, sub: 'Requires Re-order', icon: AlertTriangle, isAlert: true },
              { label: 'Total Asset Value', value: `$${totalValue.toLocaleString()}`, sub: 'Est. Current Value', icon: Tag },
            ].map((stat, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className={`p-6 border ${theme.border} ${theme.cardBg} flex items-start justify-between group hover:border-[#C9A25D]/30 transition-all duration-500`}>
                  <div>
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}>{stat.label}</span>
                    <h3 className={`font-serif text-4xl mt-2 mb-1 ${stat.isAlert ? 'text-red-400' : theme.text} h-10 flex items-center`}>
                       {/* Stats Loader */}
                       {loading ? <Loader2 className="animate-spin text-[#C9A25D]" size={24} /> : stat.value}
                    </h3>
                    <p className="text-xs text-stone-400">{stat.sub}</p>
                  </div>
                  <div className={`p-2 rounded-full ${theme.bg} ${stat.isAlert ? 'text-red-400' : 'text-[#C9A25D]'}`}>
                    <stat.icon size={20} strokeWidth={1} />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* 2. Main Inventory List */}
          <FadeIn delay={300}>
            <div className={`border ${theme.border} ${theme.cardBg} min-h-[600px] flex flex-col`}>
              
              {/* Header Toolbar */}
              <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h3 className="font-serif text-2xl italic">Asset Overview</h3>
                  <p className={`text-xs ${theme.subText} mt-1`}>Real-time tracking of equipment and supplies.</p>
                </div>
                
                {/* Filter & Actions */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                  
                  {/* Filter Pills */}
                  <div className={`flex flex-wrap gap-1 p-1 rounded-sm border ${theme.border} ${darkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`
                          px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all rounded-sm
                          ${categoryFilter === cat 
                            ? 'bg-[#C9A25D] text-white shadow-sm' 
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                          }
                        `}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleOpenAdd}
                      className="flex items-center gap-2 bg-[#1c1c1c] text-white px-4 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors"
                    >
                        <Plus size={14} /> Add Item
                    </button>
                    
                    <button className={`p-2.5 border ${theme.border} hover:text-[#C9A25D] transition-colors`}>
                        <Download size={16} strokeWidth={1} />
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE HEADER */}
              <div className={`
                grid grid-cols-12 gap-4 px-8 py-5 
                border-y ${theme.border} 
                ${darkMode ? 'bg-[#1c1c1c] text-stone-400' : 'bg-stone-100 text-stone-600'} 
                text-[11px] uppercase tracking-[0.2em] font-semibold
              `}>
                <div className="col-span-4 md:col-span-3 flex items-center gap-2 cursor-pointer hover:text-[#C9A25D] transition-colors">
                  Item Name <ArrowUpDown size={10} className="opacity-70"/>
                </div>
                <div className="col-span-2 hidden md:block">SKU</div>
                <div className="col-span-2 hidden md:block">Category</div>
                <div className="col-span-4 md:col-span-3">Stock Level</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Rows & Loading Logic */}
              <div className={`divide-y divide-stone-100 dark:divide-stone-800 flex-1`}>
                
                {loading ? (
                   // --- LOADING STATE ---
                   <div className="h-64 w-full flex flex-col items-center justify-center text-stone-400">
                      <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                      <p className="text-xs uppercase tracking-widest">Loading Inventory...</p>
                   </div>
                ) : error ? (
                   // --- ERROR STATE ---
                   <div className="h-64 w-full flex flex-col items-center justify-center text-red-400">
                      <AlertTriangle size={32} className="mb-4" />
                      <p className="text-xs uppercase tracking-widest">Failed to load data</p>
                   </div>
                ) : filteredItems.length === 0 ? (
                   // --- EMPTY STATE ---
                   <div className="py-20 text-center">
                      <Package size={40} strokeWidth={1} className="mx-auto text-stone-300 mb-4" />
                      <p className="font-serif italic text-stone-400">No items found in {categoryFilter}.</p>
                   </div>
                ) : (
                   // --- DATA MAPPING ---
                   filteredItems.map((item) => {
                    const stock = item.stock || {};
                    const qty = stock.quantityTotal || 0;
                    const threshold = stock.threshold || 0;
                    const unit = stock.unit || 'Pcs';

                    const percentage = threshold > 0 ? Math.min((qty / (threshold * 2)) * 100, 100) : 100;
                    const isLow = qty <= threshold;
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group ${theme.hoverBg} transition-colors`}
                      >
                        {/* Name */}
                        <div className="col-span-4 md:col-span-3">
                          <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>{item.name}</span>
                          <span className="text-[10px] text-stone-400 md:hidden block">{item.sku}</span>
                        </div>

                        {/* SKU */}
                        <div className={`col-span-2 hidden md:block text-xs ${theme.subText} font-mono tracking-wider`}>{item.sku}</div>

                        {/* Category */}
                        <div className="col-span-2 hidden md:block">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border rounded-sm ${theme.border} text-stone-500`}>
                            {item.category}
                          </span>
                        </div>

                        {/* Stock Visualizer */}
                        <div className="col-span-4 md:col-span-3">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className={isLow ? 'text-red-400 font-bold' : theme.text}>
                              {qty} <span className="text-[10px] text-stone-400 font-normal">{unit}</span>
                            </span>
                            <span className="text-[10px] text-stone-400">Min: {threshold}</span>
                          </div>
                          <div className={`w-full h-1.5 ${darkMode ? 'bg-stone-800' : 'bg-stone-200'} rounded-full overflow-hidden`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isLow ? 'bg-red-400' : 'bg-[#C9A25D]'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="col-span-4 md:col-span-2 flex justify-end items-center gap-3">
                          {isLow && (
                            <AlertTriangle size={14} className="text-red-500 mr-2 animate-pulse" />
                          )}
                          
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className={`p-1.5 rounded-sm hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.subText}`}
                            title="Edit Item"
                          >
                            <Pencil size={14} />
                          </button>

                          <button 
                            onClick={() => deleteItem(item.id)}
                            className={`p-1.5 rounded-sm hover:bg-red-500 hover:text-white transition-colors ${theme.subText}`}
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Footer Pagination */}
              <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
                 <span className={`text-[10px] uppercase tracking-widest ${theme.subText}`}>Showing {filteredItems.length} items</span>
                 <div className="flex gap-2">
                    <button className={`px-4 py-1.5 text-[10px] uppercase tracking-wider border ${theme.border} ${theme.subText} hover:text-[#C9A25D] transition-colors disabled:opacity-50`}>Prev</button>
                    <button className={`px-4 py-1.5 text-[10px] uppercase tracking-wider border ${theme.border} hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] transition-colors`}>Next</button>
                 </div>
              </div>

            </div>
          </FadeIn>

        </div>
      </main>

      {/* --- RENDER SHARED MODAL --- */}
      <ItemModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSave={handleSave}
         theme={theme}
         categories={categories}
         initialData={editingItem}
      />
    </div>
  );
};

export default Inventory;