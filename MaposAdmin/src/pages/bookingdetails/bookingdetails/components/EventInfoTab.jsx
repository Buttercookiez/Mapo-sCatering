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
  Coins,
  Receipt,
  Check,
  BellRing,
  XCircle, // Added for Cancel icon
  Mail     // Added for Email indicator
} from "lucide-react";

// Date Utilities
import { subDays, format, differenceInDays, isValid } from "date-fns";

// Components & Services
import StatusBadge from "./StatusBadge"; 
import { markBookingAsFullyPaid, sendPaymentReminder } from "../../../../api/bookingService";

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
  
  // --- 1. FINANCIAL CALCULATIONS ---
  const addOns = details.eventDetails?.addOns || [];
  const addOnsTotal = addOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  
  const billing = details.billing || {};
  const totalCost = billing.totalCost || details.budget || 0; 
  const reservationFee = 5000; 

  // --- 2. PAYMENT STATUS LOGIC ---
  const secureStatuses = ["Reserved", "Confirmed", "Paid", "Completed"];
  const currentStatus = details.status || "Pending";
  const isReservationSecured = billing.paymentStatus === "Paid" || secureStatuses.includes(currentStatus);
  const reservationBadgeStatus = isReservationSecured ? "Paid" : "Unpaid";

  const isFullyPaid = billing.fullPaymentStatus === "Paid";
  const balanceDue = isFullyPaid ? 0 : (totalCost - reservationFee);

  // --- 3. STATUS CHECKS ---
  const isCancelled = currentStatus === "Cancelled";
  const isCancelledOrRejected = ["Cancelled", "Rejected"].includes(currentStatus);
  const isActiveBooking = !isCancelledOrRejected;

  // --- 4. DEADLINE & DATE LOGIC ---
  const eventDateObj = new Date(details.date);
  let deadlineString = "N/A";
  let daysUntilDeadline = null;

  if (isValid(eventDateObj)) {
      const deadlineDate = subDays(eventDateObj, 5); // 5 Days before event
      deadlineString = format(deadlineDate, 'MMM dd, yyyy');
      daysUntilDeadline = differenceInDays(deadlineDate, new Date());
  }

  // --- 5. LOCAL STATE ---
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // --- HANDLERS ---
  const handleFullPayment = async () => {
    if(!window.confirm(`Confirm that the client has settled the remaining balance of ₱${balanceDue.toLocaleString()}?`)) return;
    setIsUpdatingPayment(true);
    try {
        await markBookingAsFullyPaid(details.refId);
        alert("Full payment recorded successfully.");
        window.location.reload(); 
    } catch (error) {
        console.error(error);
        alert("Failed to update payment status.");
    } finally {
        setIsUpdatingPayment(false);
    }
  };

  const handleReminderClick = async () => {
    if(!window.confirm(`Send payment reminder email to ${details.client}?`)) return;
    setIsSendingReminder(true);
    try {
        await sendPaymentReminder(details.refId);
        alert("Payment reminder sent to client.");
    } catch (error) {
        console.error(error);
        alert("Failed to send reminder.");
    } finally {
        setIsSendingReminder(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isBookingRejected ? (
        // --- REJECTION VIEW (Explicit Rejection via Button) ---
        <div className={`relative p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm overflow-hidden transition-colors duration-500`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500/80"></div>
          <div className="flex items-start gap-5 mb-8">
            <div className={`p-3 rounded-full bg-red-500/10 text-red-500 mt-1`}><AlertCircle size={24} strokeWidth={1.5} /></div>
            <div className="flex-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">Status Update</span>
                <h3 className={`text-2xl font-serif italic ${theme.text} mt-1`}>Inquiry Rejected</h3>
                <p className={`text-sm ${theme.subText} mt-2 max-w-2xl`}>This inquiry has been marked for rejection.</p>
            </div>
          </div>
          {rejectionSent ? (
            <div className={`flex flex-col items-center justify-center py-12 border-t border-dashed ${theme.border}`}>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"><CheckCircle size={32} className="text-emerald-500" /></div>
              <h4 className={`text-lg font-serif italic ${theme.text}`}>Notification Sent</h4>
              {rejectionReason && (<div className={`mt-6 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-sm border ${theme.border} max-w-md w-full text-center`}><span className="text-[10px] uppercase tracking-widest text-stone-400 block mb-2">Recorded Reason</span><p className={`text-sm ${theme.text} italic`}>"{rejectionReason}"</p></div>)}
              <button onClick={() => handleUpdateStatus("Pending")} className={`mt-8 text-xs text-stone-500 underline hover:text-[#C9A25D] transition-colors`}>Undo Rejection</button>
            </div>
          ) : (
            <div className="pl-0 md:pl-14">
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={`w-full p-4 border ${theme.border} bg-transparent ${theme.text} placeholder-stone-500/50 rounded-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm resize-none`} rows={5} placeholder="e.g., Venue fully booked..." />
              <div className="flex flex-col md:flex-row justify-end items-center gap-4 mt-8">
                <button onClick={() => handleUpdateStatus("Pending")} className={`text-xs uppercase font-bold tracking-widest ${theme.subText} hover:text-[#C9A25D] transition-colors`}>Cancel</button>
                <button onClick={handleSendRejection} disabled={!rejectionReason || isSending} className={`flex items-center gap-2 px-8 py-3 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Confirm & Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // --- NORMAL INFO VIEW ---
        <>
          {/* --- 1. CANCELLATION NOTICE (New) --- */}
          {isCancelled && (
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-sm flex flex-col md:flex-row gap-4 items-start relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                
                <div className="p-2 bg-white dark:bg-red-900/20 rounded-full text-red-500 mt-1 shadow-sm">
                    <XCircle size={24} />
                </div>

                <div className="flex-1">
                    <h4 className="text-lg font-serif font-bold text-red-700 dark:text-red-400">Booking Cancelled</h4>
                    <p className="text-sm text-red-600/80 dark:text-red-300 mt-1 leading-relaxed">
                        {details.cancellationReason || "This booking was automatically cancelled because the full payment was not settled 5 days before the event."}
                    </p>

                    {/* Email Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        <span className="flex items-center gap-1.5 py-1 px-3 bg-white dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/30 text-[10px] font-bold uppercase tracking-widest text-red-500 shadow-sm">
                            <Mail size={12} /> Cancellation Notice Sent
                        </span>
                    </div>
                </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-6">
            <h3 className={`font-serif text-2xl ${theme.text}`}>Event Specifications</h3>
          </div>

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
                    <div className="p-2 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]"><Wallet size={18} strokeWidth={1.5} /></div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Reservation Fee</p>
                </div>
                <span className={`font-serif text-xl font-medium ${theme.text}`}>₱ {reservationFee.toLocaleString()}</span>
                <div className="mt-1"><StatusBadge status={reservationBadgeStatus} /></div>
             </div>

             {/* 2. ADD-ONS TOTAL */}
             <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500"><Receipt size={18} strokeWidth={1.5} /></div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Add-ons</p>
                </div>
                <span className={`font-serif text-xl font-medium ${theme.text}`}>₱ {addOnsTotal.toLocaleString()}</span>
                <p className="text-[10px] text-stone-400 italic">{addOns.length} items selected</p>
             </div>

             {/* 3. TOTAL CONTRACT PRICE & ACTIONS */}
             <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500"><Coins size={18} strokeWidth={1.5} /></div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Contract Price</p>
                </div>
                <span className={`font-serif text-2xl font-medium ${theme.text}`}>₱ {totalCost.toLocaleString()}</span>
                
                <div className="flex flex-col gap-3 mt-2">
                    
                    {/* BALANCE INFO */}
                    {!isFullyPaid && (
                        <div className={`p-3 rounded border ${isCancelled ? 'bg-stone-100 border-stone-200 opacity-75' : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
                           <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] uppercase text-stone-500 font-bold">Balance Due</span>
                               <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">₱{balanceDue.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-[10px] uppercase text-stone-500 font-bold">Deadline</span>
                               <span className={`text-xs font-mono font-bold ${daysUntilDeadline !== null && daysUntilDeadline < 5 && isActiveBooking ? 'text-red-500' : 'text-stone-800 dark:text-stone-200'}`}>
                                   {deadlineString}
                               </span>
                           </div>
                           
                           {/* Warning Message (Only if Active) */}
                           {isActiveBooking && daysUntilDeadline !== null && daysUntilDeadline < 5 && daysUntilDeadline >= 0 && (
                               <p className="text-[9px] text-red-500 mt-2 italic text-center font-semibold">
                                   Warning: Auto-cancellation in {daysUntilDeadline} days.
                               </p>
                           )}
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2">
                        {isFullyPaid ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-sm border border-emerald-200 dark:border-emerald-900/30 w-full justify-center">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-wide">Fully Paid</span>
                            </div>
                        ) : (
                            isReservationSecured && isActiveBooking ? ( 
                                 <>
                                    <button onClick={handleFullPayment} disabled={isUpdatingPayment} className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-emerald-600 text-white px-3 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors shadow-md">
                                        {isUpdatingPayment ? <Loader2 size={12} className="animate-spin"/> : <Check size={12} />} Mark Paid
                                    </button>
                                    <button onClick={handleReminderClick} disabled={isSendingReminder} title="Send Payment Reminder Email" className="flex items-center justify-center gap-2 bg-white border border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-[#C9A25D] hover:border-[#C9A25D] px-3 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors shadow-sm">
                                        {isSendingReminder ? <Loader2 size={12} className="animate-spin"/> : <BellRing size={12} />}
                                    </button>
                                 </>
                            ) : (
                                <div className="flex flex-col gap-1 w-full">
                                    {isCancelledOrRejected ? (
                                        <div className="flex items-center justify-center gap-2 py-2 border border-red-200 bg-red-50 rounded-sm text-red-500 text-[10px] font-bold uppercase tracking-wide">
                                            <XCircle size={12} />
                                            {currentStatus}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-stone-400 italic flex items-center gap-1"><AlertCircle size={10} /> Awaiting Reservation Fee</p>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventInfoTab;