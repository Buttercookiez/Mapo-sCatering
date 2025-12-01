import React from "react";
import { Utensils, CheckCircle, Send, Loader2 } from "lucide-react";

const menuPackages = [
  { id: 1, name: "Standard Buffet", price: 850 },
  { id: 2, name: "Premium Plated", price: 1200 },
  { id: 3, name: "Grand Gala Set", price: 2500 },
];

const ProposalTab = ({
  details,
  theme,
  proposalTotal,
  setProposalTotal,
  handleSendProposal,
  isSending,
  emailStatus,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className={`font-serif text-2xl ${theme.text}`}>
            Build Proposal
          </h3>
          <p className={`text-xs ${theme.subText} mt-1`}>
            Ref No. {details.id}-QUO
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-stone-400">
            Total Estimated Cost
          </p>
          <p className="font-serif text-3xl text-[#C9A25D]">
            ₱ {Number(proposalTotal).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div
          className={`border ${theme.border} ${theme.cardBg} p-6 rounded-sm`}
        >
          <h4
            className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme.text}`}
          >
            <Utensils size={16} /> Catering Package
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {menuPackages.map((pkg) => {
              const isSelected = proposalTotal / details.guests === pkg.price;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setProposalTotal(pkg.price * details.guests)}
                  className={`p-4 border rounded-sm text-left transition-all duration-300 ${
                    isSelected
                      ? "border-[#C9A25D] bg-stone-50 dark:bg-stone-800 shadow-md ring-1 ring-[#C9A25D]/50"
                      : `${theme.border} hover:border-[#C9A25D] hover:shadow-sm bg-transparent`
                  }`}
                >
                  <span className={`font-serif text-lg block ${theme.text}`}>
                    {pkg.name}
                  </span>
                  <span className="text-xs text-stone-400 block mb-2">
                    ₱ {pkg.price} / head
                  </span>
                  {isSelected && (
                    <CheckCircle
                      size={14}
                      className="text-[#C9A25D] ml-auto"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={`mt-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}
        >
          <h4 className="text-[10px] uppercase tracking-[0.2em] mb-6 font-bold text-stone-400 border-b border-dashed border-stone-200 dark:border-stone-800 pb-2">
            Cost Breakdown
          </h4>
          <div className={`space-y-4 text-sm ${theme.text}`}>
            <div className="flex justify-between items-center">
              <span>
                Food & Beverage ({details.guests} pax)
              </span>
              <span className="font-serif text-base">
                ₱ {Number(proposalTotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>Service Charge (10%)</span>
              <span className="font-serif text-base">
                ₱ {(proposalTotal * 0.1).toLocaleString()}
              </span>
            </div>
            <div
              className={`border-t ${theme.border} pt-4 mt-4 flex justify-between items-end`}
            >
              <span
                className={`font-bold text-xs uppercase tracking-widest ${theme.text}`}
              >
                Grand Total
              </span>
              <span className="font-serif text-2xl text-[#C9A25D]">
                ₱ {(proposalTotal * 1.1).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={handleSendProposal}
            disabled={isSending || emailStatus === "success"}
            className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm uppercase tracking-wider font-bold transition-all duration-300 ${
              emailStatus === "success"
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-[#C9A25D] text-white hover:bg-[#b08d55] shadow-lg hover:shadow-[#C9A25D]/20"
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : emailStatus === "success" ? (
              <>
                <CheckCircle size={16} />
                Proposal Sent
              </>
            ) : (
              <>
                <Send size={16} />
                Send Proposal
              </>
            )}
          </button>
          {emailStatus === "error" && (
            <p className="text-xs text-red-500">
              Failed to send email. Please try again.
            </p>
          )}
          <p className="text-[10px] text-stone-400 italic">
            Sending to: {details.email || "No email provided"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProposalTab;