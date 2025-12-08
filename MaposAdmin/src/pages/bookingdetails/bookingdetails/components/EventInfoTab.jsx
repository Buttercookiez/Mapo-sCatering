import React, { useState } from "react";
import {
  Calendar, MapPin, Clock, FileText, Utensils,
  AlertCircle, CheckCircle, Loader2, Send, Wallet,
  Coins, Receipt, Check // Added Check icon
} from "lucide-react";

import StatusBadge from "./StatusBadge"; 
// 1. IMPORT THE SERVICE
import { markBookingAsFullyPaid } from "../../../../api/bookingService";

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
  
  // --- FINANCIAL CALCULATIONS ---
  const addOns = details.eventDetails?.addOns || [];
  const addOnsTotal = addOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  
  const billing = details.billing || {};
  const totalCost = billing.totalCost || details.budget || 0; 
  const reservationFee = 5000; 

  // --- LOGIC: CHECK PAYMENT STATUSES ---
  
  // 1. Reservation Fee Status (Based on existing paymentStatus)
  // If paymentStatus is "Paid", it means Reservation is secured.
  const reservationStatus = billing.paymentStatus || "Unpaid";
  const isReservationSecured = reservationStatus === "Paid";

  // 2. Full Payment Status (Based on NEW FIELD)
  // We check the specific field 'fullPaymentStatus' from the DB
  const isFullyPaid = billing.fullPaymentStatus === "Paid";

  // --- VISUAL BALANCE ---
  // If fully paid, balance is 0. Otherwise, it's Total - Reservation.
  const balanceDue = isFullyPaid ? 0 : (totalCost - reservationFee);

  // --- LOCAL STATE ---
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // --- HANDLER ---
  const handleFullPayment = async () => {
    if(!window.confirm(`Confirm that the client has settled the remaining balance of ₱${balanceDue.toLocaleString()}?`)) return;

    setIsUpdatingPayment(true);
    try {
        await markBookingAsFullyPaid(details.refId);
        alert("Full payment recorded successfully.");
        // Reload to show the new "Fully Paid" status immediately
        window.location.reload(); 
    } catch (error) {
        console.error(error);
        alert("Failed to update payment status.");
    } finally {
        setIsUpdatingPayment(false);
    }
  };

  // Badge Display Logic
  const reservationBadgeStatus = isReservationSecured ? "Paid" : "Unpaid";

  return (
    <div className="max-w-4xl mx-auto">
      {isBookingRejected ? (
         // ... (Rejection Code - Unchanged) ...
         <div className={`relative p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}>
            {/* ... rejection content ... */}
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/80"></div>
             {/* ... header ... */}
             <div className="flex items-start gap-5 mb-8">
                <div className={`p-3 rounded-full bg-red-500/10 text-red-500 mt-1`}>
                    <AlertCircle size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">Status Update</span>
                    <h3 className={`text-2xl font-serif italic ${theme.text} mt-1`}>Inquiry Rejected</h3>
                </div>
             </div>
             {rejectionSent ? (
                <div className={`flex flex-col items-center justify-center py-12 border-t border-dashed ${theme.border}`}>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <h4 className={`text-lg font-serif italic ${theme.text}`}>Notification Sent</h4>
                  <button onClick={() => handleUpdateStatus("Pending")} className={`mt-8 text-xs text-stone-500 underline hover:text-[#C9A25D] transition-colors`}>Undo Rejection</button>
                </div>
              ) : (
                <div className="pl-0 md:pl-14">
                  <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={`w-full p-4 border ${theme.border} bg-transparent ${theme.text} rounded-sm text-sm resize-none`} rows={5} placeholder="Reason..." />
                  <div className="flex justify-end gap-4 mt-8">
                    <button onClick={() => handleUpdateStatus("Pending")} className={`text-xs uppercase font-bold tracking-widest ${theme.subText}`}>Cancel</button>
                    <button onClick={handleSendRejection} disabled={!rejectionReason || isSending} className={`flex items-center gap-2 px-8 py-3 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded-sm`}>
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Confirm & Send
                    </button>
                  </div>
                </div>
              )}
         </div>
      ) : (
        <>
          <div className="flex justify-between items-end mb-6">
             <h3 className={`font-serif text-2xl ${theme.text}`}>Event Specifications</h3>
          </div>
          
          {/* ... (Main Details Grid - Unchanged) ... */}
           <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm transition-all duration-500`}>
            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Event Date</p><div className="flex items-center gap-2"><Calendar size={16} className="text-[#C9A25D]" /><span className={`text-sm font-medium ${theme.text}`}>{details.date}</span></div></div>
            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Time</p><div className="flex items-center gap-2"><Clock size={16} className="text-[#C9A25D]" /><span className={`text-sm font-medium ${theme.text}`}>{details.timeStart} — {details.timeEnd}</span></div></div>
            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Type</p><div className="flex items-center gap-2"><FileText size={16} className="text-[#C9A25D]" /><span className={`text-sm font-medium ${theme.text}`}>{details.type}</span></div></div>
            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Venue</p><div className="flex items-center gap-2"><MapPin size={16} className="text-[#C9A25D]" /><span className={`text-sm font-medium ${theme.text}`}>{details.venue}</span></div></div>
            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Service</p><div className="flex items-center gap-2"><Utensils size={16} className="text-[#C9A25D]" /><span className={`text-sm font-medium ${theme.text}`}>{details.serviceStyle}</span></div></div>
            <div className={`col-span-1 md:col-span-2 border-t border-dashed ${theme.border} my-2`}></div>
            <div className="col-span-1 md:col-span-2"><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Primary Contact</p><p className={`text-sm font-medium ${theme.text}`}>{details.phone}</p><p className={`text-xs ${theme.subText}`}>{details.email}</p></div>
          </div>

          {/* FINANCIALS BLOCK */}
          <div className={`mt-8 mb-8 border ${theme.border} ${theme.cardBg} rounded-sm p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-start transition-colors duration-500`}>
             
             {/* 1. RESERVATION FEE */}
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]">
                        <Wallet size={18} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Reservation Fee</p>
                </div>
                
                <span className={`font-serif text-xl font-medium ${theme.text}`}>
                    ₱ {reservationFee.toLocaleString()}
                </span>
                <div className="mt-1">
                    <StatusBadge status={reservationBadgeStatus} />
                </div>
             </div>

             {/* 2. ADD-ONS TOTAL */}
             <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500">
                        <Receipt size={18} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Add-ons</p>
                </div>
                
                <span className={`font-serif text-xl font-medium ${theme.text}`}>
                    ₱ {addOnsTotal.toLocaleString()}
                </span>
                <p className="text-[10px] text-stone-400 italic">
                    {addOns.length} items selected
                </p>
             </div>

             {/* 3. TOTAL CONTRACT PRICE & BUTTON */}
             <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500">
                        <Coins size={18} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Contract Price</p>
                </div>
                
                <span className={`font-serif text-2xl font-medium ${theme.text}`}>
                    ₱ {totalCost.toLocaleString()}
                </span>
                
                <div className="flex flex-col gap-2 mt-2">
                    {/* Visual Balance */}
                    {!isFullyPaid && (
                        <div className="text-[10px] text-stone-500 font-mono">
                           Balance Due: ₱ {balanceDue.toLocaleString()}
                        </div>
                    )}

                    {/* --- TOGGLE BUTTON vs PAID BADGE --- */}
                    {isFullyPaid ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-sm border border-emerald-200 dark:border-emerald-900/30 w-fit">
                            <CheckCircle size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Fully Paid</span>
                        </div>
                    ) : (
                        // Only show button if Reservation is SECURED (Reservation Fee is Paid)
                        isReservationSecured ? (
                             <button 
                                onClick={handleFullPayment}
                                disabled={isUpdatingPayment}
                                className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#C9A25D] text-white px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest transition-colors w-fit shadow-md"
                            >
                                {isUpdatingPayment ? <Loader2 size={12} className="animate-spin"/> : <Check size={12} />}
                                Mark Fully Paid
                            </button>
                        ) : (
                            // Hint if reservation not paid yet
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-1">
                                    <CheckCircle size={10} />
                                    Less ₱{reservationFee.toLocaleString()} reservation fee
                                </p>
                                <p className="text-[10px] text-stone-400 italic flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    Awaiting Reservation Fee
                                </p>
                            </div>
                        )
                    )}
                </div>
             </div>

          </div>
        </>
      )}
    </div>
  );
};

export default EventInfoTab;