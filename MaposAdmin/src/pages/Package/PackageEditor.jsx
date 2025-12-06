import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calendar, Users, MapPin, 
  Minus, Plus, AlertTriangle, CheckCircle, 
  X, ChevronDown, Layers, Edit3, DollarSign, 
  Tag, Save, Trash2, FileText, Check
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- 1. HELPER & CONSTANTS (Based on Seed Script) ---

const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

const CATEGORIES = [
    { id: "budget", name: "Budget Friendly", basePrice: 500, desc: "Quality catering essentials at an affordable price point.", inclusions: ["Buffet Service", "Iced Tea", "Basic Styling"] },
    { id: "mid", name: "Mid-Range", basePrice: 950, desc: "A perfect balance of premium flavors and elegant styling.", inclusions: ["Buffet or Plated", "Soup & Salad", "Themed Centerpieces", "Coffee Station"] },
    { id: "high", name: "High-End", basePrice: 1800, desc: "The ultimate VIP experience with signature chef creations.", inclusions: ["Full Plated Service", "Grazing Table", "Wine Pairing", "Luxury Styling", "Event Coordinator"] }
];

const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)", minPax: 30, maxPax: 60, priceMod: 1.15 },
    { id: "selection2", label: "Classic (61-150 Pax)", minPax: 61, maxPax: 150, priceMod: 1.0 },
    { id: "selection3", label: "Grand (150+ Pax)", minPax: 151, maxPax: 1000, priceMod: 0.90 }
];

// Generate Initial Data based on provided Seed Logic
const generateInitialPackages = () => {
    let packages = [];
    EVENT_TYPES.forEach(event => {
        CATEGORIES.forEach(category => {
            SELECTIONS.forEach(selection => {
                let eventMultiplier = 1.0;
                if (event === "Wedding") eventMultiplier = 1.25;
                if (event === "Corporate Gala") eventMultiplier = 1.15;
                if (event === "Private Dinner") eventMultiplier = 1.30;

                const finalPrice = Math.round(category.basePrice * selection.priceMod * eventMultiplier);
                const packageName = `${event} ${category.name} - ${selection.id === 'selection1' ? 'Lite' : selection.id === 'selection2' ? 'Classic' : 'Grand'}`;
                const docId = `${event.replace(/\s+/g, '').toLowerCase()}-${category.id}-${selection.id}`;

                packages.push({
                    id: docId,
                    eventType: event,
                    category: category.name,
                    categoryId: category.id, // budget, mid, high
                    selectionLabel: selection.label,
                    minPax: selection.minPax,
                    maxPax: selection.maxPax,
                    name: packageName,
                    description: category.desc,
                    pricePerHead: finalPrice,
                    inclusions: [
                        ...category.inclusions,
                        selection.id === 'selection3' ? "Free Lechon or Carving Station" : null
                    ].filter(Boolean)
                });
            });
        });
    });
    return packages;
};

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

// --- 2. MODALS ---

const EditPackageModal = ({ isOpen, onClose, packageData, onSave, theme }) => {
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (packageData) {
            setFormData({ ...packageData });
        }
    }, [packageData]);

    if (!isOpen || !formData) return null;

    const handleInclusionChange = (index, value) => {
        const newInclusions = [...formData.inclusions];
        newInclusions[index] = value;
        setFormData({ ...formData, inclusions: newInclusions });
    };

    const addInclusion = () => {
        setFormData({ ...formData, inclusions: [...formData.inclusions, ""] });
    };

    const removeInclusion = (index) => {
        const newInclusions = formData.inclusions.filter((_, i) => i !== index);
        setFormData({ ...formData, inclusions: newInclusions });
    };

    const inputClass = `w-full bg-transparent border-b ${theme.border} py-2 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text}`;
    const labelClass = "text-[10px] uppercase tracking-widest text-stone-400 mb-1 block";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
                    <div>
                        <h2 className={`font-serif text-2xl ${theme.text}`}>Edit Package</h2>
                        <span className="text-xs text-[#C9A25D] uppercase tracking-widest">{formData.id}</span>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-red-500"><X size={20}/></button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className={labelClass}>Package Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`font-serif text-xl ${inputClass}`} />
                        </div>
                        
                        <div className="col-span-1">
                            <label className={labelClass}>Base Price (Per Head)</label>
                            <div className="relative">
                                <span className="absolute left-0 top-2 text-stone-400 text-sm">₱</span>
                                <input type="number" value={formData.pricePerHead} onChange={e => setFormData({...formData, pricePerHead: Number(e.target.value)})} className={`${inputClass} pl-4`} />
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label className={labelClass}>Category Tier</label>
                            <input type="text" value={formData.category} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`${inputClass} resize-none`} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Inclusions</label>
                            <div className="space-y-3 mt-2">
                                {formData.inclusions.map((inc, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#C9A25D] flex-shrink-0"></div>
                                        <input 
                                            type="text" 
                                            value={inc} 
                                            onChange={(e) => handleInclusionChange(idx, e.target.value)}
                                            className={`flex-1 bg-stone-100 dark:bg-stone-900 px-3 py-2 rounded-sm text-sm ${theme.text} border border-transparent focus:border-[#C9A25D] focus:outline-none`}
                                        />
                                        <button onClick={() => removeInclusion(idx)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <button onClick={addInclusion} className="text-xs flex items-center gap-1 text-[#C9A25D] hover:underline mt-2">
                                    <Plus size={12}/> Add Inclusion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${theme.border} flex justify-end gap-3 bg-stone-50 dark:bg-[#1a1a1a]`}>
                    <button onClick={onClose} className={`px-4 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-200 dark:hover:bg-stone-800`}>Cancel</button>
                    <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm flex items-center gap-2">
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 3. MAIN COMPONENT ---

const PackageEditor = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });
  
  const [packages, setPackages] = useState(generateInitialPackages());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingPackage, setCurrentEditingPackage] = useState(null);

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

  // --- HANDLERS ---

  const handleSavePackage = (updatedPackage) => {
      setPackages(prev => prev.map(p => p.id === updatedPackage.id ? updatedPackage : p));
  };

  const openEditModal = (pkg) => {
      setCurrentEditingPackage(pkg);
      setIsEditModalOpen(true);
  };

  // Filter Logic
  const filteredPackages = packages.filter(pkg => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || pkg.id.includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === "All" || pkg.eventType === activeFilter;
      const matchesCategory = activeCategory === "All" || pkg.categoryId === activeCategory;
      return matchesSearch && matchesType && matchesCategory;
  });

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
        `}
      </style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Package Editor" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* --- HEADER --- */}
        <div className={`px-6 md:px-12 pt-8 pb-4 flex flex-col`}>
             <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
                <div>
                   <h2 className={`font-serif text-3xl italic ${theme.text}`}>Package Management</h2>
                   <p className={`text-xs mt-1 ${theme.subText}`}>Manage pricing, inclusions, and details for {packages.length} active packages.</p>
                </div>
                
                <div className="flex gap-2">
                    {/* Event Type Filter */}
                    <div className="flex bg-stone-100 dark:bg-stone-900 rounded-sm p-1 gap-1">
                        <button onClick={() => setActiveFilter("All")} className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded-sm transition-all ${activeFilter === "All" ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#C9A25D]' : 'text-stone-400'}`}>All</button>
                        {EVENT_TYPES.slice(0, 3).map(type => (
                            <button key={type} onClick={() => setActiveFilter(type)} className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded-sm transition-all ${activeFilter === type ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#C9A25D]' : 'text-stone-400'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             {/* Secondary Filter (Categories) */}
             <div className="flex gap-4 border-b ${theme.border} pb-4 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 py-1">Tier:</span>
                {["All", "budget", "mid", "high"].map(cat => (
                     <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] uppercase tracking-widest transition-colors ${activeCategory === cat ? 'text-[#C9A25D] font-bold border-b border-[#C9A25D]' : 'text-stone-500 hover:text-stone-300'}`}
                     >
                        {cat === 'budget' ? 'Budget Friendly' : cat === 'mid' ? 'Mid-Range' : cat === 'high' ? 'High-End' : 'All Tiers'}
                     </button>
                ))}
             </div>
        </div>

        {/* --- MAIN GRID CONTENT --- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-12 pb-12 custom-scrollbar">
            <FadeIn>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPackages.map((pkg) => {
                        // Dynamic Border Color based on Tier
                        let borderColor = theme.border;
                        if(pkg.categoryId === 'high') borderColor = 'border-amber-200 dark:border-amber-900';
                        
                        return (
                            <div key={pkg.id} className={`group relative border ${borderColor} ${theme.cardBg} rounded-sm p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                                
                                {/* Top Badges */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-stone-100 dark:bg-stone-800 text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm text-stone-500">
                                        {pkg.selectionLabel}
                                    </span>
                                    {pkg.categoryId === 'high' && <span className="text-[9px] uppercase tracking-widest text-amber-500 flex items-center gap-1"><CheckCircle size={10}/> Premium</span>}
                                </div>

                                {/* Content */}
                                <div className="mb-6">
                                    <h3 className={`font-serif text-xl ${theme.text} leading-tight mb-2 group-hover:text-[#C9A25D] transition-colors`}>
                                        {pkg.name}
                                    </h3>
                                    <p className={`text-xs ${theme.subText} line-clamp-2 min-h-[2.5em]`}>
                                        {pkg.description}
                                    </p>
                                </div>

                                {/* Inclusions Preview */}
                                <div className="mb-6 flex-1">
                                    <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-2">Includes:</p>
                                    <ul className="space-y-1">
                                        {pkg.inclusions.slice(0, 3).map((inc, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                                                <Check size={12} className="mt-0.5 text-[#C9A25D] flex-shrink-0" /> 
                                                <span className="line-clamp-1">{inc}</span>
                                            </li>
                                        ))}
                                        {pkg.inclusions.length > 3 && (
                                            <li className="text-[10px] text-stone-400 pl-5 italic">+ {pkg.inclusions.length - 3} more items</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Footer / Actions */}
                                <div className={`pt-4 border-t ${theme.border} border-dashed flex items-center justify-between`}>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest text-stone-400">Price Per Head</span>
                                        <span className={`font-serif text-xl ${theme.text}`}>₱{pkg.pricePerHead.toLocaleString()}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => openEditModal(pkg)}
                                        className="bg-[#1c1c1c] hover:bg-[#C9A25D] text-white p-2 rounded-sm transition-colors shadow-md"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredPackages.length === 0 && (
                    <div className="w-full h-64 flex flex-col items-center justify-center border border-dashed border-stone-300 dark:border-stone-800 rounded-sm">
                        <Search size={32} className="text-stone-300 mb-4" />
                        <p className="text-stone-400 text-sm">No packages match your filters.</p>
                    </div>
                )}
            </FadeIn>
        </div>

        {/* Edit Modal */}
        <EditPackageModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            packageData={currentEditingPackage}
            onSave={handleSavePackage}
            theme={theme}
        />

      </main>
    </div>
  );
};

export default PackageEditor;