import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { verifyProposalToken, confirmProposalSelection } from "../../api/bookingService";

// Mock Payment API (Keep as is)
const processPayment = async (type, amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, amountPaid: amount });
    }, 1500);
  });
};

const ProposalSelection = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook to read URL params

  // --- State ---
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [view, setView] = useState("selection"); 
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentPaidAmount, setCurrentPaidAmount] = useState(0);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true);
      try {
        const data = await verifyProposalToken(token);
        setProposal(data);
        
        if (data.amountPaid) setCurrentPaidAmount(data.amountPaid);

        // 1. Check if already confirmed in DB
        if (data.selectedPackage) {
            setSelectedPackage(data.selectedPackage);
            setView("summary");
        } 
        // 2. NEW: Check if clicked from Email Button (URL Param)
        else {
            const pkgIndexParam = searchParams.get("pkgIndex");
            // Validate if index exists and corresponds to a package
            if (pkgIndexParam !== null && data.options && data.options[pkgIndexParam]) {
                const preSelected = data.options[pkgIndexParam];
                setSelectedPackage(preSelected);
                setView("summary"); // Jump straight to summary
            }
        }

      } catch (err) {
        setError(err.response?.data?.message || "Proposal not found");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProposal();
  }, [token, searchParams]); // Add searchParams to dependency

  // --- Calculations ---
  const calculateTotals = () => {
    if (!proposal || !selectedPackage) return { grandTotal: 0, balance: 0 };

    const pax = parseInt(proposal.pax) || 0;
    const packageCost = (selectedPackage.pricePerHead || 0) * pax;
    // Add null check for addOns
    const addOnsTotal = proposal.addOns?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

    const grandTotal = packageCost + addOnsTotal;
    const balance = grandTotal - currentPaidAmount;

    return { pax, packageCost, addOnsTotal, grandTotal, balance };
  };

  const totals = calculateTotals();

  // --- Handlers ---
  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setView("summary");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPayment = async () => {
    try {
        await confirmProposalSelection({ token, selectedPackage });
        setView("payment");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        alert("Unable to save selection.");
    }
  };

  const handlePayment = async (type) => {
    setProcessingPayment(true);
    let amountToPay = 0;
    const { grandTotal } = totals;

    if (type === "reservation") amountToPay = 5000;
    else if (type === "half") amountToPay = (grandTotal * 0.5) - currentPaidAmount;
    else if (type === "full") amountToPay = grandTotal - currentPaidAmount;

    try {
        await processPayment(type, amountToPay);
        setCurrentPaidAmount(prev => prev + amountToPay);
    } catch (err) {
        alert("Payment processing failed.");
    } finally {
        setProcessingPayment(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-yellow-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 text-sm tracking-widest uppercase">Loading Proposal...</p>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600 font-medium">
        {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-yellow-100">
      
      {/* --- MINIMIZED PREMIUM HEADER --- */}
      <header className="bg-white py-8 px-4 sm:px-6 lg:px-8 text-center border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-[10px] md:text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase mb-2">
                Official Proposal
            </h2>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                {view === "selection" ? `Welcome, ${proposal.clientName}` : "Your Event Summary"}
            </h1>
            <div className="h-1 w-16 bg-yellow-500 mx-auto rounded-full mb-3"></div>
            <p className="text-gray-500 text-sm md:text-base">
                Event Date: <span className="font-semibold text-gray-800">{proposal.eventDate}</span>
            </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* ================= VIEW 1: SELECTION ================= */}
        {view === "selection" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {proposal.options.map((pkg, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                {/* Package Header */}
                <div className="p-8 text-center border-b border-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 uppercase tracking-widest">{pkg.name}</h3>
                  <div className="mt-6 flex justify-center items-baseline text-yellow-600">
                    <span className="text-5xl font-extrabold tracking-tight">₱{pkg.pricePerHead.toLocaleString()}</span>
                    <span className="ml-2 text-sm text-gray-400 font-medium uppercase tracking-wide">/ per head</span>
                  </div>
                </div>

                {/* Inclusions */}
                <div className="flex-1 p-8 bg-white">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Package Inclusions</p>
                    <ul className="space-y-4">
                        {pkg.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                                <svg className="h-3 w-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </span>
                            <span className="ml-3 text-sm text-gray-600 leading-relaxed">{inc}</span>
                        </li>
                        ))}
                    </ul>
                </div>

                {/* Footer Action */}
                <div className="p-8 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                  <button 
                    onClick={() => handlePackageSelect(pkg)} 
                    className="w-full bg-white border-2 border-yellow-600 text-yellow-700 font-bold py-4 rounded-xl hover:bg-yellow-600 hover:text-white transition-all duration-200 uppercase tracking-wide text-sm"
                  >
                    Select {pkg.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= VIEW 2 & 3: SUMMARY & PAYMENT ================= */}
        {(view === "summary" || view === "payment") && selectedPackage && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: DETAILS (Width 7/12) */}
            <div className="xl:col-span-7 space-y-8">
              
              {/* Card: Venue & Time */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Event Logistics</h3>
                    <span className="text-xs text-gray-500 font-mono">{proposal.refId}</span>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Venue Location</p>
                        <p className="text-lg font-medium text-gray-900">{proposal.venue}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Guest Count</p>
                        <p className="text-lg font-medium text-gray-900">{proposal.pax} Pax</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Schedule</p>
                        <p className="text-gray-700">{proposal.startTime} - {proposal.endTime}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Selected Package</p>
                        <p className="text-yellow-600 font-bold">{selectedPackage.name}</p>
                    </div>
                </div>
              </div>

              {/* Card: Add-ons */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Add-ons</h3>
                </div>
                <div className="p-8">
                    {proposal.addOns && proposal.addOns.length > 0 ? (
                        <div className="space-y-4">
                            {proposal.addOns.map((addon, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-gray-700 font-medium">{addon.name || addon}</span>
                                    <span className="text-gray-900 font-mono">₱{(addon.price || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-400 italic">No additional add-ons selected.</p>
                        </div>
                    )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RECEIPT (Width 5/12) */}
            <div className="xl:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
                {/* Receipt Header */}
                <div className="bg-gray-900 px-8 py-6 text-center">
                    <h3 className="text-white font-bold uppercase tracking-widest text-lg">Billing Summary</h3>
                </div>

                <div className="p-8 space-y-6">
                    {/* Calculations */}
                    <div className="space-y-3 pb-6 border-b border-dashed border-gray-300">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Package ({selectedPackage.name})</span>
                            <span className="font-medium text-gray-900">₱{totals.packageCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total Add-ons</span>
                            <span className="font-medium text-gray-900">₱{totals.addOnsTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between items-end">
                        <span className="text-gray-900 font-bold text-lg">Grand Total</span>
                        <span className="text-3xl font-extrabold text-yellow-600">₱{totals.grandTotal.toLocaleString()}</span>
                    </div>

                    {/* Payment Status Box */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between text-sm text-green-700 mb-2">
                            <span className="font-medium">Amount Paid</span>
                            <span className="font-bold">- ₱{currentPaidAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base text-red-700 font-bold border-t border-gray-200 pt-2">
                            <span>Balance Due</span>
                            <span>₱{totals.balance.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-2">
                        {view === "summary" && (
                            <button 
                                onClick={handleGoToPayment}
                                className="w-full bg-gray-900 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-1"
                            >
                                Proceed to Payment
                            </button>
                        )}

                        {view === "payment" && (
                            <div className="space-y-3">
                                {totals.balance <= 0 ? (
                                    <div className="py-4 bg-green-100 text-green-800 rounded-xl text-center font-bold border border-green-200">
                                        ✓ Full Payment Received
                                    </div>
                                ) : (
                                    <>
                                        {/* Reservation Fee Button */}
                                        {currentPaidAmount < 5000 && (
                                            <button
                                                onClick={() => handlePayment("reservation")}
                                                disabled={processingPayment}
                                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
                                            >
                                                {processingPayment ? "Processing..." : "Pay Reservation Fee (₱5,000)"}
                                            </button>
                                        )}

                                        {/* 50% Downpayment Button */}
                                        {currentPaidAmount < (totals.grandTotal * 0.5) && (
                                            <button
                                                onClick={() => handlePayment("half")}
                                                disabled={processingPayment || currentPaidAmount < 5000}
                                                className={`w-full font-bold py-3.5 rounded-xl transition-all border-2 ${
                                                    currentPaidAmount < 5000 
                                                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                                                    : "bg-white text-gray-900 border-gray-900 hover:bg-gray-50"
                                                }`}
                                            >
                                                {currentPaidAmount < 5000 ? "Pay Reservation First" : "Pay 50% Downpayment"}
                                            </button>
                                        )}

                                        {/* Full Payment Button */}
                                        <button
                                            onClick={() => handlePayment("full")}
                                            disabled={processingPayment || currentPaidAmount < 5000}
                                            className={`w-full font-bold py-3.5 rounded-xl transition-all border-2 ${
                                                currentPaidAmount < 5000
                                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                                : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 shadow-lg"
                                            }`}
                                        >
                                            {currentPaidAmount < 5000 ? "Pay Reservation First" : "Pay Remaining Balance"}
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={() => setView("selection")} 
                                    className="w-full text-center text-xs text-gray-400 mt-4 hover:text-gray-600 uppercase tracking-widest font-bold"
                                >
                                    Change Package Selection
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProposalSelection;