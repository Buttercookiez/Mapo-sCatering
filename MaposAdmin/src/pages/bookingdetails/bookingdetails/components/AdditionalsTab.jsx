import React from "react";
import { MessageSquare, PlusCircle } from "lucide-react";

const AdditionalsTab = ({ details, theme }) => {
  // Safe access to data
  const notes = details.notes || "No additional notes provided by the client.";
  // Check both 'addOns' (if stored as array) or if it's part of the notes
  // For now, let's assume 'addOns' is an array in your DB structure, 
  // or we parse it from the eventDetails if your structure puts it there.
  const addOns = details.eventDetails?.addOns || []; 

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h3 className={`font-serif text-2xl ${theme.text}`}>
          Additionals & Notes
        </h3>
        <p className={`text-xs ${theme.subText}`}>
          Client requests and extra items
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- CLIENT NOTES SECTION --- */}
        <div className={`p-6 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm h-full`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]">
              <MessageSquare size={18} />
            </div>
            <h4 className={`text-sm font-bold uppercase tracking-widest ${theme.text}`}>
              Client Notes
            </h4>
          </div>
          
          <div className={`p-4 bg-stone-50 dark:bg-stone-900/50 rounded-sm border ${theme.border} min-h-[150px]`}>
            <p className={`text-sm ${theme.text} whitespace-pre-wrap leading-relaxed italic`}>
              "{notes}"
            </p>
          </div>
          <p className="text-[10px] text-stone-400 mt-3 text-right">
            Last updated: {details.updatedAt ? new Date(details.updatedAt).toLocaleDateString() : "N/A"}
          </p>
        </div>

        {/* --- ADD-ONS SECTION --- */}
        <div className={`p-6 border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm h-full`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C9A25D]/10 rounded-full text-[#C9A25D]">
              <PlusCircle size={18} />
            </div>
            <h4 className={`text-sm font-bold uppercase tracking-widest ${theme.text}`}>
              Selected Add-Ons
            </h4>
          </div>

          {addOns.length > 0 ? (
            <div className="space-y-3">
              {addOns.map((addon, index) => (
                <div 
                  key={index} 
                  className={`flex justify-between items-center p-3 border-b border-dashed ${theme.border} last:border-0`}
                >
                  <span className={`text-sm ${theme.text}`}>{addon.name || addon}</span>
                  {addon.price && (
                    <span className="text-xs font-mono text-stone-500">
                      ₱{addon.price.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
              
              {/* Total Calculation if prices exist */}
              {addOns.some(a => a.price) && (
                <div className={`mt-4 pt-4 border-t ${theme.border} flex justify-between items-center`}>
                    <span className="text-xs font-bold uppercase text-stone-400">Total Add-ons</span>
                    <span className={`font-serif text-lg ${theme.text}`}>
                        ₱{addOns.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}
                    </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[150px] flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-sm">
              <span className="text-xs uppercase tracking-widest">No Add-ons Selected</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdditionalsTab;