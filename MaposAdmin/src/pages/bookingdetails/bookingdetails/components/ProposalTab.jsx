import React, { useState, useEffect, useMemo } from "react";
import { 
  Utensils, CheckCircle, Send, Loader2, 
  Zap, Star, Crown, AlertCircle 
} from "lucide-react";
import { getPackagesByEvent } from "../../../../api/bookingService"; // Import service

const ProposalTab = ({
  details,
  theme,
  handleSendProposal,
  isSending,
  emailStatus,
}) => {
  const [dbPackages, setDbPackages] = useState([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  
  // Store selections
  const [selections, setSelections] = useState({
    budget: null,
    mid: null,
    high: null
  });

  // 1. FETCH PACKAGES FROM DB ON LOAD
  useEffect(() => {
    const fetchAndSort = async () => {
      setIsLoadingPackages(true);
      // Use the event type from the booking (e.g., "Wedding")
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
        return list.find(p => guestCount >= p.minPax && guestCount <= p.maxPax) || list[0];
    };

    // Auto-select defaults if not yet selected
    if (!selections.budget && dbPackages.length > 0) {
        setSelections({
            budget: findBestFit(categories.budget),
            mid: findBestFit(categories.mid),
            high: findBestFit(categories.high)
        });
    }

    return categories;
  }, [dbPackages, details.guests]);

  const handleSelect = (tierKey, pkg) => {
    setSelections(prev => ({ ...prev, [tierKey]: pkg }));
  };

  const hasAllSelections = selections.budget && selections.mid && selections.high;

  if (isLoadingPackages) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading packages...</div>;
  if (dbPackages.length === 0) return <div className="p-10 text-center text-red-400">No packages found for {details.type}. Please run seed script or check database.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h3 className={`font-serif text-2xl ${theme.text}`}>Package Selection</h3>
          <p className={`text-xs ${theme.subText} mt-1`}>
            Event: <span className="font-bold text-[#C9A25D]">{details.type}</span> • Guests: <span className="font-bold text-[#C9A25D]">{details.guests}</span>
          </p>
        </div>
      </div>

      {/* --- RENDER 3 COLUMNS --- */}
      {["budget", "mid", "high"].map((tierKey) => {
        const tierTitle = tierKey === 'budget' ? "Budget Friendly" : tierKey === 'mid' ? "Mid-Range" : "High-End";
        const Icon = tierKey === 'budget' ? Zap : tierKey === 'mid' ? Star : Crown;
        const packages = categorizedPackages[tierKey] || [];

        return (
            <div key={tierKey} className="mb-10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#C9A25D] mb-4 flex items-center gap-2">
                <Icon size={16}/> {tierTitle} Options
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => {
                const isSelected = selections[tierKey]?.packageId === pkg.packageId;
                
                // Highlight if this package fits the guest count
                const isRecommended = details.guests >= pkg.minPax && details.guests <= pkg.maxPax;
                
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
                            <h5 className={`font-serif text-sm font-bold ${theme.text}`}>{pkg.selectionLabel}</h5>
                            {isSelected && <CheckCircle size={18} className="text-[#C9A25D]" />}
                        </div>
                        <p className="text-xs text-stone-400 mb-3 italic">{pkg.name}</p>
                        
                        <ul className="text-[10px] text-stone-500 dark:text-stone-400 space-y-1 mb-4">
                            {pkg.inclusions.slice(0, 4).map((inc, i) => <li key={i}>• {inc}</li>)}
                            {pkg.inclusions.length > 4 && <li>+ {pkg.inclusions.length - 4} more...</li>}
                        </ul>
                    </div>
                    <div className="text-right border-t border-dashed border-stone-200 dark:border-stone-700 pt-3">
                        <p className={`text-lg font-bold ${theme.text}`}>₱ {pkg.pricePerHead}</p>
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
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t ${theme.border} ${theme.cardBg} z-30 flex justify-center shadow-2xl`}>
         <div className="max-w-4xl w-full flex items-center justify-between gap-6">
            <div className="hidden md:block">
            </div>
            
            <button
                onClick={() => handleSendProposal({
                    // Send all 3 selected packages to parent handler
                    options: [selections.budget, selections.mid, selections.high]
                })}
                disabled={isSending || emailStatus === "success" || !hasAllSelections}
                className={`px-8 py-3 rounded-sm text-sm uppercase tracking-wider font-bold transition-all shadow-lg flex items-center gap-2 ${
                emailStatus === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-[#C9A25D] text-white hover:bg-[#b08d55]"
                } disabled:opacity-50`}
            >
                {isSending ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                Send Options to Client
            </button>
         </div>
      </div>
    </div>
  );
};

export default ProposalTab;