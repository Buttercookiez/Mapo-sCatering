// src/pages/Customer/Booking.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, Calendar, Users, ChevronDown, 
  Check, Utensils, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import Navbar from '../../components/customer/Navbar';
import Footer from '../../components/customer/Footer';
import api from "../../api/api";

// --- Minimalist Animation Wrapper ---
const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const translateClass = direction === 'up' ? 'translate-y-10' : 'translate-x-0';

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : `opacity-0 ${translateClass}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Booking = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // --- Form & Dropdown States ---
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', date: '', 
    guests: '', budget: '', startTime: '', endTime: '',
    notes: ''
  });
  
  const [eventType, setEventType] = useState("");
  const [serviceStyle, setServiceStyle] = useState("");
  
  // Dropdown Toggles
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  // --- Calendar Logic States ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // MOCK DATA
  const bookedDates = ["2025-11-15", "2025-11-20", "2025-12-01", "2025-12-25"];
  
  const eventOptions = [
    'Wedding', 'Corporate Gala', 'Private Dinner', 'Cocktail Reception', 
    'Product Launch', 'Birthday', 'Engagement Party', 
    'Charity Ball', 'Art Exhibition', 'Holiday Party', 'Conference', 'Workshop'
  ];

  // --- Generate Time Slots (24/7) ---
  const generateTimeSlots = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 || i === 12 ? 12 : i % 12; 
      const period = i < 12 ? 'AM' : 'PM';
      times.push(`${hour}:00 ${period}`);
      times.push(`${hour}:30 ${period}`);
    }
    return times;
  };
  const timeSlots = generateTimeSlots();

  // --- Dark Mode Logic ---
   useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Save preference
      document.body.style.backgroundColor = '#0c0c0c';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Save preference
      document.body.style.backgroundColor = '#FAFAFA';
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await api.post("/inquiries", {
      ...formData,
      eventType,
      serviceStyle
    });

    alert("Inquiry Submitted Successfully!");
    console.log("Saved:", response.data);

  } catch (error) {
    console.error(error);
    alert("Error submitting inquiry!");
  }
};

  // --- Calendar Helpers ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const handleDateClick = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = selected.getTimezoneOffset();
    const selectedDate = new Date(selected.getTime() - (offset*60*1000));
    const dateString = selectedDate.toISOString().split('T')[0];

    if (!bookedDates.includes(dateString)) {
      setFormData(prev => ({ ...prev, date: dateString }));
      setCalendarOpen(false);
    }
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
    
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(year, month, day);
      const offset = checkDate.getTimezoneOffset();
      const localCheckDate = new Date(checkDate.getTime() - (offset*60*1000));
      const dateStr = localCheckDate.toISOString().split('T')[0];
      const isBooked = bookedDates.includes(dateStr);
      const isSelected = formData.date === dateStr;
      const isPast = new Date().setHours(0,0,0,0) > checkDate;

      days.push(
        <button
          key={day}
          type="button"
          disabled={isBooked || isPast}
          onClick={() => handleDateClick(day)}
          className={`
            p-2 text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto transition-all duration-200 
            ${isSelected ? 'bg-[#C9A25D] text-white font-bold' : ''} 
            ${!isSelected && !isBooked && !isPast ? (darkMode ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-200 text-stone-700') : ''} 
            ${isBooked ? 'text-stone-300 dark:text-stone-700 line-through cursor-not-allowed opacity-50' : ''} 
            ${isPast ? 'text-stone-300 dark:text-stone-700 cursor-default' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const theme = {
    bg: darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]',
    cardBg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-200' : 'text-stone-900',
    subText: darkMode ? 'text-stone-400' : 'text-stone-500',
    // Ensure border is always defined via variables or hex for consistency
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    inputFocus: darkMode ? 'focus:border-stone-100' : 'focus:border-stone-900',
    dropdownBg: darkMode ? 'bg-[#1c1c1c]' : 'bg-white',
  };

  return (
    <div className={`font-sans antialiased transition-colors duration-500 overflow-x-hidden ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          html { scroll-behavior: smooth; }
          *, *::before, *::after { transition-property: background-color, border-color, color, fill, stroke; transition-duration: 300ms; }
          ::placeholder { color: #a8a29e; opacity: 1; }
          
          input[type="time"]::-webkit-calendar-picker-indicator { display: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={isScrolled} />

      {/* --- Hero Section --- */}
      <header className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center">
        <div className="absolute inset-0 w-full h-full z-0">
          <img src="https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Table Setting" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-10">
          <FadeIn>
            <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6 block">Reservations</span>
            <h1 className="font-serif text-5xl md:text-7xl text-white leading-none mb-6 font-thin">Curate Your <span className="italic">Moment</span></h1>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed tracking-wide">Tell us about your vision. Whether an intimate dinner or a grand gala, we craft the menu to match the occasion.</p>
          </FadeIn>
        </div>
      </header>

      {/* --- Booking Form Section --- */}
      <section className={`py-20 md:py-32 ${theme.bg} relative`}>
        <div className="max-w-screen-md mx-auto px-6">
          <FadeIn delay={200}>
            <div className={`${theme.cardBg} p-8 md:p-16 shadow-sm border ${theme.border}`}>
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* 1. Contact Details */}
                <div>
                  <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
                    <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">01.</span> The Host
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group">
                      <input type="text" name="name" placeholder="Full Name" onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none ${theme.inputFocus} transition-colors`} required />
                    </div>
                    <div className="group">
                      <input type="email" name="email" placeholder="Email Address" onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none ${theme.inputFocus} transition-colors`} required />
                    </div>
                    <div className="group md:col-span-2">
                      <input type="tel" name="phone" placeholder="Phone Number" onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none ${theme.inputFocus} transition-colors`} />
                    </div>
                  </div>
                </div>

                {/* 2. Event Details */}
                <div>
                   <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
                    <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">02.</span> The Event
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Date Picker (Box UI) */}
                    <div className="group relative">
                      <button type="button" onClick={() => setCalendarOpen(!calendarOpen)} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 pr-10 text-left focus:outline-none ${theme.inputFocus} transition-colors flex items-center cursor-pointer`}>
                        <Calendar className={`w-4 h-4 ${theme.subText} mr-3`} />
                        <span className={formData.date ? theme.text : "text-stone-400"}>{formData.date || "Select Date"}</span>
                      </button>
                      <div className={`absolute top-full left-0 w-full sm:w-[320px] mt-4 p-5 shadow-2xl rounded-sm z-50 transition-all duration-300 origin-top ${calendarOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} ${theme.dropdownBg} border ${theme.border}`}>
                        <div className="flex justify-between items-center mb-4">
                          <button type="button" onClick={() => changeMonth(-1)} className={`p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full ${theme.text}`}><ChevronLeft className="w-5 h-5" /></button>
                          <span className={`font-serif text-lg ${theme.text}`}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                          <button type="button" onClick={() => changeMonth(1)} className={`p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full ${theme.text}`}><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">{['S','M','T','W','T','F','S'].map((d, i) => (<span key={i} className="text-[10px] font-bold uppercase text-[#C9A25D]">{d}</span>))}</div>
                        <div className="grid grid-cols-7 gap-1 text-center">{renderCalendarDays()}</div>
                      </div>
                    </div>

                    {/* Start Time - FIX: Updated border to use theme.border */}
                    <div className="group relative">
                      <button type="button" onClick={() => setStartTimeOpen(!startTimeOpen)} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 pr-10 text-left focus:outline-none ${theme.inputFocus} transition-colors flex items-center cursor-pointer`}>
                         <Clock className={`w-4 h-4 ${theme.subText} mr-3`} />
                         <span className={formData.startTime ? theme.text : "text-stone-400"}>{formData.startTime || "Start Time"}</span>
                      </button>
                      
                      <div className={`absolute top-full left-0 w-full sm:w-[320px] mt-4 p-5 shadow-2xl rounded-sm z-50 transition-all duration-300 origin-top ${startTimeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} ${theme.dropdownBg} border ${theme.border}`}>
                         <div className="mb-3 border-b border-stone-100 dark:border-stone-800 pb-2"><span className="text-xs font-serif italic text-[#C9A25D]">Select Start Time</span></div>
                         <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                            {timeSlots.map(time => (
                               <div 
                                 key={time} 
                                 onClick={() => { setFormData(prev => ({...prev, startTime: time})); setStartTimeOpen(false); }} 
                                 className={`
                                   px-2 py-2 text-xs text-center cursor-pointer border rounded-sm transition-all duration-200
                                   ${formData.startTime === time 
                                     ? 'bg-[#C9A25D] text-white border-[#C9A25D] shadow-sm' 
                                     : `${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] hover:bg-transparent` 
                                   }
                                 `}
                               >
                                  {time}
                               </div>
                            ))}
                         </div>
                      </div>
                    </div>

                    {/* End Time - FIX: Updated border to use theme.border */}
                    <div className="group relative">
                      <button type="button" onClick={() => setEndTimeOpen(!endTimeOpen)} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 pr-10 text-left focus:outline-none ${theme.inputFocus} transition-colors flex items-center cursor-pointer`}>
                         <Clock className={`w-4 h-4 ${theme.subText} mr-3`} />
                         <span className={formData.endTime ? theme.text : "text-stone-400"}>{formData.endTime || "End Time"}</span>
                      </button>
                      
                      <div className={`absolute top-full left-0 w-full sm:w-[320px] mt-4 p-5 shadow-2xl rounded-sm z-50 transition-all duration-300 origin-top ${endTimeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} ${theme.dropdownBg} border ${theme.border}`}>
                         <div className="mb-3 border-b border-stone-100 dark:border-stone-800 pb-2"><span className="text-xs font-serif italic text-[#C9A25D]">Select End Time</span></div>
                         <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                            {timeSlots.map(time => (
                               <div 
                                 key={time} 
                                 onClick={() => { setFormData(prev => ({...prev, endTime: time})); setEndTimeOpen(false); }} 
                                 className={`
                                   px-2 py-2 text-xs text-center cursor-pointer border rounded-sm transition-all duration-200
                                   ${formData.endTime === time 
                                     ? 'bg-[#C9A25D] text-white border-[#C9A25D] shadow-sm' 
                                     : `${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] hover:bg-transparent` 
                                   }
                                 `}
                               >
                                  {time}
                               </div>
                            ))}
                         </div>
                      </div>
                    </div>

                    {/* Guest Count - FIX: Updated wrapper to use theme.border */}
                    <div className="group">
                      <div className={`flex items-center border-b ${theme.border}`}>
                         <Users className={`w-4 h-4 ${theme.subText} mr-3`} />
                         <input type="number" name="guests" placeholder="Estimated Guests" onChange={handleInputChange} className={`w-full bg-transparent py-3 ${theme.text} placeholder-stone-400 focus:outline-none`} required />
                      </div>
                    </div>

                    {/* Estimated Budget (PHP) - FIX: Updated wrapper to use theme.border */}
                    <div className="group md:col-span-2">
                      <div className={`flex items-center border-b ${theme.border}`}>
                         <span className={`text-lg ${theme.subText} mr-3 font-serif`}>₱</span>
                         <input type="number" name="budget" placeholder="Estimated Budget (PHP)" onChange={handleInputChange} className={`w-full bg-transparent py-3 ${theme.text} placeholder-stone-400 focus:outline-none`} />
                      </div>
                    </div>

                    {/* Event Type Dropdown */}
                    <div className="group relative md:col-span-2">
                      <button type="button" onClick={() => setEventTypeOpen(!eventTypeOpen)} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 pr-10 text-left focus:outline-none ${theme.inputFocus} transition-colors flex justify-between items-center cursor-pointer`}>
                        <span className={eventType ? theme.text : "text-stone-400"}>{eventType || "Event Type"}</span>
                        <ChevronDown className={`w-4 h-4 ${theme.subText} transition-transform duration-300 ${eventTypeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`absolute top-full left-0 w-full sm:w-[400px] mt-4 p-5 shadow-2xl rounded-sm z-40 transition-all duration-300 origin-top ${eventTypeOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} ${theme.dropdownBg} border ${theme.border}`}>
                        <div className="mb-4 border-b border-stone-100 dark:border-stone-800 pb-2"><span className="text-xs font-serif italic text-[#C9A25D]">Select an Occasion</span></div>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto no-scrollbar">
                          {eventOptions.map((option) => (
                            <div 
                              key={option} 
                              onClick={() => { setEventType(option); setEventTypeOpen(false); }} 
                              className={`
                                px-3 py-2 text-xs uppercase tracking-wider text-center cursor-pointer transition-all border rounded-sm 
                                ${eventType === option 
                                  ? 'bg-[#C9A25D] text-white border-[#C9A25D]' 
                                  : `${theme.border} ${theme.text} hover:border-[#C9A25D] hover:text-[#C9A25D] hover:bg-transparent`}
                              `}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Service Preferences */}
                <div>
                  <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
                    <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">03.</span> Service Style
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'plated', label: 'Plated', desc: 'Formal multi-course service' },
                      { id: 'buffet', label: 'Buffet', desc: 'Variety and abundance' },
                      { id: 'family', label: 'Family Style', desc: 'Shared platters at the table' }
                    ].map((style) => (
                      <div 
                        key={style.id} 
                        onClick={() => setServiceStyle(style.id)} 
                        className={`
                          border p-6 cursor-pointer transition-all duration-300 group 
                          ${serviceStyle === style.id 
                            ? 'border-[#C9A25D] bg-[#C9A25D]/5' 
                            : `${theme.border} hover:border-[#C9A25D]`
                          }
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Utensils className={`w-5 h-5 ${serviceStyle === style.id ? 'text-[#C9A25D]' : theme.subText}`} />
                          {serviceStyle === style.id && <Check className="w-4 h-4 text-[#C9A25D]" />}
                        </div>
                        <h4 className={`font-serif text-lg ${theme.text} mb-1`}>{style.label}</h4>
                        <p className={`text-xs ${theme.subText}`}>{style.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Additional Notes */}
                <div>
                  <h3 className={`font-serif text-2xl ${theme.text} mb-8 flex items-center gap-3`}>
                    <span className="text-[#C9A25D] text-sm font-sans tracking-widest uppercase">04.</span> Details
                  </h3>
                  <textarea name="notes" rows="4" placeholder="Tell us about dietary restrictions, theme, or any specific requests..." onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 pl-0 ${theme.text} placeholder-stone-400 focus:outline-none ${theme.inputFocus} transition-colors resize-none`}></textarea>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button className={`w-full py-5 ${darkMode ? 'bg-white text-stone-900 hover:bg-[#C9A25D] hover:text-white' : 'bg-stone-900 text-white hover:bg-[#C9A25D]'} text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 shadow-xl`}>Get a Quotation</button>
                  <p className={`text-center mt-6 text-xs ${theme.subText} italic`}>A member of our team will respond within 24 hours.</p>
                </div>

              </form>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer darkMode={darkMode} />

      <button onClick={scrollToTop} className={`fixed bottom-8 right-8 p-3 ${darkMode ? 'bg-stone-800/50 border-stone-700 hover:bg-white hover:text-stone-900' : 'bg-white/10 border-stone-200 hover:bg-stone-900 hover:text-white'} backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Booking;