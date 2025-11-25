import React from 'react';
import { Filter, Plus, ChevronRight } from 'lucide-react';
import { FadeIn, renderStatusBadge } from '../Utils/UIHelpers'; 

const BookingList = ({ 
  bookings, 
  onSelectBooking, 
  onOpenNewBooking, 
  theme, 
  darkMode 
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className={`font-serif text-3xl italic ${theme.text}`}>Bookings</h2>
          <p className={`text-xs mt-1 ${theme.subText}`}>Manage requests and proposals.</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}>
            <Filter size={14} /> Filter
          </button>
          <button 
            onClick={onOpenNewBooking}
            className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm"
          >
            <Plus size={14} /> New Booking
          </button>
        </div>
      </div>

      {/* List Content */}
      <FadeIn>
        <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
          <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 select-none`}>
            <div className="col-span-2">Ref ID</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Event Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3 text-right">Status</div>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
            {bookings.map((b) => (
              <div 
                key={b.id} 
                onClick={() => onSelectBooking(b)}
                className={`grid grid-cols-12 gap-4 px-8 py-6 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}
              >
                <div className={`col-span-2 text-xs font-mono tracking-wider group-hover:text-[#C9A25D] transition-colors ${theme.subText}`}>{b.refId}</div>
                <div className="col-span-3">
                  <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>{b.fullName}</span>
                  <span className="text-[10px] text-stone-400 block mt-1">{b.estimatedGuests} Guests</span>
                </div>
                <div className={`col-span-2 text-xs ${theme.subText}`}>{b.dateOfEvent}</div>
                <div className="col-span-2">
                  <span className={`text-[10px] uppercase border ${theme.border} px-2 py-1 rounded-sm text-stone-500 bg-transparent`}>{b.eventType}</span>
                </div>
                <div className="col-span-3 flex justify-end items-center gap-4">
                  {renderStatusBadge(b.status)}
                  <ChevronRight size={16} className="text-stone-300 group-hover:text-[#C9A25D] transition-colors"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default BookingList;