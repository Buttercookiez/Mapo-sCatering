import React, { useState, useEffect, useRef } from 'react';
import { FadeIn, renderStatusBadge } from './Utils/UIHelpers'; 
import { 
  Search, Filter, ChevronRight, ArrowLeft, Calendar, 
  Users, MapPin, Mail, Phone, Plus, Trash2, Send, 
  FileText, DollarSign, CheckCircle, Clock, AlertCircle,
  Printer, MoreHorizontal, ChevronDown, ChefHat, 
  Utensils, CreditCard, Bell, MessageSquare, User,
  FileCheck, AlertTriangle, Wallet, X, ChevronLeft, Check
} from 'lucide-react';

import Sidebar from '../../components/layout/Sidebar';
import DashboardNavbar from '../../components/layout/Navbar';
import BookingList from './BookingList/BookingList';
import api from '../../api/api';
// --- 1. HELPER FUNCTIONS & ANIMATIONS ---

// --- 2. NEW BOOKING MODAL (CUSTOM UI IMPLEMENTATION) ---

const NewBookingModal = ({ isOpen, onClose, onSave, theme }) => {
  // Form State
  const [formData, setFormData] = useState({
    clientName: '', email: '', phone: '', customerNotes: '',
    date: '', timeStart: '', timeEnd: '', venue: '', guests: '',
    budget: '', eventType: '', serviceStyle: '',
    packageId: 1, 
    reservationFee: 0, reservationStatus: 'Unpaid',
    downpayment: 0, downpaymentStatus: 'Unpaid', paymentMethod: 'Bank Transfer',
    resDeadline: '', dpDeadline: ''
  });

  // UI Toggles
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);

  // Calendar Logic
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Reset on Open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientName: '', email: '', phone: '', customerNotes: '',
        date: '', timeStart: '', timeEnd: '', venue: '', guests: '',
        budget: '', eventType: '', serviceStyle: '',
        packageId: 1, reservationFee: 0, reservationStatus: 'Unpaid',
        downpayment: 0, downpaymentStatus: 'Unpaid', paymentMethod: 'Bank Transfer',
        resDeadline: '', dpDeadline: ''
      });
    }
  }, [isOpen]);

  // Generate Time Slots
  const generateTimeSlots = () => {
    const times = [];
    for (let i = 8; i <= 23; i++) { // 8 AM to 11 PM
      const hour = i > 12 ? i - 12 : i;
      const period = i >= 12 ? 'PM' : 'AM';
      times.push(`${hour}:00 ${period}`);
      times.push(`${hour}:30 ${period}`);
    }
    return times;
  };
  const timeSlots = generateTimeSlots();

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const handleDateClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = selected.getTimezoneOffset();
    const selectedDate = new Date(selected.getTime() - (offset*60*1000));
    const dateString = selectedDate.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: dateString }));
    setCalendarOpen(false);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < startDay; i++) { days.push(<div key={`empty-${i}`} className="p-2"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(year, month, day);
      const offset = checkDate.getTimezoneOffset();
      const localCheckDate = new Date(checkDate.getTime() - (offset*60*1000));
      const dateStr = localCheckDate.toISOString().split('T')[0];
      const isSelected = formData.date === dateStr;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`
            p-2 text-xs rounded-full w-8 h-8 flex items-center justify-center mx-auto transition-all duration-200 
            ${isSelected ? 'bg-[#C9A25D] text-white font-bold' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'} 
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  // Mock Packages
  const packages = [
    { id: 1, name: 'Standard Buffet', price: 850 },
    { id: 2, name: 'Premium Plated', price: 1200 },
    { id: 3, name: 'Grand Gala Set', price: 2500 }
  ];

  const selectedPackage = packages.find(p => p.id === formData.packageId) || packages[0];
  const guestCount = Number(formData.guests) || 0;
  const packageTotal = selectedPackage.price * guestCount;
  const grandTotal = packageTotal;
  const totalPaid = (formData.reservationStatus === 'Paid' ? Number(formData.reservationFee) : 0) + 
                    (formData.downpaymentStatus === 'Paid' ? Number(formData.downpayment) : 0);
  const remainingBalance = grandTotal - totalPaid;

  let computedStatus = 'Pending';
  if (formData.reservationStatus === 'Paid' && formData.downpaymentStatus === 'Unpaid') computedStatus = 'Reserved';
  else if (formData.downpaymentStatus === 'Paid') computedStatus = 'Confirmed';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newBooking = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      client: formData.clientName,
      date: formData.date || 'TBD',
      type: formData.eventType || 'TBD',
      guests: guestCount,
      budget: grandTotal,
      status: computedStatus,
      email: formData.email,
      phone: formData.phone,
      notes: formData.customerNotes,
    };
    onSave(newBooking);
    onClose();
  };

  // --- STYLES ---
  // Using "Underline Input" style from your reference code
  const inputBase = `w-full bg-transparent border-b ${theme.border} py-3 pl-0 text-sm ${theme.text} placeholder-stone-400 focus:outline-none focus:border-[#C9A25D] transition-colors`;
  const labelClass = `text-[#C9A25D] text-xs font-sans tracking-widest uppercase mb-4 block`;
  const dropdownContainer = `absolute top-full left-0 w-full mt-1 p-4 shadow-xl rounded-sm z-50 transition-all duration-300 origin-top border ${theme.border} ${theme.cardBg}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col no-scrollbar`}>
        
        {/* Header */}
        <div className={`p-8 border-b ${theme.border} flex justify-between items-center sticky top-0 ${theme.cardBg} z-20`}>
          <div>
            <h2 className={`font-serif text-3xl ${theme.text}`}>New Booking Entry</h2>
            <p className={`text-xs ${theme.subText} mt-1`}>Manually create a reservation record.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-16">
          
          {/* 1. CUSTOMER INFO */}
          <section>
            <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
              <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">01.</span> The Host
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Full Name" className={inputBase} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={inputBase} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className={inputBase} />
              <input type="text" name="customerNotes" value={formData.customerNotes} onChange={handleChange} placeholder="Special Notes (VIP, Allergies)" className={inputBase} />
            </div>
          </section>

          {/* 2. EVENT DETAILS (Custom Dropdowns & Calendar) */}
          <section>
            <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
              <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">02.</span> The Event
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Calendar Picker */}
              <div className="relative">
                <button type="button" onClick={() => setCalendarOpen(!calendarOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                  <span className={formData.date ? theme.text : "text-stone-400"}>{formData.date || "Select Date"}</span>
                  <Calendar className="w-4 h-4 text-stone-400" />
                </button>
                <div className={`${dropdownContainer} ${calendarOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                   <div className="flex justify-between items-center mb-4">
                      <button type="button" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></button>
                      <span className="font-serif">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                      <button type="button" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></button>
                   </div>
                   <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#C9A25D] mb-2">
                      {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
                   </div>
                   <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
                </div>
              </div>

              {/* Time Pickers */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <button type="button" onClick={() => setStartTimeOpen(!startTimeOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                       <span className={formData.timeStart ? theme.text : "text-stone-400"}>{formData.timeStart || "Start Time"}</span>
                       <Clock className="w-4 h-4 text-stone-400" />
                    </button>
                    <div className={`${dropdownContainer} ${startTimeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                       <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                          {timeSlots.map(t => (
                             <div key={t} onClick={() => { setFormData(prev => ({...prev, timeStart: t})); setStartTimeOpen(false); }} className="text-xs p-2 text-center hover:bg-[#C9A25D] hover:text-white cursor-pointer transition-colors rounded-sm border border-stone-200 dark:border-stone-800">{t}</div>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="relative">
                    <button type="button" onClick={() => setEndTimeOpen(!endTimeOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                       <span className={formData.timeEnd ? theme.text : "text-stone-400"}>{formData.timeEnd || "End Time"}</span>
                       <Clock className="w-4 h-4 text-stone-400" />
                    </button>
                    <div className={`${dropdownContainer} ${endTimeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                       <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                          {timeSlots.map(t => (
                             <div key={t} onClick={() => { setFormData(prev => ({...prev, timeEnd: t})); setEndTimeOpen(false); }} className="text-xs p-2 text-center hover:bg-[#C9A25D] hover:text-white cursor-pointer transition-colors rounded-sm border border-stone-200 dark:border-stone-800">{t}</div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Event Type */}
              <div className="relative">
                 <button type="button" onClick={() => setEventTypeOpen(!eventTypeOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                    <span className={formData.eventType ? theme.text : "text-stone-400"}>{formData.eventType || "Event Type"}</span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${eventTypeOpen ? 'rotate-180' : ''}`} />
                 </button>
                 <div className={`${dropdownContainer} ${eventTypeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                    <div className="grid grid-cols-2 gap-2">
                       {['Wedding', 'Debut', 'Corporate', 'Birthday', 'Anniversary', 'Other'].map(opt => (
                          <div key={opt} onClick={() => { setFormData(prev => ({...prev, eventType: opt})); setEventTypeOpen(false); }} className="text-xs p-2 text-center border hover:border-[#C9A25D] hover:text-[#C9A25D] cursor-pointer transition-colors rounded-sm uppercase tracking-wider">{opt}</div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Venue & Guests */}
              <div className="relative">
                 <button type="button" onClick={() => setVenueOpen(!venueOpen)} className={`${inputBase} text-left flex items-center justify-between`}>
                    <span className={formData.venue ? theme.text : "text-stone-400"}>{formData.venue || "Select Venue"}</span>
                    <MapPin className="w-4 h-4 text-stone-400" />
                 </button>
                 <div className={`${dropdownContainer} ${venueOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                    <div className="space-y-2">
                       {['Grand Ballroom', 'Glass Garden', 'Function Hall A'].map(v => (
                          <div key={v} onClick={() => { setFormData(prev => ({...prev, venue: v})); setVenueOpen(false); }} className="text-sm p-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors rounded-sm">{v}</div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="flex items-center border-b border-stone-200 dark:border-stone-800">
                 <Users className="w-4 h-4 text-stone-400 mr-3" />
                 <input type="number" name="guests" value={formData.guests} onChange={handleChange} placeholder="Estimated Guests" className="w-full bg-transparent py-3 text-sm focus:outline-none" />
              </div>

            </div>
          </section>

          {/* 3. SERVICE STYLE (Card Selection) */}
          <section>
             <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
               <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">03.</span> Service Style
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'Plated', label: 'Plated', desc: 'Formal multi-course' },
                  { id: 'Buffet', label: 'Buffet', desc: 'Variety and abundance' },
                  { id: 'Family Style', label: 'Family', desc: 'Shared platters' }
                ].map((style) => (
                  <div 
                    key={style.id} 
                    onClick={() => setFormData(prev => ({ ...prev, serviceStyle: style.id }))} 
                    className={`
                      border p-6 cursor-pointer transition-all duration-300 group rounded-sm
                      ${formData.serviceStyle === style.id 
                        ? 'border-[#C9A25D] bg-[#C9A25D]/5' 
                        : `${theme.border} hover:border-[#C9A25D]`
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Utensils className={`w-5 h-5 ${formData.serviceStyle === style.id ? 'text-[#C9A25D]' : 'text-stone-400'}`} />
                      {formData.serviceStyle === style.id && <Check className="w-4 h-4 text-[#C9A25D]" />}
                    </div>
                    <h4 className={`font-serif text-lg ${theme.text} mb-1`}>{style.label}</h4>
                    <p className={`text-xs ${theme.subText}`}>{style.desc}</p>
                  </div>
                ))}
             </div>
          </section>

          {/* 4. PAYMENTS (Aligned & Clean) */}
          <section>
             <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
               <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">04.</span> Financials
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Reservation */}
                <div className={`p-6 border ${theme.border} rounded-sm bg-stone-50 dark:bg-stone-900/30`}>
                   <h4 className="font-bold text-xs uppercase tracking-widest mb-4 text-stone-500">Reservation Fee</h4>
                   <div className="space-y-4">
                      <input type="number" name="reservationFee" value={formData.reservationFee} onChange={handleChange} placeholder="Amount" className={inputBase} />
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setFormData(prev => ({...prev, reservationStatus: 'Paid'}))} className={`flex-1 py-2 text-xs uppercase border rounded-sm ${formData.reservationStatus === 'Paid' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-stone-300 text-stone-400'}`}>Paid</button>
                         <button type="button" onClick={() => setFormData(prev => ({...prev, reservationStatus: 'Unpaid'}))} className={`flex-1 py-2 text-xs uppercase border rounded-sm ${formData.reservationStatus === 'Unpaid' ? 'bg-stone-200 text-stone-600 border-stone-300' : 'border-stone-300 text-stone-400'}`}>Unpaid</button>
                      </div>
                   </div>
                </div>

                {/* Downpayment */}
                <div className={`p-6 border ${theme.border} rounded-sm bg-stone-50 dark:bg-stone-900/30`}>
                   <h4 className="font-bold text-xs uppercase tracking-widest mb-4 text-stone-500">Downpayment</h4>
                   <div className="space-y-4">
                      <input type="number" name="downpayment" value={formData.downpayment} onChange={handleChange} placeholder="Amount" className={inputBase} />
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setFormData(prev => ({...prev, downpaymentStatus: 'Paid'}))} className={`flex-1 py-2 text-xs uppercase border rounded-sm ${formData.downpaymentStatus === 'Paid' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-stone-300 text-stone-400'}`}>Paid</button>
                         <button type="button" onClick={() => setFormData(prev => ({...prev, downpaymentStatus: 'Unpaid'}))} className={`flex-1 py-2 text-xs uppercase border rounded-sm ${formData.downpaymentStatus === 'Unpaid' ? 'bg-stone-200 text-stone-600 border-stone-300' : 'border-stone-300 text-stone-400'}`}>Unpaid</button>
                      </div>
                   </div>
                </div>

             </div>

             <div className="mt-8 pt-8 border-t border-dashed border-stone-300 dark:border-stone-800 flex justify-end items-center">
                <div className="text-right">
                   <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Total Estimated Cost</p>
                   <p className={`font-serif text-4xl ${theme.text}`}>₱ {grandTotal.toLocaleString()}</p>
                   <p className="text-xs mt-1 text-stone-500">Balance: <span className="text-red-500 font-bold">₱ {remainingBalance.toLocaleString()}</span></p>
                </div>
             </div>
          </section>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${theme.border} flex justify-end gap-4 sticky bottom-0 ${theme.cardBg} z-20`}>
          <button onClick={onClose} className={`px-8 py-3 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`}>Cancel</button>
          <button onClick={handleSubmit} className="px-10 py-3 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm shadow-lg">Create Booking</button>
        </div>

      </div>
    </div>
  );
};

// // --- 3. BOOKING LIST COMPONENT ---
// const BookingList = ({ bookings, onSelectBooking, onOpenNewBooking, theme, darkMode }) => {
//   return (
//     <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth no-scrollbar">
//       <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
//         <div>
//           <h2 className={`font-serif text-3xl italic ${theme.text}`}>Bookings</h2>
//           <p className={`text-xs mt-1 ${theme.subText}`}>Manage requests and proposals.</p>
//         </div>
//         <div className="flex gap-3">
//           <button className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} text-[10px] uppercase tracking-widest hover:text-[#C9A25D] hover:border-[#C9A25D] transition-all bg-transparent ${theme.subText}`}>
//             <Filter size={14} /> Filter
//           </button>
//           <button 
//             onClick={onOpenNewBooking}
//             className="flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm"
//           >
//             <Plus size={14} /> New Booking
//           </button>
//         </div>
//       </div>

//       <FadeIn>
//         <div className={`border ${theme.border} ${theme.cardBg} rounded-sm min-h-[400px]`}>
//           <div className={`grid grid-cols-12 gap-4 px-8 py-4 border-b ${theme.border} text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 select-none`}>
//             <div className="col-span-2">Ref ID</div>
//             <div className="col-span-3">Client</div>
//             <div className="col-span-2">Event Date</div>
//             <div className="col-span-2">Type</div>
//             <div className="col-span-3 text-right">Status</div>
//           </div>
//           <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
//             {bookings.map((b) => (
//               <div 
//                 key={b.id} 
//                 onClick={() => onSelectBooking(b)}
//                 className={`grid grid-cols-12 gap-4 px-8 py-6 items-center group transition-colors duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBg}`}
//               >
//                 <div className={`col-span-2 text-xs font-mono tracking-wider group-hover:text-[#C9A25D] transition-colors ${theme.subText}`}>{b.refId}</div>
//                 <div className="col-span-3">
//                   <span className={`font-serif text-lg block leading-tight group-hover:text-[#C9A25D] transition-colors ${theme.text}`}>{b.fullName}</span>
//                   <span className="text-[10px] text-stone-400 block mt-1">{b.estimatedGuests} Guests</span>
//                 </div>
//                 <div className={`col-span-2 text-xs ${theme.subText}`}>{b.dateOfEvent}</div>
//                 <div className="col-span-2">
//                   <span className={`text-[10px] uppercase border ${theme.border} px-2 py-1 rounded-sm text-stone-500 bg-transparent`}>{b.eventType}</span>
//                 </div>
//                 <div className="col-span-3 flex justify-end items-center gap-4">
//                   {renderStatusBadge(b.status)}
//                   <ChevronRight size={16} className="text-stone-300 group-hover:text-[#C9A25D] transition-colors"/>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </FadeIn>
//     </div>
//   );
// };

// --- 4. BOOKING DETAILS COMPONENT ---
const BookingDetails = ({ booking, onBack, activeDetailTab, setActiveDetailTab, theme, darkMode }) => {
  const [proposalTotal, setProposalTotal] = useState(250000); 
  const detailTabs = ['Event Info', 'Payments', 'Proposal', 'Notes'];

  const details = {
      ...booking,
      timeStart: booking.timeStart || '4:00 PM',
      timeEnd: booking.timeEnd || '10:00 PM',
      venue: booking.venue || 'The Grand Glass Garden',
      serviceStyle: booking.serviceStyle || 'Plated Sit-down',
      dietary: booking.dietary || 'No specific requests',
      paymentStatus: booking.status === 'Confirmed' ? 'Fully Paid' : 'Partially Paid',
      reservationFee: 5000,
      reservationStatus: booking.status === 'Reserved' || booking.status === 'Confirmed' ? 'Paid' : 'Unpaid',
      downpayment: 120000,
      downpaymentStatus: booking.status === 'Confirmed' ? 'Paid' : 'Unpaid',
      balance: 125000,
      paymentMethod: 'Bank Transfer',
      history: [
          { date: 'Oct 24, 2024', desc: 'Reservation Fee', amount: 5000, status: 'Paid' },
      ],
      timeline: [
          { date: 'Oct 24, 2024', user: 'Admin', action: 'Created Booking Entry' },
      ]
  };

  const menuPackages = [
      { id: 1, name: 'Standard Buffet', price: 850 },
      { id: 2, name: 'Premium Plated', price: 1200 },
      { id: 3, name: 'Grand Gala Set', price: 2500 }
  ];

  return (
    <div className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar h-full flex flex-col ${theme.bg}`}>
      
      {/* Top Bar */}
      <div className={`h-16 flex items-center justify-between px-6 md:px-8 border-b ${theme.border} ${theme.cardBg} sticky top-0 z-20`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 hover:text-[#C9A25D] rounded-full transition-colors ${theme.subText}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-2"></div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`font-serif text-xl ${theme.text}`}>{booking.client}</h2>
              <span className={`text-xs font-mono ${theme.subText}`}>{booking.id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
           {renderStatusBadge(booking.status)}
           <button className={`p-2 hover:text-[#C9A25D] transition-colors ${theme.subText}`}><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* LEFT: Static Info Card */}
        <div className={`w-full lg:w-80 border-r ${theme.border} ${theme.cardBg} p-6 lg:p-8 overflow-y-auto scroll-smooth no-scrollbar z-10`}>
           <h3 className={`text-[10px] uppercase tracking-[0.2em] mb-6 ${theme.subText} font-bold`}>Customer Profile</h3>
           
           <div className={`flex flex-col items-center text-center mb-8 pb-8 border-b border-dashed ${theme.border}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-[#C9A25D] text-xl font-serif italic mb-3 border ${theme.border} bg-transparent`}>
                 {booking.client.charAt(0)}
              </div>
              <h4 className={`font-serif text-xl mb-1 ${theme.text}`}>{booking.client}</h4>
              <div className={`flex gap-3 mt-3 justify-center`}>
                 <button className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}><Mail size={14}/></button>
                 <button className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}><Phone size={14}/></button>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-start gap-3">
                 <Calendar size={16} className="mt-0.5 text-[#C9A25D]" />
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">Event Date</p>
                    <p className={`text-sm font-medium ${theme.text}`}>{booking.date}</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <ChefHat size={16} className="mt-0.5 text-[#C9A25D]" />
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">Occasion</p>
                    <p className={`text-sm font-medium ${theme.text}`}>{booking.type}</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <Users size={16} className="mt-0.5 text-[#C9A25D]" />
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">Headcount</p>
                    <p className={`text-sm font-medium ${theme.text}`}>{booking.guests} Pax</p>
                 </div>
              </div>
              
              <div className={`p-4 rounded-sm border ${theme.border} bg-transparent`}>
                 <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Customer Notes</p>
                 <p className={`text-xs italic ${theme.subText}`}>"{booking.notes}"</p>
              </div>
           </div>
        </div>

        {/* RIGHT: Tabs Workspace */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
           <div className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-6`}>
              {detailTabs.map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`px-6 py-4 text-xs uppercase tracking-[0.2em] border-b-2 transition-colors font-medium ${
                      activeDetailTab === tab 
                      ? 'border-[#C9A25D] text-[#C9A25D]' 
                      : `border-transparent ${theme.subText} hover:text-stone-600 dark:hover:text-stone-300`
                    }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
              <FadeIn key={activeDetailTab}>
                 
                 {/* EVENT INFO */}
                 {activeDetailTab === 'Event Info' && (
                    <div className="max-w-4xl mx-auto">
                       <h3 className={`font-serif text-2xl mb-6 ${theme.text}`}>Event Specifications</h3>
                       <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Event Date</p>
                             <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-[#C9A25D]" />
                                <span className={`text-sm font-medium ${theme.text}`}>{details.date}</span>
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Time & Duration</p>
                             <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[#C9A25D]" />
                                <span className={`text-sm font-medium ${theme.text}`}>{details.timeStart} — {details.timeEnd}</span>
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Event Type</p>
                             <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[#C9A25D]" />
                                <span className={`text-sm font-medium ${theme.text}`}>{details.type}</span>
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Venue Location</p>
                             <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-[#C9A25D]" />
                                <span className={`text-sm font-medium ${theme.text}`}>{details.venue}</span>
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Service Style</p>
                             <div className="flex items-center gap-2">
                                <Utensils size={16} className="text-[#C9A25D]" />
                                <span className={`text-sm font-medium ${theme.text}`}>{details.serviceStyle}</span>
                             </div>
                          </div>
                          <div className={`col-span-1 md:col-span-2 border-t border-dashed ${theme.border} my-2`}></div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Primary Contact</p>
                             <p className={`text-sm font-medium ${theme.text}`}>{details.phone}</p>
                             <p className={`text-xs ${theme.subText}`}>{details.email}</p>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Estimated Budget</p>
                             <p className={`text-sm font-medium ${theme.text}`}>₱ {details.budget.toLocaleString()}</p>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                             <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Special Requests / Dietary Restrictions</p>
                             <div className={`p-4 border ${theme.border} rounded-sm bg-transparent`}>
                                <p className={`text-sm ${theme.text}`}>{details.dietary}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* PAYMENTS */}
                 {activeDetailTab === 'Payments' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                       {/* Summary Cards */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                              { label: 'Total Cost', val: details.budget, color: 'text-[#C9A25D]', icon: DollarSign },
                              { label: 'Amount Paid', val: details.reservationFee + details.downpayment, color: 'text-emerald-600 dark:text-emerald-400', icon: Wallet },
                              { label: 'Remaining Balance', val: details.balance, color: 'text-red-500 dark:text-red-400', icon: AlertCircle }
                          ].map((stat, idx) => (
                             <div key={idx} className={`p-6 border ${theme.border} ${theme.cardBg} rounded-sm flex flex-col justify-between h-32 shadow-sm transition-all duration-300 hover:border-[#C9A25D] hover:bg-[#C9A25D]/5 hover:shadow-md group cursor-pointer`}>
                                <div className="flex justify-between items-start">
                                  <p className="text-[10px] uppercase tracking-widest text-stone-400">{stat.label}</p>
                                  <stat.icon size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-[#C9A25D] transition-colors" strokeWidth={1.5} />
                                </div>
                                <p className={`font-serif text-3xl ${stat.color}`}>₱ {stat.val.toLocaleString()}</p>
                             </div>
                          ))}
                       </div>

                       {/* Schedule */}
                       <div className={`border ${theme.border} ${theme.cardBg} rounded-sm`}>
                          <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
                             <h4 className={`font-serif text-xl ${theme.text}`}>Payment Schedule</h4>
                             <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#C9A25D] border border-[#C9A25D] px-4 py-2 rounded-sm hover:bg-[#C9A25D] hover:text-white transition-colors bg-transparent">
                                <Bell size={12} /> Send Reminder
                             </button>
                          </div>
                          <div className={`grid grid-cols-12 gap-4 px-6 py-3 border-b ${theme.border} text-[10px] uppercase tracking-widest text-stone-400`}>
                              <div className="col-span-4">Description</div>
                              <div className="col-span-3">Due Date</div>
                              <div className="col-span-3 text-right">Amount</div>
                              <div className="col-span-2 text-right">Status</div>
                          </div>
                          <div className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
                             {[
                               {label: "Reservation Fee", amount: details.reservationFee, status: details.reservationStatus, due: "On Booking", icon: FileText},
                               {label: "50% Downpayment", amount: details.downpayment, status: details.downpaymentStatus, due: "Oct 01, 2024", icon: CreditCard},
                               {label: "Final Balance", amount: details.balance, status: "Unpaid", due: "Oct 24, 2024", icon: DollarSign}
                             ].map((row, i) => (
                               <div key={i} className={`grid grid-cols-12 gap-4 items-center px-6 py-5 ${theme.hoverBg} transition-colors duration-300 group`}>
                                  <div className="col-span-4 flex items-center gap-4">
                                     <div className={`p-2 rounded-full border ${theme.border} text-stone-400 bg-white dark:bg-transparent group-hover:border-[#C9A25D] group-hover:text-[#C9A25D] transition-colors`}>
                                        <row.icon size={16}/>
                                     </div>
                                     <span className={`text-sm font-bold ${theme.text} group-hover:text-[#C9A25D] transition-colors`}>{row.label}</span>
                                  </div>
                                  <div className="col-span-3 text-xs text-stone-500 dark:text-stone-400">Due: {row.due}</div>
                                  <div className="col-span-3 text-right">
                                     <span className={`font-serif text-lg font-medium ${theme.text}`}>₱ {row.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                     {renderStatusBadge(row.status)}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                       
                       {/* Transactions */}
                       <div className={`border ${theme.border} ${theme.cardBg} rounded-sm p-6`}>
                           <h4 className="text-[10px] uppercase tracking-widest text-stone-400 mb-6 border-b border-dashed border-stone-200 dark:border-stone-800 pb-2">Transaction History</h4>
                           <table className="w-full text-left text-sm">
                               <thead className={`text-[10px] uppercase tracking-widest text-stone-400 border-b ${theme.border}`}>
                                   <tr>
                                       <th className="pb-4 font-normal pl-2">Date</th>
                                       <th className="pb-4 font-normal">Description</th>
                                       <th className="pb-4 font-normal">Payment Method</th>
                                       <th className="pb-4 font-normal text-right pr-2">Amount</th>
                                   </tr>
                               </thead>
                               <tbody className={`${theme.text}`}>
                                   {details.history.map((tx, i) => (
                                       <tr key={i} className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-100'} last:border-0 ${theme.hoverBg} transition-colors duration-300`}>
                                           <td className="py-4 pl-2 text-xs font-mono text-stone-500">{tx.date}</td>
                                           <td className="py-4 font-medium">{tx.desc}</td>
                                           <td className="py-4 text-stone-500 flex items-center gap-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                              {details.paymentMethod}
                                           </td>
                                           <td className="py-4 text-right font-serif pr-2 text-lg">₱ {tx.amount.toLocaleString()}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                    </div>
                 )}

                 {/* PROPOSAL & NOTES SECTIONS */}
                 {activeDetailTab === 'Proposal' && (
                    <div className="max-w-4xl mx-auto">
                       <div className="flex justify-between items-center mb-8">
                          <div>
                             <h3 className={`font-serif text-2xl ${theme.text}`}>Build Proposal</h3>
                             <p className={`text-xs ${theme.subText} mt-1`}>Ref No. {booking.id}-QUO</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] uppercase tracking-widest text-stone-400">Total Estimated Cost</p>
                             <p className="font-serif text-3xl text-[#C9A25D]">₱ {proposalTotal.toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className={`border ${theme.border} ${theme.cardBg} p-6 rounded-sm`}>
                             <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme.text}`}><Utensils size={16} /> Catering Package</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {menuPackages.map((pkg) => (
                                   <button key={pkg.id} onClick={() => setProposalTotal(pkg.price * booking.guests)} className={`p-4 border rounded-sm text-left transition-all duration-300 ${ (proposalTotal / booking.guests) === pkg.price ? 'border-[#C9A25D] bg-white dark:bg-[#C9A25D]/10 shadow-md' : `${theme.border} hover:border-[#C9A25D] hover:shadow-sm bg-transparent` }`}>
                                      <span className={`font-serif text-lg block ${theme.text}`}>{pkg.name}</span>
                                      <span className="text-xs text-stone-400 block mb-2">₱ {pkg.price} / head</span>
                                      { (proposalTotal / booking.guests) === pkg.price && <CheckCircle size={14} className="text-[#C9A25D] ml-auto" /> }
                                   </button>
                                ))}
                             </div>
                          </div>
                          <div className={`border ${theme.border} ${theme.cardBg} p-6 rounded-sm`}>
                             <div className="flex justify-between items-center mb-4">
                                <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme.text}`}><MapPin size={16} /> Venue Selection</h4>
                                <button className={`text-[10px] uppercase tracking-wider text-[#C9A25D] hover:underline`}>Check Availability</button>
                             </div>
                             <div className={`p-4 border border-dashed ${theme.border} flex flex-col items-center justify-center py-8 cursor-pointer hover:border-[#C9A25D] transition-colors rounded-sm bg-transparent`}>
                                <Plus size={24} className="text-stone-300 mb-2" />
                                <span className="text-xs text-stone-400 uppercase tracking-wider">Add Venue to Quote</span>
                             </div>
                          </div>
                          <div className={`mt-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
                             <h4 className="text-[10px] uppercase tracking-[0.2em] mb-6 font-bold text-stone-400 border-b border-dashed border-stone-200 dark:border-stone-800 pb-2">Cost Breakdown</h4>
                             <div className={`space-y-4 text-sm ${theme.text}`}>
                                <div className="flex justify-between items-center"><span>Food & Beverage ({booking.guests} pax)</span><span className="font-serif text-base">₱ {proposalTotal.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span>Venue Rental</span><span className="font-serif text-base text-stone-400 italic">--</span></div>
                                <div className="flex justify-between items-center text-stone-400"><span>Service Charge (10%)</span><span className="font-serif text-base">₱ {(proposalTotal * 0.1).toLocaleString()}</span></div>
                                <div className={`border-t ${theme.border} pt-4 mt-4 flex justify-between items-end`}><span className={`font-bold text-xs uppercase tracking-widest ${theme.text}`}>Grand Total</span><span className="font-serif text-2xl text-[#C9A25D]">₱ {(proposalTotal * 1.1).toLocaleString()}</span></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'Notes' && (
                    <div className="max-w-3xl mx-auto h-full flex flex-col">
                       <h3 className={`font-serif text-2xl mb-6 ${theme.text}`}>Activity Log & Notes</h3>
                       <div className="flex-1 relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[1px] before:bg-stone-200 dark:before:bg-stone-800">
                          {details.timeline.map((log, i) => (
                             <div key={i} className="flex gap-6 relative">
                                <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.cardBg} flex items-center justify-center z-10 shadow-sm`}>
                                   {log.user === 'Admin' ? <User size={16} className="text-stone-400"/> : log.user === 'System' ? <AlertTriangle size={16} className="text-amber-500"/> : <MessageSquare size={16} className="text-[#C9A25D]"/>}
                                </div>
                                <div className={`flex-1 p-4 border ${theme.border} ${theme.cardBg} rounded-sm`}>
                                   <div className="flex justify-between items-start mb-1"><span className={`text-xs font-bold ${theme.text}`}>{log.user}</span><span className="text-[10px] text-stone-400 uppercase tracking-wide">{log.date}</span></div>
                                   <p className={`text-sm ${theme.subText}`}>{log.action}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                       <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                           <label className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 block">Add Internal Note</label>
                           <div className="flex gap-3">
                               <textarea className={`flex-1 border ${theme.border} bg-transparent rounded-sm p-3 text-sm focus:outline-none focus:border-[#C9A25D]`} rows="3" placeholder="Type a private note for the admin team..."></textarea>
                               <button className="self-end px-4 py-3 bg-[#1c1c1c] text-white hover:bg-[#C9A25D] transition-colors rounded-sm"><Send size={16} /></button>
                           </div>
                       </div>
                    </div>
                 )}

              </FadeIn>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. MAIN PAGE COMPONENT ---
const Bookings = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? savedState === 'true' : true;
  });

  const [currentView, setCurrentView] = useState(() => localStorage.getItem('bookingCurrentView') || 'list'); 
  const [activeDetailTab, setActiveDetailTab] = useState(() => localStorage.getItem('bookingActiveTab') || 'Event Info');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    api.get('/inquiries-summary') // relative to baseURL
      .then(res => setBookings(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSaveBooking = (newBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('bookingCurrentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('bookingActiveTab', activeDetailTab);
  }, [activeDetailTab]);

  // Updated Theme for Stronger Light Mode Contrast
  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#141414]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-500' : 'text-stone-500',
    border: darkMode ? 'border-stone-800' : 'border-stone-300', // Darker border for visibility
    accent: 'text-[#C9A25D]',
    hoverBg: 'hover:bg-[#C9A25D]/5', 
  };

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

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar activeTab="Bookings & Proposals" theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {currentView === 'list' ? (
          <BookingList 
            bookings={bookings}
            onSelectBooking={(booking) => { setSelectedBooking(booking); setCurrentView('details'); }}
            onOpenNewBooking={() => setIsNewBookingOpen(true)}
            theme={theme}
            darkMode={darkMode}
          />
        ) : (
          <BookingDetails 
            booking={selectedBooking || bookings[0]} 
            onBack={() => setCurrentView('list')}
            activeDetailTab={activeDetailTab}
            setActiveDetailTab={setActiveDetailTab}
            theme={theme}
            darkMode={darkMode}
          />
        )}
      </main>

      <NewBookingModal 
         isOpen={isNewBookingOpen} 
         onClose={() => setIsNewBookingOpen(false)} 
         onSave={handleSaveBooking}
         theme={theme}
      />
    </div>
  );
};

export default Bookings;