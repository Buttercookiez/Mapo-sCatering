import React, { useState, useEffect } from "react";
import {
  Calendar, MapPin, Clock, FileText, Utensils,
  AlertCircle, CheckCircle, Loader2, Send, Wallet,
  Coins, Receipt, Check, BellRing, XCircle, Mail,
  TrendingUp, Save, Lock, Info, X, AlertTriangle
} from "lucide-react";

import { subDays, format, differenceInDays, isValid } from "date-fns";
import StatusBadge from "./StatusBadge"; 
import { 
  markBookingAsFullyPaid, 
  markBookingAs50PercentPaid, 
  sendPaymentReminder,
  saveOperationalCost 
} from "../../../../api/bookingService";

// --- 1. TOAST NOTIFICATION (Luxury Dark Theme) ---
const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClass = "pointer-events-auto flex items-center gap-4 px-5 py-4 shadow-2xl border-l-4 backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300 min-w-[340px] rounded-sm bg-[#141414]";
  
  const styles = type === 'success' 
    ? "border-emerald-500 text-stone-200" 
    : "border-red-500 text-stone-200";

  const icon = type === 'success' 
    ? <CheckCircle size={20} className="text-emerald-500" /> 
    : <AlertTriangle size={20} className="text-red-500" />;

  return (
    <div className={`${baseClass} ${styles}`}>
      {icon}
      <div className="flex-1">
        <h4 className="font-serif text-sm tracking-wider text-[#C9A25D] mb-0.5 font-semibold">
          {type === 'success' ? 'System Notification' : 'Action Failed'}
        </h4>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} className="text-stone-400" />
      </button>
    </div>
  );
};

// --- 2. CONFIRMATION MODAL (Matches Your Dark Screenshot) ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading, confirmText = "Confirm" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-[#141414] border border-stone-800 w-full max-w-[500px] p-8 shadow-2xl rounded-sm flex gap-6 relative">
        
        {/* Icon Section (Gold Warning) */}
        <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#C9A25D]/10 flex items-center justify-center border border-[#C9A25D]/20 mt-1">
                <AlertTriangle className="text-[#C9A25D]" size={20} strokeWidth={2} />
            </div>
        </div>

        {/* Content Section */}
        <div className="flex-1">
            <h3 className="font-serif text-xl text-stone-100 mb-2 tracking-wide">
                {title}
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed mb-8 font-light">
                {message}
            </p>

            {/* Buttons */}
            <div className="flex justify-end items-center gap-4">
                 <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-[11px] font-bold text-stone-500 uppercase tracking-widest hover:text-stone-300 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="bg-[#C9A25D] text-black text-[11px] font-bold uppercase tracking-[0.15em] px-6 py-3 rounded-sm hover:bg-[#b08d55] transition-colors flex items-center gap-2 shadow-lg shadow-[#C9A25D]/10"
                  >
                    {isLoading && <Loader2 size={12} className="animate-spin" />}
                    {confirmText}
                  </button>
            </div>
        </div>
      </div>
    </div>
  );
};

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
  
  // --- STATE FOR UI FEEDBACK ---
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    action: null,
    confirmText: "Confirm"
  });
  
  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openConfirm = (title, message, action, confirmText = "Confirm") => {
    setModalConfig({ isOpen: true, title, message, action, confirmText });
  };

  const closeConfirm = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  // --- DATA HANDLING ---
  let addOns = details.eventDetails?.addOns;
  if (!Array.isArray(addOns)) {
      if (addOns && typeof addOns === 'object') {
          addOns = Object.values(addOns);
      } else {
          addOns = [];
      }
  }

  const addOnsTotal = addOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const billing = details.billing || {};
  const totalCost = billing.totalCost || details.budget || 0; 
  const reservationFee = 5000; 

  const opsCost = billing.operationalCost || 0;
  const netProfit = totalCost - opsCost;
  const hasOpsData = opsCost > 0;
  const marginPercent = (hasOpsData && totalCost > 0) ? ((netProfit / totalCost) * 100).toFixed(1) : null;

  const currentStatus = details.status || "Pending";
  const isEventCompleted = currentStatus === "Completed";
  const secureStatuses = ["Reserved", "Confirmed", "Paid", "Completed"];
  const isReservationPaid = secureStatuses.includes(currentStatus) || billing.paymentStatus === "Paid";
  const reservationBadgeStatus = isReservationPaid ? "Paid" : "Unpaid";
  const isFullyPaid = billing.fullPaymentStatus === "Paid";
  const is50PercentPaid = billing.fiftyPercentPaymentStatus === "Paid";

  let balanceDue = totalCost;
  if (isFullyPaid) balanceDue = 0;
  else if (is50PercentPaid) balanceDue = (totalCost - reservationFee) / 2;
  else if (isReservationPaid) balanceDue = totalCost - reservationFee;

  const isCancelled = currentStatus === "Cancelled";
  const isCancelledOrRejected = ["Cancelled", "Rejected"].includes(currentStatus);
  const isActiveBooking = !isCancelledOrRejected;

  const eventDateObj = new Date(details.date);
  let deadlineString = "N/A";
  let daysUntilDeadline = null;
  if (isValid(eventDateObj)) {
      const deadlineDate = subDays(eventDateObj, 4); 
      deadlineString = format(deadlineDate, 'MMM dd, yyyy');
      daysUntilDeadline = differenceInDays(deadlineDate, new Date());
  }

  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [costInput, setCostInput] = useState(opsCost);
  const [isSavingCost, setIsSavingCost] = useState(false);

  // --- HANDLERS ---
  const handle50PercentPayment = () => {
    const amountToPay = (totalCost - reservationFee) / 2;
    openConfirm(
      "Confirm Partial Payment",
      `Mark 50% partial payment (₱${amountToPay.toLocaleString()}) as received? This will update the balance due.`,
      async () => {
        setIsUpdatingPayment(true);
        try {
            await markBookingAs50PercentPaid(details.refId);
            addToast("50% payment recorded successfully.", "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            addToast("Failed to update status. Please try again.", "error");
        } finally {
            setIsUpdatingPayment(false);
            closeConfirm();
        }
      },
      "Confirm Pay"
    );
  };

  const handleFullPayment = () => {
    openConfirm(
      "Confirm Final Payment",
      `Are you sure you want to mark the remaining balance of ₱${balanceDue.toLocaleString()} as fully paid? This action cannot be undone.`,
      async () => {
        setIsUpdatingPayment(true);
        try {
            await markBookingAsFullyPaid(details.refId);
            addToast("Full payment recorded successfully.", "success");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            addToast("Failed to update payment status.", "error");
        } finally {
            setIsUpdatingPayment(false);
            closeConfirm();
        }
      },
      "Confirm Pay"
    );
  };

  const handleReminderClick = () => {
    openConfirm(
      "Send Payment Reminder",
      `Are you sure you want to send a payment reminder email to ${details.client}?`,
      async () => {
        setIsSendingReminder(true);
        try {
            await sendPaymentReminder(details.refId);
            addToast("Payment reminder sent to client.", "success");
        } catch (error) {
            addToast("Failed to send reminder email.", "error");
        } finally {
            setIsSendingReminder(false);
            closeConfirm();
        }
      },
      "Send Email"
    );
  };

  const handleSaveCost = async () => {
    setIsSavingCost(true);
    try {
        await saveOperationalCost(details.refId, costInput);
        addToast("Operational cost analysis saved.", "success");
        setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
        addToast("Failed to save cost data.", "error");
    } finally {
        setIsSavingCost(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      
      {/* TOAST CONTAINER (Positioned Top Right, Stacked) */}
      <div className="fixed top-24 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastNotification 
            key={t.id} 
            message={t.msg} 
            type={t.type} 
            onClose={() => removeToast(t.id)} 
          />
        ))}
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.action}
        onCancel={closeConfirm}
        confirmText={modalConfig.confirmText}
        isLoading={isUpdatingPayment || isSendingReminder}
      />

      {isBookingRejected ? (
        // --- REJECTION VIEW ---
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
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={`w-full p-4 border ${theme.border} bg-transparent ${theme.text} placeholder-stone-500/50 rounded-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm resize-none`} rows={5} placeholder="Reason..." />
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => handleUpdateStatus("Pending")} className={`text-xs uppercase font-bold tracking-widest ${theme.subText}`}>Cancel</button>
                <button onClick={handleSendRejection} disabled={!rejectionReason || isSending} className={`flex items-center gap-2 px-8 py-3 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Confirm & Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* --- CANCELLATION NOTICE --- */}
          {isCancelled && (
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-sm flex flex-col md:flex-row gap-4 items-start relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div className="p-2 bg-white dark:bg-red-900/20 rounded-full text-red-500 mt-1 shadow-sm"><XCircle size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-lg font-serif font-bold text-red-700 dark:text-red-400">Booking Cancelled</h4>
                    <p className="text-sm text-red-600/80 dark:text-red-300 mt-1 leading-relaxed">{details.cancellationReason || "Payment not settled."}</p>
                    <div className="flex items-center gap-2 mt-4"><span className="flex items-center gap-1.5 py-1 px-3 bg-white dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/30 text-[10px] font-bold uppercase tracking-widest text-red-500 shadow-sm"><Mail size={12} /> Cancellation Notice Sent</span></div>
                </div>
            </div>
          )}

          {/* --- EVENT SPECS --- */}
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

          {/* --- FINANCIALS BLOCK --- */}
          <div className={`mt-8 mb-8 border ${theme.border} ${theme.cardBg} rounded-sm p-6 shadow-sm`}>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-8 border-b border-dashed border-stone-200 dark:border-stone-800 pb-8">
                {/* 1. RESERVATION FEE */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]"><Wallet size={18} strokeWidth={1.5} /></div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Reservation Fee</p>
                    </div>
                    <span className={`font-serif text-xl font-medium ${theme.text}`}>₱ {reservationFee.toLocaleString()}</span>
                    <div className="mt-1"><StatusBadge status={reservationBadgeStatus} /></div>
                </div>

                {/* 2. ADD-ONS */}
                <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500"><Receipt size={18} strokeWidth={1.5} /></div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Add-ons</p>
                    </div>
                    <span className={`font-serif text-xl font-medium ${theme.text}`}>₱ {addOnsTotal.toLocaleString()}</span>
                    <p className="text-[10px] text-stone-400 italic">{addOns.length} items selected</p>
                </div>

                {/* 3. CONTRACT & ACTIONS */}
                <div className="flex flex-col gap-1 md:border-l md:border-dashed md:border-stone-200 md:dark:border-stone-800 md:pl-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500"><Coins size={18} strokeWidth={1.5} /></div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Total Contract Price</p>
                    </div>
                    <span className={`font-serif text-2xl font-medium ${theme.text}`}>₱ {totalCost.toLocaleString()}</span>
                    
                    {/* Payment Actions */}
                    <div className="flex flex-col gap-3 mt-4">
                        {!isFullyPaid && (
                            <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded border border-stone-200 dark:border-stone-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] uppercase text-stone-500 font-bold">Balance Due</span>
                                    <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">₱{balanceDue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase text-stone-500 font-bold">Deadline</span>
                                    <span className={`text-xs font-mono font-bold ${daysUntilDeadline !== null && daysUntilDeadline < 5 && isActiveBooking ? 'text-red-500' : 'text-stone-800 dark:text-stone-200'}`}>{deadlineString}</span>
                                </div>
                                {is50PercentPaid && isActiveBooking && (<div className="mt-2 pt-2 border-t border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">50% Paid</span></div>)}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {isFullyPaid ? (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-sm border border-emerald-200 dark:border-emerald-900/30 w-full justify-center"><CheckCircle size={16} /><span className="text-xs font-bold uppercase tracking-wide">Fully Paid</span></div>
                            ) : (
                                isReservationPaid && isActiveBooking ? ( 
                                     <>
                                        <div className="flex gap-2">
                                            {!is50PercentPaid && (
                                                <button onClick={handle50PercentPayment} disabled={isUpdatingPayment} className="flex-1 flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 text-white px-3 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors shadow-sm">
                                                    {isUpdatingPayment ? <Loader2 size={12} className="animate-spin"/> : null} 50% Paid
                                                </button>
                                            )}
                                            <button onClick={handleFullPayment} disabled={isUpdatingPayment} className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] dark:bg-[#C9A25D] text-white dark:text-[#1c1c1c] hover:bg-emerald-600 dark:hover:bg-white px-3 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors shadow-md font-bold">
                                                {isUpdatingPayment ? <Loader2 size={12} className="animate-spin"/> : <Check size={12} />} {is50PercentPaid ? "Pay Final" : "Pay Full"}
                                            </button>
                                        </div>
                                        <button onClick={handleReminderClick} disabled={isSendingReminder} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-transparent border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-[#C9A25D] hover:border-[#C9A25D] px-3 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors shadow-sm">
                                            {isSendingReminder ? <Loader2 size={12} className="animate-spin"/> : <BellRing size={12} />} Send Reminder
                                        </button>
                                     </>
                                ) : (
                                    <div className="flex flex-col gap-1 w-full">
                                        {isCancelledOrRejected ? (
                                            <div className="flex items-center justify-center gap-2 py-2 border border-red-200 bg-red-50 rounded-sm text-red-500 text-[10px] font-bold uppercase tracking-wide"><XCircle size={12} /> {currentStatus}</div>
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

             {/* --- PROFITABILITY ANALYSIS ROW --- */}
             <div className="rounded-sm overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm transition-colors duration-500">
                {/* Header */}
                <div className="bg-[#1c1c1c] dark:bg-[#000000] border-b border-stone-800 p-4 flex justify-between items-center">
                    <h4 className="text-[11px] uppercase tracking-[0.25em] text-[#C9A25D] font-bold flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#C9A25D]" /> Internal Profitability Analysis
                    </h4>
                    {!isEventCompleted && (
                        <div className="flex items-center gap-2 bg-stone-800/80 dark:bg-stone-900 px-3 py-1 rounded-full border border-stone-700">
                             <Lock size={10} className="text-amber-500" />
                             <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Event Ongoing</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className={`p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-end bg-stone-100 dark:bg-[#0f0f0f] relative transition-colors duration-500 ${!isEventCompleted ? 'cursor-not-allowed' : ''}`}>
                    
                    {/* Overlay for inactive state */}
                    {!isEventCompleted && (
                        <div className="absolute inset-0 bg-stone-100/50 dark:bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="bg-white dark:bg-[#1a1a1a] px-5 py-3 rounded shadow-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                                <Info size={14} className="text-stone-400"/>
                                <span className="text-xs text-stone-500 dark:text-stone-300 italic">Complete event to unlock analysis</span>
                            </div>
                        </div>
                    )}

                    {/* Operational Cost Input */}
                    <div className="flex flex-col gap-2 z-0">
                        <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-500">Operational Cost</label>
                        <div className="flex items-end gap-2">
                            <div className="relative flex-1 group">
                                <span className="absolute left-0 bottom-2 text-sm text-stone-400 group-focus-within:text-[#C9A25D] transition-colors">₱</span>
                                <input 
                                    type="number" 
                                    value={costInput}
                                    onChange={(e) => setCostInput(e.target.value)}
                                    disabled={!isEventCompleted} 
                                    className={`w-full pl-5 pr-2 py-1.5 text-lg font-mono font-medium bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#C9A25D] transition-all placeholder-stone-300 text-stone-800 dark:text-stone-200`}
                                    placeholder="0"
                                />
                            </div>
                            <button 
                                onClick={handleSaveCost}
                                disabled={isSavingCost || !isEventCompleted} 
                                className="bg-[#1c1c1c] dark:bg-[#C9A25D] text-white dark:text-[#1c1c1c] p-2 rounded-sm hover:bg-[#C9A25D] dark:hover:bg-white transition-colors disabled:opacity-50 shadow-md"
                                title="Save Cost"
                            >
                                {isSavingCost ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Net Profit Display */}
                    <div className="flex flex-col gap-1 z-0">
                        <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-500">Net Profit</p>
                        <div className="flex items-baseline gap-2 border-b border-dotted border-stone-300 dark:border-stone-800 pb-1">
                             {hasOpsData ? (
                                <span className={`font-serif text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                    ₱ {netProfit.toLocaleString()}
                                </span>
                            ) : (
                                <span className="font-serif text-3xl font-bold text-stone-300 dark:text-stone-700">---</span>
                            )}
                        </div>
                        <p className="text-[9px] text-stone-400 mt-1">Revenue (Total) - Expenses</p>
                    </div>

                    {/* Margin Display */}
                    <div className="flex flex-col gap-1 z-0">
                        <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-500">Profit Margin</p>
                        <div className="h-[46px] flex items-center">
                            {marginPercent !== null ? (
                                <div className="flex items-center gap-3 w-full">
                                    <span className={`text-2xl font-bold ${Number(marginPercent) > 30 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}>
                                        {marginPercent}%
                                    </span>
                                    <div className="h-1.5 flex-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${Number(marginPercent) > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                            style={{ width: `${Math.min(Number(marginPercent), 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm text-stone-400 italic font-light">Pending Input...</span>
                            )}
                        </div>
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