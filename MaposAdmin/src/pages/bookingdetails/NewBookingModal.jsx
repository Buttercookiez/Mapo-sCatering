import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, ChevronLeft, ChevronRight, Clock, 
  ChevronDown, MapPin, Users, Utensils, Check 
} from 'lucide-react';

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
  const inputBase = `w-full bg-transparent border-b ${theme.border} py-3 pl-0 text-sm ${theme.text} placeholder-stone-400 focus:outline-none focus:border-[#C9A25D] transition-colors`;
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

export default NewBookingModal;