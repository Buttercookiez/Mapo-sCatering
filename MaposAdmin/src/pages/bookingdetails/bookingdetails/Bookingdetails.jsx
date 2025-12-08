import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, Lock, Loader2 } from "lucide-react";

// --- API SERVICES ---
import {
  sendProposalEmail,
  updateBookingStatus,
  rejectBooking
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
import AdditionalsTab from "./components/AdditionalsTab"; // <--- 1. IMPORT NEW TAB

// --- 2. UPDATE TABS LIST ---
const detailTabs = ["Event Info", "Proposal", "Additionals"];

const BookingDetails = ({
  booking: initialBooking,
  onBack,
  onUpdateBooking, 
  activeDetailTab,
  setActiveDetailTab,
  theme,
  darkMode,
}) => {
  const { booking: realtimeBooking, loading: isSyncing, error } = useBookingDetails(initialBooking?.id);
  const details = realtimeBooking || initialBooking || {};
  
  const [proposalTotal, setProposalTotal] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionSent, setRejectionSent] = useState(false);

  useEffect(() => {
    if (details) {
      const grandTotal = details.billing?.totalCost || details.budget || 0;
      setProposalTotal(grandTotal);
    }
  }, [details]);

  // --- HANDLERS ---
  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === "Cancelled" || newStatus === "Rejected") {
      setActiveDetailTab("Event Info");
    }
    if (newStatus === "Pending" && details.status === "Rejected") {
        setRejectionSent(false);
        setRejectionReason("");
    }
    try {
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
      await handleUpdateStatus("Proposal Sent"); 
      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    } finally {
      setIsSending(false);
    }
  };

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
        setRejectionSent(true);
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

  // --- 3. LOGIC FOR ADDITIONALS TAB LOCK ---
  // Only unlock Additionals if they have reached the "Verifying" stage or later (meaning they submitted choices)
  const allowedAdditionalsStages = ["Verifying", "Reserved", "Confirmed", "Paid"];
  const isAdditionalsUnlocked = allowedAdditionalsStages.some(stage => 
    stage.toLowerCase() === currentStatusNormalized.toLowerCase()
  );

  return (
    <div className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar h-full flex flex-col ${theme.bg}`}>
      
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

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        
        {isSyncing && (
           <div className={`absolute top-0 right-0 p-4 z-50`}>
               <Loader2 size={16} className="animate-spin text-[#C9A25D]" />
           </div>
        )}

        <BookingSidebar
          details={details}
          theme={theme}
          handleUpdateStatus={handleUpdateStatus}
        />

        <div className={`flex-1 flex flex-col ${theme.bg}`}>
          
          <div className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-6`}>
            {detailTabs.map((tab) => {
              // --- 4. DETERMINE LOCK STATE PER TAB ---
              let isLocked = false;
              if (tab === "Proposal") isLocked = !isProposalUnlocked;
              if (tab === "Additionals") isLocked = !isAdditionalsUnlocked;

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
            
            {activeDetailTab === "Event Info" && (
                <FadeIn>
                  <EventInfoTab
                    details={details}
                    theme={theme}
                    isBookingAccepted={details.status === 'Accepted'}
                    isBookingRejected={details.status === 'Rejected' || rejectionSent}
                    rejectionSent={rejectionSent || (details.status === 'Rejected' && !!details.rejectionReason)}
                    rejectionReason={rejectionReason || details.rejectionReason || ""}
                    setRejectionReason={setRejectionReason}
                    handleUpdateStatus={handleUpdateStatus}
                    handleSendRejection={handleSendRejection}
                    isSending={isSending}
                  />
                </FadeIn>
            )}

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

            {/* --- 5. RENDER ADDITIONALS TAB --- */}
            {activeDetailTab === "Additionals" && (
                <FadeIn>
                  <AdditionalsTab
                    details={details}
                    theme={theme}
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