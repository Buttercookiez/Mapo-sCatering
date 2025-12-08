// src/pages/Packages/PackageEditor.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Trash2,
  Loader2,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight, 
  Check,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import DashboardNavbar from "../../components/layout/Navbar";
import usePackages from "../../hooks/usePackage";
import { packageService } from "../../services/packageService";
import PackageFormModal from "./PackageFormModal";

const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

// --- ANIMATION COMPONENT ---
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const PackageEditor = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarState");
    return savedState !== null ? savedState === "true" : true;
  });

  const { packages, loading, error } = usePackages();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); 
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [isSaving, setIsSaving] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    cardBg: darkMode ? "bg-[#141414]" : "bg-white",
    text: darkMode ? "text-stone-200" : "text-stone-900",
    subText: darkMode ? "text-stone-500" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-300",
    accent: "text-[#C9A25D]",
  };

  // --- HANDLERS ---
  const handleSave = async (data, isEdit) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        pricePerHead: Number(data.pricePerHead),
        lastUpdated: new Date().toISOString() // Always update this
      };

      if (isEdit) {
        await packageService.update(data.id, payload);
      } else {
        const cleanEvent = data.eventType.replace(/\s+/g, "").toLowerCase();
        const sType = data.selectionLabel === "Service Only" ? "service" : "full";
        const newId = `${cleanEvent}-${sType}-${data.categoryId}-${data.selectionId}`;

        await packageService.create({ 
            ...payload, 
            id: newId,
            // 1. ADD CREATED AT TIMESTAMP
            createdAt: new Date().toISOString() 
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Error saving package.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await packageService.delete(id);
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Error deleting package.");
    }
  };

  const openAddModal = () => { setCurrentPackage(null); setModalMode("create"); setIsModalOpen(true); };
  const openEditModal = (pkg) => { setCurrentPackage(pkg); setModalMode("edit"); setIsModalOpen(true); };
  const openViewModal = (pkg) => { setCurrentPackage(pkg); setModalMode("view"); setIsModalOpen(true); };

  // --- FILTER & SORT LOGIC ---
  const filteredPackages = (packages || [])
    // 2. SORT BY DATE (Newest First)
    // This ensures that even if Firestore returns mixed order, the UI fixes it.
    .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.lastUpdated || 0);
        const dateB = new Date(b.createdAt || b.lastUpdated || 0);
        return dateB - dateA;
    })
    .filter((pkg) => {
        const pkgName = pkg.name || "";
        const pkgId = pkg.id || "";

        // Search
        const matchesSearch =
        pkgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkgId.includes(searchQuery.toLowerCase());
        
        // Event Type
        let matchesType = true;
        if (activeFilter !== "All") {
            if (activeFilter.includes(":")) {
                const [type, subtype] = activeFilter.split(":").map(s => s.trim());
                matchesType = (pkg.eventType === type) && (pkg.selectionLabel === subtype);
            } else {
                matchesType = pkg.eventType === activeFilter;
            }
        }

        // Category
        const matchesCategory = activeCategory === "All" || pkg.categoryId === activeCategory;
        
        return matchesSearch && matchesType && matchesCategory;
    });

  const handleSubSelection = (type, subtype, e) => {
    e.stopPropagation(); 
    setActiveFilter(`${type}: ${subtype}`);
    setIsFilterDropdownOpen(false);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text}`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #57534e; border-radius: 2px; }
      `}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar
          activeTab="Package Editor"
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* --- HEADER --- */}
        <div className="px-6 md:px-12 pt-8 pb-4 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
            <div>
              <h2 className={`font-serif text-3xl italic ${theme.text}`}>Package Management</h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>
                Manage {packages ? packages.length : 0} active packages.
              </p>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#C9A25D] text-white px-4 py-2 rounded-sm transition-colors shadow-md text-xs uppercase tracking-widest h-fit">
              <Plus size={14} /> New Package
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            
            {/* EVENT FILTER */}
            <div className="relative z-30" ref={dropdownRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-3 px-4 py-2 border ${theme.border} ${theme.cardBg} min-w-[180px] justify-between text-xs uppercase tracking-widest hover:border-[#C9A25D] transition-colors rounded-sm`}
              >
                <span className="flex items-center gap-2">
                  <Filter size={14} className="text-[#C9A25D]" />
                  {activeFilter === "All" ? "All Events" : activeFilter.split(":")[0]}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterDropdownOpen ? "rotate-180" : ""}`}/>
              </button>

              {isFilterDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 w-full min-w-[200px] ${theme.cardBg} border ${theme.border} shadow-xl rounded-sm py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50`}>
                  <button
                    onClick={() => { setActiveFilter("All"); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#C9A25D]/10 hover:text-[#C9A25D] transition-colors flex justify-between items-center ${activeFilter === "All" ? "text-[#C9A25D]" : theme.text}`}
                  >
                    All Events
                    {activeFilter === "All" && <Check size={12} />}
                  </button>
                  <div className={`h-[1px] my-1 mx-4 ${theme.border} bg-stone-100 dark:bg-stone-800`}></div>
                  {EVENT_TYPES.map((type) => (
                    <div key={type} className="group relative w-full">
                      <button
                        onClick={() => { setActiveFilter(type); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#C9A25D]/10 hover:text-[#C9A25D] transition-colors flex justify-between items-center ${activeFilter === type ? "text-[#C9A25D]" : theme.subText}`}
                      >
                        {type}
                        <div className="flex items-center">
                          {activeFilter === type && <Check size={12} className="mr-2" />}
                          <ChevronRight size={12} />
                        </div>
                      </button>
                      <div className="absolute left-full top-0 ml-1 w-48 hidden group-hover:block z-50">
                        <div className={`rounded-sm border ${theme.border} ${theme.cardBg} shadow-xl py-2`}>
                          <button
                            onClick={(e) => handleSubSelection(type, "Full Service", e)}
                            className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#C9A25D]/10 hover:text-[#C9A25D] transition-colors ${theme.subText}`}
                          >
                            Full Service
                          </button>
                          <button
                            onClick={(e) => handleSubSelection(type, "Service Only", e)}
                            className={`w-full text-left px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#C9A25D]/10 hover:text-[#C9A25D] transition-colors ${theme.subText}`}
                          >
                            Service Only
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tier Pills */}
            <div className={`flex items-center gap-1 p-1 rounded-sm border ${theme.border} ${theme.cardBg}`}>
              {["All", "budget", "mid", "high"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-[10px] uppercase tracking-widest rounded-sm transition-all duration-300 ${activeCategory === cat ? "bg-stone-100 dark:bg-stone-800 text-[#C9A25D] font-bold shadow-sm" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"}`}
                >
                  {cat === "All" ? "All Tiers" : cat === "budget" ? "Budget" : cat === "mid" ? "Mid" : "High"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- GRID CONTENT --- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-12 pb-12 custom-scrollbar">
          {loading ? (
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
            <>
              {filteredPackages.length === 0 ? (
                <div className="w-full h-64 flex flex-col items-center justify-center border border-dashed border-stone-300 dark:border-stone-800 rounded-sm">
                  <Search size={32} className="text-stone-300 mb-4" />
                  <p className="text-stone-400 text-sm">No packages match your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                  {filteredPackages.map((pkg) => {
                    let borderColor = theme.border;
                    if (pkg.categoryId === "high") borderColor = "border-amber-200 dark:border-amber-900";

                    return (
                      <div key={pkg.id} className={`group relative border ${borderColor} ${theme.cardBg} rounded-sm p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2">
                             <span className="text-[10px] uppercase tracking-widest py-1 bg-transparent text-stone-500 dark:text-white font-bold">
                               {pkg.selectionLabel || "Standard"}
                             </span>
                             {pkg.paxLabel && (
                               <span className="text-[10px] uppercase tracking-widest py-1 text-stone-400">
                                 ({pkg.paxLabel})
                               </span>
                             )}
                          </div>
                          {pkg.categoryId === "high" && (
                            <span className="text-[9px] uppercase tracking-widest text-amber-500 flex items-center gap-1">
                              <CheckCircle size={10} /> Premium
                            </span>
                          )}
                        </div>

                        <div className="mb-6">
                          <h3 className={`font-serif text-xl ${theme.text} leading-tight mb-2 group-hover:text-[#C9A25D] transition-colors`}>{pkg.name}</h3>
                          <p className={`text-xs ${theme.subText} line-clamp-2 min-h-[2.5em]`}>{pkg.description}</p>
                        </div>

                        <div className="mb-6 flex-1">
                          <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-2">Includes:</p>
                          <ul className="space-y-1">
                            {pkg.inclusions?.slice(0, 3).map((inc, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                                <Check size={12} className="mt-0.5 text-[#C9A25D] flex-shrink-0" />
                                <span className="line-clamp-1">{inc}</span>
                              </li>
                            ))}
                            {pkg.inclusions?.length > 3 && (
                              <li className="text-[10px] text-stone-400 pl-5 italic">+ {pkg.inclusions.length - 3} more items</li>
                            )}
                          </ul>
                        </div>

                        <div className={`pt-4 border-t ${theme.border} border-dashed flex items-center justify-between`}>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-stone-400">Price Per Head</span>
                            <span className={`font-serif text-xl ${theme.text}`}>₱{pkg.pricePerHead?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openViewModal(pkg)} className="p-2 rounded-sm border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent"><Eye size={16} /></button>
                            <button onClick={() => handleDeletePackage(pkg.id)} className="p-2 rounded-sm border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-red-500 hover:border-red-500 transition-all bg-transparent"><Trash2 size={16} /></button>
                            <button onClick={() => openEditModal(pkg)} className="p-2 rounded-sm border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent"><Edit3 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <PackageFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageData={currentPackage}
          onSave={handleSave}
          isSaving={isSaving}
          theme={theme}
          mode={modalMode}
        />
      </main>
    </div>
  );
};

export default PackageEditor;