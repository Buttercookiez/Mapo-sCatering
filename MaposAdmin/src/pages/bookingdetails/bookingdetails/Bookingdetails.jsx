import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Lock, Loader2 } from "lucide-react";

// API
import {
  getBookingByRefId,
  sendProposalEmail,
  updateBookingStatus,
} from "../../../api/bookingService";

// Helper Components
import FadeIn from "./components/FadeIn";
import StatusBadge from "./components/StatusBadge"; // Ensure this component handles the new strings
import BookingSidebar from "./components/BookingSidebar";

// Tab Components
import EventInfoTab from "./components/EventInfoTab";
import ProposalTab from "./components/ProposalTab";

const detailTabs = ["Event Info", "Proposal"];

const BookingDetails = ({
  booking,
  onBack,
  onUpdateBooking, // <--- NEW PROP: Callback to update parent list
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
  const [emailStatus, setEmailStatus] = useState(null);

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionSent, setRejectionSent] = useState(false);

  // 1. Fetch Data Effect
  useEffect(() => {
    setActiveDetailTab("Event Info");

    const fetchBookingDetails = async () => {
      // Use refId if available, otherwise fallback to id
      const idToFetch = booking?.refId || booking?.id;
      if (!idToFetch) return;

      setIsLoading(true);
      try {
        const data = await getBookingByRefId(idToFetch);
        setBookingData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        // Fallback: use the prop data if API fails so UI doesn't crash
        setBookingData(booking);
        setError("Could not sync with database. Showing cached data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [booking, setActiveDetailTab]); 

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

  // 3. Data Merging & Preparation
  const currentData = bookingData || booking || {};
  const paymentData = currentData.payment || {};

  const details = {
    id: currentData.refId || currentData.id || "N/A",
    client: currentData.fullName || currentData.client || "Unknown Client",
    phone: currentData.phone || "No Contact Info",
    email: currentData.email || "No Email",
    date: currentData.dateOfEvent || currentData.date || "TBD",
    guests: currentData.estimatedGuests || currentData.guests || 0,
    type: currentData.eventType || currentData.type || "Event",
    venue: currentData.venueName || currentData.venue || "Client Venue",
    timeStart: currentData.startTime || "TBD",
    timeEnd: currentData.endTime || "TBD",
    serviceStyle: currentData.serviceStyle || "Plated",
    status: currentData.status || "Pending", // Default to Pending
    budget: currentData.estimatedBudget || 0,
    reservationFee: paymentData.reservationFee || 5000,
    reservationStatus: paymentData.reservationFee ? "Paid" : "Unpaid",
    downpayment: paymentData.downpayment || 0,
    downpaymentStatus: paymentData.downpayment ? "Paid" : "Unpaid",
    balance: paymentData.balance || currentData.estimatedBudget || 0,
    paymentStatus: paymentData.paymentStatus || "Unpaid",
    paymentMethod: paymentData.paymentMethod || "Bank Transfer",
    history: paymentData.history?.length > 0 ? paymentData.history : [],
  };

  // 4. Handle Booking Status Change
  const handleUpdateStatus = async (newStatus) => {
    // 1. Optimistic Update (Immediate UI reflection)
    setBookingData((prev) => ({
      ...prev,
      status: newStatus,
    }));

    // If Rejected or Cancelled, force tab back to Info
    if (newStatus === "Cancelled" || newStatus === "Rejected") {
      setActiveDetailTab("Event Info");
    }

    try {
      if (details.id) {
        // 2. API Call
        await updateBookingStatus(details.id, newStatus);
        
        // 3. Notify Parent Component (Fixes "Unknown" in List)
        if (onUpdateBooking) {
          onUpdateBooking({ ...currentData, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update status on server:", error);
      alert("Failed to save status. Please check your connection.");
      // Revert on failure if needed
    }
  };

  // 5. Handle Send Proposal
  const handleSendProposal = async (payloadData) => {
    if (!details.email) {
      alert("No email address found for this client.");
      return;
    }

    setIsSending(true);
    setEmailStatus(null);

    const { options } = payloadData;
    
    const payload = {
      refId: details.id,
      clientName: details.client,
      clientEmail: details.email,
      packageOptions: options, 
      details: {
        date: details.date,
        guests: details.guests,
        venue: details.venue,
      },
    };

    try {
      await sendProposalEmail(payload);
      setEmailStatus("success");
      
      // Update status to "Proposal Sent" automatically
      await handleUpdateStatus("Proposal Sent"); 

      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendRejection = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setRejectionSent(true);
      handleUpdateStatus("Rejected");
    }, 1500);
  };

  // --- WORKFLOW LOGIC ---
  // The Proposal tab is unlocked if the Admin has Accepted the inquiry,
  // or if we are already in a later stage (Proposal Sent, Verifying, Reserved).
  const allowedProposalStages = [
    "Accepted", 
    "Proposal Sent", 
    "No Response", 
    "Verifying", 
    "Reserved", 
    "Confirmed", 
    "Paid"
  ];
  
  // Clean string comparison to avoid case sensitivity issues
  const currentStatusNormalized = details.status ? details.status.trim() : "";
  
  // Check if current status allows unlocking the proposal tab
  const isProposalUnlocked = allowedProposalStages.some(stage => 
    stage.toLowerCase() === currentStatusNormalized.toLowerCase()
  );

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
          {/* Status Badge in Header */}
          <StatusBadge status={details.status} />
          
          <button className={`p-2 hover:text-[#C9A25D] transition-colors ${theme.subText}`}>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs text-red-500">
          {error}
        </div>
      )}

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        
        {/* --- LOADING OVERLAY --- */}
        {isLoading && (
           <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${theme.bg} transition-all duration-300`}>
                <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
                <p className={`text-xs uppercase tracking-widest font-medium ${theme.text}`}>Loading Details...</p>
           </div>
        )}

        {/* LEFT: Static Info Card (Sidebar) */}
        <BookingSidebar
          details={details}
          theme={theme}
          handleUpdateStatus={handleUpdateStatus}
        />

        {/* RIGHT: Tabs Workspace */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
          {/* TABS HEADER */}
          <div className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-6`}>
            {detailTabs.map((tab) => {
              // Lock 'Proposal' tab if not yet Accepted/Confirmed
              const isLocked = tab === "Proposal" && !isProposalUnlocked;

              return (
                <button
                  key={tab}
                  onClick={() => !isLocked && setActiveDetailTab(tab)}
                  disabled={isLocked}
                  className={`px-6 py-4 text-xs uppercase tracking-[0.2em] border-b-2 transition-colors font-medium flex items-center gap-2 ${
                    activeDetailTab === tab
                      ? "border-[#C9A25D] text-[#C9A25D]"
                      : isLocked
                      ? "border-transparent text-stone-300 dark:text-stone-700 cursor-not-allowed"
                      : `border-transparent ${theme.subText} hover:text-stone-600 dark:hover:text-stone-300`
                  }`}
                >
                  {tab}
                  {isLocked && <Lock size={10} />}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
            {!isLoading && (
              <FadeIn key={activeDetailTab}>
                {/* EVENT INFO */}
                {activeDetailTab === "Event Info" && (
                  <EventInfoTab
                    details={details}
                    theme={theme}
                    // Pass specific flags for UI controls
                    isBookingAccepted={details.status === 'Accepted'}
                    isBookingRejected={details.status === 'Rejected'}
                    rejectionSent={rejectionSent}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    handleUpdateStatus={handleUpdateStatus}
                    handleSendRejection={handleSendRejection}
                    isSending={isSending}
                  />
                )}

                {/* PROPOSAL */}
                {activeDetailTab === "Proposal" && (
                  <ProposalTab
                    details={details}
                    theme={theme}
                    proposalTotal={proposalTotal}
                    setProposalTotal={setProposalTotal}
                    handleSendProposal={handleSendProposal}
                    isSending={isSending}
                    emailStatus={emailStatus}
                  />
                )}
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;