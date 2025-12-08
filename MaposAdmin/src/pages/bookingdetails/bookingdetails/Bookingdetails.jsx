import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Lock, Loader2 } from "lucide-react";

// --- API SERVICES ---
import {
  sendProposalEmail,
  updateBookingStatus,
  rejectBooking // Import the rejection service
} from "../../../api/bookingService";

// --- HOOKS ---
import { useBookingDetails } from "../../../hooks/useBookingDetails";

// --- COMPONENTS ---
import FadeIn from "./components/FadeIn";
import StatusBadge from "./components/StatusBadge"; 
import BookingSidebar from "./components/BookingSidebar";

// --- TABS ---
import EventInfoTab from "./components/EventInfoTab";
import ProposalTab from "./components/ProposalTab";

const detailTabs = ["Event Info", "Proposal"];

const BookingDetails = ({
  booking: initialBooking,
  onBack,
  onUpdateBooking, 
  activeDetailTab,
  setActiveDetailTab,
  theme,
  darkMode,
}) => {
  // --- 1. REALTIME DATA SYNC ---
  // Subscribe to Firestore updates using the ID passed from the list
  const { booking: realtimeBooking, loading: isSyncing, error } = useBookingDetails(initialBooking?.id);

  // Merge: Prefer realtime data, fallback to initial prop, or empty object
  const details = realtimeBooking || initialBooking || {};
  
  // --- 2. LOCAL STATE ---
  const [proposalTotal, setProposalTotal] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  // Proposal State
  const [emailStatus, setEmailStatus] = useState(null);

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionSent, setRejectionSent] = useState(false);

  // Update total calculation when details change
  useEffect(() => {
    if (details) {
      const grandTotal = details.billing?.totalCost || details.budget || 0;
      setProposalTotal(grandTotal);
    }
  }, [details]);

  // --- HANDLERS ---

  // 1. General Status Update (e.g., Cancel, Restore)
  const handleUpdateStatus = async (newStatus) => {
    // If cancelling or rejecting, force switch to Event Info tab
    if (newStatus === "Cancelled" || newStatus === "Rejected") {
      setActiveDetailTab("Event Info");
    }

    // If restoring from Rejected to Pending, reset the UI state
    if (newStatus === "Pending" && details.status === "Rejected") {
        setRejectionSent(false);
        setRejectionReason("");
    }

    try {
      if (details.refId) {
        await updateBookingStatus(details.refId, newStatus);
        
        // Notify parent list to update immediately
        if (onUpdateBooking) {
          onUpdateBooking({ ...details, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update status on server:", error);
      alert("Failed to save status.");
    }
  };

  // 2. Send Proposal Email
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
      
      // Auto-update status to "Proposal Sent"
      await handleUpdateStatus("Proposal Sent"); 

      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  // 3. Send Rejection Email (The new logic)
  const handleSendRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }

    setIsSending(true);
    
    try {
        await rejectBooking({
            refId: details.refId,
            clientEmail: details.email,
            clientName: details.client,
            reason: rejectionReason
        });

        // Show success UI
        setRejectionSent(true);
        
        // Ensure parent list knows status changed
        if (onUpdateBooking) {
           onUpdateBooking({ ...details, status: "Rejected" });
        }

    } catch (error) {
        console.error("Rejection failed:", error);
        alert("Failed to send rejection email.");
    } finally {
        setIsSending(false);
    }
  };

  // --- WORKFLOW HELPERS ---
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
      
      {/* --- TOP HEADER --- */}
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs text-red-500">
          {error}
        </div>
      )}

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        
        {/* Syncing Indicator (Top Right) */}
        {isSyncing && (
           <div className={`absolute top-0 right-0 p-4 z-50`}>
               <Loader2 size={16} className="animate-spin text-[#C9A25D]" />
           </div>
        )}

        {/* LEFT: Sidebar Info */}
        <BookingSidebar
          details={details}
          theme={theme}
          handleUpdateStatus={handleUpdateStatus}
        />

        {/* RIGHT: Tabs & Action Area */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
          
          {/* Tabs Navigation */}
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

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
            
            {/* 1. EVENT INFO TAB */}
            {activeDetailTab === "Event Info" && (
                <FadeIn>
                  <EventInfoTab
                    details={details}
                    theme={theme}
                    isBookingAccepted={details.status === 'Accepted'}
                    
                    // 1. Controls the layout (Red Card vs Normal Info)
                    // Keep this checking only the status.
                    isBookingRejected={details.status === 'Rejected'}
                    
                    // 2. Controls the "Form" vs "Success Message"
                    // CHANGE THIS: Only show success if local state is true OR if DB has a reason recorded.
                    rejectionSent={rejectionSent || (details.status === 'Rejected' && !!details.rejectionReason)}
                    
                    // 3. Ensure the text box gets the saved reason if it exists
                    rejectionReason={rejectionReason || details.rejectionReason || ""}
                    
                    setRejectionReason={setRejectionReason}
                    handleUpdateStatus={handleUpdateStatus}
                    handleSendRejection={handleSendRejection}
                    isSending={isSending}
                  />
                </FadeIn>
            )}

            {/* 2. PROPOSAL TAB */}
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