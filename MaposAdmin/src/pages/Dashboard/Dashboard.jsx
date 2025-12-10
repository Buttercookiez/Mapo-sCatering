import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  DollarSign,
  Loader2,
  PieChart,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import Hooks
import { useCalendar } from "../../hooks/useCalendar";
import { useBookings } from "../../hooks/useBooking";
import { useInventory } from "../../hooks/useInventory";

// Import Layout Components
import Sidebar from "../../components/layout/Sidebar";
import DashboardNavbar from "../../components/layout/Navbar";

// --- Shared Animation Component ---
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- COMPONENT: ANIMATED DONUT CHART ---
const AssetDonutChart = ({ data, size = 160, strokeWidth = 20, theme }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-xs text-stone-400">
        <PieChart className="mb-2 opacity-20" size={32} />
        No Asset Data
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      <div
        className={`relative transition-all duration-[1500ms] ease-out transform ${
          isLoaded
            ? "rotate-0 opacity-100 scale-100"
            : "-rotate-180 opacity-0 scale-50"
        }`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDasharray = `${
              percent * circumference
            } ${circumference}`;
            const strokeDashoffset = -cumulativePercent * circumference;
            cumulativePercent += percent;
            const isHovered = hoveredIndex === index;
            const currentStrokeWidth = isLoaded
              ? isHovered
                ? strokeWidth + 6
                : strokeWidth
              : 0;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={currentStrokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                style={{
                  transition:
                    "stroke-width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 delay-500 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{ pointerEvents: "none" }}
        >
          <span className={`text-3xl font-serif ${theme.text}`}>{total}</span>
          <span
            className={`text-[8px] uppercase tracking-widest ${theme.subText}`}
          >
            Assets
          </span>
        </div>
      </div>

      <div className="mt-6 w-full space-y-2 px-2">
        {data.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between text-[10px] uppercase tracking-widest transition-all duration-700 transform ${
              isLoaded
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
            style={{ transitionDelay: `${400 + i * 150}ms` }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  hoveredIndex === i
                    ? "scale-150 ring-2 ring-offset-1 ring-stone-300 dark:ring-stone-700"
                    : ""
                }`}
                style={{ backgroundColor: item.color }}
              ></span>
              <span
                className={`${theme.subText} ${
                  hoveredIndex === i ? theme.text : ""
                } transition-colors`}
              >
                {item.label}
              </span>
            </div>
            <span className={`font-bold ${theme.text}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENT: STAT CARD (Updated) ---
const StatCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  theme,
  isLoading,
  delay,
}) => (
  <FadeIn delay={delay} className="h-full">
    <div
      className={`p-6 border ${theme.border} ${theme.cardBg} group hover:border-[#C9A25D]/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden rounded-sm`}
    >
      {/* Background Decor */}
      <Icon
        size={100}
        className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12"
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <span
          className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText}`}
        >
          {label}
        </span>
        <div
          className={`p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-[#C9A25D]`}
        >
          <Icon size={16} strokeWidth={1.5} />
        </div>
      </div>

      <div className="relative z-10">
        <div className="min-h-[48px] flex items-center mb-1">
          {isLoading ? (
            <Loader2 className="animate-spin text-[#C9A25D]" />
          ) : (
            <h3
              className={`font-serif text-3xl md:text-4xl font-light ${theme.text}`}
            >
              {value}
            </h3>
          )}
        </div>

        {/* LINE REMOVED HERE */}

        <div className="flex justify-start items-end mt-4">
          <span className="text-[9px] uppercase tracking-wider text-stone-500 opacity-60">
            {subValue}
          </span>
        </div>
      </div>
    </div>
  </FadeIn>
);

const Dashboard = () => {
  const navigate = useNavigate();

  // --- State & Themes ---
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("sidebarState") !== "false"
  );
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Financial Filter State ---
  const [timeRange, setTimeRange] = useState("Weekly"); // 'Weekly', 'Monthly', 'Yearly'
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Data Integration ---
  const { events, loading: calendarLoading } = useCalendar();
  const { bookings, totalRevenue, isLoading: bookingsLoading } = useBookings();
  const { inventoryData, logsData, loading: inventoryLoading } = useInventory();

  // --- Handlers for Date Navigation ---
  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (timeRange === "Weekly") newDate.setDate(newDate.getDate() - 7);
    else if (timeRange === "Monthly") newDate.setMonth(newDate.getMonth() - 1);
    else if (timeRange === "Yearly")
      newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (timeRange === "Weekly") newDate.setDate(newDate.getDate() + 7);
    else if (timeRange === "Monthly") newDate.setMonth(newDate.getMonth() + 1);
    else if (timeRange === "Yearly")
      newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const getDisplayDateLabel = () => {
    if (timeRange === "Weekly") {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString(
        "default",
        { month: "short" }
      )} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString("default", {
        month: "short",
      })}`;
    }
    if (timeRange === "Monthly")
      return currentDate.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      });
    if (timeRange === "Yearly") return currentDate.getFullYear().toString();
  };

  // --- Financial Data Processing Engine ---
  const financialChartData = useMemo(() => {
    if (!bookings) return { stats: [], max: 1000 };

    // 1. Prepare Buckets
    let buckets = [];
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth();

    if (timeRange === "Weekly") {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(currentDate);
      monday.setDate(diff);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        buckets.push({
          label: d.toLocaleDateString("default", { weekday: "narrow" }),
          fullLabel: d.toLocaleDateString("default", {
            weekday: "short",
            day: "numeric",
          }),
          dateObj: new Date(d.setHours(0, 0, 0, 0)),
          revenue: 0,
          expense: 0,
          profit: 0,
        });
      }
    } else if (timeRange === "Monthly") {
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(viewYear, viewMonth, i);
        buckets.push({
          label: `${i}`,
          fullLabel: d.toLocaleDateString("default", {
            month: "short",
            day: "numeric",
          }),
          dateObj: new Date(d.setHours(0, 0, 0, 0)),
          revenue: 0,
          expense: 0,
          profit: 0,
        });
      }
    } else if (timeRange === "Yearly") {
      for (let i = 0; i < 12; i++) {
        const d = new Date(viewYear, i, 1);
        buckets.push({
          label: d.toLocaleDateString("default", { month: "narrow" }),
          fullLabel: d.toLocaleDateString("default", { month: "long" }),
          monthIndex: i,
          revenue: 0,
          expense: 0,
          profit: 0,
        });
      }
    }

    // 2. Aggregate Data from Bookings
    const validBookings = bookings.filter(
      (b) => b.status !== "Cancelled" && b.status !== "Rejected"
    );

    validBookings.forEach((booking) => {
      const bDate = new Date(
        booking.dateOfEvent || booking.date || booking.createdAt
      );
      if (isNaN(bDate)) return;

      // Financial Values
      const revenue = Number(
        booking.billing?.totalCost || booking.totalPrice || booking.amount || 0
      );
      const expense = Number(booking.billing?.operationalCost || 0);
      const profit = revenue - expense;

      // Match Booking to Bucket
      let matchIndex = -1;

      if (timeRange === "Weekly" || timeRange === "Monthly") {
        const bTime = new Date(bDate).setHours(0, 0, 0, 0);
        matchIndex = buckets.findIndex(
          (b) => b.dateObj && b.dateObj.getTime() === bTime
        );
      } else if (timeRange === "Yearly") {
        if (bDate.getFullYear() === viewYear) {
          matchIndex = bDate.getMonth();
        }
      }

      if (matchIndex !== -1 && buckets[matchIndex]) {
        buckets[matchIndex].revenue += revenue;
        buckets[matchIndex].expense += expense;
        buckets[matchIndex].profit += profit;
      }
    });

    // 3. Scale
    const maxVal = Math.max(...buckets.map((b) => b.revenue), 1000);

    return { stats: buckets, max: maxVal };
  }, [bookings, timeRange, currentDate]);

  // --- Inventory Memos ---
  const inventoryStats = useMemo(() => {
    if (!inventoryData) return [];
    const inUse = inventoryData.reduce(
      (acc, item) => acc + (item.stock?.quantityInUse || 0),
      0
    );
    const totalOwned = inventoryData.reduce(
      (acc, item) => acc + (item.stock?.quantityTotal || 0),
      0
    );
    const available = totalOwned - inUse;
    const lost = logsData
      ? logsData.reduce((acc, log) => acc + (log.quantityLost || 0), 0)
      : 0;
    return [
      {
        label: "Available",
        value: available,
        color: darkMode ? "#57534e" : "#d6d3d1",
      },
      { label: "Checked Out", value: inUse, color: "#C9A25D" },
      { label: "Lost / Damaged", value: lost, color: "#ef4444" },
    ];
  }, [inventoryData, logsData, darkMode]);

  const lowStockItems = useMemo(() => {
    return inventoryData
      ? inventoryData
          .filter(
            (i) =>
              i.stock?.quantityTotal - i.stock?.quantityInUse <=
              i.stock?.threshold
          )
          .slice(0, 3)
      : [];
  }, [inventoryData]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  const formatK = (amount) =>
    amount >= 1000 ? `₱${(amount / 1000).toFixed(1)}k` : `₱${amount}`;

  // Theme Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    cardBg: darkMode ? "bg-[#141414]" : "bg-white",
    text: darkMode ? "text-stone-200" : "text-stone-900",
    subText: darkMode ? "text-stone-500" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    rowHover: darkMode ? "hover:bg-stone-900" : "hover:bg-stone-50",
  };

  // --- Event Processing ---
  const dashboardEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = events.filter((e) => {
      const d = e.dateObj || new Date(e.date);
      return d >= today && e.status !== "Cancelled";
    });
    upcoming.sort(
      (a, b) =>
        (a.dateObj || new Date(a.date)) - (b.dateObj || new Date(b.date))
    );
    return upcoming.slice(0, 5);
  }, [events]);

  const formatDateDisplay = (dateObj) => {
    const d = new Date(dateObj);
    return {
      day: d.getDate().toString().padStart(2, "0"),
      month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    };
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text} selection:bg-[#C9A25D] selection:text-white transition-colors duration-500`}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar
          activeTab={activeTab}
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 scroll-smooth no-scrollbar">
          {/* 2. STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              subValue="Current Fiscal Year"
              icon={DollarSign}
              theme={theme}
              isLoading={bookingsLoading}
              delay={0}
            />
            <StatCard
              label="Active Events"
              value={events.length.toString().padStart(2, "0")}
              subValue="Confirmed Bookings"
              icon={Calendar}
              theme={theme}
              isLoading={calendarLoading}
              delay={100}
            />
            <StatCard
              label="Pending Inquiries"
              value={bookings
                .filter((b) => b.status === "Pending")
                .length.toString()
                .padStart(2, "0")}
              subValue="Requires Attention"
              icon={CheckSquare}
              theme={theme}
              isLoading={bookingsLoading}
              delay={200}
            />
            <StatCard
              label="Inventory Alert"
              value={lowStockItems.length.toString().padStart(2, "0")}
              subValue="Items below threshold"
              icon={AlertCircle}
              theme={theme}
              isLoading={inventoryLoading}
              delay={300}
            />
          </div>

          {/* 3. MIDDLE SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* UPCOMING SCHEDULE */}
            <div className="lg:col-span-2">
              <FadeIn delay={400} className="h-full">
                <div
                  className={`border ${theme.border} ${theme.cardBg} flex flex-col h-full min-h-[450px] shadow-sm`}
                >
                  <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif text-2xl italic">
                        Upcoming Schedule
                      </h3>
                    </div>
                    <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                      <MoreHorizontal size={18} className={theme.subText} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {calendarLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400">
                        <Loader2
                          size={24}
                          className="animate-spin mb-2 text-[#C9A25D]"
                        />
                        <span className="text-xs uppercase tracking-widest">
                          Syncing Calendar...
                        </span>
                      </div>
                    ) : dashboardEvents.length > 0 ? (
                      dashboardEvents.map((event) => {
                        const { day, month } = formatDateDisplay(event.dateObj);
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center justify-between p-4 mb-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all rounded-sm border border-transparent hover:border-stone-100 dark:hover:border-stone-800 group cursor-pointer`}
                          >
                            <div className="flex items-center gap-5">
                              {/* Date Block */}
                              <div
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-sm border ${theme.border} bg-stone-50 dark:bg-stone-900 group-hover:border-[#C9A25D]/50 transition-colors`}
                              >
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C9A25D]">
                                  {month}
                                </span>
                                <span className="font-serif text-2xl leading-none">
                                  {day}
                                </span>
                              </div>
                              <div>
                                <h4
                                  className={`font-serif text-lg ${theme.text} group-hover:text-[#C9A25D] transition-colors line-clamp-1`}
                                >
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span
                                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.border} ${theme.subText}`}
                                  >
                                    {event.type}
                                  </span>
                                  <span
                                    className={`text-xs ${theme.subText} flex items-center gap-1`}
                                  >
                                    <Clock size={10} />{" "}
                                    {event.time || "All Day"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] rounded-full font-medium ${
                                event.status === "Confirmed"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-orange-500/10 text-orange-500"
                              }`}
                            >
                              {event.status}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 dark:border-stone-800 m-4 rounded-sm">
                        <span className="text-sm italic">
                          No upcoming events.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* INVENTORY WATCH */}
            <div className="lg:col-span-1">
              <FadeIn delay={500} className="h-full">
                <div
                  className={`border ${theme.border} ${theme.cardBg} p-6 h-full flex flex-col shadow-sm`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-xl italic">
                      Asset Activity
                    </h3>
                    <AlertCircle
                      size={18}
                      strokeWidth={1}
                      className={theme.subText}
                    />
                  </div>

                  {/* Chart */}
                  <div className="flex-none mb-6">
                    {inventoryLoading ? (
                      <Loader2 className="mx-auto animate-spin text-[#C9A25D]" />
                    ) : (
                      <AssetDonutChart
                        data={inventoryStats}
                        theme={theme}
                        size={150}
                        strokeWidth={15}
                      />
                    )}
                  </div>

                  {/* Low Stock Watchlist */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <span
                      className={`text-[10px] uppercase tracking-widest ${theme.subText} mb-3 block`}
                    >
                      Low Stock Alerts
                    </span>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((item, i) => (
                          <div
                            key={i}
                            className={`flex justify-between items-center p-3 border ${theme.border} rounded-sm bg-red-500/5`}
                          >
                            <span
                              className={`text-xs font-medium ${theme.text} truncate max-w-[120px]`}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-red-400">
                              {item.stock?.quantityTotal -
                                item.stock?.quantityInUse}{" "}
                              Left
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-stone-400 italic text-center py-4">
                          All stock levels healthy.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FUNCTIONAL BUTTON: Go to Inventory */}
                  <button
                    onClick={() => navigate("/inventory")}
                    className={`mt-4 w-full py-3 border ${theme.border} text-[10px] uppercase tracking-[0.25em] hover:bg-[#C9A25D] hover:text-white hover:border-[#C9A25D] transition-colors`}
                  >
                    Full Inventory
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* 4. FINANCIAL SECTION */}
          <FadeIn delay={600}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Side */}
              <div
                className={`lg:col-span-2 border ${theme.border} ${theme.cardBg} p-8 shadow-sm`}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-start mb-10 gap-4">
                  <div>
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] ${theme.subText} block mb-2`}
                    >
                      Performance Overview
                    </span>
                    <h3 className="font-serif text-3xl italic">
                      Profit & Expenses
                    </h3>

                    {/* Date Navigation for Chart */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={handlePrevDate}
                        className={`p-1 rounded-full ${theme.subText} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${theme.text} min-w-[140px] text-center`}
                      >
                        {getDisplayDateLabel()}
                      </span>
                      <button
                        onClick={handleNextDate}
                        className={`p-1 rounded-full ${theme.subText} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Filter */}
                  <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-sm p-1 h-fit">
                    {["Weekly", "Monthly", "Yearly"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-4 py-1 text-[10px] uppercase tracking-widest rounded-sm transition-all ${
                          timeRange === t
                            ? "bg-white dark:bg-stone-800 shadow-sm text-[#C9A25D]"
                            : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bar Chart Visualization */}
                <div className="flex items-end justify-between h-64 w-full gap-2 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-full h-px ${
                          darkMode ? "bg-white" : "bg-black"
                        }`}
                      ></div>
                    ))}
                  </div>

                  {financialChartData.stats.length === 0 ||
                  financialChartData.stats.every((s) => s.revenue === 0) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 z-20">
                      <span className="text-xs italic">
                        No financial data for this period.
                      </span>
                    </div>
                  ) : (
                    financialChartData.stats.map((item, i) => {
                      const heightPercent =
                        (item.revenue / financialChartData.max) * 100;
                      const expensePercent =
                        item.revenue > 0
                          ? (item.expense / item.revenue) * 100
                          : 0;

                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer z-10 px-0.5"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-stone-900 text-white px-3 py-2 rounded-sm shadow-xl z-20 pointer-events-none w-max border border-stone-700">
                            <span className="text-[9px] uppercase tracking-wider text-[#C9A25D] font-bold block mb-1 border-b border-stone-700 pb-1">
                              {item.fullLabel}
                            </span>
                            <div className="text-xs grid grid-cols-2 gap-x-3 gap-y-1">
                              <span className="text-stone-400">Rev:</span>{" "}
                              <span className="text-right text-white">
                                {formatK(item.revenue)}
                              </span>
                              <span className="text-stone-400">Exp:</span>{" "}
                              <span className="text-right text-stone-400">
                                {formatK(item.expense)}
                              </span>
                              <span className="text-stone-400">Net:</span>{" "}
                              <span className="text-right text-emerald-400">
                                {formatK(item.profit)}
                              </span>
                            </div>
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45 border-r border-b border-stone-700"></div>
                          </div>

                          {/* Bars */}
                          <div
                            style={{ height: `${heightPercent || 2}%` }}
                            className={`w-full ${
                              item.revenue > 0
                                ? "bg-[#C9A25D]"
                                : "bg-stone-100 dark:bg-stone-800"
                            } opacity-90 group-hover:opacity-100 group-hover:scale-y-105 transition-all duration-300 relative rounded-t-sm shadow-sm origin-bottom`}
                          >
                            {/* Inner Bar = Expenses */}
                            <div
                              style={{ height: `${expensePercent}%` }}
                              className="absolute bottom-0 left-0 w-full bg-stone-400/50 dark:bg-stone-900/60 transition-all duration-500 border-t border-stone-500/20"
                            ></div>
                          </div>
                          <span
                            className={`text-[9px] text-center mt-3 uppercase tracking-wider ${theme.subText} group-hover:text-[#C9A25D] transition-colors truncate w-full block`}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div
                className={`lg:col-span-1 border ${theme.border} ${theme.cardBg} p-6 shadow-sm flex flex-col`}
              >
                <h3 className="font-serif text-xl italic mb-6">
                  Recent Activity
                </h3>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 relative">
                  <div
                    className={`absolute left-[7px] top-2 bottom-2 w-px ${
                      darkMode ? "bg-stone-800" : "bg-stone-200"
                    }`}
                  ></div>
                  {logsData &&
                    logsData.slice(0, 5).map((log, i) => (
                      <div key={i} className="pl-6 relative group">
                        <div
                          className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                            theme.cardBg
                          } ${
                            log.action === "checkout"
                              ? "border-orange-400 bg-orange-400"
                              : "border-emerald-500 bg-emerald-500"
                          } z-10`}
                        ></div>
                        <p
                          className={`text-xs font-medium ${theme.text} leading-tight`}
                        >
                          <span
                            className={
                              log.action === "checkout"
                                ? "text-orange-400"
                                : "text-emerald-500"
                            }
                          >
                            {log.action === "checkout"
                              ? "Checked Out"
                              : "Restocked"}
                          </span>{" "}
                          {log.quantityMoved}x {log.itemName}
                        </p>
                        <span
                          className={`text-[10px] ${theme.subText} mt-1 block`}
                        >
                          {log.date
                            ? new Date(log.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    ))}
                  {(!logsData || logsData.length === 0) && (
                    <div className="text-xs text-stone-400 italic pl-6">
                      No recent activity logs.
                    </div>
                  )}
                </div>

                {/* FUNCTIONAL BUTTON: View All Logs (Goes to Inventory) */}
                <button
                  onClick={() => navigate("/inventory")}
                  className={`mt-4 w-full py-3 border ${theme.border} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-[10px] uppercase tracking-widest ${theme.subText}`}
                >
                  View All Logs
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
