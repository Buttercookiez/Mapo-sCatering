import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Filter, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Loader2, 
  Inbox,
  Search,
  X,
  Check
} from "lucide-react";

// Import shared helpers
import { renderStatusBadge, STATUS_CONFIG } from "./Utils/UIHelpers"; 

// --- COMPONENT: Booking List ---
const BookingList = ({
  bookings,
  isLoading,
  onSelectBooking,
  onOpenNewBooking,
  theme,
  darkMode,
}) => {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // --- FILTER LOGIC ---
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((b) => {
      // 1. Search Filter (Ref ID or Full Name)
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        b.refId.toLowerCase().includes(query) || 
        b.fullName.toLowerCase().includes(query);

      // 2. Status Filter
      const statusKey = b.status ? b.status.toUpperCase().replace(/\s+/g, '_') : 'DEFAULT';
      const matchesStatus = statusFilter === "ALL" || statusKey === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // --- HANDLERS ---
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-12 pb-12 overflow-hidden">
      
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #44403c; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C9A25D; }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #44403c transparent; }
        `}
      </style>

      {/* Header with Search & Filter Controls */}
      <div className="flex-none">
        <BookingHeader 
            theme={theme} 
            onOpenNewBooking={onOpenNewBooking}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            darkMode={darkMode}
        />
      </div>

      {/* Table Wrapper */}
      <div className={`flex-1 min-h-0 flex flex-col border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm transition-all duration-700 animate-in fade-in slide-in-from-bottom-4`}>
            
            {/* Table Column Headers */}
            <div
                className={`flex-none grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 select-none`}
            >
                <div className="col-span-2">Ref ID</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Event Date</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3 text-right">Status</div>
            </div>

            {/* Scrollable List */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${darkMode ? "divide-stone-800" : "divide-stone-100"}`}>
                
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400">
                        <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                        <p className="text-xs uppercase tracking-widest">Loading Bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    // Empty State: No bookings at all
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-full mb-4">
                            <Inbox size={24} className="text-stone-400" />
                        </div>
                        <h3 className={`font-serif text-xl ${theme.text}`}>No bookings found</h3>
                        <p className={`text-xs mt-2 ${theme.subText}`}>Create a new booking to get started.</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    // Empty State: No results from search/filter
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-full mb-4">
                            <Search size={24} className="text-stone-400" />
                        </div>
                        <h3 className={`font-serif text-lg ${theme.text}`}>No results found</h3>
                        <p className={`text-xs mt-2 ${theme.subText}`}>
                           Adjust your search or filters.
                        </p>
                        <button 
                          onClick={clearFilters}
                          className="mt-4 text-[10px] uppercase tracking-widest text-[#C9A25D] hover:underline"
                        >
                          Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className={`divide-y ${darkMode ? "divide-stone-800" : "divide-stone-100"}`}>
                        {filteredBookings.map((b) => (
                        <div
                            key={b.refId}
                            onClick={() => onSelectBooking(b)}
                            className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}
                        >
                            <div className={`col-span-2 text-xs font-mono tracking-wider group-hover:text-[#C9A25D] transition-colors ${theme.subText}`}>
                                {b.refId}
                            </div>
                            
                            <div className="col-span-3">
                                <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>
                                    {b.fullName}
                                </span>
                                <span className="text-[10px] text-stone-400 block mt-1">
                                    {b.estimatedGuests} Guests
                                </span>
                            </div>
                            
                            <div className={`col-span-2 text-xs ${theme.subText}`}>
                                {b.dateOfEvent}
                            </div>
                            
                            <div className="col-span-2">
                                <span className={`text-[10px] uppercase border ${theme.border} px-2 py-1 rounded-sm text-stone-500 bg-transparent`}>
                                    {b.eventType}
                                </span>
                            </div>
                            
                            <div className="col-span-3 flex justify-end items-center gap-4">
                                {renderStatusBadge(b.status)}
                                <ChevronRight
                                    size={16}
                                    className="text-stone-300 group-hover:text-[#C9A25D] transition-colors"
                                />
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

// --- SUB-COMPONENT: Custom Status Dropdown ---
const StatusFilterDropdown = ({ currentFilter, onSelect, theme, darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    // Determine label
    const selectedLabel = currentFilter === "ALL" 
      ? "All Statuses" 
      : STATUS_CONFIG[currentFilter]?.label || "Unknown";
  
    // Dropdown Background Logic (Hardcoded specifically to ensure opacity/color is correct on top of card)
    const dropdownBg = darkMode ? "bg-[#1c1c1c]" : "bg-white";
    const hoverBg = darkMode ? "hover:bg-stone-800" : "hover:bg-stone-50";
  
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-3 pl-3 pr-3 py-2.5 border ${theme.border} bg-transparent text-[10px] uppercase tracking-widest hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all ${theme.subText} min-w-[160px] rounded-sm`}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} />
            <span className="truncate max-w-[100px] text-left">{selectedLabel}</span>
          </div>
          <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
  
        {isOpen && (
          <div className={`absolute top-full right-0 mt-1 w-56 z-50 border ${theme.border} ${dropdownBg} shadow-2xl max-h-80 overflow-y-auto custom-scrollbar rounded-sm animate-in fade-in zoom-in-95 duration-200`}>
            <div className="py-1">
              <button
                onClick={() => { onSelect("ALL"); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-between group ${hoverBg}`}
              >
                <span className={`${currentFilter === "ALL" ? "text-[#C9A25D] font-bold" : theme.subText}`}>
                  All Statuses
                </span>
                {currentFilter === "ALL" && <Check size={12} className="text-[#C9A25D]" />}
              </button>
  
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => { onSelect(key); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-between group ${hoverBg}`}
                >
                  <span className={`flex items-center gap-2 ${currentFilter === key ? "text-[#C9A25D] font-bold" : theme.subText} group-hover:text-[#C9A25D]`}>
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                        {config.icon}
                    </span>
                    {config.label}
                  </span>
                  {currentFilter === key && <Check size={12} className="text-[#C9A25D]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

// --- HEADER COMPONENT ---
const BookingHeader = ({ 
  theme, 
  onOpenNewBooking, 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter,
  darkMode 
}) => (
  <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
    {/* Title Section */}
    <div className="w-full lg:w-auto">
      <h2 className={`font-serif text-3xl italic ${theme.text}`}>
        Bookings
      </h2>
      <p className={`text-xs mt-1 ${theme.subText}`}>
        Manage requests and proposals.
      </p>
    </div>

    {/* Actions Section */}
    <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
      
      {/* Search Bar */}
      <div className={`flex items-center border ${theme.border} rounded-sm px-3 py-2.5 bg-transparent focus-within:border-[#C9A25D] transition-colors flex-grow sm:flex-grow-0 sm:w-64`}>
        <Search size={14} className="text-stone-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ID or Name..."
          className={`bg-transparent border-none outline-none text-xs w-full placeholder:text-stone-500 ${theme.text}`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X size={14} className="text-stone-400 hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>

      {/* Custom Dropdown Replaces Native Select */}
      <StatusFilterDropdown 
        currentFilter={statusFilter}
        onSelect={setStatusFilter}
        theme={theme}
        darkMode={darkMode}
      />

      {/* New Booking Button */}
      <button
        onClick={onOpenNewBooking}
        className="flex items-center justify-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-md min-w-[140px]"
      >
        <Plus size={14} /> New Booking
      </button>
    </div>
  </div>
);

export default BookingList;