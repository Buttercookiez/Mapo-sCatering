// src/pages/Customer/Booking.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, Calendar, Check, ChevronDown, 
  ChevronLeft, ChevronRight, Plus, ArrowRight, Clock,
  Users, Utensils, MapPin
} from "lucide-react";
import Navbar from "../../components/customer/Navbar";
import Footer from "../../components/customer/Footer";
import GoogleMapModal from "../../components/modals/GoogleMapModal";
import TermsModal from "../../components/modals/TermsModal";
import api from "../../api/api";

// --- ANIMATION COMPONENTS (Consistent with Homepage/Venue) ---

// 1. Staggered Text Reveal
const StaggeredText = ({ text, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } 
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className} leading-tight`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
          <span
            className={`inline-block transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
              isVisible ? 'translate-y-0' : 'translate-y-[110%]'
            }`}
            style={{ transitionDelay: isVisible ? `${delay + (i * 30)}ms` : '0ms' }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

// 2. Fade Up Wrapper
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      }, { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

// --- IMPROVED DROPDOWN COMPONENT (Strict Black Text) ---
const DropdownInput = ({ label, value, options, onSelect, placeholder, icon: Icon, theme, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group relative z-30" ref={dropdownRef}>
      <label className={`text-xs uppercase tracking-[0.2em] ${theme.subText} mb-2 block font-light font-sans`}>{label}</label>
      
      {/* TRIGGER BUTTON */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full text-left bg-transparent border-b ${theme.border} py-5 text-xl ${theme.text} font-light font-sans flex justify-between items-center focus:outline-none focus:border-[#C9A25D] transition-colors`}
      >
        <span className={value ? "" : "opacity-30"}>{value || placeholder}</span>
        {Icon ? 
          <Icon className={`w-4 h-4 opacity-40 transition-transform duration-300 ${isOpen ? 'text-[#C9A25D] opacity-100' : ''}`} /> 
          : 
          <ChevronDown className={`w-4 h-4 opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#C9A25D] opacity-100' : ''}`} /> 
        }
      </button>

      {/* DROPDOWN LIST */}
      <div 
        className={`absolute top-full left-0 w-full mt-2 max-h-80 overflow-y-auto shadow-2xl rounded-sm z-50 
        transition-all duration-300 ease-out origin-top stop-scroll-propagation no-scrollbar
        ${isOpen ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'}
        `}
        style={{ 
            backgroundColor: darkMode ? '#1c1c1c' : '#ffffff',
            border: darkMode ? '1px solid #333' : '1px solid #e5e7eb'
        }} 
      >
        {options.map((opt) => (
          <div 
            key={opt} 
            onClick={() => { onSelect(opt); setIsOpen(false); }} 
            className={`px-6 py-4 cursor-pointer transition-all duration-300 text-xs tracking-[0.25em] uppercase font-medium font-sans
              hover:pl-8 
              ${value === opt ? 'text-[#C9A25D]' : ''}
            `}
            // STRICTLY FORCE BLACK COLOR
            style={{ 
                color: value === opt ? '#C9A25D' : (darkMode ? '#d6d3d1' : '#000000') 
            }}
            onMouseEnter={(e) => { if(value !== opt) e.target.style.color = '#C9A25D'; }}
            onMouseLeave={(e) => { if(value !== opt) e.target.style.color = darkMode ? '#d6d3d1' : '#000000'; }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

const Booking = () => {
  const navigate = useNavigate();
  const [appLoading, setAppLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false);
  
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const addToRefs = (el) => { if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el); };

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phoneSuffix: "", 
    date: "", guests: "", startTime: "", endTime: "", notes: ""
  });
  
  const [eventType, setEventType] = useState("");
  const [serviceStyle, setServiceStyle] = useState("full_service"); 
  const [selectedVenue, setSelectedVenue] = useState(null); 
  const [currentLocation, setCurrentLocation] = useState(null); 

  const [showMapModal, setShowMapModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Example blocked dates
  const bookedDates = ["2025-11-15", "2025-11-20"];
  
  const venues = [
    { id: 1, name: "Palacios Event Place", capacity: "300 Pax", img: "/images/palacios.png", type: "predefined" },
    { id: 2, name: "La Veranda Events Hall", capacity: "150 Pax", img: "/images/laverandaa.png", type: "predefined" },
    { id: 3, name: "Tenorio's Events Place", capacity: "50 Pax", img: "/images/tenorios.png", type: "predefined" }
  ];
  
  const eventOptions = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

  // --- GENERATE TIME (6:00 AM to 5:30 AM Next Day) ---
  const generateTimeOptions = () => {
    const times = [];
    const startHour = 6; // Start at 6 AM
    const totalSlots = 48; // 24 hours * 2 (30 min intervals)

    for (let i = 0; i < totalSlots; i++) {
        const totalMinutes = (startHour * 60) + (i * 30);
        let hours = Math.floor(totalMinutes / 60) % 24;
        let minutes = totalMinutes % 60;
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        let displayHour = hours % 12;
        displayHour = displayHour ? displayHour : 12; 
        
        const minutesStr = minutes < 10 ? '00' : minutes;
        
        let label = `${displayHour}:${minutesStr} ${ampm}`;
        times.push(label);
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  // --- INITIAL LOAD ANIMATION ---
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setAppLoading(false);
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 1200);
    }, 1500); 

    return () => clearTimeout(timer);
  }, []);

  // --- SCROLL ENGINE ---
  const handleNativeScroll = (e) => setNavIsScrolled(e.currentTarget.scrollTop > 50);
  const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const smoothScrollTo = useCallback((targetPosition, duration) => {
    const container = containerRef.current;
    if (!container) return;
    const startPosition = container.scrollTop;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      container.scrollTop = startPosition + (distance * easeInOutCubic(progress));
      if (timeElapsed < duration) requestAnimationFrame(animation);
      else setIsScrolling(false);
    };
    requestAnimationFrame(animation);
  }, []);

  const scrollToSection = useCallback((index) => {
    if (index < 0 || index >= sectionRefs.current.length) return;
    setActiveIndex(index);
    if (window.innerWidth >= 768) {
      setIsScrolling(true);
      smoothScrollTo(sectionRefs.current[index].offsetTop, 1000); 
    } else {
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  }, [smoothScrollTo]);

  const handleNextClick = (targetIndex) => {
    scrollToSection(targetIndex);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (appLoading) return;
      if (window.innerWidth < 768) return; 
      if (e.target.closest('.stop-scroll-propagation')) return;
      if (showMapModal || showTermsModal) return;

      e.preventDefault();
      if (isScrolling) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(Math.max(activeIndex + direction, 0), sectionRefs.current.length - 1);
      
      if (nextIndex !== activeIndex) scrollToSection(nextIndex);
    };
    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (container) container.removeEventListener('wheel', handleWheel); };
  }, [activeIndex, isScrolling, showMapModal, showTermsModal, scrollToSection, appLoading]); 


  // --- INITIALIZATION ---
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      document.body.style.backgroundColor = "#0c0c0c";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      document.body.style.backgroundColor = "#FAFAFA";
    }
  }, [darkMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 9) {
      setFormData(prev => ({ ...prev, phoneSuffix: val }));
    }
  };

  const handlePredefinedVenueSelect = (venue) => {
    setSelectedVenue(venue);
  };

  const handleCustomVenueSelect = (venueData) => {
    setSelectedVenue({ ...venueData, type: 'custom' });
    setShowMapModal(false);
  };

  const handleOpenMap = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setShowMapModal(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let addressName = "Current Location";
        setCurrentLocation({ lat: latitude, lng: longitude, name: addressName });
        setShowMapModal(true);
      },
      (error) => {
        alert("Unable to retrieve location. Opening default map.");
        setShowMapModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRequestQuotation = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert("Please fill in your contact details.");
      scrollToSection(1);
      return;
    }
    if (!selectedVenue) {
      alert("Please select a venue.");
      scrollToSection(2);
      return;
    }
    setShowTermsModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const finalFullName = `${formData.firstName} ${formData.lastName}`;
    const finalPhone = `09${formData.phoneSuffix}`;

    const bookingData = {
      name: finalFullName,
      email: formData.email,
      phone: finalPhone,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      guests: formData.guests, 
      venue: selectedVenue ? selectedVenue.name : "",
      venueId: selectedVenue?.id || null,
      venueType: selectedVenue?.type || "custom",
      eventType: eventType,
      serviceStyle: serviceStyle,
      notes: formData.notes
    };

    try {
      const response = await api.post("/inquiries", bookingData);
      navigate("/confirmation", { state: { ...bookingData, refId: response.data.refId } });
      setShowTermsModal(false);
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to submit. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    text: darkMode ? "text-stone-200" : "text-black", // Forced black text
    subText: darkMode ? "text-stone-400" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    dropdownBg: darkMode ? "bg-[#1c1c1c]" : "bg-white",
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  
  const renderCalendarDays = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(y, m), startDay = getFirstDayOfMonth(y, m), days = [];
    
    // Empty slots for start of month
    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`} className="w-full aspect-square"></div>);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const check = new Date(y, m, d);
      // Adjust timezone offset to compare dates correctly
      const str = new Date(check.getTime() - check.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const isBooked = bookedDates.includes(str);
      const isSelected = formData.date === str;
      const isPast = new Date().setHours(0,0,0,0) > check;
      
      // COLOR LOGIC for Calendar
      let textColor = darkMode ? '#d6d3d1' : '#000000'; // Default available
      if (isBooked || isPast) textColor = darkMode ? '#57534e' : '#d1d5db'; // Disabled (Gray)
      if (isSelected) textColor = '#ffffff'; // Selected (White)

      days.push(
        <button 
          key={d} 
          type="button" 
          disabled={isBooked || isPast} 
          onClick={(e) => { 
              e.stopPropagation(); 
              setFormData(p => ({ ...p, date: str })); 
              setTimeout(() => setCalendarOpen(false), 200); 
          }}
          className={`
            w-full aspect-square flex items-center justify-center rounded-sm transition-all duration-300 font-medium text-sm font-sans
            ${isSelected ? "bg-[#C9A25D] shadow-lg" : ""}
            ${isBooked || isPast ? "line-through cursor-not-allowed" : "hover:bg-[#C9A25D]/20 hover:text-[#C9A25D]"}
          `}
          style={{ color: textColor }} // Force color inline
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />
      
      {/* --- OPENING ANIMATION --- */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center 
          ${darkMode ? 'bg-[#0c0c0c]' : 'bg-[#FAFAFA]'}`
        }
        style={{
          clipPath: appLoading 
            ? 'ellipse(150% 150% at 50% 50%)' 
            : 'ellipse(150% 100% at 50% -100%)',
          transition: 'clip-path 1.2s cubic-bezier(0.76, 0, 0.24, 1)'
        }}
      >
        <div className={`text-center transition-all duration-700 ease-out 
          ${appLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-20'}`}>
          <h1 className={`font-serif text-3xl md:text-4xl tracking-[0.2em] uppercase 
            ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            Booking
          </h1>
        </div>
      </div>

      <div 
        ref={containerRef}
        onScroll={handleNativeScroll}
        className={`h-screen w-full font-sans antialiased transition-colors duration-500 overflow-y-scroll md:overflow-hidden ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}
      >
        <style>{`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] { -moz-appearance: textfield; }
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

        <GoogleMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} onSelect={handleCustomVenueSelect} darkMode={darkMode} currentLocation={currentLocation} />
        <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} onAccept={handleFinalSubmit} isSubmitting={isSubmitting} darkMode={darkMode} />

        {/* --- SLIDE 0: HERO --- */}
        <section ref={addToRefs} className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center">
          <div className={`absolute inset-0 w-full h-full z-0 transition-transform duration-[2000ms] ease-out ${appLoading ? 'scale-125' : 'scale-100'}`}>
            <img src="https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Hero" className="w-full h-full object-cover opacity-40 animate-[pulse_10s_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90"></div>
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-10">
            <FadeIn delay={1000}>
              <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-light mb-6 block font-sans">Reservations</span>
            </FadeIn>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.9] mb-8 font-thin drop-shadow-2xl">
              <div className="block overflow-hidden">
                  <StaggeredText text="Curate Your" delay={1400} />
              </div>
              <div className="block overflow-hidden">
                  <span className="italic font-light">
                    <StaggeredText text="Moment" delay={1600} />
                  </span>
              </div>
            </h1>

            <FadeIn delay={2000}>
              <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed tracking-wide">Tell us about your vision. Whether an intimate dinner or a grand gala, we craft the menu to match the occasion.</p>
            </FadeIn>
          </div>
          <div onClick={() => handleNextClick(1)} className={`absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 animate-bounce z-10 cursor-pointer hover:opacity-100 transition-opacity duration-1000 delay-[2200ms] ${appLoading ? 'opacity-0' : 'opacity-80'}`}>
             <span className="text-[9px] text-white tracking-[0.4em] uppercase font-light font-sans">Start Booking</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
          </div>
        </section>

        <form onSubmit={handleRequestQuotation}>
          
          {/* --- SLIDE 1: HOST --- */}
          <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg}`}>
              <div className="max-w-screen-md mx-auto px-6 w-full">
                  <FadeIn>
                      <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                          <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">Step 01</span>
                          <h2 className={`font-serif text-5xl md:text-6xl ${theme.text} font-thin`}>
                            <StaggeredText text="The Host" />
                          </h2>
                      </div>
                      
                      <div className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="group relative">
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>First Name</label>
                                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl md:text-2xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`} placeholder="Juan" required />
                              </div>
                              <div className="group relative">
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>Last Name</label>
                                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl md:text-2xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`} placeholder="Dela Cruz" required />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="group relative">
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>Email Address</label>
                                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] font-sans`} placeholder="example@email.com" required />
                              </div>
                              
                              <div className="group relative">
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>Phone Number</label>
                                  <div className={`flex items-end border-b ${theme.border} focus-within:border-[#C9A25D] transition-colors`}>
                                    <span className={`py-3 text-xl ${theme.text} mr-2 font-light select-none opacity-80 font-sans`}>09</span>
                                    <input 
                                      type="text" 
                                      name="phoneSuffix" 
                                      value={formData.phoneSuffix} 
                                      onChange={handlePhoneChange} 
                                      className={`w-full bg-transparent py-3 text-xl ${theme.text} font-light focus:outline-none font-sans`} 
                                      placeholder="XXX XXX XXX" 
                                      required 
                                    />
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="mt-16 flex justify-end">
                          <button type="button" onClick={() => handleNextClick(2)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans">Next Step <ArrowRight className="w-4 h-4" /></button>
                      </div>
                  </FadeIn>
              </div>
          </section>

          {/* --- SLIDE 2: VENUE --- */}
          <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
              <div className="max-w-screen-xl mx-auto px-6 w-full">
                  <FadeIn>
                      <div className="mb-10 text-center">
                          <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">Step 02</span>
                          <h2 className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}>
                             <StaggeredText text="Select a Venue" />
                          </h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                          {venues.map((venue) => (
                              <div key={venue.id} onClick={() => handlePredefinedVenueSelect(venue)}
                                  className={`group relative cursor-pointer flex flex-col h-[350px] md:h-[450px] transition-all duration-500 
                                      ${selectedVenue?.id === venue.id ? 'grayscale-0 translate-y-[-10px]' : 'grayscale hover:grayscale-0 hover:translate-y-[-10px]'}
                                  `}>
                                  <div className="absolute inset-0 bg-stone-200 overflow-hidden shadow-xl">
                                      <img src={venue.img} alt={venue.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${selectedVenue?.id === venue.id ? 'opacity-20' : 'opacity-40 group-hover:opacity-20'}`}></div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
                                      <h3 className="font-serif text-2xl mb-1 leading-none font-light">{venue.name}</h3>
                                      <p className="text-xs uppercase tracking-widest opacity-80 mb-4 font-light font-sans">{venue.capacity}</p>
                                      <div className={`w-8 h-8 rounded-full border border-white/50 flex items-center justify-center transition-all duration-300 ${selectedVenue?.id === venue.id ? 'bg-[#C9A25D] border-[#C9A25D] text-white' : 'group-hover:bg-white group-hover:text-black'}`}>
                                          {selectedVenue?.id === venue.id ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                      </div>
                                  </div>
                                  {selectedVenue?.id === venue.id && <div className="absolute -inset-2 border border-[#C9A25D]/50 z-[-1]"></div>}
                              </div>
                          ))}

                          <div onClick={handleOpenMap} className={`group relative cursor-pointer flex flex-col h-[350px] md:h-[450px] bg-stone-100 dark:bg-stone-900 border ${theme.border} transition-all duration-500 hover:border-[#C9A25D] ${selectedVenue?.type === 'custom' ? 'border-[#C9A25D]' : ''}`}>
                              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${selectedVenue?.type === 'custom' ? 'bg-[#C9A25D] text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500 group-hover:text-[#C9A25D]'}`}>
                                      <Plus className="w-8 h-8" />
                                  </div>
                                  {/* FIXED: Explicit White Text in Dark Mode, Black in Light Mode */}
                                  <h3 className="font-serif text-2xl mb-2 font-light text-black dark:text-white">Other Location</h3>
                                  <p className="text-xs text-stone-500 dark:text-stone-400 px-4 font-light font-sans">Search Google Maps for your preferred venue.</p>
                                  {selectedVenue?.type === 'custom' && (
                                      <div className="mt-6 text-[10px] text-[#C9A25D] flex items-center justify-center gap-1 font-light font-sans">
                                          <Check className="w-3 h-3" /> Selected: {selectedVenue.name}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      <div className="mt-12 flex justify-between items-center">
                          <button type="button" onClick={() => scrollToSection(1)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}>Back</button>
                          <button type="button" onClick={() => handleNextClick(3)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans">Next Step <ArrowRight className="w-4 h-4" /></button>
                      </div>
                  </FadeIn>
              </div>
          </section>

          {/* --- SLIDE 3: SERVICE STYLE --- */}
          <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
              <div className="max-w-screen-md mx-auto px-6 w-full text-center">
                  <FadeIn>
                        <div className="mb-12">
                          <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">Step 03</span>
                          <h2 className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}>
                            <StaggeredText text="Service Style" />
                          </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {[
                              { id: "full_service", label: "Full Service", desc: "Complete catering with food, staff, setup, and styling.", icon: Utensils },
                              { id: "service_only", label: "Service Only", desc: "Staff, equipment, and setup only. You provide the food.", icon: Users }
                          ].map((style) => (
                              <div key={style.id} onClick={() => setServiceStyle(style.id)} 
                                  className={`p-8 border cursor-pointer transition-all duration-500 hover:-translate-y-2
                                      ${serviceStyle === style.id ? "border-[#C9A25D] bg-[#C9A25D]/5" : `${theme.border} hover:border-[#C9A25D]`}
                                  `}>
                                  <div 
                                      className={`w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300`}
                                      style={{ 
                                          // FORCE GREY (#e5e5e5) IN LIGHT MODE IF NOT SELECTED
                                          backgroundColor: serviceStyle === style.id ? '#C9A25D' : (darkMode ? '#292524' : '#e5e5e5'),
                                          color: serviceStyle === style.id ? '#ffffff' : (darkMode ? '#a8a29e' : '#4b5563')
                                      }}
                                  >
                                      <style.icon className="w-5 h-5" />
                                  </div>
                                  <h3 className={`font-serif text-2xl ${theme.text} mb-3 font-light`}>{style.label}</h3>
                                  <p className={`text-xs leading-relaxed ${theme.subText} font-light font-sans`}>{style.desc}</p>
                              </div>
                          ))}
                      </div>
                      <div className="mt-16 flex justify-between items-center">
                          <button type="button" onClick={() => scrollToSection(2)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}>Back</button>
                          <button type="button" onClick={() => handleNextClick(4)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans">Next Step <ArrowRight className="w-4 h-4" /></button>
                      </div>
                  </FadeIn>
              </div>
          </section>

          {/* --- SLIDE 4: EVENT LOGISTICS (MERGED) --- */}
          <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
               <div className="max-w-screen-lg mx-auto px-6 w-full">
                  <FadeIn>
                      <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                          <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">Step 04</span>
                          <h2 className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}>
                            <StaggeredText text="Event Logistics" />
                          </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-10">
                              {/* Improved Date Picker with Dropdown Style - Z-INDEX 50 */}
                              <div className="group relative z-50">
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>Date</label>
                                  {/* TRIGGER BUTTON - Added font-sans */}
                                  <button 
                                      type="button" 
                                      onClick={() => setCalendarOpen(!calendarOpen)} 
                                      className={`w-full text-left bg-transparent border-b ${theme.border} py-5 text-xl ${theme.text} font-light font-sans flex justify-between items-center focus:outline-none focus:border-[#C9A25D] transition-colors`}
                                  >
                                      {formData.date || "Select Date"} 
                                      <Calendar className={`w-4 h-4 opacity-40 transition-transform duration-300 ${calendarOpen ? 'text-[#C9A25D] opacity-100' : ''}`} />
                                  </button>
                                  
                                  {/* Calendar Dropdown */}
                                  <div 
                                      className={`absolute top-full left-0 w-full mt-2 p-6 shadow-2xl rounded-sm z-50 
                                      transition-all duration-300 origin-top stop-scroll-propagation
                                      ${calendarOpen ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'}
                                      `}
                                      style={{ 
                                          backgroundColor: darkMode ? '#1c1c1c' : '#ffffff',
                                          border: darkMode ? '1px solid #333' : '1px solid #e5e7eb'
                                      }} 
                                  >
                                      <div className="flex justify-between items-center mb-6 border-b pb-4 border-stone-200 dark:border-stone-800">
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1))); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-black dark:text-stone-300" /></button>
                                          <span className={`text-sm font-medium tracking-widest uppercase ${theme.text} font-sans`}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1))); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-black dark:text-stone-300" /></button>
                                      </div>
                                      
                                      {/* Weekday Headers */}
                                      <div className="grid grid-cols-7 mb-2 text-center">
                                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                              <span key={day} className="text-[10px] uppercase tracking-wider text-stone-400 font-sans">{day}</span>
                                          ))}
                                      </div>

                                      {/* Responsive Grid for Days */}
                                      <div className="grid grid-cols-7 gap-2">
                                          {renderCalendarDays()}
                                      </div>
                                  </div>
                              </div>

                               {/* Time Duration - Z-INDEX 30 */}
                               <div className="grid grid-cols-2 gap-8 z-30 relative">
                                  <DropdownInput 
                                      label="Start Time" 
                                      value={formData.startTime} 
                                      options={timeOptions} 
                                      onSelect={(val) => setFormData(prev => ({...prev, startTime: val}))} 
                                      placeholder="Start"
                                      icon={Clock}
                                      theme={theme}
                                      darkMode={darkMode}
                                  />
                                  <DropdownInput 
                                      label="End Time" 
                                      value={formData.endTime} 
                                      options={timeOptions} 
                                      onSelect={(val) => setFormData(prev => ({...prev, endTime: val}))} 
                                      placeholder="End"
                                      icon={Clock}
                                      theme={theme}
                                      darkMode={darkMode}
                                  />
                              </div>
                          </div>

                          <div className="space-y-10">
                               {/* Guest Count */}
                               <div>
                                  <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}>Guest Count</label>
                                  {/* Added font-sans to input */}
                                  <input type="number" name="guests" value={formData.guests} onChange={handleInputChange} placeholder="0" className={`w-full bg-transparent border-b ${theme.border} py-5 text-xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`} required />
                               </div>
                              
                              {/* Occasion - IMPROVED DROPDOWN */}
                              <DropdownInput 
                                  label="Occasion" 
                                  value={eventType} 
                                  options={eventOptions} 
                                  onSelect={(val) => setEventType(val)} 
                                  placeholder="Select Type"
                                  theme={theme}
                                  darkMode={darkMode}
                              />
                          </div>
                      </div>

                      {/* --- BUTTON SECTION (Notes Removed) --- */}
                      <div className="mt-20">
                          <button 
                              type="submit"
                              className={`group relative w-full py-6 text-sm tracking-[0.3em] uppercase font-light overflow-hidden transition-all duration-300 shadow-2xl ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} font-sans`}
                          >
                              <span className="absolute inset-0 w-full h-full bg-[#C9A25D] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                              <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                                  Request A Quotation
                              </span>
                          </button>
                      </div>

                      <div className="mt-8 text-center">
                          <button type="button" onClick={() => scrollToSection(3)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}>Back</button>
                      </div>
                  </FadeIn>
               </div>
          </section>

        </form>
        <div ref={addToRefs} className="h-auto"><Footer darkMode={darkMode} /></div>
        <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 p-3 backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${
          (activeIndex > 0 || navIsScrolled) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          } ${darkMode ? "bg-stone-800/50 border-stone-700 hover:bg-white hover:text-black" : "bg-white/10 border-stone-200 hover:bg-black hover:text-white"}`}>
          <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </>
  );
};

export default Booking;