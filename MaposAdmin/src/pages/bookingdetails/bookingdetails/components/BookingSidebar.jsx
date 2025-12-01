import React from "react";
import {
  Mail,
  Phone,
  Calendar,
  ChefHat,
  Users,
  Check,
  XCircle,
  CheckCircle,
} from "lucide-react";

const BookingSidebar = ({ details, theme, handleUpdateStatus }) => {
  return (
    <div
      className={`w-full lg:w-80 border-r ${theme.border} ${theme.cardBg} p-6 lg:p-8 overflow-y-auto scroll-smooth no-scrollbar z-10`}
    >
      <h3
        className={`text-[10px] uppercase tracking-[0.2em] mb-6 ${theme.subText} font-bold`}
      >
        Customer Profile
      </h3>

      <div
        className={`flex flex-col items-center text-center mb-8 pb-8 border-b border-dashed ${theme.border}`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-[#C9A25D] text-xl font-serif italic mb-3 border ${theme.border} bg-transparent`}
        >
          {details.client.charAt(0)}
        </div>
        <h4 className={`font-serif text-xl mb-1 ${theme.text}`}>
          {details.client}
        </h4>
        <div className={`flex gap-3 mt-3 justify-center`}>
          <button
            className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}
          >
            <Mail size={14} />
          </button>
          <button
            className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}
          >
            <Phone size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Calendar size={16} className="mt-0.5 text-[#C9A25D]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400">
              Event Date
            </p>
            <p className={`text-sm font-medium ${theme.text}`}>
              {details.date}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ChefHat size={16} className="mt-0.5 text-[#C9A25D]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400">
              Occasion
            </p>
            <p className={`text-sm font-medium ${theme.text}`}>
              {details.type}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users size={16} className="mt-0.5 text-[#C9A25D]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400">
              Headcount
            </p>
            <p className={`text-sm font-medium ${theme.text}`}>
              {details.guests} Pax
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-sm border ${theme.border} bg-transparent`}>
          {/* CASE 1: PENDING (Show Buttons) */}
          {details.status === "Pending" && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                Action Required
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus("Confirmed")}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-sm text-xs font-bold uppercase transition-colors"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => handleUpdateStatus("Cancelled")}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-sm text-xs font-bold uppercase transition-colors"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: CONFIRMED (Show Success Message) */}
          {details.status === "Confirmed" && (
            <div className="flex flex-col items-center justify-center py-2 text-emerald-600 dark:text-emerald-500 animate-in fade-in duration-500">
              <CheckCircle size={24} className="mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Booking Accepted
              </span>
              <p className="text-[10px] text-stone-400 mt-1">
                Client has been notified.
              </p>
            </div>
          )}

          {/* CASE 3: CANCELLED (Show Rejection Message) */}
          {details.status === "Cancelled" && (
            <div className="flex flex-col items-center justify-center py-2 text-red-500 animate-in fade-in duration-500">
              <XCircle size={24} className="mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Booking Rejected
              </span>
              <p className="text-[10px] text-stone-400 mt-1">
                Action cannot be undone.
              </p>
            </div>
          )}

          {/* CASE 4: OTHER STATUSES (Show Notes - Optional fallback) */}
          {!["Pending", "Confirmed", "Cancelled"].includes(details.status) && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                Customer Notes
              </p>
              <p className={`text-xs italic ${theme.subText}`}>
                "{details.notes || "No additional notes."}"
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSidebar;
