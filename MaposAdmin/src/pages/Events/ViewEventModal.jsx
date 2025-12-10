import React, { useState, useEffect } from 'react';
import {
  X, Loader2, AlertCircle, FileText, Check, Ban
} from 'lucide-react';
import { calendarService } from '../../services/calendarService';

const ViewEventModal = ({ isOpen, onClose, eventId, theme, darkMode }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch Details
  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      setError(false);
      calendarService.getEventDetails(eventId)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Modal Fetch Error:", err);
          setError(true);
          setLoading(false);
        });
    } else {
      setDetails(null);
      setError(false);
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  // --- Helpers ---
  const formatMoney = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  const isCancelled = details?.status === 'Cancelled' || details?.status === 'Rejected';

  // --- Styles (Copied from Reference) ---
  const labelClass = "text-[10px] uppercase tracking-widest text-stone-500 mb-1 block font-bold";
  // Simulating the read-only input look
  const valueClass = `w-full bg-transparent border-b ${theme.border} pb-2 mb-1 text-sm ${theme.text} font-medium flex items-center justify-between`;

  // --- Sub-Component: Field ---
  const InfoField = ({ label, value, isMoney, highlight }) => (
    <div className="w-full">
      <label className={labelClass}>{label}</label>
      <div className={`${valueClass} ${highlight ? 'text-[#C9A25D]' : ''}`}>
        <span>{isMoney ? formatMoney(value) : (value || '-')}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-3xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col max-h-[90vh]`}>

        {/* --- HEADER --- */}
        <div className={`p-6 border-b ${theme.border} flex justify-between items-start`}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`font-serif text-2xl ${theme.text}`}>
                {details ? details.fullName : 'Loading...'}
              </h2>
              {details && (
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border rounded-sm 
                  ${isCancelled ? 'border-red-500 text-red-500' : 'border-[#C9A25D] text-[#C9A25D]'}`}>
                  {details.status}
                </span>
              )}
            </div>
            <span className="text-xs text-stone-500 uppercase tracking-widest mt-1 block">Ref: {eventId}</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-500">
              <Loader2 size={32} className="animate-spin mb-4 text-[#C9A25D]" />
              <p className="text-xs uppercase tracking-widest">Retrieving Booking...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-red-500">
              <AlertCircle size={32} className="mb-4" />
              <p className="text-xs uppercase tracking-widest">Failed to load details</p>
            </div>
          ) : details ? (
            <div className="space-y-8">

              {/* CANCELLATION NOTICE */}
              {isCancelled && (
                <div className="border-l-2 border-red-500 bg-red-500/10 p-4">
                  <h4 className="text-red-500 font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Ban size={12} /> Booking {details.status}
                  </h4>
                  <p className="text-red-400 text-sm">
                    Reason: {details.rejectionReason || details.cancellationReason || "No specific reason provided."}
                  </p>
                </div>
              )}

              {/* SECTION 1: EVENT DETAILS */}
              <div className="grid grid-cols-2 gap-8">
                <InfoField label="Event Type" value={details.eventType} />
                <InfoField label="Date of Event" value={details.dateOfEvent} />
                <InfoField label="Venue" value={details.venueName} />
                <InfoField label="Time" value={`${details.startTime} - ${details.endTime}`} />
              </div>

              {/* SECTION 2: CONTACT & PACKAGE */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className={`text-xs uppercase tracking-widest font-bold ${theme.subText} border-b ${theme.border} pb-2`}>Client Details</h3>
                  <InfoField label="Email Address" value={details.email} />
                  <InfoField label="Phone Number" value={details.phone} />
                  <InfoField label="Expected Guests" value={`${details.guests} Pax`} />
                </div>

                <div className="space-y-6">
                  <h3 className={`text-xs uppercase tracking-widest font-bold ${theme.subText} border-b ${theme.border} pb-2`}>Package Selection</h3>
                  <InfoField label="Package Name" value={details.packageName} />
                  
                  {/* ADD-ONS LIST */}
                  <div>
                    <label className={labelClass}>Add-ons & Upgrades</label>
                    <div className="space-y-2 mt-2">
                      {details.addOns && details.addOns.length > 0 ? (
                        details.addOns.map((addon, idx) => (
                          <div key={idx} className="flex gap-3 items-center group">
                             {/* The Gold Dot Style */}
                            <div className="h-1.5 w-1.5 rounded-full bg-[#C9A25D] flex-shrink-0 mt-0.5"></div>
                            <div className={`flex-1 flex justify-between border-b ${theme.border} pb-1 text-sm ${theme.text}`}>
                              <span>{addon.name}</span>
                              <span className="font-mono text-stone-500">{formatMoney(addon.price)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-500 italic">No add-ons selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: FINANCIALS */}
              <div>
                <h3 className={`text-xs uppercase tracking-widest font-bold ${theme.subText} border-b ${theme.border} pb-2 mb-6`}>Financial Breakdown</h3>
                <div className="grid grid-cols-3 gap-8">
                  <InfoField label="Total Contract" value={details.billing?.totalCost} isMoney />
                  
                  <div>
                    <InfoField label="Amount Paid" value={details.billing?.amountPaid} isMoney highlight />
                    <div className="flex gap-2 mt-2">
                         <span className={`text-[9px] uppercase tracking-wider ${details.billing?.fiftyPercentStatus === 'Paid' ? 'text-emerald-500' : 'text-stone-500'}`}>
                           50%: {details.billing?.fiftyPercentStatus}
                         </span>
                         <span className="text-stone-600">|</span>
                         <span className={`text-[9px] uppercase tracking-wider ${details.billing?.fullPaymentStatus === 'Paid' ? 'text-emerald-500' : 'text-stone-500'}`}>
                           Full: {details.billing?.fullPaymentStatus}
                         </span>
                    </div>
                  </div>

                  <div>
                     <label className={labelClass}>Balance Due</label>
                     <div className={`w-full bg-transparent border-b ${theme.border} pb-2 mb-1 text-sm font-medium flex items-center justify-between`}>
                        <span className={`${details.billing?.remainingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {formatMoney(details.billing?.remainingBalance)}
                        </span>
                     </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: NOTES */}
              <div className="w-full">
                 <label className={labelClass}>Notes & Instructions</label>
                 <div className={`w-full bg-transparent border ${theme.border} rounded-sm p-3 text-sm ${theme.text} min-h-[80px]`}>
                    {details.notes ? details.notes : <span className="text-stone-500 italic">No notes provided.</span>}
                 </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* --- FOOTER --- */}
        <div className={`p-6 border-t ${theme.border} flex justify-end gap-3 bg-stone-50/5 dark:bg-[#141414]`}>
           {/* If you wanted an Edit button, it would go here matching the style */}
          <button 
            onClick={onClose} 
            className={`px-6 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:bg-stone-800 hover:text-white transition-colors rounded-sm`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewEventModal;