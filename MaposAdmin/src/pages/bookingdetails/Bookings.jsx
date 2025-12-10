// src/pages/Bookings/Bookings.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardNavbar from "../../components/layout/Navbar";
import BookingList from "./BookingList";
import NewBookingModal from "./NewBookingModal";
import BookingDetails from "./bookingdetails/Bookingdetails";

// --- IMPORT THE HOOK ---
import { useBookings } from "../../hooks/useBooking";

const Bookings = () => {
  // --- STATE ---
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarState");
    return savedState !== null ? savedState === "true" : true;
  });

  const [currentView, setCurrentView] = useState("list");
  const [activeDetailTab, setActiveDetailTab] = useState(
    () => localStorage.getItem("bookingActiveTab") || "Event Info"
  );

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // --- USE THE HOOK (Replaces manual API useEffect) ---
  const { bookings, isLoading, addBooking } = useBookings();

  // --- HANDLERS ---
  
  // Update theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // View safety check
  useEffect(() => {
    if (currentView === "details" && !selectedBooking) {
      setCurrentView("list");
    }
  }, [currentView, selectedBooking]);

  const handleSaveBooking = async (newBookingData) => {
    // Call the API wrapper from our hook
    const result = await addBooking(newBookingData);
    if (result.success) {
      // No need to manually update state; the onSnapshot listener 
      // in useBookings will see the new DB entry and update 'bookings' automatically.
      setIsNewBookingOpen(false);
    } else {
      alert("Failed to create booking. Please try again.");
    }
  };

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    cardBg: darkMode ? "bg-[#141414]" : "bg-white",
    text: darkMode ? "text-stone-200" : "text-stone-900",
    subText: darkMode ? "text-stone-500" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-300",
    accent: "text-[#C9A25D]",
    hoverBg: "hover:bg-[#C9A25D]/5",
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}>
      {/* 
        FIX: Removed local @import of fonts to prevent double-loading/bolding.
        Only keeping the scrollbar utility here.
      */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar
          activeTab="Bookings & Proposals"
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {currentView === "list" || !selectedBooking ? (
          <BookingList
            bookings={bookings} 
            isLoading={isLoading} 
            onSelectBooking={(booking) => {
              setSelectedBooking(booking);
              setCurrentView("details");
            }}
            onOpenNewBooking={() => setIsNewBookingOpen(true)}
            theme={theme}
            darkMode={darkMode}
          />
        ) : (
          <BookingDetails
            booking={selectedBooking}
            onBack={() => {
              setSelectedBooking(null);
              setCurrentView("list");
            }}
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