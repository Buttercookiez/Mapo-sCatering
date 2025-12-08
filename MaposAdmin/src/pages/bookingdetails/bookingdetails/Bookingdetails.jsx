import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Lock, Loader2 } from "lucide-react";

// API (Only write functions needed now)
import {
  sendProposalEmail,
  updateBookingStatus,
} from "../../../api/bookingService";

// NEW: Import the Hook
import { useBookingDetails } from "../../../hooks/useBookingDetails";

// Helper Components
import FadeIn from "./components/FadeIn";
import StatusBadge from "./components/StatusBadge"; 
import BookingSidebar from "./components/BookingSidebar";

// Tab Components
import EventInfoTab from "./components/EventInfoTab";
import ProposalTab from "./components/ProposalTab";

const detailTabs = ["Event Info", "Proposal"];

const BookingDetails = ({
  booking: initialBooking, // Renamed to initialBooking
  onBack,
  onUpdateBooking, 
  activeDetailTab,
  setActiveDetailTab,
  theme,
  darkMode,
}) => {
  // --- 1. USE REALTIME HOOK ---
  // We use the ID passed from the list to subscribe to the doc
  const { booking: realtimeBooking, loading: isSyncing, error } = useBookingDetails(initialBooking?.id);

  // --- 2. MERGE DATA ---
  // Prefer realtime data, fallback to initial prop, or empty object
  const details = realtimeBooking || initialBooking || {};
  
  // Local UI States
  const [proposalTotal, setProposalTotal] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionSent, setRejectionSent] = useState(false);

  // Proposal Calculation Effect
  useEffect(() => {
    if (details) {
      // Check both nested (realtime) and flat (initial) structures
      const grandTotal = details.billing?.totalCost || details.budget || 0;
      setProposalTotal(grandTotal);
    }
  }, [details]);

  // --- HANDLERS ---

  const handleUpdateStatus = async (newStatus) => {
    // Note: We don't strictly need to set local state because the Hook 
    // will update 'details' automatically when the DB changes.
    // But we can do it for instant UI feedback.
    
    if (newStatus === "Cancelled" || newStatus === "Rejected") {
      setActiveDetailTab("Event Info");
    }

    try {
      // CHANGE THIS LINE: Use details.refId instead of details.id
      if (details.refId) {
        await updateBookingStatus(details.refId, newStatus);
        
        if (onUpdateBooking) {
          onUpdateBooking({ ...details, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update status on server:", error);
      alert("Failed to save status.");
    }
  };

  const handleSendProposal = async (payloadData) => {
    if (!details.email) {
      alert("No email address found for this client.");
      return;
    }

    setIsSending(true);
    setEmailStatus(null);

    const { options } = payloadData;
    
    const payload = {
      refId: details.refId,
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
      
      // Update status to "Proposal Sent"
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
  const allowedProposalStages = [
    "Accepted", 
    "Proposal Sent", 
    "No Response", 
    "Verifying", 
    "Reserved", 
    "Confirmed", 
    "Paid"
  ];
  
  const currentStatusNormalized = details.status ? details.status.trim() : "";
  
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
                {details.client || "Loading..."}
              </h2>
              <span className={`text-xs font-mono ${theme.subText}`}>
                {details.refId}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
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
        
        {/* --- SYNCING OVERLAY (Shows briefly when data updates) --- */}
        {isSyncing && (
           <div className={`absolute top-0 right-0 p-4 z-50`}>
               <Loader2 size={16} className="animate-spin text-[#C9A25D]" />
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
            {/* EVENT INFO */}
            {activeDetailTab === "Event Info" && (
                <FadeIn>
                  <EventInfoTab
                    details={details}
                    theme={theme}
                    isBookingAccepted={details.status === 'Accepted'}
                    isBookingRejected={details.status === 'Rejected'}
                    rejectionSent={rejectionSent}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    handleUpdateStatus={handleUpdateStatus}
                    handleSendRejection={handleSendRejection}
                    isSending={isSending}
                  />
                </FadeIn>
            )}

            {/* PROPOSAL */}
            {activeDetailTab === "Proposal" && (
                <FadeIn>
                  <ProposalTab
                    details={details}
                    theme={theme}
                    proposalTotal={proposalTotal}
                    handleSendProposal={handleSendProposal}
                    isSending={isSending}
                    emailStatus={emailStatus}
                  />
                </FadeIn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;