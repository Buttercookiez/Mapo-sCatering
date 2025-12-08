import React, { useState, useEffect, useMemo } from "react";
import {
  Utensils,
  CheckCircle,
  Send,
  Loader2,
  Zap,
  Star,
  Crown,
  Clock, // Import Clock icon
} from "lucide-react";
import { getPackagesByEvent } from "../../../../api/bookingService";

const ProposalTab = ({
  details,
  theme,
  handleSendProposal,
  isSending,
  emailStatus,
}) => {
  const [dbPackages, setDbPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Store selections
  const [selections, setSelections] = useState({
    budget: null,
    mid: null,
    high: null,
  });

  // --- NEW: COOLDOWN LOGIC ---
  const isCoolingDown = useMemo(() => {
    if (!details.lastProposalSentAt) return false;

    const lastSent = new Date(details.lastProposalSentAt);
    const now = new Date();
    const diffInMs = now - lastSent;
    const hoursPassed = diffInMs / (1000 * 60 * 60);

    // If less than 24 hours passed AND status is still "Proposal Sent"
    // (If they replied and status changed to 'Accepted', we might want to allow sending again)
    return hoursPassed < 24 && details.status === "Proposal Sent";
  }, [details.lastProposalSentAt, details.status]);

  // --- NEW: COUNTDOWN TIMER DISPLAY ---
  useEffect(() => {
    if (!isCoolingDown || !details.lastProposalSentAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const lastSent = new Date(details.lastProposalSentAt);
      const now = new Date();
      // 24 hours in milliseconds
      const cooldownTime = 24 * 60 * 60 * 1000; 
      const timePassed = now - lastSent;
      const timeLeft = cooldownTime - timePassed;

      if (timeLeft <= 0) {
        setTimeRemaining(null); // Cooldown over
      } else {
        const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer(); // Run immediately
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isCoolingDown, details.lastProposalSentAt]);


  // 1. FETCH PACKAGES FROM DB ON LOAD
  useEffect(() => {
    const fetchAndSort = async () => {
      setIsLoadingPackages(true);
      const result = await getPackagesByEvent(details.type || "Other");
      setDbPackages(result);
      setIsLoadingPackages(false);
    };

    if (details.type) fetchAndSort();
  }, [details.type]);

  // 2. ORGANIZE PACKAGES & AUTO-SELECT
  const categorizedPackages = useMemo(() => {
    const categories = { budget: [], mid: [], high: [] };
    const guestCount = parseInt(details.guests) || 0;

    // Sort raw DB data into categories
    dbPackages.forEach((pkg) => {
      if (pkg.categoryId === "budget") categories.budget.push(pkg);
      if (pkg.categoryId === "mid") categories.mid.push(pkg);
      if (pkg.categoryId === "high") categories.high.push(pkg);
    });

    // Helper to find best fit based on Guest Count
    const findBestFit = (list) => {
      return (
        list.find((p) => guestCount >= p.minPax && guestCount <= p.maxPax) ||
        list[0]
      );
    };

    // Auto-select defaults if not yet selected
    if (!selections.budget && dbPackages.length > 0) {
      setSelections({
        budget: findBestFit(categories.budget),
        mid: findBestFit(categories.mid),
        high: findBestFit(categories.high),
      });
    }

    return categories;
  }, [dbPackages, details.guests]);

  const handleSelect = (tierKey, pkg) => {
    setSelections((prev) => ({ ...prev, [tierKey]: pkg }));
  };

  const hasAllSelections =
    selections.budget && selections.mid && selections.high;

  // --- UPDATED LOADING STATE ---
  if (isLoadingPackages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#C9A25D] mb-4" />
        <p className={`text-xs uppercase tracking-widest ${theme.subText}`}>
          Loading {details.type} Packages...
        </p>
      </div>
    );
  }

  if (dbPackages.length === 0)
    return (
      <div className="p-10 text-center text-red-400">
        No packages found for {details.type}. Please run seed script or check
        database.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* ... (Header and Package Grid Code remains the same) ... */}
       <div className="flex justify-between items-end mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h3 className={`font-serif text-2xl ${theme.text}`}>
            Package Selection
          </h3>
          <p className={`text-xs ${theme.subText} mt-1`}>
            Event:{" "}
            <span className="font-bold text-[#C9A25D]">{details.type}</span> •
            Guests:{" "}
            <span className="font-bold text-[#C9A25D]">{details.guests}</span>
          </p>
        </div>
      </div>

      {/* --- RENDER 3 COLUMNS --- */}
      {["budget", "mid", "high"].map((tierKey) => {
          // ... (Existing Grid Code - No Changes needed here) ...
          const tierTitle =
          tierKey === "budget"
            ? "Budget Friendly"
            : tierKey === "mid"
            ? "Mid-Range"
            : "High-End";
        const Icon =
          tierKey === "budget" ? Zap : tierKey === "mid" ? Star : Crown;
        const packages = categorizedPackages[tierKey] || [];

        return (
          <div key={tierKey} className="mb-10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#C9A25D] mb-4 flex items-center gap-2">
              <Icon size={16} /> {tierTitle} Options
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected =
                  selections[tierKey]?.packageId === pkg.packageId;
                const isRecommended =
                  details.guests >= pkg.minPax && details.guests <= pkg.maxPax;

                return (
                  <div
                    key={pkg.packageId}
                    onClick={() => handleSelect(tierKey, pkg)}
                    className={`relative cursor-pointer rounded-sm border transition-all duration-200 p-5 flex flex-col justify-between ${
                      isSelected
                        ? "border-[#C9A25D] bg-[#C9A25D]/5 ring-1 ring-[#C9A25D]"
                        : `${theme.border} ${theme.cardBg} hover:border-stone-400`
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 -right-2 bg-stone-800 text-white text-[10px] uppercase px-2 py-1 rounded-full shadow-md">
                        Recommended
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h5
                          className={`font-serif text-sm font-bold ${theme.text}`}
                        >
                          {pkg.selectionLabel}
                        </h5>
                        {isSelected && (
                          <CheckCircle size={18} className="text-[#C9A25D]" />
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mb-3 italic">
                        {pkg.name}
                      </p>

                      <ul className="text-[10px] text-stone-500 dark:text-stone-400 space-y-1 mb-4">
                        {pkg.inclusions.slice(0, 4).map((inc, i) => (
                          <li key={i}>• {inc}</li>
                        ))}
                        {pkg.inclusions.length > 4 && (
                          <li>+ {pkg.inclusions.length - 4} more...</li>
                        )}
                      </ul>
                    </div>
                    <div className="text-right border-t border-dashed border-stone-200 dark:border-stone-700 pt-3">
                      <p className={`text-lg font-bold ${theme.text}`}>
                        ₱ {pkg.pricePerHead}
                      </p>
                      <p className="text-[10px] text-stone-400">per head</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* --- ACTION BAR --- */}
      <div
        className={`fixed bottom-0 left-0 right-0 p-4 border-t ${theme.border} ${theme.cardBg} z-30 flex justify-center shadow-2xl`}
      >
        <div className="max-w-4xl w-full flex items-center justify-between gap-6">
          
          {/* Left Side: Status Message */}
          <div className="hidden md:block">
             {isCoolingDown && (
                <p className="text-xs text-stone-500 flex items-center gap-2">
                    <Clock size={14} className="text-orange-400"/>
                    Proposal sent. Re-send available in: <span className="font-mono font-bold text-orange-400">{timeRemaining}</span>
                </p>
             )}
          </div>

          {/* Right Side: Button */}
          <button
            onClick={() =>
              handleSendProposal({
                options: [selections.budget, selections.mid, selections.high],
              })
            }
            // --- UPDATED DISABLED LOGIC ---
            disabled={
              isSending || 
              emailStatus === "success" || 
              !hasAllSelections || 
              isCoolingDown // Blocks click if within 24 hours
            }
            className={`px-8 py-3 rounded-sm text-sm uppercase tracking-wider font-bold transition-all shadow-lg flex items-center gap-2 ${
              emailStatus === "success"
                ? "bg-emerald-600 text-white"
                : isCoolingDown // Visually grey out if cooling down
                ? "bg-stone-300 dark:bg-stone-700 text-stone-500 cursor-not-allowed"
                : "bg-[#C9A25D] text-white hover:bg-[#b08d55]"
            } disabled:opacity-70`}
          >
            {isSending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : emailStatus === "success" ? (
               <CheckCircle size={16} />
            ) : isCoolingDown ? (
               <Clock size={16} /> // Show Clock icon when cooling down
            ) : (
              <Send size={16} />
            )}
            
            {/* Button Text Logic */}
            {isSending 
                ? "Sending..." 
                : emailStatus === "success" 
                ? "Sent Successfully" 
                : isCoolingDown 
                ? `Wait ${timeRemaining || '24h'}` 
                : "Send Options to Client"
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalTab;