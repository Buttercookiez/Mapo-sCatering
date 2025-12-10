// src/pages/Customer/Booking.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Clock,
  Users,
  Utensils,
  X,
  AlertCircle,
} from "lucide-react";

import Navbar from "../../components/customer/Navbar";
import Footer from "../../components/customer/Footer";
import GoogleMapModal from "../../components/modals/GoogleMapModal";
import api from "../../api/api"; // Ensure this matches your axios instance

// --- ANIMATION COMPONENTS ---
const StaggeredText = ({ text, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => ref.current && observer.unobserve(ref.current);
  }, []);
  const words = text.split(" ");
  return (
    <span ref={ref} className={`inline-block ${className} leading-tight`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom mr-[0.25em]"
        >
          <span
            className={`inline-block transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
              isVisible ? "translate-y-0" : "translate-y-[110%]"
            }`}
            style={{
              transitionDelay: isVisible ? `${delay + i * 30}ms` : "0ms",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => ref.current && observer.unobserve(ref.current);
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

// --- ALERT MODAL ---
const AlertModal = ({ isOpen, onClose, message, darkMode }) => {
  const [show, setShow] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div
        className={`relative w-full max-w-sm p-8 shadow-2xl transform transition-all duration-300 ease-out ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        } ${darkMode ? "bg-[#1c1c1c] border border-stone-800" : "bg-white"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${
            darkMode
              ? "text-stone-500 hover:text-white"
              : "text-stone-400 hover:text-black"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#C9A25D]/10 flex items-center justify-center mb-4 text-[#C9A25D]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3
            className={`font-serif text-2xl mb-2 ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            Action Required
          </h3>
          <p
            className={`text-sm mb-8 font-light leading-relaxed font-sans ${
              darkMode ? "text-stone-400" : "text-stone-600"
            }`}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#C9A25D] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#b08d55] transition-colors font-sans"
          >
            Okay, Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DROPDOWN INPUT ---
const DropdownInput = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
  icon: Icon,
  theme,
  darkMode,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };
  return (
    <div className="group relative z-30" ref={dropdownRef}>
      <label
        className={`text-xs uppercase tracking-[0.2em] ${theme.subText} mb-2 block font-light font-sans`}
      >
        {label}
      </label>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full text-left bg-transparent border-b ${
          theme.border
        } py-5 text-xl ${
          theme.text
        } font-light font-sans flex justify-between items-center focus:outline-none focus:border-[#C9A25D] transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={value ? "" : "opacity-30"}>
          {value || placeholder}
        </span>
        {Icon ? (
          <Icon
            className={`w-4 h-4 opacity-40 transition-transform duration-300 ${
              isOpen ? "text-[#C9A25D] opacity-100" : ""
            }`}
          />
        ) : (
          <ChevronDown
            className={`w-4 h-4 opacity-40 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#C9A25D] opacity-100" : ""
            }`}
          />
        )}
      </button>
      {!disabled && (
        <div
          className={`absolute top-full left-0 w-full mt-2 max-h-60 overflow-y-auto shadow-2xl rounded-sm z-50 transition-all duration-300 ease-out origin-top stop-scroll-propagation no-scrollbar ${
            isOpen
              ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
          }`}
          style={{
            backgroundColor: darkMode ? "#1c1c1c" : "#ffffff",
            border: darkMode ? "1px solid #333" : "1px solid #e5e7eb",
          }}
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
                className={`px-6 py-4 cursor-pointer transition-all duration-300 text-xs tracking-[0.25em] uppercase font-medium font-sans hover:pl-8 ${
                  value === opt ? "text-[#C9A25D]" : ""
                }`}
                style={{
                  color:
                    value === opt
                      ? "#C9A25D"
                      : darkMode
                      ? "#d6d3d1"
                      : "#000000",
                }}
                onMouseEnter={(e) => {
                  if (value !== opt) e.target.style.color = "#C9A25D";
                }}
                onMouseLeave={(e) => {
                  if (value !== opt)
                    e.target.style.color = darkMode ? "#d6d3d1" : "#000000";
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div
              className={`px-6 py-4 text-xs tracking-[0.25em] uppercase font-medium font-sans opacity-50 ${
                darkMode ? "text-stone-400" : "text-stone-500"
              }`}
            >
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Booking = () => {
  const navigate = useNavigate();
  const [appLoading, setAppLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [navIsScrolled, setNavIsScrolled] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- FORM DATA --
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneSuffix: "",
    date: "",
    guests: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [eventType, setEventType] = useState("");
  const [specificEventType, setSpecificEventType] = useState("");
  const [serviceStyle, setServiceStyle] = useState("full_service");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // -- MODALS & STATE --
  const [showMapModal, setShowMapModal] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // -- AVAILABILITY STATE --
  const [blockedDates, setBlockedDates] = useState([]); // Stores "YYYY-MM-DD"
  const [fullyBookedDates, setFullyBookedDates] = useState([]); // Stores "YYYY-MM-DD"

  const venues = [
    {
      id: 1,
      name: "Palacios Event Place",
      capacity: "300 Pax",
      img: "/images/palacios.png",
      type: "predefined",
    },
    {
      id: 2,
      name: "La Veranda Events Hall",
      capacity: "150 Pax",
      img: "/images/laverandaa.png",
      type: "predefined",
    },
    {
      id: 3,
      name: "Tenorio's Events Place",
      capacity: "50 Pax",
      img: "/images/tenorios.png",
      type: "predefined",
    },
  ];
  const eventOptions = [
    "Wedding",
    "Corporate Gala",
    "Private Dinner",
    "Birthday",
    "Other",
  ];

  // --- TIME UTILS ---
  const generateTimeOptions = () => {
    const times = [];
    const startHour = 6;
    for (let i = 0; i < 48; i++) {
      const totalMinutes = startHour * 60 + i * 30;
      let hours = Math.floor(totalMinutes / 60) % 24;
      let minutes = totalMinutes % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      let displayHour = hours % 12;
      displayHour = displayHour ? displayHour : 12;
      const minutesStr = minutes < 10 ? "00" : minutes;
      times.push(`${displayHour}:${minutesStr} ${ampm}`);
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  const getEndTimeOptions = () => {
    if (!formData.startTime) return [];
    const startIndex = timeOptions.indexOf(formData.startTime);
    if (startIndex === -1) return [];
    const minDurationSlots = 10; // 5 hours
    return timeOptions.slice(startIndex + minDurationSlots);
  };
  const endTimeOptions = getEndTimeOptions();

  const handleStartTimeChange = (val) => {
    setFormData((prev) => ({ ...prev, startTime: val, endTime: "" }));
  };

  // --- SCROLL & INITIALIZATION & POLLING ---
  useEffect(() => {
    document.body.style.overflow = "hidden";
    let isMounted = true; // Prevents state updates on unmount

    // 1. Loading Simulation
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1500);

    // 2. Fetch Data (Polling Function)
    const fetchAvailability = async () => {
      try {
        // Using '/calendar/data' which returns both events and blockedDates
        const res = await api.get(`/calendar/data?t=${new Date().getTime()}`);

        if (isMounted) {
          const { events, blockedDates } = res.data;

          // A. Set Manual Blocks (Compare JSON to avoid re-renders if same)
          setBlockedDates((prev) => {
            const newData = blockedDates || [];
            return JSON.stringify(prev) !== JSON.stringify(newData)
              ? newData
              : prev;
          });

          // B. Calculate Capacity
          const counts = {};
          events.forEach((ev) => {
            if (ev.status !== "Cancelled") {
              const dateStr = ev.date;
              counts[dateStr] = (counts[dateStr] || 0) + 1;
            }
          });

          const full = Object.keys(counts).filter((date) => counts[date] >= 4);
          setFullyBookedDates((prev) => {
            return JSON.stringify(prev) !== JSON.stringify(full) ? full : prev;
          });
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      }
    };

    // Initial Fetch
    fetchAvailability();

    // 3. Set Interval for Polling (Every 5 seconds)
    const intervalId = setInterval(fetchAvailability, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(intervalId); // Cleanup interval
    };
  }, []);

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
      container.scrollTop = startPosition + distance * easeInOutCubic(progress);
      if (timeElapsed < duration) requestAnimationFrame(animation);
      else setIsScrolling(false);
    };
    requestAnimationFrame(animation);
  }, []);

  const scrollToSection = useCallback(
    (index) => {
      if (index < 0 || index >= sectionRefs.current.length) return;
      setActiveIndex(index);
      setIsScrolling(true);
      smoothScrollTo(sectionRefs.current[index].offsetTop, 1000);
    },
    [smoothScrollTo]
  );

  // --- NAVIGATION VALIDATOR ---
  const validateNavigation = (currentIndex, direction) => {
    if (direction > 0) {
      if (currentIndex === 1) {
        if (
          !formData.firstName ||
          !formData.lastName ||
          !formData.email ||
          !formData.phoneSuffix
        ) {
          setAlertMessage("Please fill in your contact details to proceed.");
          setAlertOpen(true);
          return false;
        }
      } else if (currentIndex === 2) {
        if (!selectedVenue) {
          setAlertMessage("Please select a venue to proceed.");
          setAlertOpen(true);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = (targetIndex) => {
    const direction = targetIndex > activeIndex ? 1 : -1;
    if (validateNavigation(activeIndex, direction))
      scrollToSection(targetIndex);
  };

  // --- EVENT LISTENERS (Wheel/Touch) ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (
        appLoading ||
        isScrolling ||
        showMapModal ||
        alertOpen ||
        e.target.closest(".stop-scroll-propagation")
      )
        return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      if (validateNavigation(activeIndex, direction)) {
        const nextIndex = Math.min(
          Math.max(activeIndex + direction, 0),
          sectionRefs.current.length - 1
        );
        if (nextIndex !== activeIndex) scrollToSection(nextIndex);
      }
    };
    const container = containerRef.current;
    if (container)
      container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      if (container) container.removeEventListener("wheel", handleWheel);
    };
  }, [
    activeIndex,
    isScrolling,
    showMapModal,
    alertOpen,
    scrollToSection,
    appLoading,
    formData,
    selectedVenue,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const onTouchStart = (e) => {
      if (!e.target.closest(".stop-scroll-propagation"))
        setTouchStart(e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      if (!e.target.closest(".stop-scroll-propagation")) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (
        !touchStart ||
        e.target.closest(".stop-scroll-propagation") ||
        isScrolling ||
        appLoading ||
        showMapModal ||
        alertOpen
      )
        return;
      const touchEnd = e.changedTouches[0].clientY;
      const distance = touchStart - touchEnd;
      const direction = distance > 50 ? 1 : distance < -50 ? -1 : 0;
      if (direction !== 0 && validateNavigation(activeIndex, direction)) {
        const nextIndex = Math.min(
          Math.max(activeIndex + direction, 0),
          sectionRefs.current.length - 1
        );
        if (nextIndex !== activeIndex) scrollToSection(nextIndex);
      }
      setTouchStart(null);
    };
    if (container) {
      container.addEventListener("touchstart", onTouchStart, {
        passive: false,
      });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", onTouchEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, [
    touchStart,
    activeIndex,
    isScrolling,
    appLoading,
    showMapModal,
    alertOpen,
    formData,
    selectedVenue,
    scrollToSection,
  ]);

  useEffect(() => {
    if ("scrollRestoration" in window.history)
      window.history.scrollRestoration = "manual";
    if (containerRef.current) containerRef.current.scrollTop = 0;
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

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 9) setFormData((prev) => ({ ...prev, phoneSuffix: val }));
  };
  const handlePredefinedVenueSelect = (venue) => {
    setSelectedVenue(venue);
  };
  const handleCustomVenueSelect = (venueData) => {
    setSelectedVenue({ ...venueData, type: "custom" });
    setShowMapModal(false);
  };
  const handleOpenMap = () => {
    if (!navigator.geolocation) {
      setAlertMessage("Geolocation is not supported by your browser.");
      setAlertOpen(true);
      setShowMapModal(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Current Location",
        });
        setShowMapModal(true);
      },
      (error) => {
        setAlertMessage("Unable to retrieve location. Opening default map.");
        setAlertOpen(true);
        setShowMapModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.date ||
      !formData.startTime ||
      !formData.guests ||
      !eventType
    ) {
      setAlertMessage("Please fill in all required fields.");
      setAlertOpen(true);
      return;
    }
    if (eventType === "Other" && !specificEventType.trim()) {
      setAlertMessage("Please specify the type of your event.");
      setAlertOpen(true);
      return;
    }
    setIsSubmitting(true);
    const bookingData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: `09${formData.phoneSuffix}`,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      guests: formData.guests,
      venue: selectedVenue?.name || "",
      venueId: selectedVenue?.id || null,
      venueType: selectedVenue?.type || "custom",
      eventType: eventType === "Other" ? specificEventType : eventType,
      serviceStyle: serviceStyle,
      notes: formData.notes,
    };
    try {
      const response = await api.post("/inquiries", bookingData);
      navigate("/confirmation", {
        state: { ...bookingData, refId: response.data.refId },
      });
    } catch (error) {
      console.error("Submission Error:", error);
      setAlertMessage("Failed to submit inquiry.");
      setAlertOpen(true);
      setIsSubmitting(false);
    }
  };

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    text: darkMode ? "text-stone-200" : "text-black",
    subText: darkMode ? "text-stone-400" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    dropdownBg: darkMode ? "bg-[#1c1c1c]" : "bg-white",
  };

  // --- CALENDAR RENDER LOGIC (UPDATED) ---
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const renderCalendarDays = () => {
    const y = currentDate.getFullYear(),
      m = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(y, m),
      startDay = getFirstDayOfMonth(y, m),
      days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minBookableDate = new Date(today);
    minBookableDate.setDate(today.getDate() + 14);

    for (let i = 0; i < startDay; i++)
      days.push(<div key={`e-${i}`} className="w-full aspect-square"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const check = new Date(y, m, d);
      // Ensure YYYY-MM-DD format for string comparison
      const str = check.toLocaleDateString("en-CA");

      const isManualBlock = blockedDates.includes(str);
      const isFull = fullyBookedDates.includes(str);
      const isTooSoon = check < minBookableDate;
      const isDisabled = isManualBlock || isFull || isTooSoon;
      const isSelected = formData.date === str;

      let textColor = darkMode ? "#d6d3d1" : "#000000";
      if (isDisabled) textColor = darkMode ? "#57534e" : "#d1d5db";
      if (isSelected) textColor = "#ffffff";

      days.push(
        <button
          key={d}
          type="button"
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            setFormData((p) => ({ ...p, date: str }));
            setTimeout(() => setCalendarOpen(false), 200);
          }}
          className={`w-full aspect-square flex flex-col items-center justify-center rounded-sm transition-all duration-300 font-sans ${
            isSelected ? "bg-[#C9A25D] shadow-lg" : ""
          } ${
            isDisabled
              ? "cursor-not-allowed opacity-50 bg-stone-100/5"
              : "hover:bg-[#C9A25D]/20 hover:text-[#C9A25D]"
          }`}
          style={{ color: textColor }}
        >
          <span className="text-sm font-medium">{d}</span>
          {isFull && !isManualBlock && (
            <span className="text-[7px] text-red-500 font-bold leading-none mt-1">
              FULL
            </span>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isScrolled={activeIndex > 0 || navIsScrolled}
      />
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        darkMode={darkMode}
      />

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center ${
          darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]"
        }`}
        style={{
          clipPath: appLoading
            ? "ellipse(150% 150% at 50% 50%)"
            : "ellipse(150% 100% at 50% -100%)",
          transition: "clip-path 1.2s cubic-bezier(0.76, 0, 0.24, 1)",
        }}
      >
        <div
          className={`text-center transition-all duration-700 ease-out ${
            appLoading
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 -translate-y-20"
          }`}
        >
          <h1
            className={`font-serif text-3xl md:text-4xl tracking-[0.2em] uppercase ${
              darkMode ? "text-white" : "text-stone-900"
            }`}
          >
            Booking
          </h1>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`h-screen w-full font-sans antialiased transition-colors duration-500 overflow-hidden ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white touch-none`}
      >
        <style>{`
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

        <GoogleMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          onSelect={handleCustomVenueSelect}
          darkMode={darkMode}
          currentLocation={currentLocation}
        />

        {/* --- SLIDE 0: HERO --- */}
        <section
          ref={addToRefs}
          className="relative h-screen w-full overflow-hidden bg-stone-900 flex flex-col justify-center items-center shrink-0"
        >
          <div
            className={`absolute inset-0 w-full h-full z-0 transition-transform duration-[2000ms] ease-out ${
              appLoading ? "scale-125" : "scale-100"
            }`}
          >
            <img
              src="https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Hero"
              className="w-full h-full object-cover opacity-40 animate-[pulse_10s_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90"></div>
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-10">
            <FadeIn delay={1000}>
              <span className="text-[#C9A25D] text-xs md:text-sm tracking-[0.3em] uppercase font-light mb-6 block font-sans">
                Reservations
              </span>
            </FadeIn>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.9] mb-8 font-thin drop-shadow-2xl">
              <div className="block overflow-hidden">
                <StaggeredText text="Craft Your" delay={1400} />
              </div>
              <div className="block overflow-hidden">
                <span className="italic font-light">
                  <StaggeredText text="Celebration" delay={1600} />
                </span>
              </div>
            </h1>
            <FadeIn delay={2000}>
              <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed tracking-wide">
                Tell us about your vision. Whether an intimate dinner or a grand
                gala, we craft the menu to match the occasion.
              </p>
            </FadeIn>
          </div>
          <div
            onClick={() => handleNextStep(1)}
            className={`absolute bottom-10 w-full flex flex-col items-center justify-center gap-3 animate-bounce z-10 cursor-pointer hover:opacity-100 transition-opacity duration-1000 delay-[2200ms] ${
              appLoading ? "opacity-0" : "opacity-80"
            }`}
          >
            <span className="text-[9px] text-white tracking-[0.4em] uppercase font-light font-sans">
              Start Booking
            </span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
          </div>
        </section>

        <form onSubmit={handleFormSubmit}>
          {/* --- SLIDE 1: HOST --- */}
          <section
            ref={addToRefs}
            className={`h-screen w-full flex flex-col justify-center py-20 ${theme.bg} shrink-0`}
          >
            <div className="max-w-screen-md mx-auto px-6 w-full">
              <FadeIn>
                <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                  <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">
                    Step 01
                  </span>
                  <h2
                    className={`font-serif text-5xl md:text-6xl ${theme.text} font-thin`}
                  >
                    <StaggeredText text="The Booker" />
                  </h2>
                </div>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="group relative">
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl md:text-2xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`}
                        placeholder="Juan"
                      />
                    </div>
                    <div className="group relative">
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl md:text-2xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`}
                        placeholder="Dela Cruz"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="group relative">
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] font-sans`}
                        placeholder="example@email.com"
                      />
                    </div>
                    <div className="group relative">
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        Phone Number
                      </label>
                      <div
                        className={`flex items-end border-b ${theme.border} focus-within:border-[#C9A25D] transition-colors`}
                      >
                        <span
                          className={`py-3 text-xl ${theme.text} mr-2 font-light select-none opacity-80 font-sans`}
                        >
                          09
                        </span>
                        <input
                          type="text"
                          name="phoneSuffix"
                          value={formData.phoneSuffix}
                          onChange={handlePhoneChange}
                          className={`w-full bg-transparent py-3 text-xl ${theme.text} font-light focus:outline-none font-sans`}
                          placeholder="XXX XXX XXX"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-16 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleNextStep(2)}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* --- SLIDE 2: VENUE --- */}
          <section
            ref={addToRefs}
            className={`h-screen w-full flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border} shrink-0`}
          >
            <div className="max-w-screen-xl mx-auto px-6 w-full stop-scroll-propagation">
              <FadeIn>
                <div className="mb-10 text-center">
                  <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">
                    Step 02
                  </span>
                  <h2
                    className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}
                  >
                    <StaggeredText text="Select a Venue" />
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      onClick={() => handlePredefinedVenueSelect(venue)}
                      className={`group relative cursor-pointer flex flex-col h-[200px] md:h-[450px] transition-all duration-500 ${
                        selectedVenue?.id === venue.id
                          ? "grayscale-0 translate-y-[-10px]"
                          : "grayscale hover:grayscale-0 hover:translate-y-[-10px]"
                      }`}
                    >
                      <div className="absolute inset-0 bg-stone-200 overflow-hidden shadow-xl">
                        <img
                          src={venue.img}
                          alt={venue.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div
                          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                            selectedVenue?.id === venue.id
                              ? "opacity-20"
                              : "opacity-40 group-hover:opacity-20"
                          }`}
                        ></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 text-white z-10">
                        <h3 className="font-serif text-lg md:text-2xl mb-1 leading-none font-light">
                          {venue.name}
                        </h3>
                        <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 mb-4 font-light font-sans">
                          {venue.capacity}
                        </p>
                        <div
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/50 flex items-center justify-center transition-all duration-300 ${
                            selectedVenue?.id === venue.id
                              ? "bg-[#C9A25D] border-[#C9A25D] text-white"
                              : "group-hover:bg-white group-hover:text-black"
                          }`}
                        >
                          {selectedVenue?.id === venue.id ? (
                            <Check className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </div>
                      </div>
                      {selectedVenue?.id === venue.id && (
                        <div className="absolute -inset-2 border border-[#C9A25D]/50 z-[-1]"></div>
                      )}
                    </div>
                  ))}
                  <div
                    onClick={handleOpenMap}
                    className={`group relative cursor-pointer flex flex-col h-[200px] md:h-[450px] bg-stone-100 dark:bg-stone-900 border ${
                      theme.border
                    } transition-all duration-500 hover:border-[#C9A25D] ${
                      selectedVenue?.type === "custom" ? "border-[#C9A25D]" : ""
                    }`}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${
                          selectedVenue?.type === "custom"
                            ? "bg-[#C9A25D] text-white"
                            : "bg-stone-200 dark:bg-stone-800 text-stone-500 group-hover:text-[#C9A25D]"
                        }`}
                      >
                        <Plus className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <h3 className="font-serif text-lg md:text-2xl mb-2 font-light text-black dark:text-white">
                        Other Location
                      </h3>
                      <p className="hidden md:block text-xs text-stone-500 dark:text-stone-400 px-4 font-light font-sans">
                        Search Google Maps for your preferred venue.
                      </p>
                      {selectedVenue?.type === "custom" && (
                        <div className="mt-6 text-[10px] text-[#C9A25D] flex items-center justify-center gap-1 font-light font-sans">
                          <Check className="w-3 h-3" /> Selected:{" "}
                          {selectedVenue.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-12 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => scrollToSection(1)}
                    className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextStep(3)}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* --- SLIDE 3: SERVICE STYLE --- */}
          <section
            ref={addToRefs}
            className={`h-screen w-full flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border} shrink-0`}
          >
            <div className="max-w-screen-md mx-auto px-6 w-full text-center">
              <FadeIn>
                <div className="mb-12">
                  <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">
                    Step 03
                  </span>
                  <h2
                    className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}
                  >
                    <StaggeredText text="Service Style" />
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      id: "full_service",
                      label: "Full Service",
                      desc: "Complete catering with food, staff, setup, and styling.",
                      icon: Utensils,
                    },
                    {
                      id: "service_only",
                      label: "Service Only",
                      desc: "Staff, equipment, and setup only. You provide the food.",
                      icon: Users,
                    },
                  ].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setServiceStyle(style.id)}
                      className={`p-8 border cursor-pointer transition-all duration-500 hover:-translate-y-2 ${
                        serviceStyle === style.id
                          ? "border-[#C9A25D] bg-[#C9A25D]/5"
                          : `${theme.border} hover:border-[#C9A25D]`
                      }`}
                    >
                      <div
                        className={`w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300`}
                        style={{
                          backgroundColor:
                            serviceStyle === style.id
                              ? "#C9A25D"
                              : darkMode
                              ? "#292524"
                              : "#e5e5e5",
                          color:
                            serviceStyle === style.id
                              ? "#ffffff"
                              : darkMode
                              ? "#a8a29e"
                              : "#4b5563",
                        }}
                      >
                        <style.icon className="w-5 h-5" />
                      </div>
                      <h3
                        className={`font-serif text-2xl ${theme.text} mb-3 font-light`}
                      >
                        {style.label}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed ${theme.subText} font-light font-sans`}
                      >
                        {style.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-16 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => scrollToSection(2)}
                    className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextStep(4)}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light hover:text-[#C9A25D] transition-colors font-sans"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* --- SLIDE 4: EVENT LOGISTICS --- */}
          <section
            ref={addToRefs}
            className={`h-screen w-full flex flex-col justify-center py-20 ${theme.bg} border-t ${theme.border} shrink-0`}
          >
            <div className="max-w-screen-lg mx-auto px-6 w-full">
              <FadeIn>
                <div className="mb-12 border-l-2 border-[#C9A25D] pl-6">
                  <span className="text-[#C9A25D] text-xs font-light tracking-widest uppercase mb-2 block font-sans">
                    Step 04
                  </span>
                  <h2
                    className={`font-serif text-4xl md:text-5xl ${theme.text} font-thin`}
                  >
                    <StaggeredText text="Event Details" />
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-10 stop-scroll-propagation">
                    <div className="group relative z-50">
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        className={`w-full text-left bg-transparent border-b ${theme.border} py-5 text-xl ${theme.text} font-light font-sans flex justify-between items-center focus:outline-none focus:border-[#C9A25D] transition-colors`}
                      >
                        {formData.date || "Select Date"}
                        <Calendar
                          className={`w-4 h-4 opacity-40 transition-transform duration-300 ${
                            calendarOpen ? "text-[#C9A25D] opacity-100" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`absolute top-full left-0 w-full mt-2 p-6 shadow-2xl rounded-sm z-50 transition-all duration-300 origin-top stop-scroll-propagation ${
                          calendarOpen
                            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                        }`}
                        style={{
                          backgroundColor: darkMode ? "#1c1c1c" : "#ffffff",
                          border: darkMode
                            ? "1px solid #333"
                            : "1px solid #e5e7eb",
                        }}
                      >
                        <div className="flex justify-between items-center mb-6 border-b pb-4 border-stone-200 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDate(
                                new Date(
                                  currentDate.setMonth(
                                    currentDate.getMonth() - 1
                                  )
                                )
                              );
                            }}
                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-black dark:text-stone-300" />
                          </button>
                          <span
                            className={`text-sm font-medium tracking-widest uppercase ${theme.text} font-sans`}
                          >
                            {currentDate.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDate(
                                new Date(
                                  currentDate.setMonth(
                                    currentDate.getMonth() + 1
                                  )
                                )
                              );
                            }}
                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-black dark:text-stone-300" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 mb-2 text-center">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (day) => (
                              <span
                                key={day}
                                className="text-[10px] uppercase tracking-wider text-stone-400 font-sans"
                              >
                                {day}
                              </span>
                            )
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {renderCalendarDays()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 z-30 relative">
                      <DropdownInput
                        label="Start Time"
                        value={formData.startTime}
                        options={timeOptions}
                        onSelect={handleStartTimeChange}
                        placeholder="Start"
                        icon={Clock}
                        theme={theme}
                        darkMode={darkMode}
                      />
                      <DropdownInput
                        label="End Time"
                        value={formData.endTime}
                        options={endTimeOptions}
                        onSelect={(val) =>
                          setFormData((prev) => ({ ...prev, endTime: val }))
                        }
                        placeholder="End"
                        icon={Clock}
                        theme={theme}
                        darkMode={darkMode}
                        disabled={!formData.startTime}
                      />
                    </div>
                  </div>
                  <div className="space-y-10 stop-scroll-propagation">
                    <div>
                      <label
                        className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                      >
                        Guest Count
                      </label>
                      <input
                        type="number"
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        placeholder="0"
                        className={`w-full bg-transparent border-b ${theme.border} py-5 text-xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`}
                      />
                    </div>
                    <div>
                      <DropdownInput
                        label="Occasion"
                        value={eventType}
                        options={eventOptions}
                        onSelect={(val) => setEventType(val)}
                        placeholder="Select Type"
                        theme={theme}
                        darkMode={darkMode}
                      />
                      {eventType === "Other" && (
                        <div className="mt-4 animate-[fadeIn_0.5s_ease-out]">
                          <label
                            className={`text-xs uppercase tracking-widest ${theme.subText} mb-2 block font-light font-sans`}
                          >
                            Please Specify
                          </label>
                          <input
                            type="text"
                            value={specificEventType}
                            onChange={(e) =>
                              setSpecificEventType(e.target.value)
                            }
                            placeholder="e.g. Debut, Reunion"
                            className={`w-full bg-transparent border-b ${theme.border} py-3 text-xl ${theme.text} font-light focus:outline-none focus:border-[#C9A25D] transition-colors font-sans`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-20">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`group relative w-full py-6 text-sm tracking-[0.3em] uppercase font-light overflow-hidden transition-all duration-300 shadow-2xl ${
                      darkMode ? "bg-white text-black" : "bg-black text-white"
                    } font-sans ${
                      isSubmitting ? "opacity-70 cursor-wait" : ""
                    }`}
                  >
                    <span className="absolute inset-0 w-full h-full bg-[#C9A25D] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                    <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                      {isSubmitting ? "Processing..." : "Request A Quotation"}
                    </span>
                  </button>
                </div>
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => scrollToSection(3)}
                    className={`text-xs uppercase tracking-widest ${theme.subText} hover:${theme.text} font-light font-sans`}
                  >
                    Back
                  </button>
                </div>
              </FadeIn>
            </div>
          </section>
        </form>
        <div ref={addToRefs} className="h-auto shrink-0">
          <Footer darkMode={darkMode} />
        </div>
        <button
          onClick={() => scrollToSection(0)}
          className={`fixed bottom-8 right-8 p-3 backdrop-blur-md border rounded-full shadow-lg transition-all duration-500 z-50 ${
            activeIndex > 0 || navIsScrolled
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 pointer-events-none"
          } ${
            darkMode
              ? "bg-stone-800/50 border-stone-700 hover:bg-white hover:text-black"
              : "bg-white/10 border-stone-200 hover:bg-black hover:text-white"
          }`}
        >
          <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </>
  );
};

export default Booking;
