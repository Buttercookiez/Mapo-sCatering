import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, Calendar, Users, ChevronDown, Check, Utensils,
  ChevronLeft, ChevronRight, Clock, Plus, ArrowRight
} from "lucide-react";
import Navbar from "../../components/customer/Navbar";
import Footer from "../../components/customer/Footer";
import GoogleMapModal from "../../components/modals/GoogleMapModal";
import TermsModal from "../../components/modals/TermsModal";
import api from "../../api/api";

// --- Minimalist Animation Wrapper ---
const FadeIn = ({ children, delay = 0, direction = "up" }) => {
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
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const translateClass = direction === "up" ? "translate-y-10" : "translate-x-0";

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : `opacity-0 ${translateClass}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Booking = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // --- Scroll Logic ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false);
  
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const addToRefs = (el) => { if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el); };

  // --- Data States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", date: "", guests: "", budget: "", startTime: "", endTime: "", notes: "",
  });
  const [eventType, setEventType] = useState("");
  const [serviceStyle, setServiceStyle] = useState(""); 
  const [selectedVenue, setSelectedVenue] = useState(null); 
  const [currentLocation, setCurrentLocation] = useState(null); // Added for Geolocation

  // --- Modals State ---
  const [showMapModal, setShowMapModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // --- Dropdowns State ---
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data
  const bookedDates = ["2025-11-15", "2025-11-20", "2025-12-01", "2025-12-25"];
  const prices = { full_service: 1500, service_only: 600 };
  const venues = [
    { id: 1, name: "Palacios Event Place", capacity: "300 Pax", img: "/images/palacios.png", type: "predefined" },
    { id: 2, name: "La Veranda Events Hall", capacity: "150 Pax", img: "/images/laverandaa.png", type: "predefined" },
    { id: 3, name: "Tenorio's Events Place", capacity: "50 Pax", img: "/images/tenorios.png", type: "predefined" }
  ];
  const eventOptions = ["Wedding", "Corporate Gala", "Private Dinner", "Cocktail Reception", "Product Launch", "Birthday", "Engagement Party", "Charity Ball", "Anniversary", "Baby Shower", "Baptism", "Graduation", "Reunion"];

  // --- SCROLL ENGINE ---
  const handleNativeScroll = (e) => setNavIsScrolled(e.currentTarget.scrollTop > 50);

  const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const smoothScrollTo = (targetPosition, duration) => {
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
  };

  const scrollToSection = (index) => {
    if (index < 0 || index >= sectionRefs.current.length) return;
    setActiveIndex(index);
    if (window.innerWidth >= 768) {
      setIsScrolling(true);
      smoothScrollTo(sectionRefs.current[index].offsetTop, 1000); 
    } else {
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (window.innerWidth < 768) return; 
      // FIX: Stop scroll if inside a dropdown or modal content
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
  }, [activeIndex, isScrolling, showMapModal, showTermsModal]);

  // --- Logic ---
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

  useEffect(() => {
    const guestCount = parseInt(formData.guests) || 0;
    const pricePerHead = prices[serviceStyle] || 0;
    if (guestCount > 0 && pricePerHead > 0) {
      setFormData((prev) => ({ ...prev, budget: guestCount * pricePerHead }));
    }
  }, [formData.guests, serviceStyle]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Venue Selection Logic ---
  const handlePredefinedVenueSelect = (venue) => {
    setSelectedVenue(venue);
  };

  const handleCustomVenueSelect = (venueData) => {
    setSelectedVenue(venueData);
  };

  // --- Map & Geolocation Logic (FIXED: Fetches Address Name) ---
  const handleOpenMap = () => {
    // 1. Check if browser supports it
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setShowMapModal(true);
      return;
    }

    // 2. Fetch with High Accuracy & Options
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Success: Get coordinates
        const { latitude, longitude } = position.coords;
        
        let addressName = "Current Location";
        const API_KEY = "pk.3afdd6de186ee932339deec83a4c2882"; // Using the same key as your Modal

        try {
          // FETCH: Reverse Geocoding to get actual address string
          const response = await fetch(`https://us1.locationiq.com/v1/reverse?key=${API_KEY}&lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          if (data && data.display_name) {
            addressName = data.display_name;
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          // Fallback if fetch fails
          addressName = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
        }

        console.log("Location found:", latitude, longitude, addressName);
        
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          name: addressName // Now contains the specific address
        });
        
        setShowMapModal(true);
      },
      (error) => {
        // Detailed Error Handling
        console.error("Geolocation Error:", error);
        let errorMsg = "Unable to retrieve location.";
        if (error.code === 1) errorMsg = "Location permission denied. Please allow access in browser settings.";
        else if (error.code === 2) errorMsg = "Location unavailable. Ensure GPS is on.";
        else if (error.code === 3) errorMsg = "Location request timed out.";
        
        alert(errorMsg + " Opening default map.");
        setShowMapModal(true);
      },
      { 
        enableHighAccuracy: true, // Force GPS if available
        timeout: 10000,           // Wait up to 10 seconds
        maximumAge: 0             // Do not use cached position
      }
    );
  };

  // --- Submission Logic ---
  const handleRequestQuotation = (e) => {
    e.preventDefault();
    if (!selectedVenue) { alert("Please select a venue."); return; }
    // Open Terms Modal instead of submitting directly
    setShowTermsModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const bookingData = {
      ...formData, venue: selectedVenue.name, venueId: selectedVenue.id, venueType: selectedVenue.type, eventType, serviceStyle,
    };
    try {
      const response = await api.post("/inquiries", bookingData);
      navigate("/confirmation", { state: { ...bookingData, refId: response.data.refId } });
      setShowTermsModal(false);
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to submit. Try again.");
      setIsSubmitting(false);
    }
  };

  // Theme Helpers
  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    text: darkMode ? "text-stone-200" : "text-stone-900",
    subText: darkMode ? "text-stone-400" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    dropdownBg: darkMode ? "bg-[#1c1c1c]" : "bg-white",
  };

  // Calendar Logic
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const renderCalendarDays = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(y, m), startDay = getFirstDayOfMonth(y, m), days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`}></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const check = new Date(y, m, d), str = new Date(check.getTime() - check.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const isBooked = bookedDates.includes(str), isSelected = formData.date === str, isPast = new Date().setHours(0,0,0,0) > check;
      days.push(
        <button key={d} type="button" disabled={isBooked || isPast} onClick={() => { setFormData(p => ({ ...p, date: str })); setCalendarOpen(false); }}
          className={`p-2 text-xs rounded-full w-8 h-8 flex items-center justify-center mx-auto transition-all ${isSelected ? "bg-[#C9A25D] text-white" : isBooked ? "text-stone-300 line-through" : isPast ? "text-stone-300" : "hover:bg-stone-200 dark:hover:bg-stone-800"}`}>
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleNativeScroll}
      className={`h-screen w-full font-sans antialiased transition-colors duration-500 overflow-y-scroll md:overflow-hidden ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}
    >
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isScrolled={activeIndex > 0 || navIsScrolled} />
      
      {/* Modals */}
      <GoogleMapModal 
        isOpen={showMapModal} 
        onClose={() => setShowMapModal(false)} 
        onSelect={handleCustomVenueSelect}
        darkMode={darkMode}
        currentLocation={currentLocation} // Pass the fetched location to the modal
      />
      <TermsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleFinalSubmit}
        isSubmitting={isSubmitting}
        darkMode={darkMode}
      />

      {/* --- SLIDE 0: HERO --- */}
      <section ref={addToRefs} className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center">
        <div className="absolute inset-0 w-full h-full z-0">
          <img src="https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Hero" className="w-full h-full object-cover opacity-40 animate-[pulse_10s_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-10">
          <FadeIn>
            <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6 block">Reservations</span>
            <h1 className="font-serif text-5xl md:text-7xl text-white leading-none mb-6 font-thin">Curate Your <span className="italic">Moment</span></h1>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed tracking-wide">Tell us about your vision. Whether an intimate dinner or a grand gala, we craft the menu to match the occasion.</p>
          </FadeIn>
        </div>
        <div onClick={() => scrollToSection(1)} className="absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 opacity-80 animate-bounce z-10 cursor-pointer hover:opacity-100">
           <span className="text-[9px] text-white tracking-[0.4em] uppercase">Start Booking</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      <form onSubmit={handleRequestQuotation}>
        
        {/* --- SLIDE 1: HOST --- */}
        <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg}`}>
            <div className="max-w-screen-md mx-auto px-6 w-full">
                <FadeIn>
                    <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                        <span className="text-[#C9A25D] text-xs font-bold tracking-widest uppercase mb-2 block">Step 01</span>
                        <h2 className={`font-serif text-5xl md:text-6xl ${theme.text}`}>The Host</h2>
                    </div>
                    <div className="space-y-10">
                        <div className="group relative">
                            <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl md:text-2xl ${theme.text} focus:outline-none focus:border-[#C9A25D] transition-colors`} placeholder="Who should we address?" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="group relative">
                                <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} focus:outline-none focus:border-[#C9A25D]`} placeholder="example@email.com" required />
                            </div>
                            <div className="group relative">
                                <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} focus:outline-none focus:border-[#C9A25D]`} placeholder="+63 900 000 0000" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 flex justify-end">
                        <button type="button" onClick={() => scrollToSection(2)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold hover:text-[#C9A25D] transition-colors">Next Step <ArrowRight className="w-4 h-4" /></button>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* --- SLIDE 2: VENUE --- */}
        <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
            <div className="max-w-screen-xl mx-auto px-6 w-full">
                <FadeIn>
                    <div className="mb-10 text-center">
                        <span className="text-[#C9A25D] text-xs font-bold tracking-widest uppercase mb-2 block">Step 02</span>
                        <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>Select a Venue</h2>
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
                                    <h3 className="font-serif text-2xl mb-1 leading-none">{venue.name}</h3>
                                    <p className="text-xs uppercase tracking-widest opacity-80 mb-4">{venue.capacity}</p>
                                    <div className={`w-8 h-8 rounded-full border border-white/50 flex items-center justify-center transition-all duration-300 ${selectedVenue?.id === venue.id ? 'bg-[#C9A25D] border-[#C9A25D] text-white' : 'group-hover:bg-white group-hover:text-black'}`}>
                                        {selectedVenue?.id === venue.id ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                    </div>
                                </div>
                                {selectedVenue?.id === venue.id && <div className="absolute -inset-2 border border-[#C9A25D]/50 z-[-1]"></div>}
                            </div>
                        ))}

                        {/* Custom Venue Card - Triggers Map with Geolocation */}
                        <div 
                            onClick={handleOpenMap} 
                            className={`group relative cursor-pointer flex flex-col h-[350px] md:h-[450px] bg-stone-100 dark:bg-stone-900 border ${theme.border} transition-all duration-500 hover:border-[#C9A25D] ${selectedVenue?.type === 'custom' ? 'border-[#C9A25D]' : ''}`}
                        >
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${selectedVenue?.type === 'custom' ? 'bg-[#C9A25D] text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500 group-hover:text-[#C9A25D]'}`}>
                                    <Plus className="w-8 h-8" />
                                </div>
                                <h3 className={`font-serif text-2xl ${theme.text} mb-2`}>Other Location</h3>
                                <p className={`text-xs ${theme.subText} px-4`}>Search Google Maps for your preferred venue.</p>
                                {selectedVenue?.type === 'custom' && (
                                    <div className="mt-6 text-[10px] text-[#C9A25D] flex items-center justify-center gap-1 font-bold">
                                        <Check className="w-3 h-3" /> Selected: {selectedVenue.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 flex justify-between items-center">
                        <button type="button" onClick={() => scrollToSection(1)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Back</button>
                        <button type="button" onClick={() => scrollToSection(3)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold hover:text-[#C9A25D] transition-colors">Next Step <ArrowRight className="w-4 h-4" /></button>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* --- SLIDE 3: SERVICE STYLE --- */}
        <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
            <div className="max-w-screen-md mx-auto px-6 w-full text-center">
                <FadeIn>
                      <div className="mb-12">
                        <span className="text-[#C9A25D] text-xs font-bold tracking-widest uppercase mb-2 block">Step 03</span>
                        <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>Service Style</h2>
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
                                {/* FIX: Icon color consistency in Light Mode */}
                                <div className={`w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors
                                    ${serviceStyle === style.id 
                                        ? 'bg-[#C9A25D] text-white' 
                                        : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}
                                `}>
                                    <style.icon className="w-5 h-5" />
                                </div>
                                <h3 className={`font-serif text-2xl ${theme.text} mb-3`}>{style.label}</h3>
                                <p className={`text-xs leading-relaxed ${theme.subText}`}>{style.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 flex justify-between items-center">
                        <button type="button" onClick={() => scrollToSection(2)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Back</button>
                        <button type="button" onClick={() => scrollToSection(4)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold hover:text-[#C9A25D] transition-colors">Next Step <ArrowRight className="w-4 h-4" /></button>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* --- SLIDE 4: EVENT LOGISTICS --- */}
        <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
             <div className="max-w-screen-lg mx-auto px-6 w-full">
                <FadeIn>
                    <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                        <span className="text-[#C9A25D] text-xs font-bold tracking-widest uppercase mb-2 block">Step 04</span>
                        <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>Event Logistics</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Column 1 */}
                        <div className="space-y-8">
                            {/* Date Picker - Uses stop-scroll-propagation */}
                            <div className="group relative">
                                <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Date</label>
                                <button type="button" onClick={() => setCalendarOpen(!calendarOpen)} className={`w-full text-left bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} flex justify-between items-center`}>
                                    {formData.date || "Select Date"} <Calendar className="w-4 h-4 opacity-50" />
                                </button>
                                <div className={`absolute top-full left-0 mt-4 p-4 shadow-2xl rounded-sm z-50 ${theme.dropdownBg} border ${theme.border} transition-all duration-300 origin-top stop-scroll-propagation ${calendarOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                                    <div className="flex justify-between mb-4">
                                        <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-sm font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                        <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Start</label><input type="text" name="startTime" value={formData.startTime} onChange={handleInputChange} placeholder="00:00 AM" className={`w-full bg-transparent border-b ${theme.border} py-3 text-lg ${theme.text} focus:outline-none focus:border-[#C9A25D]`} /></div>
                                <div><label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>End</label><input type="text" name="endTime" value={formData.endTime} onChange={handleInputChange} placeholder="00:00 PM" className={`w-full bg-transparent border-b ${theme.border} py-3 text-lg ${theme.text} focus:outline-none focus:border-[#C9A25D]`} /></div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-8">
                             <div><label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Guest Count</label><input type="number" name="guests" value={formData.guests} onChange={handleInputChange} placeholder="0" className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} focus:outline-none focus:border-[#C9A25D]`} /></div>
                             <div className="relative"><label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Est. Budget (PHP)</label><input type="text" value={formData.budget ? formData.budget.toLocaleString() : ""} readOnly className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} opacity-70`} /></div>
                            
                            {/* Occasion Dropdown - FIX: stop-scroll-propagation */}
                            <div className="relative">
                                <label className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block`}>Occasion</label>
                                <button type="button" onClick={() => setEventTypeOpen(!eventTypeOpen)} className={`w-full text-left bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} flex justify-between items-center`}>
                                    {eventType || "Select Type"} <ChevronDown className="w-4 h-4 opacity-50" />
                                </button>
                                {eventTypeOpen && (
                                    <div className={`absolute bottom-full left-0 w-full mb-1 max-h-48 overflow-y-auto shadow-xl z-50 ${theme.dropdownBg} border ${theme.border} stop-scroll-propagation`}>
                                        {eventOptions.map(opt => (
                                            <div key={opt} onClick={() => { setEventType(opt); setEventTypeOpen(false); }} className="p-3 hover:bg-[#C9A25D] hover:text-white cursor-pointer text-sm">{opt}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex justify-between items-center">
                        <button type="button" onClick={() => scrollToSection(3)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Back</button>
                        <button type="button" onClick={() => scrollToSection(5)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold hover:text-[#C9A25D] transition-colors">Next Step <ArrowRight className="w-4 h-4" /></button>
                    </div>
                </FadeIn>
             </div>
        </section>

        {/* --- SLIDE 5: SUBMIT --- */}
        <section ref={addToRefs} className={`min-h-screen md:h-screen flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border}`}>
             <div className="max-w-screen-md mx-auto px-6 w-full">
                <FadeIn>
                    <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                        <span className="text-[#C9A25D] text-xs font-bold tracking-widest uppercase mb-2 block">Step 05</span>
                        <h2 className={`font-serif text-4xl md:text-5xl ${theme.text}`}>Final Touches</h2>
                    </div>

                    <textarea name="notes" rows="5" onChange={handleInputChange} placeholder="Share your vision, themes, dietary restrictions, or any specific requests..." className={`w-full bg-transparent border ${theme.border} p-6 text-lg ${theme.text} placeholder-stone-500 focus:outline-none focus:border-[#C9A25D] mb-12`}></textarea>

                    {/* Improved Button */}
                    <button 
                        className={`group relative w-full py-6 text-sm tracking-[0.3em] uppercase font-bold overflow-hidden transition-all duration-300 shadow-2xl ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                        <span className="absolute inset-0 w-full h-full bg-[#C9A25D] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                             Request Quotation
                        </span>
                    </button>
                    
                    <div className="mt-8 text-center">
                         <button type="button" onClick={() => scrollToSection(4)} className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text}`}>Go Back</button>
                    </div>
                </FadeIn>
             </div>
        </section>

      </form>
      <div ref={addToRefs} className="h-auto"><Footer darkMode={darkMode} /></div>
      <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 p-3 backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${activeIndex > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"} ${darkMode ? "bg-stone-800/50 border-stone-700 hover:bg-white hover:text-black" : "bg-white/10 border-stone-200 hover:bg-black hover:text-white"}`}>
        <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Booking;