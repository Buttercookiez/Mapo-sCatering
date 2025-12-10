// src/components/Sidebar/BookingSidebar.jsx
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
  AlertCircle
} from "lucide-react";

const BookingSidebar = ({ details, theme, handleUpdateStatus }) => {
  
  const status = details.status || "Pending";
  const showActionBox = ["Pending", "Pending Review", "Accepted", "Rejected"].includes(status);

  return (
    <div
      className={`w-full lg:w-80 border-r ${theme.border} ${theme.cardBg} p-6 lg:p-8 overflow-y-auto scroll-smooth no-scrollbar z-10`}
    >
      <h3
        className={`text-[10px] uppercase tracking-[0.2em] mb-6 ${theme.subText} font-bold`}
      >
        Customer Profile
      </h3>

      {/* --- AVATAR & NAME --- */}
      <div
        className={`flex flex-col items-center text-center mb-8 pb-8 border-b border-dashed ${theme.border}`}
      >
        <div
          className={`h-16 w-16 flex items-center justify-center rounded-full text-[#C9A25D] text-xl font-serif italic mb-3 border ${theme.border} bg-stone-50 dark:bg-stone-900/50`}
        >
          {details.client ? details.client.charAt(0) : "?"}
        </div>
        <h4 className={`font-serif text-xl mb-1 ${theme.text}`}>
          {details.client}
        </h4>
        <div className={`flex gap-3 mt-3 justify-center`}>
          <button title="Email Client" className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}>
            <Mail size={14} />
          </button>
          <button title="Call Client" className={`p-2 rounded-full border ${theme.border} text-stone-400 hover:border-[#C9A25D] hover:text-[#C9A25D] transition-all`}>
            <Phone size={14} />
          </button>
        </div>
      </div>

      {/* --- DETAILS LIST --- */}
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

        {/* --- ACTION / STATUS BOX --- */}
        {showActionBox && (
          <div
            // FIXED: Using 'bg-stone-50' for Light and 'dark:bg-stone-900/30' for Dark.
            // This ensures it is very light gray (almost white) in light mode.
            className={`mt-8 p-5 rounded-sm border ${theme.border} bg-stone-50 dark:bg-stone-900/20`}
          >
            {/* CASE 1: PENDING (Decide) */}
            {(status === "Pending" || status === "Pending Review") && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} className="text-yellow-600" />
                  <p className="text-[10px] uppercase tracking-widest text-stone-400">Action Required</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus("Accepted")}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-sm text-xs font-bold uppercase transition-colors shadow-sm"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("Rejected")}
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-transparent border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors py-2.5 rounded-sm text-xs font-bold uppercase"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 text-center mt-1">
                  Accepting unlocks the Proposal tab.
                </p>
              </div>
            )}

            {/* CASE 2: ACCEPTED (Feedback) */}
            {status === "Accepted" && (
              <div className="flex flex-col items-center justify-center py-2 text-emerald-600 dark:text-emerald-500 animate-in fade-in duration-500">
                <CheckCircle size={28} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Request Accepted
                </span>
                <p className="text-[10px] text-stone-400 mt-2 text-center leading-relaxed">
                  You can now create and send a proposal in the <strong>Proposal Tab</strong>.
                </p>
              </div>
            )}

            {/* CASE 3: REJECTED (Feedback) */}
            {status === "Rejected" && (
              <div className="flex flex-col items-center justify-center py-2 text-red-500 animate-in fade-in duration-500">
                <XCircle size={28} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Request Rejected
                </span>
                <p className="text-[10px] text-stone-400 mt-2 text-center">
                  This inquiry has been closed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSidebar;