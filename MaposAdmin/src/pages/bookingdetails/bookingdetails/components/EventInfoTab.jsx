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
  Bell,
  XCircle
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
        // --- REDESIGNED REJECTION VIEW ---
        <div className={`relative p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm overflow-hidden transition-colors duration-500`}>
          
          {/* Decorative Left Accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500/80"></div>

          <div className="flex items-start gap-5 mb-8">
            <div className={`p-3 rounded-full bg-red-500/10 text-red-500 mt-1`}>
                <AlertCircle size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">Status Update</span>
                <h3 className={`text-2xl font-serif italic ${theme.text} mt-1`}>Inquiry Rejected</h3>
                <p className={`text-sm ${theme.subText} mt-2 max-w-2xl`}>
                    This inquiry has been marked for rejection. Please review the details below before notifying the client.
                </p>
            </div>
          </div>

          {rejectionSent ? (
            <div className={`flex flex-col items-center justify-center py-12 border-t border-dashed ${theme.border}`}>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h4 className={`text-lg font-serif italic ${theme.text}`}>
                Notification Sent
              </h4>
              <p className={`text-xs uppercase tracking-widest ${theme.subText} mt-2`}>
                The client has been notified via email.
              </p>
              
              <button
                  onClick={() => handleUpdateStatus("Pending")}
                  className={`mt-8 text-xs text-stone-500 underline hover:text-[#C9A25D] transition-colors`}
                >
                  Undo Rejection (Restore to Pending)
              </button>
            </div>
          ) : (
            <div className="pl-0 md:pl-14">
              <label className={`text-[10px] uppercase tracking-widest ${theme.subText} mb-3 block`}>
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={`
                    w-full p-4 border ${theme.border} bg-transparent 
                    ${theme.text} placeholder-stone-500/50 rounded-sm 
                    focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20
                    transition-all duration-300 text-sm resize-none
                `}
                rows={5}
                placeholder="e.g., We regret to inform you that our venue is fully booked for the requested date..."
              />

              <div className="flex flex-col md:flex-row justify-end items-center gap-4 mt-8">
                <button
                  onClick={() => handleUpdateStatus("Pending")}
                  className={`text-xs uppercase font-bold tracking-widest ${theme.subText} hover:text-[#C9A25D] transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRejection}
                  disabled={!rejectionReason || isSending}
                  className={`
                    flex items-center gap-2 px-8 py-3 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded-sm 
                    hover:bg-red-700 transition-all shadow-lg shadow-red-900/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Confirm & Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // --- EVENT INFO VIEW (Unchanged) ---
        <>
          <div className="flex justify-between items-end mb-6">
            <h3 className={`font-serif text-2xl ${theme.text}`}>
              Event Specifications
            </h3>
          </div>

          {/* MAIN DETAILS GRID */}
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

          {/* Reservation Fee Block */}
          <div className={`mt-8 mb-8 border ${theme.border} ${theme.cardBg} rounded-sm p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500`}>
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