import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calendar, Users, MapPin, 
  Utensils, Minus, Plus, 
  AlertTriangle, CheckCircle, Circle, 
  Clock, X, ChevronDown, Layers
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- 1. HELPER FUNCTIONS ---

const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// --- 2. SUB-COMPONENTS ---

// CUSTOM DROPDOWN COMPONENT
const CustomDropdown = ({ label, options, value, onChange, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] uppercase tracking-widest text-stone-400 mb-1 block">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-transparent border-b ${theme.border} py-2 text-sm cursor-pointer flex justify-between items-center hover:border-[#C9A25D] transition-colors ${theme.text}`}
            >
                <span>{value}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className={`absolute top-full left-0 w-full z-50 max-h-40 overflow-y-auto ${theme.cardBg} border ${theme.border} shadow-xl mt-1 custom-scrollbar`}>
                    {options.map((option) => (
                        <div 
                            key={option} 
                            onClick={() => { onChange(option); setIsOpen(false); }}
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#C9A25D] hover:text-white transition-colors ${theme.text}`}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Add Ingredient Modal
const AddIngredientModal = ({ isOpen, onClose, onSave, theme }) => {
    const [formData, setFormData] = useState({ name: '', unit: 'kg', category: 'Pantry', current: 0, max: 100 });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.name) return;
        onSave({ ...formData, id: `ing-${Date.now()}` });
        setFormData({ name: '', unit: 'kg', category: 'Pantry', current: 0, max: 100 }); 
        onClose();
    };

    const inputClass = `w-full bg-transparent border-b ${theme.border} py-2 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text}`;
    const unitOptions = ['kg', 'g', 'L', 'ml', 'pcs', 'btl', 'pk', 'bnch'];
    const categoryOptions = ['Meat', 'Seafood', 'Produce', 'Dairy', 'Pantry', 'Spices', 'Misc'];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} p-8 relative`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-red-500"><X size={20}/></button>
                
                <h2 className={`font-serif text-2xl ${theme.text} mb-6`}>Add New Ingredient</h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-stone-400">Ingredient Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="e.g. Saffron" />
                    </div>
                    
                    {/* Category Dropdown */}
                    <div>
                        <CustomDropdown 
                            label="Category" 
                            options={categoryOptions} 
                            value={formData.category} 
                            onChange={(val) => setFormData({...formData, category: val})}
                            theme={theme}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <CustomDropdown 
                                label="Unit" 
                                options={unitOptions} 
                                value={formData.unit} 
                                onChange={(val) => setFormData({...formData, unit: val})}
                                theme={theme}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] uppercase tracking-widest text-stone-400">Current</label>
                            <input type="number" value={formData.current} onChange={e => setFormData({...formData, current: Number(e.target.value)})} className={inputClass} />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] uppercase tracking-widest text-stone-400">Max Cap</label>
                            <input type="number" value={formData.max} onChange={e => setFormData({...formData, max: Number(e.target.value)})} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className={`px-4 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-100 dark:hover:bg-stone-800`}>Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm">Save Item</button>
                </div>
            </div>
        </div>
    );
};

const VisualStockBar = ({ current, max, theme }) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    
    let colorClass = "bg-stone-400"; 
    let textClass = "text-stone-400";
    
    if (percentage <= 25) {
        colorClass = "bg-red-400";
        textClass = "text-red-400";
    } else if (percentage <= 50) {
        colorClass = "bg-[#C9A25D]";
        textClass = "text-[#C9A25D]";
    }

    return (
        <div className="w-full flex flex-col justify-center h-full">
            <div className="relative w-full">
                <div className="flex justify-between absolute -top-5 w-full text-[10px] font-bold tracking-widest uppercase">
                    <span className={`${textClass}`}>{percentage < 30 ? 'Low Stock' : percentage < 70 ? 'Mid Stock' : 'Good'}</span>
                    <span className={`${textClass}`}>{Math.round(percentage)}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} transition-all duration-700 ease-out rounded-full`} style={{ width: `${percentage}%` }} />
                </div>
            </div>
        </div>
    );
};

// --- 3. MAIN COMPONENT ---

const Kitchen = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });
  
  const [activeTab, setActiveTab] = useState('Inventory'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [deductedItems, setDeductedItems] = useState([]); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- MOCK DATA UPDATED WITH CATEGORIES ---
  const [ingredients, setIngredients] = useState([
    { id: 'ing-1', name: 'Wagyu Beef Strips', unit: 'kg', category: 'Meat', current: 5, max: 20 }, 
    { id: 'ing-2', name: 'Truffle Oil', unit: 'btl', category: 'Pantry', current: 2, max: 10 }, 
    { id: 'ing-3', name: 'Heavy Cream', unit: 'L', category: 'Dairy', current: 18, max: 20 },
    { id: 'ing-4', name: 'Fresh Basil', unit: 'bnch', category: 'Produce', current: 12, max: 30 },
    { id: 'ing-5', name: 'Arborio Rice', unit: 'kg', category: 'Pantry', current: 9, max: 20 }, 
    { id: 'ing-6', name: 'Norwegian Salmon', unit: 'kg', category: 'Seafood', current: 19, max: 20 }, 
    { id: 'ing-7', name: 'Dark Chocolate', unit: 'kg', category: 'Pantry', current: 2, max: 10 }, 
    { id: 'ing-8', name: 'Gold Leaf Sheets', unit: 'pk', category: 'Pantry', current: 5, max: 50 }, 
  ]);

  const todaysDate = 'Oct 24, 2024';
  const bookings = [
    { id: 'BK-042', client: 'Sofia Alcantara', date: 'Oct 24, 2024', type: 'Wedding', venue: 'The Grand Glass Garden', guests: 150, packageId: 2, time: '6:00 PM' },
    { id: 'BK-055', client: 'Marco De Santos', date: 'Oct 24, 2024', type: 'Birthday', venue: 'Private Room A', guests: 20, packageId: 3, time: '7:30 PM' },
  ];

  const packageMenus = {
      2: { 
          name: 'Premium Plated', 
          items: [
              { name: 'Truffle Mushroom Risotto', ingredients: [{ id: 'ing-5', name: 'Arborio Rice', needed: 5 }, { id: 'ing-2', name: 'Truffle Oil', needed: 1 }] },
              { name: 'Seared Norwegian Salmon', ingredients: [{ id: 'ing-6', name: 'Norwegian Salmon', needed: 8 }, { id: 'ing-4', name: 'Fresh Basil', needed: 2 }] },
              { name: 'Angus Beef Medallions', ingredients: [{ id: 'ing-1', name: 'Wagyu Beef Strips', needed: 10 }] },
              { name: 'Roasted Asparagus', ingredients: [{ id: 'ing-4', name: 'Fresh Basil', needed: 1 }] },
              { name: 'Molten Lava Cake', ingredients: [{ id: 'ing-7', name: 'Dark Chocolate', needed: 3 }, { id: 'ing-3', name: 'Heavy Cream', needed: 2 }] }
          ]
      },
      3: { 
          name: 'Grand Gala Set', 
          items: [
              { name: 'Lobster Bisque', ingredients: [{ id: 'ing-3', name: 'Heavy Cream', needed: 5 }] },
              { name: 'Wagyu A5 Steak', ingredients: [{ id: 'ing-1', name: 'Wagyu Beef Strips', needed: 5 }, { id: 'ing-8', name: 'Gold Leaf Sheets', needed: 1 }] },
              { name: 'Truffle Mashed Potato', ingredients: [{ id: 'ing-2', name: 'Truffle Oil', needed: 2 }] },
              { name: 'Caesar Salad', ingredients: [{ id: 'ing-4', name: 'Fresh Basil', needed: 3 }] },
              { name: 'Gold Leaf Tiramisu', ingredients: [{ id: 'ing-3', name: 'Heavy Cream', needed: 4 }, { id: 'ing-8', name: 'Gold Leaf Sheets', needed: 2 }] }
          ]
      }
  };

  const todaysPackages = bookings.filter(b => b.date === todaysDate);

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

  // --- ACTIONS ---

  const handleAddIngredient = (newItem) => {
      setIngredients(prev => [...prev, newItem]);
  };

  const handleDeduct = (uniqueKey, ingredientId, amount) => {
      if (deductedItems.includes(uniqueKey)) return;
      setIngredients(prev => prev.map(ing => {
          if (ing.id === ingredientId) {
              const newVal = Math.max(0, ing.current - amount);
              return { ...ing, current: newVal };
          }
          return ing;
      }));
      setDeductedItems(prev => [...prev, uniqueKey]);
  };

  const handleManualInput = (id, value) => {
      const num = parseFloat(value) || 0;
      setIngredients(prev => prev.map(item => item.id === id ? { ...item, current: num } : item));
  };

  const handleIncrement = (id, amount) => {
    setIngredients(prev => prev.map(item => item.id === id ? { ...item, current: Math.max(0, item.current + amount) } : item));
  };

  // Filter and Group Ingredients for Inventory View
  const getFilteredAndGroupedIngredients = () => {
    const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Group by Category
    const grouped = filtered.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    return grouped;
  };

  const groupedInventory = getFilteredAndGroupedIngredients();
  const sortedCategories = Object.keys(groupedInventory).sort();

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #57534e; border-radius: 2px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C9A25D; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}
      </style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Kitchen Inventory & Menu" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* --- HEADER --- */}
        <div className={`px-6 md:px-12 pt-8 pb-4 flex flex-col`}>
             <div className="flex justify-between items-end mb-8">
                <div>
                   <h2 className={`font-serif text-3xl italic ${theme.text}`}>Kitchen Operations</h2>
                   <p className={`text-xs mt-1 ${theme.subText}`}>Manage stocks and view today's active menus.</p>
                </div>
                <div className="flex gap-4">
                    {activeTab === 'Inventory' && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-lg"
                        >
                            <Plus size={14} /> Add Ingredient
                        </button>
                    )}
                    <div className={`flex border ${theme.border} rounded-sm p-1 ${theme.cardBg}`}>
                        {['Inventory', 'Packages'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 text-[10px] uppercase tracking-widest transition-all rounded-sm ${activeTab === tab ? 'bg-[#1c1c1c] text-white shadow-md' : `${theme.subText} hover:text-[#C9A25D]`}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-12 pb-12 no-scrollbar">
            <FadeIn>
                {/* 1. INVENTORY VIEW WITH CATEGORIES */}
                {activeTab === 'Inventory' && (
                    <div className={`border ${theme.border} ${theme.cardBg} rounded-sm overflow-hidden`}>
                        <div className={`grid grid-cols-12 gap-6 px-8 py-4 border-b ${theme.border} bg-[#C9A25D]/10 text-[10px] uppercase tracking-widest font-bold text-stone-500`}>
                            <div className="col-span-4 flex items-center">Ingredient Name</div>
                            <div className="col-span-5 flex items-center">Stock Level</div>
                            <div className="col-span-3 text-right flex items-center justify-end">Adjustment</div>
                        </div>
                        
                        <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                            {sortedCategories.length > 0 ? sortedCategories.map(category => (
                                <React.Fragment key={category}>
                                    {/* Category Header */}
                                    <div className={`px-8 py-3 bg-stone-50 dark:bg-stone-900 border-y ${theme.border} flex items-center gap-2`}>
                                        <Layers size={14} className="text-[#C9A25D]" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{category}</span>
                                    </div>

                                    {/* Items in Category */}
                                    {groupedInventory[category].map((item) => (
                                        <div key={item.id} className={`grid grid-cols-12 gap-6 px-8 py-6 items-center group ${theme.hoverBg} transition-colors`}>
                                            <div className="col-span-4 flex flex-col justify-center">
                                                <p className={`font-serif text-lg ${theme.text} leading-tight`}>{item.name}</p>
                                                <p className="text-[10px] text-[#C9A25D] mt-1 font-sans font-medium">Per {item.unit}</p>
                                            </div>
                                            <div className="col-span-5 pr-4">
                                                <VisualStockBar current={item.current} max={item.max} theme={theme} />
                                            </div>
                                            <div className="col-span-3 flex justify-end items-center gap-3">
                                                <button onClick={() => handleIncrement(item.id, -1)} className={`w-8 h-8 flex items-center justify-center border ${theme.border} rounded-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors`}>
                                                    <Minus size={14} />
                                                </button>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={item.current} 
                                                        onChange={(e) => handleManualInput(item.id, e.target.value)}
                                                        className={`w-16 text-center bg-transparent border-b ${theme.border} py-1 text-base font-serif focus:border-[#C9A25D] focus:outline-none ${theme.text}`}
                                                    />
                                                    <span className="absolute -top-3 left-0 w-full text-center text-[8px] text-stone-400 uppercase">Qty</span>
                                                </div>
                                                <button onClick={() => handleIncrement(item.id, 1)} className={`w-8 h-8 flex items-center justify-center border ${theme.border} rounded-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors`}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            )) : (
                                <div className="p-8 text-center text-stone-400 text-sm">No ingredients found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. PACKAGES VIEW */}
                {activeTab === 'Packages' && (
                    <div className="space-y-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar size={18} className="text-[#C9A25D]" />
                            <h3 className={`font-serif text-2xl ${theme.text}`}>
                                Menu for Today <span className="text-stone-400 italic text-lg">({todaysDate})</span>
                            </h3>
                        </div>

                        {todaysPackages.length === 0 ? (
                            <div className={`p-12 text-center border border-dashed ${theme.border} rounded-sm`}>
                                <p className={theme.subText}>No active packages booked for today.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-12">
                                {todaysPackages.map((booking) => {
                                    const menu = packageMenus[booking.packageId];
                                    return (
                                        <div key={booking.id} className={`border ${theme.border} ${theme.cardBg} rounded-sm overflow-hidden flex flex-col md:flex-row shadow-sm h-[600px]`}>
                                            {/* LEFT: Package Info */}
                                            <div className="w-full md:w-80 flex-shrink-0 border-r border-stone-200 dark:border-stone-800 flex flex-col">
                                                <div className="p-8 border-b border-stone-100 dark:border-stone-800 bg-[#C9A25D]/5">
                                                    <span className="text-[10px] uppercase tracking-widest text-[#C9A25D] font-bold block mb-2">Selected Package</span>
                                                    <h4 className={`font-serif text-3xl ${theme.text}`}>{menu.name}</h4>
                                                    <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
                                                        <Clock size={14} /> {booking.time}
                                                    </div>
                                                </div>
                                                <div className={`p-8 flex-1 ${theme.cardBg} flex flex-col justify-center`}> 
                                                    <div className="space-y-8">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2"><Users size={12}/> Client (Who)</p>
                                                            <p className={`text-xl font-serif ${theme.text}`}>{booking.client}</p>
                                                            <p className={`text-xs ${theme.subText} mt-1`}>{booking.guests} Guests</p>
                                                        </div>
                                                        <div className={`w-full h-[1px] ${theme.border} border-t border-dashed`}></div>
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2"><MapPin size={12}/> Venue (Where)</p>
                                                            <p className={`text-lg font-serif ${theme.text}`}>{booking.venue}</p>
                                                            <p className={`text-xs ${theme.subText} mt-1`}>{booking.type}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Menu & Ingredients */}
                                            <div className="flex-1 p-8 flex flex-col min-w-0">
                                                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                                     <p className="text-[10px] uppercase tracking-widest text-stone-400">Course Breakdown & Ingredients</p>
                                                     <p className="text-[10px] uppercase tracking-widest text-red-400 flex items-center gap-1"><AlertTriangle size={10}/> Tap circle to deduct stock</p>
                                                </div>
                                                
                                                <div className="overflow-y-auto custom-scrollbar pr-4 space-y-6 flex-1">
                                                    {menu.items.map((dish, idx) => (
                                                        <div key={idx} className={`border ${theme.border} rounded-sm p-5`}>
                                                            <h5 className={`font-serif text-xl ${theme.text} mb-4 flex items-center gap-2`}>
                                                                <Utensils size={14} className="text-[#C9A25D]" /> {dish.name}
                                                            </h5>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {dish.ingredients.map((ing, i) => {
                                                                    const uniqueKey = `${booking.id}-${idx}-${ing.id}`;
                                                                    const isDeducted = deductedItems.includes(uniqueKey);
                                                                    const stockItem = ingredients.find(inv => inv.id === ing.id);
                                                                    const isCritical = stockItem && stockItem.current < ing.needed;

                                                                    // --- FIX: UPDATED BACKGROUND COLORS FOR DARK MODE ---
                                                                    // Using dark:bg-stone-900 instead of default/white in dark mode
                                                                    return (
                                                                        <div 
                                                                            key={i} 
                                                                            className={`
                                                                                flex items-center justify-between p-4 rounded-sm border transition-all duration-300 shadow-sm
                                                                                ${isDeducted 
                                                                                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                                                                                    : `bg-stone-50 border-stone-200 hover:border-[#C9A25D] dark:bg-stone-900 dark:border-stone-700 dark:hover:border-[#C9A25D]`
                                                                                }
                                                                            `}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`text-xs font-bold ${isDeducted ? 'text-emerald-500 line-through' : theme.text}`}>
                                                                                    {ing.name}
                                                                                </span>
                                                                                <span className="text-[10px] text-stone-400 mt-1">
                                                                                    Required: {ing.needed} {stockItem?.unit}
                                                                                </span>
                                                                                {isCritical && !isDeducted && <span className="text-[9px] text-red-500 font-bold uppercase mt-1">Insufficient Stock</span>}
                                                                            </div>

                                                                            <button 
                                                                                onClick={() => handleDeduct(uniqueKey, ing.id, ing.needed)}
                                                                                disabled={isDeducted}
                                                                                className={`
                                                                                    transition-all duration-300 transform active:scale-90
                                                                                    ${isDeducted ? 'text-emerald-500' : 'text-stone-300 hover:text-[#C9A25D]'}
                                                                                `}
                                                                            >
                                                                                {isDeducted ? <CheckCircle size={22} fill="currentColor" className="text-emerald-900/20"/> : <Circle size={22} strokeWidth={1.5} />}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </FadeIn>
        </div>

        <AddIngredientModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={handleAddIngredient}
            theme={theme} 
        />
      </main>
    </div>
  );
};

export default Kitchen;