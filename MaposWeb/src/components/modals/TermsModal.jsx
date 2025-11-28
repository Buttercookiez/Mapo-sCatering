// src/components/modals/TermsModal.jsx
import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAccept, isSubmitting, darkMode }) => {
  if (!isOpen) return null;

  const theme = {
    bg: darkMode ? 'bg-[#111]' : 'bg-white',
    text: darkMode ? 'text-stone-300' : 'text-stone-600',
    heading: darkMode ? 'text-stone-100' : 'text-stone-900',
    border: darkMode ? 'border-stone-800' : 'border-stone-200',
    secondaryBg: darkMode ? 'bg-stone-900' : 'bg-stone-50',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden ${theme.bg} animate-[fadeIn_0.3s_ease-out]`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${theme.border}`}>
            <div className="flex items-center gap-3">
                {/* Gold Color Restored */}
                <ShieldCheck className="w-6 h-6 text-[#C9A25D]" />
                <h3 className={`font-serif text-2xl ${theme.heading}`}>Terms & Conditions</h3>
            </div>
            <button onClick={onClose} className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors ${theme.text}`}>
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Scrollable Text Area */}
        <div className={`p-6 max-h-[50vh] overflow-y-auto stop-scroll-propagation text-sm leading-relaxed ${theme.text}`}>
            {/* Colons removed from headers */}
            <p className="mb-4">
                <strong>1. Booking Confirmation</strong> A booking is only tentatively confirmed upon the receipt of this inquiry. A formal contract and a down payment of 50% are required to secure the date.
            </p>
            <p className="mb-4">
                <strong>2. Payment Terms</strong> The remaining balance is due 14 days prior to the event date. We accept bank transfers, credit cards, and checks.
            </p>
            <p className="mb-4">
                <strong>3. Cancellation Policy</strong> Cancellations made 30 days prior to the event are eligible for a 50% refund of the deposit. Cancellations made within 30 days are non-refundable.
            </p>
            <p className="mb-4">
                <strong>4. Guest Count</strong> Final guest count must be confirmed 7 days before the event. We will charge based on the guaranteed count or actual attendance, whichever is higher.
            </p>
            <p className="mb-4">
                <strong>5. Damages</strong> The client is responsible for any damages to the venue or equipment caused by their guests during the event.
            </p>
            <p className="mb-4">
                <strong>6. Force Majeure</strong> We are not liable for failure to perform obligations due to events beyond our control (e.g., natural disasters, government lockdowns).
            </p>
             <p className="italic opacity-70">
                By clicking "Accept & Submit", you acknowledge that you have read and understood these terms.
            </p>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${theme.border} ${theme.secondaryBg} flex flex-col-reverse md:flex-row gap-4 justify-end`}>
            <button 
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-3 text-xs uppercase tracking-widest font-bold border ${theme.border} hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors ${theme.heading}`}
            >
                Decline
            </button>
            <button 
                onClick={onAccept}
                disabled={isSubmitting}
                // Gold Button Restored
                className={`px-8 py-3 text-xs uppercase tracking-widest font-bold bg-[#C9A25D] text-white hover:bg-[#b08d4b] transition-all shadow-lg flex justify-center items-center gap-2`}
            >
                {isSubmitting ? 'Processing...' : 'Accept & Submit Inquiry'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default TermsModal;