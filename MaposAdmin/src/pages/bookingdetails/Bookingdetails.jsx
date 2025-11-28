// src/pages/bookingdetails/Bookingdetails.jsx
import React, { useState, useEffect, useRef } from "react";
// Import the new send service function - assume updateBookingStatus exists or we mock it
import { getBookingByRefId, sendProposalEmail } from "../../api/bookingService"; 
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  Send,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChefHat,
  Utensils,
  CreditCard,
  Bell,
  MessageSquare,
  User,
  AlertTriangle,
  Wallet,
  Loader2,
  Check,      // Added
  XCircle,    // Added
  Lock,       // Added
} from "lucide-react";

// --- STATIC DATA ---
const detailTabs = ["Event Info", "Payments", "Proposal", "Notes"];

const menuPackages = [
  { id: 1, name: "Standard Buffet", price: 850 },
  { id: 2, name: "Premium Plated", price: 1200 },
  { id: 3, name: "Grand Gala Set", price: 2500 },
];

// --- UI HELPERS ---
const FadeIn = ({ children, delay = 0 }) => {
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

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const renderStatusBadge = (status) => {
  const styles = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200", // Used for Rejected
    Reviewing: "bg-blue-100 text-blue-700 border-blue-200",
    Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Unpaid: "bg-stone-100 text-stone-600 border-stone-200",
    Draft: "bg-stone-100 text-stone-500 border-stone-200",
  };
  
  const activeStyle = styles[status] || styles.Draft;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${activeStyle}`}>
      {status}
    </span>
  );
};

// --- MAIN COMPONENT ---
const BookingDetails = ({
  booking,
  onBack,
  activeDetailTab,
  setActiveDetailTab,
  theme,
  darkMode,
}) => {
  const [bookingData, setBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposalTotal, setProposalTotal] = useState(0);

  // Email State
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'success', 'error', null

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionSent, setRejectionSent] = useState(false);

  // 1. Fetch Data Effect
  useEffect(() => {
    const fetchBookingDetails = async () => {
      const idToFetch = booking?.refId || booking?.id;

      if (!idToFetch) return;

      setIsLoading(true);
      try {
        const data = await getBookingByRefId(idToFetch);
        setBookingData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not sync with database. Showing list data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [booking]);

  // 2. Proposal Calculation Effect
  useEffect(() => {
    if (bookingData) {
        const proposalData = bookingData.proposal || {};
        if (proposalData.costBreakdown?.grandTotal) {
            setProposalTotal(proposalData.costBreakdown.grandTotal);
        } else if (bookingData.estimatedBudget) {
            setProposalTotal(bookingData.estimatedBudget);
        }
    }
  }, [bookingData]);

  // 3. Handle Send Proposal
  const handleSendProposal = async () => {
    if (!details.email) {
      alert("No email address found for this client.");
      return;
    }

    setIsSending(true);
    setEmailStatus(null);

    const menuCost = proposalTotal; 
    const serviceCharge = menuCost * 0.1;
    const grandTotal = menuCost + serviceCharge;

    const payload = {
      refId: details.id,
      clientName: details.client,
      clientEmail: details.email,
      totalCost: grandTotal,
      breakdown: {
        menuPrice: menuCost,
        serviceCharge: serviceCharge
      },
      details: {
        date: details.date,
        guests: details.guests,
        venue: details.venue
      }
    };

    try {
      await sendProposalEmail(payload);
      setEmailStatus("success");
      setTimeout(() => setEmailStatus(null), 3000); // Reset after 3 seconds
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Handle Booking Status Change (Mock Implementation)
  const handleUpdateStatus = (newStatus) => {
    // In a real app, this would call an API like updateBookingStatus(id, newStatus)
    setBookingData(prev => ({
        ...prev,
        status: newStatus
    }));

    // If rejecting, automatically switch to Event Info tab to show the rejection form
    if (newStatus === 'Cancelled') {
        setActiveDetailTab("Event Info");
    }
  };

  const handleSendRejection = () => {
    setIsSending(true);
    // Simulate API call to send rejection email
    setTimeout(() => {
        setIsSending(false);
        setRejectionSent(true);
    }, 1500);
  };

  // 5. Early Return (Loading/Empty)
  if (!booking && !bookingData) {
    return (
      <div className={`flex-1 h-full flex items-center justify-center ${theme.bg}`}>
        <Loader2 className="animate-spin text-[#C9A25D]" size={30} />
      </div>
    );
  }

  // 6. Data Merging & Preparation
  const currentData = bookingData || {};
  const paymentData = currentData.payment || {};
  const notesData = currentData.notes || {};

   const details = {
    // IDs
    id: currentData.refId || currentData.id || "N/A",
    // Client Info
    client: currentData.fullName || currentData.client || "Unknown Client",
    phone: currentData.phone || "No Contact Info",
    email: currentData.email || "No Email",
    // Event Info
    date: currentData.dateOfEvent || currentData.date || "TBD",
    guests: currentData.estimatedGuests || currentData.guests || 0,
    type: currentData.eventType || currentData.type || "Event",
    venue: currentData.venueName || currentData.venue || "Client Venue", 
    // Time & Logistics
    timeStart: currentData.startTime || "TBD",
    timeEnd: currentData.endTime || "TBD",
    serviceStyle: currentData.serviceStyle || "Plated",
    dietary: currentData.initialNotes || currentData.dietary || "No specific requests",
    notes: currentData.initialNotes || "No notes available.",
    // Status
    status: currentData.status || "Pending",
    // Financials
    budget: currentData.estimatedBudget || 0,
    reservationFee: paymentData.reservationFee || 5000,
    reservationStatus: paymentData.reservationFee ? "Paid" : "Unpaid",
    downpayment: paymentData.downpayment || 0,
    downpaymentStatus: paymentData.downpayment ? "Paid" : "Unpaid",
    balance: paymentData.balance || currentData.estimatedBudget || 0,
    paymentStatus: paymentData.paymentStatus || "Unpaid",
    paymentMethod: paymentData.paymentMethod || "Bank Transfer",
    // Arrays
    history: paymentData.history && paymentData.history.length > 0 ? paymentData.history : [],
    timeline: notesData.timeline && notesData.timeline.length > 0
        ? notesData.timeline
        : [{ date: "N/A", user: "System", action: "No activity recorded yet." }],
  };

  // Helper to check if tabs should be disabled
  // Enabled only if status is Confirmed (or Paid, Reviewing - basically accepted statuses)
  // Disabled if Pending, Cancelled/Rejected, etc.
  const isBookingConfirmed = details.status === 'Confirmed' || details.status === 'Paid';
  const isBookingRejected = details.status === 'Cancelled' || details.status === 'Rejected';

  return (
    <div className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar h-full flex flex-col ${theme.bg}`}>
      {/* Top Bar */}
      <div className={`h-16 flex items-center justify-between px-6 md:px-8 border-b ${theme.border} ${theme.cardBg} sticky top-0 z-20`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 hover:text-[#C9A25D] rounded-full transition-colors ${theme.subText}`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-2"></div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`font-serif text-xl ${theme.text}`}>
                {details.client}
              </h2>
              <span className={`text-xs font-mono ${theme.subText}`}>
                {details.id}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {renderStatusBadge(details.status)}
          <button className={`p-2 hover:text-[#C9A25D] transition-colors ${theme.subText}`}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs text-red-500">
          Warning: {error}
        </div>
      )}

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* LEFT: Static Info Card */}
        <div className={`w-full lg:w-80 border-r ${theme.border} ${theme.cardBg} p-6 lg:p-8 overflow-y-auto scroll-smooth no-scrollbar z-10`}>
          <h3 className={`text-[10px] uppercase tracking-[0.2em] mb-6 ${theme.subText} font-bold`}>
            Customer Profile
          </h3>

          <div className={`flex flex-col items-center text-center mb-8 pb-8 border-b border-dashed ${theme.border}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-[#C9A25D] text-xl font-serif italic mb-3 border ${theme.border} bg-transparent`}>
              {details.client.charAt(0)}
            </div>
            <h4 className={`font-serif text-xl mb-1 ${theme.text}`}>
              {details.client}
            </h4>
            <div className={`flex gap-3 mt-3 justify-center`}>
              <button className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}>
                <Mail size={14} />
              </button>
              <button className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}>
                <Phone size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-[#C9A25D]" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400">Event Date</p>
                <p className={`text-sm font-medium ${theme.text}`}>{details.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ChefHat size={16} className="mt-0.5 text-[#C9A25D]" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400">Occasion</p>
                <p className={`text-sm font-medium ${theme.text}`}>{details.type}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users size={16} className="mt-0.5 text-[#C9A25D]" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400">Headcount</p>
                <p className={`text-sm font-medium ${theme.text}`}>{details.guests} Pax</p>
              </div>
            </div>

            {/* --- REPLACED SECTION: Accept/Reject Buttons vs Notes --- */}
            <div className={`p-4 rounded-sm border ${theme.border} bg-transparent`}>
              {details.status === 'Pending' ? (
                 <div className="flex flex-col gap-3">
                   <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Action Required</p>
                   <div className="flex gap-2">
                     <button 
                        onClick={() => handleUpdateStatus('Confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-sm text-xs font-bold uppercase transition-colors"
                     >
                       <Check size={14} /> Accept
                     </button>
                     <button 
                        onClick={() => handleUpdateStatus('Cancelled')}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-sm text-xs font-bold uppercase transition-colors"
                     >
                       <XCircle size={14} /> Reject
                     </button>
                   </div>
                 </div>
              ) : (
                // If not pending, show the notes (or the outcome)
                <>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Customer Notes</p>
                  <p className={`text-xs italic ${theme.subText}`}>"{details.notes}"</p>
                </>
              )}
            </div>
            {/* ----------------------------------------------------- */}
          </div>
        </div>

        {/* RIGHT: Tabs Workspace */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
          {/* TABS HEADER */}
          <div className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-6`}>
            {detailTabs.map((tab) => {
              // Logic to disable Payments and Proposal
              const isDisabled = !isBookingConfirmed && (tab === "Payments" || tab === "Proposal");
              
              return (
                <button
                  key={tab}
                  onClick={() => !isDisabled && setActiveDetailTab(tab)}
                  disabled={isDisabled}
                  className={`px-6 py-4 text-xs uppercase tracking-[0.2em] border-b-2 transition-colors font-medium flex items-center gap-2 ${
                    activeDetailTab === tab
                      ? "border-[#C9A25D] text-[#C9A25D]"
                      : isDisabled
                        ? "border-transparent text-stone-300 dark:text-stone-700 cursor-not-allowed"
                        : `border-transparent ${theme.subText} hover:text-stone-600 dark:hover:text-stone-300`
                  }`}
                >
                  {tab}
                  {isDisabled && <Lock size={10} />}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
            <FadeIn key={activeDetailTab}>
              {/* EVENT INFO */}
              {activeDetailTab === "Event Info" && (
                <div className="max-w-4xl mx-auto">
                  {/* --- CONDITIONAL: REJECTION LOGIC --- */}
                  {isBookingRejected ? (
                    <div className={`p-8 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-sm`}>
                      <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                         <AlertCircle size={24} />
                         <h3 className="font-serif text-xl">Inquiry Rejected</h3>
                      </div>
                      
                      {rejectionSent ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <CheckCircle size={48} className="text-emerald-500 mb-4" />
                            <h4 className={`text-lg font-bold ${theme.text}`}>Rejection Email Sent</h4>
                            <p className={`text-sm ${theme.subText} mt-2`}>The client has been notified regarding the rejection of this inquiry.</p>
                        </div>
                      ) : (
                        <>
                            <p className={`text-sm ${theme.text} mb-6`}>
                                This inquiry has been rejected. Please provide a reason below to notify the client via email.
                            </p>
                            <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 block">Reason for Rejection</label>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className={`w-full p-4 border ${theme.border} bg-white dark:bg-stone-900 rounded-sm focus:outline-none focus:border-red-400 mb-4 text-sm`}
                                rows={5}
                                placeholder="e.g., Sorry, the date is fully booked..."
                            />
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => handleUpdateStatus('Pending')}
                                    className={`px-4 py-2 text-xs uppercase font-bold text-stone-500 hover:text-stone-700`}
                                >
                                    Cancel & Restore
                                </button>
                                <button 
                                    onClick={handleSendRejection}
                                    disabled={!rejectionReason || isSending}
                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white text-xs uppercase font-bold rounded-sm hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send Rejection Email
                                </button>
                            </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* --- STANDARD EVENT INFO --- */
                    <>
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
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Special Requests / Dietary Restrictions</p>
                          <div className={`p-4 border ${theme.border} rounded-sm bg-transparent`}>
                            <p className={`text-sm ${theme.text}`}>{details.dietary}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PAYMENTS */}
              {activeDetailTab === "Payments" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        label: "Total Cost",
                        val: details.budget,
                        color: "text-[#C9A25D]",
                        icon: DollarSign,
                      },
                      {
                        label: "Amount Paid",
                        val: (details.reservationFee || 0) + (details.downpayment || 0),
                        color: "text-emerald-600 dark:text-emerald-400",
                        icon: Wallet,
                      },
                      {
                        label: "Remaining Balance",
                        val: details.balance,
                        color: "text-red-500 dark:text-red-400",
                        icon: AlertCircle,
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`p-6 border ${theme.border} ${theme.cardBg} rounded-sm flex flex-col justify-between h-32 shadow-sm transition-all duration-300 hover:border-[#C9A25D] hover:bg-[#C9A25D]/5 hover:shadow-md group cursor-pointer`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400">{stat.label}</p>
                          <stat.icon size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-[#C9A25D] transition-colors" strokeWidth={1.5} />
                        </div>
                        <p className={`font-serif text-3xl ${stat.color}`}>₱ {Number(stat.val).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

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
                    <div className={`divide-y ${darkMode ? "divide-stone-800" : "divide-stone-100"}`}>
                      {[
                        {
                          label: "Reservation Fee",
                          amount: details.reservationFee,
                          status: details.reservationStatus,
                          due: "On Booking",
                          icon: FileText,
                        },
                        {
                          label: "50% Downpayment",
                          amount: details.downpayment,
                          status: details.downpaymentStatus,
                          due: "TBD",
                          icon: CreditCard,
                        },
                        {
                          label: "Final Balance",
                          amount: details.balance,
                          status: "Unpaid",
                          due: "TBD",
                          icon: DollarSign,
                        },
                      ].map((row, i) => (
                        <div key={i} className={`grid grid-cols-12 gap-4 items-center px-6 py-5 ${theme.hoverBg} transition-colors duration-300 group`}>
                          <div className="col-span-4 flex items-center gap-4">
                            <div className={`p-2 rounded-full border ${theme.border} text-stone-400 bg-white dark:bg-transparent group-hover:border-[#C9A25D] group-hover:text-[#C9A25D] transition-colors`}>
                              <row.icon size={16} />
                            </div>
                            <span className={`text-sm font-bold ${theme.text} group-hover:text-[#C9A25D] transition-colors`}>{row.label}</span>
                          </div>
                          <div className="col-span-3 text-xs text-stone-500 dark:text-stone-400">Due: {row.due}</div>
                          <div className="col-span-3 text-right">
                            <span className={`font-serif text-lg font-medium ${theme.text}`}>₱ {Number(row.amount).toLocaleString()}</span>
                          </div>
                          <div className="col-span-2 flex justify-end">{renderStatusBadge(row.status)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PROPOSAL */}
              {activeDetailTab === "Proposal" && (
                <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className={`font-serif text-2xl ${theme.text}`}>Build Proposal</h3>
                      <p className={`text-xs ${theme.subText} mt-1`}>Ref No. {details.id}-QUO</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400">Total Estimated Cost</p>
                      <p className="font-serif text-3xl text-[#C9A25D]">₱ {Number(proposalTotal).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className={`border ${theme.border} ${theme.cardBg} p-6 rounded-sm`}>
                      <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme.text}`}>
                        <Utensils size={16} /> Catering Package
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {menuPackages.map((pkg) => {
                          const isSelected = proposalTotal / details.guests === pkg.price;
                          return (
                            <button
                              key={pkg.id}
                              onClick={() => setProposalTotal(pkg.price * details.guests)}
                              // --- FIXED: Dark Mode Logic Here ---
                              className={`p-4 border rounded-sm text-left transition-all duration-300 ${
                                isSelected
                                  ? "border-[#C9A25D] bg-stone-50 dark:bg-stone-800 shadow-md ring-1 ring-[#C9A25D]/50" 
                                  : `${theme.border} hover:border-[#C9A25D] hover:shadow-sm bg-transparent`
                              }`}
                            >
                              <span className={`font-serif text-lg block ${theme.text}`}>{pkg.name}</span>
                              <span className="text-xs text-stone-400 block mb-2">₱ {pkg.price} / head</span>
                              {isSelected && <CheckCircle size={14} className="text-[#C9A25D] ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className={`mt-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] mb-6 font-bold text-stone-400 border-b border-dashed border-stone-200 dark:border-stone-800 pb-2">
                        Cost Breakdown
                      </h4>
                      <div className={`space-y-4 text-sm ${theme.text}`}>
                        <div className="flex justify-between items-center">
                          <span>Food & Beverage ({details.guests} pax)</span>
                          <span className="font-serif text-base">₱ {Number(proposalTotal).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-400">
                          <span>Service Charge (10%)</span>
                          <span className="font-serif text-base">₱ {(proposalTotal * 0.1).toLocaleString()}</span>
                        </div>
                        <div className={`border-t ${theme.border} pt-4 mt-4 flex justify-between items-end`}>
                          <span className={`font-bold text-xs uppercase tracking-widest ${theme.text}`}>Grand Total</span>
                          <span className="font-serif text-2xl text-[#C9A25D]">₱ {(proposalTotal * 1.1).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* --- NEW SEND PROPOSAL BUTTON --- */}
                    <div className="flex flex-col items-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                        <button
                            onClick={handleSendProposal}
                            disabled={isSending || emailStatus === 'success'}
                            className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm uppercase tracking-wider font-bold transition-all duration-300 ${
                                emailStatus === 'success' 
                                ? "bg-emerald-600 text-white cursor-default"
                                : "bg-[#C9A25D] text-white hover:bg-[#b08d55] shadow-lg hover:shadow-[#C9A25D]/20"
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Sending...
                                </>
                            ) : emailStatus === 'success' ? (
                                <>
                                    <CheckCircle size={16} />
                                    Proposal Sent
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Send Proposal
                                </>
                            )}
                        </button>
                        {emailStatus === 'error' && (
                            <p className="text-xs text-red-500">Failed to send email. Please try again.</p>
                        )}
                        <p className="text-[10px] text-stone-400 italic">
                            Sending to: {details.email || "No email provided"}
                        </p>
                    </div>

                  </div>
                </div>
              )}

              {/* NOTES / TIMELINE */}
              {activeDetailTab === "Notes" && (
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                  <h3 className={`font-serif text-2xl mb-6 ${theme.text}`}>Activity Log & Notes</h3>
                  <div className="flex-1 relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[1px] before:bg-stone-200 dark:before:bg-stone-800">
                    {details.timeline.map((log, i) => (
                      <div key={i} className="flex gap-6 relative">
                        <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.cardBg} flex items-center justify-center z-10 shadow-sm`}>
                          {log.user === "Admin" ? (
                            <User size={16} className="text-stone-400" />
                          ) : log.user === "System" ? (
                            <AlertTriangle size={16} className="text-amber-500" />
                          ) : (
                            <MessageSquare size={16} className="text-[#C9A25D]" />
                          )}
                        </div>
                        <div className={`flex-1 p-4 border ${theme.border} ${theme.cardBg} rounded-sm`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${theme.text}`}>{log.user}</span>
                            <span className="text-[10px] text-stone-400 uppercase tracking-wide">{log.date}</span>
                          </div>
                          <p className={`text-sm ${theme.subText}`}>{log.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 block">Add Internal Note</label>
                    <div className="flex gap-3">
                      <textarea
                        className={`flex-1 border ${theme.border} bg-transparent rounded-sm p-3 text-sm focus:outline-none focus:border-[#C9A25D]`}
                        rows="3"
                        placeholder="Type a private note for the admin team..."
                      ></textarea>
                      <button className="self-end px-4 py-3 bg-[#1c1c1c] text-white hover:bg-[#C9A25D] transition-colors rounded-sm">
                        <Send size={16} />
                      </button>
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

export default BookingDetails;