import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardNavbar from "../../components/layout/Navbar";
import BookingList from "./BookingList";
import api from "../../api/api";
import NewBookingModal from "./NewBookingModal";
import BookingDetails from "./Bookingdetails";

// --- MAIN PAGE COMPONENT ---
const Bookings = () => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarState");
    return savedState !== null ? savedState === "true" : true;
  });

  // 1. Initialize View (Default to 'list' on refresh to avoid empty details)
  const [currentView, setCurrentView] = useState("list");

  const [activeDetailTab, setActiveDetailTab] = useState(
    () => localStorage.getItem("bookingActiveTab") || "Event Info"
  );

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api
      .get("/inquiries")
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err));
  }, []);

  // 2. Safety Check: If we are in 'details' mode but have no booking selected (e.g., after refresh), go back to list
  useEffect(() => {
    if (currentView === "details" && !selectedBooking) {
      setCurrentView("list");
    }
  }, [currentView, selectedBooking]);

  const handleSaveBooking = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("bookingActiveTab", activeDetailTab);
  }, [activeDetailTab]);

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
    <div
      className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white`}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
          .font-serif { font-family: 'Cormorant Garamond', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
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

        {/* 3. Logic Check: Only show Details if currentView is 'details' AND selectedBooking exists */}
        {currentView === "list" || !selectedBooking ? (
          <BookingList
            bookings={bookings}
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
            booking={selectedBooking} // REMOVED "|| bookings[0]"
            onBack={() => {
              setSelectedBooking(null); // Clear selection when going back
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
