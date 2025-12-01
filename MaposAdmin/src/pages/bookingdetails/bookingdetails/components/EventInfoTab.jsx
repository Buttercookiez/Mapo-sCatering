import React from "react";
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
  ThumbsUp,
  XCircle,
  Unlock
} from "lucide-react";

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
  
  return (
    <div className="max-w-4xl mx-auto">
      {isBookingRejected ? (
        // --- REJECTION VIEW (Existing Code) ---
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
        </>
      )}
    </div>
  );
};

export default EventInfoTab;