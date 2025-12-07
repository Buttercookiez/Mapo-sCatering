import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calendar, Users, MapPin, 
  Minus, Plus, AlertTriangle, CheckCircle, 
  X, ChevronDown, Layers, Edit3, DollarSign, 
  Tag, Save, Trash2, FileText, Check, Loader2, Eye
} from 'lucide-react';

// --- CUSTOM IMPORTS ---
import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';

// --- SERVICES & HOOKS ---
import usePackages from '../../hooks/usePackage'; 
import { packageService } from '../../services/packageService';

// --- 1. CONSTANTS ---
const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];
const CATEGORIES = ["budget", "mid", "high"];
const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)" },
    { id: "selection2", label: "Classic (61-150 Pax)" },
    { id: "selection3", label: "Grand (150+ Pax)" }
];

// --- 2. HELPER COMPONENTS ---

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

// --- 3. REFACTORED MODAL (Handles Add, Edit, and View) ---

const PackageFormModal = ({ isOpen, onClose, packageData, onSave, isSaving, theme, mode }) => {
    const defaultForm = {
        name: '',
        pricePerHead: '', 
        description: '',
        inclusions: [''],
        eventType: EVENT_TYPES[0],
        categoryId: CATEGORIES[0],
        selectionId: SELECTIONS[0].id,
        selectionLabel: SELECTIONS[0].label
    };

    const [formData, setFormData] = useState(defaultForm);
    const isViewMode = mode === 'view';

    useEffect(() => {
        if (packageData) {
            setFormData({ ...packageData });
        } else {
            setFormData(defaultForm);
        }
    }, [packageData, isOpen]);

    if (!isOpen) return null;

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

    const handleSelectionChange = (e) => {
        const selected = SELECTIONS.find(s => s.id === e.target.value);
        setFormData({
            ...formData,
            selectionId: selected.id,
            selectionLabel: selected.label
        });
    };

    const inputClass = `w-full bg-transparent border-b ${theme.border} py-2 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text} disabled:opacity-50 disabled:cursor-not-allowed`;
    const selectClass = `w-full bg-transparent border-b ${theme.border} py-2 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text} appearance-none disabled:opacity-50 disabled:cursor-not-allowed`;
    const labelClass = "text-[10px] uppercase tracking-widest text-stone-400 mb-1 block";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
                    <div>
                        <h2 className={`font-serif text-2xl ${theme.text}`}>
                            {mode === 'create' ? 'Create New Package' : mode === 'edit' ? 'Edit Package' : 'Package Details'}
                        </h2>
                        {mode !== 'create' && <span className="text-xs text-[#C9A25D] uppercase tracking-widest">{formData.id}</span>}
                    </div>
                    <button onClick={onClose} disabled={isSaving} className="text-stone-400 hover:text-red-500"><X size={20}/></button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        
                        {/* --- ADD MODE: Selection Dropdowns --- */}
                        {mode === 'create' && (
                            <>
                                <div className="col-span-1">
                                    <label className={labelClass}>Event Type</label>
                                    <select 
                                        value={formData.eventType} 
                                        onChange={e => setFormData({...formData, eventType: e.target.value})} 
                                        className={selectClass}
                                    >
                                        {EVENT_TYPES.map(type => <option key={type} value={type} className="bg-white dark:bg-black">{type}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className={labelClass}>Category Tier</label>
                                    <select 
                                        value={formData.categoryId} 
                                        onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                                        className={selectClass}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-white dark:bg-black">{cat}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Pax Selection</label>
                                    <select 
                                        value={formData.selectionId} 
                                        onChange={handleSelectionChange} 
                                        className={selectClass}
                                    >
                                        {SELECTIONS.map(sel => <option key={sel.id} value={sel.id} className="bg-white dark:bg-black">{sel.label}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="col-span-2">
                            <label className={labelClass}>Package Name</label>
                            <input 
                                type="text" 
                                disabled={isViewMode}
                                placeholder="e.g. Wedding Budget Friendly - Lite" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className={`font-serif text-xl ${inputClass}`} 
                            />
                        </div>
                        
                        <div className="col-span-1">
                            <label className={labelClass}>Base Price (Per Head)</label>
                            <div className="relative">
                                <span className="absolute left-0 top-2 text-stone-400 text-sm">₱</span>
                                <input 
                                    type="number" 
                                    disabled={isViewMode}
                                    value={formData.pricePerHead} 
                                    onChange={e => setFormData({...formData, pricePerHead: e.target.value})} 
                                    className={`${inputClass} pl-4`} 
                                />
                            </div>
                        </div>

                        {/* --- EDIT/VIEW MODE: Read-only Tier Info --- */}
                        {mode !== 'create' && (
                            <div className="col-span-1">
                                <label className={labelClass}>Category Tier</label>
                                <input type="text" value={formData.category || formData.categoryId} disabled className={`${inputClass} opacity-50`} />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea 
                                rows={2} 
                                disabled={isViewMode}
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                className={`${inputClass} resize-none`} 
                            />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Inclusions</label>
                            <div className="space-y-3 mt-2">
                                {formData.inclusions && formData.inclusions.map((inc, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#C9A25D] flex-shrink-0"></div>
                                        <input 
                                            type="text" 
                                            disabled={isViewMode}
                                            value={inc} 
                                            onChange={(e) => handleInclusionChange(idx, e.target.value)}
                                            className={`flex-1 bg-stone-100 dark:bg-stone-900 px-3 py-2 rounded-sm text-sm ${theme.text} border border-transparent focus:border-[#C9A25D] focus:outline-none disabled:opacity-70`}
                                        />
                                        {!isViewMode && (
                                            <button onClick={() => removeInclusion(idx)} className="text-stone-400 hover:text-red-500 p-1">
                                                <Trash2 size={14}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {!isViewMode && (
                                    <button onClick={addInclusion} className="text-xs flex items-center gap-1 text-[#C9A25D] hover:underline mt-2">
                                        <Plus size={12}/> Add Inclusion
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${theme.border} flex justify-end gap-3 bg-stone-50 dark:bg-[#1a1a1a]`}>
                    <button onClick={onClose} disabled={isSaving} className={`px-4 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-200 dark:hover:bg-stone-800`}>
                        {isViewMode ? 'Close' : 'Cancel'}
                    </button>
                    
                    {!isViewMode && (
                        <button 
                            onClick={() => onSave(formData, mode === 'edit')} 
                            disabled={isSaving}
                            className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                            {isSaving ? "Saving..." : mode === 'edit' ? "Save Changes" : "Create Package"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 4. MAIN COMPONENT ---

const PackageEditor = () => {
  // Theme & Layout State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });
  
  // Data State
  const { packages, loading, error } = usePackages(); 

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [isSaving, setIsSaving] = useState(false);

  // Theme Effect
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

  const handleSave = async (data, isEdit) => {
      setIsSaving(true);
      try {
          // Ensure price is a number before saving
          const payload = {
              ...data,
              pricePerHead: Number(data.pricePerHead)
          };

          if (isEdit) {
              await packageService.update(data.id, payload);
          } else {
              const cleanEvent = data.eventType.replace(/\s+/g, '').toLowerCase();
              const newId = `${cleanEvent}-${data.categoryId}-${data.selectionId}`;
              
              const newPackageData = {
                  ...payload,
                  id: newId,
                  category: data.categoryId === 'budget' ? 'Budget Friendly' : data.categoryId === 'mid' ? 'Mid-Range' : 'High-End'
              };

              await packageService.create(newPackageData);
          }
          
          setIsModalOpen(false);
      } catch (err) {
          console.error("Failed to save:", err);
          alert("Error saving package. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeletePackage = async (id) => {
      if(!window.confirm("Are you sure you want to delete this package? This cannot be undone.")) return;
      try {
          await packageService.delete(id);
      } catch (err) {
          console.error("Failed to delete:", err);
          alert("Error deleting package.");
      }
  };

  const openAddModal = () => {
      setCurrentPackage(null); 
      setModalMode('create');
      setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
      setCurrentPackage(pkg);
      setModalMode('edit');
      setIsModalOpen(true);
  };

  // NEW: View Handler
  const openViewModal = (pkg) => {
      setCurrentPackage(pkg);
      setModalMode('view');
      setIsModalOpen(true);
  };

  // Filter Logic
  const filteredPackages = (packages || []).filter(pkg => {
      const pkgName = pkg.name || "";
      const pkgId = pkg.id || "";
      
      const matchesSearch = pkgName.toLowerCase().includes(searchQuery.toLowerCase()) || pkgId.includes(searchQuery.toLowerCase());
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
                   <p className={`text-xs mt-1 ${theme.subText}`}>
                       Manage pricing, inclusions, and details for {packages ? packages.length : 0} active packages.
                   </p>
                </div>
                
                <div className="flex gap-2">
                     <button 
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#C9A25D] text-white px-4 py-2 rounded-sm transition-colors shadow-md text-xs uppercase tracking-widest"
                     >
                        <Plus size={14} /> New Package
                     </button>
                </div>
             </div>

             {/* Filters */}
             <div className="flex flex-col gap-4">
                 <div className="flex bg-stone-100 dark:bg-stone-900 rounded-sm p-1 gap-1 w-fit">
                    <button onClick={() => setActiveFilter("All")} className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded-sm transition-all ${activeFilter === "All" ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#C9A25D]' : 'text-stone-400'}`}>All</button>
                    {EVENT_TYPES.slice(0, 3).map(type => (
                        <button key={type} onClick={() => setActiveFilter(type)} className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded-sm transition-all ${activeFilter === type ? 'bg-white dark:bg-[#2a2a2a] shadow-sm text-[#C9A25D]' : 'text-stone-400'}`}>
                            {type}
                        </button>
                    ))}
                </div>

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
        </div>

        {/* --- MAIN GRID CONTENT --- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-12 pb-12 custom-scrollbar">
            {loading ? (
                // --- LOADING STATE WITH GOLD SPINNER ---
                <div className="h-64 w-full flex flex-col items-center justify-center text-stone-400">
                    <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                    <p className="text-xs uppercase tracking-widest">Loading Packages...</p>
                </div>
            ) : error ? (
                <div className="h-64 w-full flex flex-col items-center justify-center text-red-400">
                    <AlertTriangle size={32} className="mb-4" />
                    <p className="text-xs uppercase tracking-widest">Failed to load data</p>
                </div>
            ) : (
                <FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPackages.map((pkg) => {
                            let borderColor = theme.border;
                            if(pkg.categoryId === 'high') borderColor = 'border-amber-200 dark:border-amber-900';
                            
                            return (
                                <div key={pkg.id} className={`group relative border ${borderColor} ${theme.cardBg} rounded-sm p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-stone-100 dark:bg-stone-800 text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm text-stone-500">
                                            {pkg.selectionLabel || "Standard"}
                                        </span>
                                        {pkg.categoryId === 'high' && <span className="text-[9px] uppercase tracking-widest text-amber-500 flex items-center gap-1"><CheckCircle size={10}/> Premium</span>}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className={`font-serif text-xl ${theme.text} leading-tight mb-2 group-hover:text-[#C9A25D] transition-colors`}>{pkg.name}</h3>
                                        <p className={`text-xs ${theme.subText} line-clamp-2 min-h-[2.5em]`}>{pkg.description}</p>
                                    </div>

                                    <div className="mb-6 flex-1">
                                        <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-2">Includes:</p>
                                        <ul className="space-y-1">
                                            {pkg.inclusions && pkg.inclusions.slice(0, 3).map((inc, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                                                    <Check size={12} className="mt-0.5 text-[#C9A25D] flex-shrink-0" /> 
                                                    <span className="line-clamp-1">{inc}</span>
                                                </li>
                                            ))}
                                            {pkg.inclusions && pkg.inclusions.length > 3 && (
                                                <li className="text-[10px] text-stone-400 pl-5 italic">+ {pkg.inclusions.length - 3} more items</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className={`pt-4 border-t ${theme.border} border-dashed flex items-center justify-between`}>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-widest text-stone-400">Price Per Head</span>
                                            <span className={`font-serif text-xl ${theme.text}`}>₱{pkg.pricePerHead?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* VIEW BUTTON */}
                                            <button 
                                                onClick={() => openViewModal(pkg)} 
                                                className="bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 p-2 rounded-sm transition-colors" 
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button 
                                                onClick={() => handleDeletePackage(pkg.id)} 
                                                className="bg-stone-100 dark:bg-stone-800 hover:bg-red-100 hover:text-red-500 text-stone-500 p-2 rounded-sm transition-colors" 
                                                title="Delete Package"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => openEditModal(pkg)} 
                                                className="bg-[#1c1c1c] hover:bg-[#C9A25D] text-white p-2 rounded-sm transition-colors shadow-md" 
                                                title="Edit Package"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </div>
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
            )}
        </div>

        {/* Unified Modal */}
        <PackageFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            packageData={currentPackage} 
            onSave={handleSave}
            isSaving={isSaving}
            theme={theme}
            mode={modalMode} // Pass the mode: 'create', 'edit', 'view'
        />

      </main>
    </div>
  );
};

export default PackageEditor;