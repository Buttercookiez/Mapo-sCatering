import React, { useState, useEffect } from "react";
import { Filter, Plus, ChevronRight, Loader2, Inbox } from "lucide-react";
import { renderStatusBadge } from "./Utils/UIHelpers";

const BookingList = ({
  bookings,
  isLoading,
  onSelectBooking,
  onOpenNewBooking,
  theme,
  darkMode,
}) => {
  
  // No pagination logic needed anymore since we show all clients

  return (
    // 1. MAIN CONTAINER: Fixed Height (h-full) with Padding
    <div className="h-full flex flex-col p-6 md:p-12 pb-12 overflow-hidden">
      
      {/* --- ADDED STYLE BLOCK FOR CUSTOM SCROLLBAR --- */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #44403c; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C9A25D; }
          /* Firefox fallback */
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #44403c transparent; }
        `}
      </style>

      {/* Page Header (Fixed at Top) */}
      <div className="flex-none">
        <BookingHeader 
            theme={theme} 
            onOpenNewBooking={onOpenNewBooking} 
        />
      </div>

      {/* 2. TABLE CARD WRAPPER: Takes remaining height (flex-1) */}
      <div className={`flex-1 min-h-0 flex flex-col border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm transition-all duration-700 animate-in fade-in slide-in-from-bottom-4`}>
            
            {/* Table Header (Fixed Top of List) */}
            <div
                className={`flex-none grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 select-none`}
            >
                <div className="col-span-2">Ref ID</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Event Date</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3 text-right">Status</div>
            </div>

            {/* 3. TABLE BODY: Scrollable (overflow-y-auto) - Uses custom-scrollbar class */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${darkMode ? "divide-stone-800" : "divide-stone-100"}`}>
                
                {isLoading ? (
                    // Loading State
                    <div className="h-full flex flex-col items-center justify-center text-stone-400">
                        <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                        <p className="text-xs uppercase tracking-widest">Loading Bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    // Empty State
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-full mb-4">
                            <Inbox size={24} className="text-stone-400" />
                        </div>
                        <h3 className={`font-serif text-xl ${theme.text}`}>No bookings found</h3>
                        <p className={`text-xs mt-2 ${theme.subText}`}>Create a new booking to get started.</p>
                    </div>
                ) : (
                    // Rows - Mapping ALL bookings without slicing
                    <div className={`divide-y ${darkMode ? "divide-stone-800" : "divide-stone-100"}`}>
                        {bookings.map((b) => (
                        <div
                            key={b.refId}
                            onClick={() => onSelectBooking(b)}
                            className={`grid grid-cols-12 gap-4 px-8 py-5 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}
                        >
                            <div
                            className={`col-span-2 text-xs font-mono tracking-wider group-hover:text-[#C9A25D] transition-colors ${theme.subText}`}
                            >
                            {b.refId}
                            </div>
                            <div className="col-span-3">
                            <span
                                className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}
                            >
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
                            <span
                                className={`text-[10px] uppercase border ${theme.border} px-2 py-1 rounded-sm text-stone-500 bg-transparent`}
                            >
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

// Extracted Header
const BookingHeader = ({ theme, onOpenNewBooking }) => (
  <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
    <div>
      <h2 className={`font-serif text-3xl italic ${theme.text}`}>
        Bookings
      </h2>
      <p className={`text-xs mt-1 ${theme.subText}`}>
        Manage requests and proposals.
      </p>
    </div>
    <div className="flex gap-3">
      <button
        className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}
      >
        <Filter size={14} /> Filter
      </button>
      <button
        onClick={onOpenNewBooking}
        className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-md"
      >
        <Plus size={14} /> New Booking
      </button>
    </div>
  </div>
);

export default BookingList;