import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  FileText,
  Utensils,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  Wallet,
  Bell // Added Bell icon for notification
} from "lucide-react";

import StatusBadge from "./StatusBadge"; 

const EventInfoTab = ({
  details,
  theme,
  isBookingRejected,
  rejectionSent,
  rejectionReason,
  setRejectionReason,
  handleUpdateStatus,
  handleSendRejection,
  isSending,
}) => {
  
  // Local state for the Reminder Email button
  const [isReminderSending, setIsReminderSending] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const handleSendReminder = () => {
    setIsReminderSending(true);
    // Simulate API call for payment reminder
    setTimeout(() => {
        setIsReminderSending(false);
        setReminderSent(true);
        // Reset success message after 3 seconds
        setTimeout(() => setReminderSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isBookingRejected ? (
        // --- REJECTION VIEW (Unchanged) ---
        <div
          className={`p-8 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-sm`}
        >
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
            <AlertCircle size={24} />
            <h3 className="font-serif text-xl">Inquiry Rejected</h3>
          </div>

          {rejectionSent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle size={48} className="text-emerald-500 mb-4" />
              <h4 className={`text-lg font-bold ${theme.text}`}>
                Rejection Email Sent
              </h4>
              <p className={`text-sm ${theme.subText} mt-2`}>
                The client has been notified regarding the rejection of this
                inquiry.
              </p>
            </div>
          ) : (
            <>
              <p className={`text-sm ${theme.text} mb-6`}>
                This inquiry has been rejected. Please provide a reason below to
                notify the client via email.
              </p>
              <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 block">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={`w-full p-4 border ${theme.border} bg-white dark:bg-stone-900 rounded-sm focus:outline-none focus:border-red-400 mb-4 text-sm`}
                rows={5}
                placeholder="e.g., Sorry, the date is fully booked..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus("Pending")}
                  className={`px-4 py-2 text-xs uppercase font-bold text-stone-500 hover:text-stone-700`}
                >
                  Cancel & Restore
                </button>
                <button
                  onClick={handleSendRejection}
                  disabled={!rejectionReason || isSending}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white text-xs uppercase font-bold rounded-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Send Rejection Email
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // --- EVENT INFO VIEW ---
        <>
          <div className="flex justify-between items-end mb-6">
            <h3 className={`font-serif text-2xl ${theme.text}`}>
              Event Specifications
            </h3>
          </div>

          {/* 2. MAIN DETAILS GRID */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm transition-all duration-500`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Event Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#C9A25D]" />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {details.date}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Time & Duration
              </p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#C9A25D]" />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {details.timeStart} — {details.timeEnd}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Event Type
              </p>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#C9A25D]" />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {details.type}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Venue Location
              </p>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#C9A25D]" />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {details.venue}
                </span>
              </div>
            </div>
            
            {/* Note: Reservation Fee removed from here as it's now in the top container */}

            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Service Style
              </p>
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-[#C9A25D]" />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {details.serviceStyle}
                </span>
              </div>
            </div>

            <div
              className={`col-span-1 md:col-span-2 border-t border-dashed ${theme.border} my-2`}
            ></div>
            
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Primary Contact
              </p>
              <p className={`text-sm font-medium ${theme.text}`}>
                {details.phone}
              </p>
              <p className={`text-xs ${theme.subText}`}>{details.email}</p>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                Special Requests / Dietary Restrictions
              </p>
              <div
                className={`p-4 border ${theme.border} rounded-sm bg-transparent`}
              >
                <p className={`text-sm ${theme.text}`}>
                    {details.dietary || "No special requests indicated."}
                </p>
              </div>
            </div>
          </div>

                    <div className={`mb-8 border ${theme.border} ${theme.cardBg} rounded-sm p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6`}>
             <div className="flex items-start gap-4">
                <div className="p-3 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]">
                    <Wallet size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Reservation Fee Status</p>
                    <div className="flex items-center gap-3">
                        <span className={`font-serif text-3xl font-medium ${theme.text}`}>
                            ₱ {Number(details.reservationFee || 0).toLocaleString()}
                        </span>
                        <StatusBadge status={details.reservationStatus || "Unpaid"} />
                    </div>
                </div>
             </div>

             {/* Notification Button Action */}
             <div>
                {details.reservationStatus !== "Paid" ? (
                    <button 
                        onClick={handleSendReminder}
                        disabled={isReminderSending || reminderSent}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs uppercase tracking-widest font-bold transition-all
                            ${reminderSent 
                                ? 'bg-emerald-600 text-white cursor-default' 
                                : `border border-[#C9A25D] text-[#C9A25D] hover:bg-[#C9A25D] hover:text-white bg-transparent`
                            }
                        `}
                    >
                        {isReminderSending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : reminderSent ? (
                            <CheckCircle size={14} />
                        ) : (
                            <Bell size={14} />
                        )}
                        {reminderSent ? "Reminder Sent" : "Send Payment Reminder"}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-sm border border-emerald-200 dark:border-emerald-900/30">
                        <CheckCircle size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">Payment Verified</span>
                    </div>
                )}
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventInfoTab;