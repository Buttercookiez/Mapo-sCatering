// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import {
//   Loader2,
//   Check,
//   Calendar,
//   Users,
//   ArrowRight,
//   Utensils,
//   Moon,
//   Sun,
//   ChevronDown,
//   Plus,
//   CheckCircle,
//   FileText,
//   Download,
//   User,
//   Info,
//   CreditCard,
//   Lock,
// } from "lucide-react";
// import html2pdf from "html2pdf.js";

// // --- API ---
// import {
//   verifyProposalToken,
//   confirmProposalSelection,
// } from "../../api/bookingService";

// // --- MOCK PAYMENT (Keep as is) ---
// const processPayment = async (type, amount) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({ success: true, amountPaid: amount });
//     }, 1500);
//   });
// };

// // --- PLACEHOLDER IMAGES FOR UI ---
// const PLACEHOLDER_IMAGES = [
//   "https://images.pexels.com/photos/5639947/pexels-photo-5639947.jpeg?auto=compress&cs=tinysrgb&w=600",
//   "https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?auto=compress&cs=tinysrgb&w=600",
//   "https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=600",
// ];

// const ProposalSelection = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();

//   // --- STATE ---
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [proposal, setProposal] = useState(null); // The full data object

//   // UI State
//   const [viewMode, setViewMode] = useState("SELECTION"); // SELECTION | REVIEW | PAYMENT | SUCCESS
//   const [darkMode, setDarkMode] = useState(
//     () => localStorage.getItem("theme") === "dark"
//   );
//   const [selectedPkgIndex, setSelectedPkgIndex] = useState(null); // Use Index for mapping
//   const [selectedAddOns, setSelectedAddOns] = useState([]); // Array of AddOn Objects

//   // Processing State
//   const [isConfirming, setIsConfirming] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [processingPayment, setProcessingPayment] = useState(false);
//   const [currentPaidAmount, setCurrentPaidAmount] = useState(0);

//   const detailsRef = useRef(null);
//   const pdfRef = useRef(null);

//   // --- THEME HANDLER ---
//   useEffect(() => {
//     if (darkMode) {
//       document.documentElement.classList.add("dark");
//       localStorage.setItem("theme", "dark");
//       document.body.style.backgroundColor = "#0c0c0c";
//     } else {
//       document.documentElement.classList.remove("dark");
//       localStorage.setItem("theme", "light");
//       document.body.style.backgroundColor = "#FAFAFA";
//     }
//   }, [darkMode]);

//   // --- 1. FETCH & INIT DATA ---
//   useEffect(() => {
//     const fetchProposal = async () => {
//       setLoading(true);
//       try {
//         const data = await verifyProposalToken(token);
//         setProposal(data);

//         if (data.amountPaid) setCurrentPaidAmount(data.amountPaid);

//         // CASE 1: Already Selected/Confirmed in DB
//         if (data.selectedPackage) {
//           // Find index of the selected package in the options list
//           const idx = data.options.findIndex(
//             (p) => p.name === data.selectedPackage.name
//           );
//           if (idx !== -1) setSelectedPkgIndex(idx);

//           // If they have balance, go to payment, else review
//           if (data.amountPaid > 0) setViewMode("PAYMENT");
//           else setViewMode("REVIEW");
//         }
//         // CASE 2: URL Param (Email Link Click)
//         else {
//           const pkgIndexStr = searchParams.get("pkgIndex");
//           if (pkgIndexStr !== null) {
//             const index = parseInt(pkgIndexStr, 10);
//             if (!isNaN(index) && data.options && data.options[index]) {
//               setSelectedPkgIndex(index);
//               setViewMode("REVIEW"); // Skip selection
//             }
//           }
//         }
//       } catch (err) {
//         setError(
//           err.response?.data?.message || "Proposal not found or expired."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (token) fetchProposal();
//   }, [token, searchParams]);

//   // --- CALCULATIONS ---
//   const getCalculations = () => {
//     if (!proposal || selectedPkgIndex === null)
//       return { grandTotal: 0, balance: 0, packageCost: 0 };

//     const pkg = proposal.options[selectedPkgIndex];
//     const pax = parseInt(proposal.pax) || 0;
//     const packageCost = (pkg.pricePerHead || 0) * pax;

//     // Calculate Addons (Assuming proposal.addOns is list of available addons)
//     // Note: If addOns are pre-selected in DB, we use proposal.addOns directly.
//     // If UI allows toggling, we use selectedAddOns state.
//     // For this merge, we'll assume proposal.addOns are fixed from inquiry,
//     // but I'll add logic to sum them up.
//     const addOnsTotal = (proposal.addOns || []).reduce(
//       (sum, item) => sum + (item.price || 0),
//       0
//     );

//     const grandTotal = packageCost + addOnsTotal;
//     const balance = grandTotal - currentPaidAmount;

//     // Payment Terms
//     const reservationFee = 5000;
//     const downPayment = grandTotal * 0.5;

//     return {
//       pax,
//       pkg,
//       packageCost,
//       addOnsTotal,
//       grandTotal,
//       balance,
//       reservationFee,
//       downPayment,
//     };
//   };

//   const totals = getCalculations();

//   // --- HANDLERS ---
//   const handleSelectPackage = (index) => {
//     setSelectedPkgIndex(index);
//     setTimeout(() => {
//       detailsRef.current?.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });
//     }, 100);
//   };

//   const handleProceedToReview = () => {
//     if (selectedPkgIndex === null) return alert("Please select a package.");
//     setViewMode("REVIEW");
//     window.scrollTo(0, 0);
//   };

//   const handleDownloadPDF = () => {
//     setIsDownloading(true);
//     const element = pdfRef.current;
//     const opt = {
//       margin: [10, 10],
//       filename: `Proposal_${proposal.refId}.pdf`,
//       image: { type: "jpeg", quality: 0.98 },
//       html2canvas: { scale: 2 },
//       jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//     };
//     html2pdf()
//       .set(opt)
//       .from(element)
//       .save()
//       .then(() => setIsDownloading(false));
//   };

//   const handleConfirmAndPay = async () => {
//     setIsConfirming(true);
//     try {
//       // Save selection to DB
//       await confirmProposalSelection({
//         token,
//         selectedPackage: totals.pkg,
//       });
//       setViewMode("PAYMENT");
//       window.scrollTo(0, 0);
//     } catch (err) {
//       alert("Failed to confirm proposal. Please try again.");
//     } finally {
//       setIsConfirming(false);
//     }
//   };

//   const handlePayment = async (type) => {
//     setProcessingPayment(true);
//     let amount = 0;

//     if (type === "reservation") amount = 5000;
//     else if (type === "half") amount = totals.downPayment - currentPaidAmount;
//     else if (type === "full") amount = totals.balance;

//     try {
//       await processPayment(type, amount);
//       setCurrentPaidAmount((prev) => prev + amount);
//       // Optional: If paid fully, move to success?
//       // For now stay on payment screen with updated balance
//     } catch (err) {
//       alert("Payment failed.");
//     } finally {
//       setProcessingPayment(false);
//     }
//   };

//   // --- RENDER HELPERS ---
//   const theme = {
//     bg: darkMode ? "bg-[#0c0c0c]" : "bg-stone-50",
//     cardBg: darkMode ? "bg-[#1c1c1c]" : "bg-white",
//     text: darkMode ? "text-stone-200" : "text-stone-900",
//     subText: darkMode ? "text-stone-400" : "text-stone-500",
//     border: darkMode ? "border-stone-800" : "border-stone-200",
//     headerBg: "bg-[#111]",
//     highlightRing: "ring-[#C9A25D]",
//   };

//   if (loading)
//     return (
//       <div
//         className={`min-h-screen flex flex-col items-center justify-center ${theme.bg}`}
//       >
//         <Loader2 className="animate-spin text-[#C9A25D] mb-4" size={40} />
//         <p className={theme.subText}>Loading Proposal...</p>
//       </div>
//     );
//   if (error)
//     return (
//       <div
//         className={`min-h-screen flex items-center justify-center ${theme.bg} text-red-500`}
//       >
//         {error}
//       </div>
//     );

//   // =========================================================
//   // VIEW: REVIEW & PAYMENT (Combined Logic)
//   // =========================================================
//   if (viewMode === "REVIEW" || viewMode === "PAYMENT") {
//     return (
//       <div className={`min-h-screen ${theme.bg} font-sans py-16 px-4 md:px-8`}>
//         {/* Main Receipt Container */}
//         <div
//           ref={pdfRef}
//           className={`max-w-4xl mx-auto ${theme.cardBg} shadow-2xl border ${theme.border} rounded-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500`}
//         >
//           {/* Receipt Header */}
//           <div className="bg-[#111] p-10 text-center relative border-b border-[#C9A25D]">
//             <h2 className="text-[#C9A25D] text-3xl font-serif tracking-[0.2em] uppercase mb-2">
//               {viewMode === "PAYMENT"
//                 ? "Booking Confirmation"
//                 : "Quotation Preview"}
//             </h2>
//             <p className="text-stone-500 text-xs uppercase tracking-widest">
//               Reference ID: {proposal.refId}
//             </p>
//             {/* Status Badge */}
//             <div className="absolute top-6 right-6 px-3 py-1 border border-[#C9A25D] text-[#C9A25D] text-[10px] uppercase tracking-widest font-bold rounded-full">
//               {viewMode === "PAYMENT" ? "Confirmed" : "Draft"}
//             </div>
//           </div>

//           <div className="p-10 space-y-12">
//             {/* 1. Client Details */}
//             <div className="border-b border-dashed border-stone-300 dark:border-stone-700 pb-8">
//               <h3
//                 className={`text-sm uppercase tracking-widest font-bold mb-6 flex items-center gap-2 ${theme.text}`}
//               >
//                 <User size={16} /> 1. Event Information
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
//                 <div className="space-y-1">
//                   <p className={`text-[10px] uppercase text-stone-500`}>
//                     Client
//                   </p>
//                   <p className={`font-serif text-lg ${theme.text}`}>
//                     {proposal.clientName}
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className={`text-[10px] uppercase text-stone-500`}>
//                     Email
//                   </p>
//                   <p className={`font-medium text-sm ${theme.text}`}>
//                     {proposal.clientEmail}
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className={`text-[10px] uppercase text-stone-500`}>
//                     Event Date
//                   </p>
//                   <p className={`font-medium text-sm ${theme.text}`}>
//                     {proposal.eventDate} | {proposal.startTime} -{" "}
//                     {proposal.endTime}
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className={`text-[10px] uppercase text-stone-500`}>
//                     Venue
//                   </p>
//                   <p className={`font-medium text-sm ${theme.text}`}>
//                     {proposal.venue}
//                   </p>
//                   <p className={`font-serif text-lg text-[#C9A25D]`}>
//                     {totals.pax} Guests
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* 2. Package Details */}
//             <div className="border-b border-dashed border-stone-300 dark:border-stone-700 pb-8">
//               <h3
//                 className={`text-sm uppercase tracking-widest font-bold mb-6 flex items-center gap-2 ${theme.text}`}
//               >
//                 <Utensils size={16} /> 2. Selected Package
//               </h3>
//               <div
//                 className={`p-6 border ${theme.border} rounded-sm mb-6 ${
//                   darkMode ? "bg-white/5" : "bg-stone-50"
//                 }`}
//               >
//                 <div className="flex justify-between items-start mb-4">
//                   <h4 className={`font-serif text-2xl ${theme.text}`}>
//                     {totals.pkg.name}
//                   </h4>
//                   <span className="font-mono font-bold text-lg text-[#C9A25D]">
//                     ₱{totals.pkg.pricePerHead.toLocaleString()} / head
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-[10px] uppercase font-bold text-stone-500 mb-3">
//                     Inclusions:
//                   </p>
//                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                     {totals.pkg.inclusions.map((feat, idx) => (
//                       <li
//                         key={idx}
//                         className={`flex items-start gap-2 text-sm ${theme.subText}`}
//                       >
//                         <Check size={14} className="mt-1 text-green-500" />{" "}
//                         {feat}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             {/* 3. Financials */}
//             <div className="border-b border-dashed border-stone-300 dark:border-stone-700 pb-8">
//               <h3
//                 className={`text-sm uppercase tracking-widest font-bold mb-6 flex items-center gap-2 ${theme.text}`}
//               >
//                 <FileText size={16} /> 3. Cost Breakdown
//               </h3>
//               <table className="w-full text-sm">
//                 <thead
//                   className={`border-b ${theme.border} text-[10px] uppercase text-stone-500`}
//                 >
//                   <tr>
//                     <th className="text-left py-2">Item</th>
//                     <th className="text-right py-2">Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody className={`${theme.text}`}>
//                   <tr>
//                     <td className="py-3">
//                       Package (₱{totals.pkg.pricePerHead} × {totals.pax} pax)
//                     </td>
//                     <td className="text-right py-3">
//                       ₱ {totals.packageCost.toLocaleString()}
//                     </td>
//                   </tr>
//                   {/* Add-ons loop */}
//                   {proposal.addOns &&
//                     proposal.addOns.map((add, i) => (
//                       <tr key={i}>
//                         <td className="py-3 text-stone-500">
//                           + {add.name || "Add-on"}
//                         </td>
//                         <td className="text-right py-3 text-stone-500">
//                           ₱ {(add.price || 0).toLocaleString()}
//                         </td>
//                       </tr>
//                     ))}
//                   <tr
//                     className={`border-t-2 border-[#C9A25D] font-bold text-lg`}
//                   >
//                     <td className="py-4">TOTAL AMOUNT</td>
//                     <td className="text-right py-4 text-[#C9A25D]">
//                       ₱ {totals.grandTotal.toLocaleString()}
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             {/* 4. Payment Status Section (Only for PAYMENT view) */}
//             {viewMode === "PAYMENT" && (
//               <div className="border-b border-dashed border-stone-300 dark:border-stone-700 pb-8 animate-in fade-in">
//                 <h3
//                   className={`text-sm uppercase tracking-widest font-bold mb-6 flex items-center gap-2 ${theme.text}`}
//                 >
//                   <CreditCard size={16} /> 4. Payment Status
//                 </h3>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* Status Card */}
//                   <div
//                     className={`p-6 rounded border ${
//                       totals.balance <= 0
//                         ? "border-green-500 bg-green-500/10"
//                         : "border-amber-500 bg-amber-500/10"
//                     }`}
//                   >
//                     <p className="text-xs uppercase tracking-widest font-bold mb-2">
//                       Total Paid
//                     </p>
//                     <p
//                       className={`text-3xl font-serif font-bold ${
//                         totals.balance <= 0
//                           ? "text-green-600"
//                           : "text-amber-600"
//                       }`}
//                     >
//                       ₱ {currentPaidAmount.toLocaleString()}
//                     </p>
//                     <p className="text-xs mt-2 opacity-70">
//                       {totals.balance <= 0
//                         ? "Fully Paid"
//                         : `Balance: ₱ ${totals.balance.toLocaleString()}`}
//                     </p>
//                   </div>

//                   {/* Payment Actions */}
//                   <div className="space-y-3">
//                     {totals.balance <= 0 ? (
//                       <div className="h-full flex flex-col items-center justify-center text-green-600">
//                         <CheckCircle size={40} className="mb-2" />
//                         <span className="font-bold">Payment Complete</span>
//                       </div>
//                     ) : (
//                       <>
//                         <p
//                           className={`text-xs uppercase tracking-widest font-bold ${theme.text} mb-1`}
//                         >
//                           Select Payment Option:
//                         </p>

//                         {/* Reservation Fee */}
//                         {currentPaidAmount < 5000 && (
//                           <button
//                             onClick={() => handlePayment("reservation")}
//                             disabled={processingPayment}
//                             className="w-full py-3 px-4 bg-[#C9A25D] hover:bg-[#b08d55] text-white font-bold text-sm uppercase rounded shadow-sm disabled:opacity-50"
//                           >
//                             {processingPayment
//                               ? "Processing..."
//                               : `Pay Reservation Fee (₱5,000)`}
//                           </button>
//                         )}

//                         {/* 50% Downpayment */}
//                         {currentPaidAmount < totals.downPayment && (
//                           <button
//                             onClick={() => handlePayment("half")}
//                             disabled={
//                               processingPayment || currentPaidAmount < 5000
//                             }
//                             className={`w-full py-3 px-4 border text-sm font-bold uppercase rounded ${
//                               currentPaidAmount < 5000
//                                 ? "border-stone-200 text-stone-300"
//                                 : `border-[#C9A25D] text-[#C9A25D] hover:bg-[#C9A25D] hover:text-white`
//                             }`}
//                           >
//                             {currentPaidAmount < 5000
//                               ? "Pay Reservation First"
//                               : "Pay 50% Downpayment"}
//                           </button>
//                         )}

//                         {/* Full Balance */}
//                         <button
//                           onClick={() => handlePayment("full")}
//                           disabled={
//                             processingPayment || currentPaidAmount < 5000
//                           }
//                           className={`w-full py-3 px-4 bg-[#111] text-white text-sm font-bold uppercase rounded hover:bg-black disabled:opacity-20`}
//                         >
//                           Pay Full Balance
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Footer Actions */}
//             <div data-html2canvas-ignore="true">
//               {viewMode === "REVIEW" ? (
//                 <div className="flex flex-col md:flex-row gap-4">
//                   <button
//                     onClick={() => setViewMode("SELECTION")}
//                     className={`flex-1 py-4 border ${theme.border} text-stone-500 font-bold uppercase text-xs hover:bg-stone-100 dark:hover:bg-stone-800 rounded-sm`}
//                   >
//                     Back / Edit
//                   </button>
//                   <button
//                     onClick={handleDownloadPDF}
//                     disabled={isDownloading}
//                     className={`flex-1 py-4 border ${theme.border} ${theme.text} font-bold uppercase text-xs hover:bg-stone-100 dark:hover:bg-stone-800 rounded-sm flex items-center justify-center gap-2`}
//                   >
//                     {isDownloading ? (
//                       <Loader2 className="animate-spin" size={16} />
//                     ) : (
//                       <>
//                         <Download size={16} /> PDF
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={handleConfirmAndPay}
//                     disabled={isConfirming}
//                     className="flex-[2] py-4 bg-[#C9A25D] hover:bg-[#b08d55] text-white font-bold uppercase text-xs rounded-sm shadow-xl flex items-center justify-center gap-2"
//                   >
//                     {isConfirming ? (
//                       <Loader2 className="animate-spin" />
//                     ) : (
//                       <>
//                         <CheckCircle size={16} /> Confirm & Proceed to Payment
//                       </>
//                     )}
//                   </button>
//                 </div>
//               ) : (
//                 <div className="text-center pt-6 border-t border-stone-200 dark:border-stone-800">
//                   <p className="text-xs text-stone-500 italic mb-4">
//                     A copy of this receipt has been sent to{" "}
//                     {proposal.clientEmail}
//                   </p>
//                   <button
//                     onClick={() => window.print()}
//                     className={`text-xs uppercase tracking-widest font-bold underline ${theme.text}`}
//                   >
//                     Print Receipt
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // VIEW: SELECTION (Main Page)
//   // =========================================================
//   return (
//     <div
//       className={`min-h-screen ${theme.bg} font-sans pb-40 transition-colors duration-500`}
//     >
//       <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap'); .font-serif { font-family: 'Cormorant Garamond', serif; } .font-sans { font-family: 'Inter', sans-serif; }`}</style>

//       {/* NAV */}
//       <nav
//         className={`fixed top-0 w-full z-40 px-6 py-4 flex justify-between items-center mix-blend-difference text-white`}
//       >
//         <div className="font-serif text-xl font-bold tracking-widest">
//           MAPOS<span className="text-[#C9A25D]">.</span>
//         </div>
//         <button
//           onClick={() => setDarkMode(!darkMode)}
//           className="p-2 rounded-full hover:bg-white/10 transition-colors"
//         >
//           {darkMode ? (
//             <Sun className="w-5 h-5" />
//           ) : (
//             <Moon className="w-5 h-5" />
//           )}
//         </button>
//       </nav>

//       {/* HEADER */}
//       <header
//         className={`${theme.headerBg} text-white pt-32 pb-20 px-6 text-center relative overflow-hidden`}
//       >
//         <div className="relative z-10 max-w-4xl mx-auto">
//           <span className="text-[#C9A25D] text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold block mb-4">
//             Ref: {proposal.refId}
//           </span>
//           <h1 className="font-serif text-4xl md:text-6xl text-white font-thin mb-6">
//             Your Event <span className="italic">Proposal</span>
//           </h1>
//           <p className="text-stone-400 font-light max-w-xl mx-auto text-sm md:text-base leading-relaxed">
//             Welcome, <strong>{proposal.clientName}</strong>. We are honored to
//             present these curated catering options for your event at{" "}
//             <strong>{proposal.venue}</strong>.
//           </p>
//           <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10 border-t border-stone-800 pt-8">
//             <div className="flex items-center gap-3">
//               <Calendar className="w-5 h-5 text-[#C9A25D]" />
//               <div className="text-left">
//                 <span className="block text-[10px] uppercase tracking-wider text-stone-500">
//                   Date
//                 </span>
//                 <span className="text-sm font-medium">
//                   {proposal.eventDate}
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <Users className="w-5 h-5 text-[#C9A25D]" />
//               <div className="text-left">
//                 <span className="block text-[10px] uppercase tracking-wider text-stone-500">
//                   Guests
//                 </span>
//                 <span className="text-sm font-medium">{totals.pax} Pax</span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
//       </header>

//       {/* PACKAGE GRID */}
//       <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {proposal.options.map((pkg, idx) => {
//             const isSelected = selectedPkgIndex === idx;
//             // Generate some dummy features if API doesn't return them formatted
//             const features = pkg.inclusions || [
//               "Full Service",
//               "Elegant Styling",
//               "Uniformed Waiters",
//             ];

//             return (
//               <div
//                 key={idx}
//                 onClick={() => handleSelectPackage(idx)}
//                 className={`relative flex flex-col p-8 rounded-sm cursor-pointer transition-all duration-300 group overflow-hidden ${
//                   theme.cardBg
//                 } ${
//                   isSelected
//                     ? `shadow-2xl ring-1 ${theme.highlightRing} -translate-y-2`
//                     : `shadow-lg border ${theme.border} hover:border-[#C9A25D]/50 hover:-translate-y-1`
//                 }`}
//               >
//                 {idx === 1 && (
//                   <div className="absolute top-0 right-0">
//                     <div className="bg-[#C9A25D] text-white text-[9px] uppercase font-bold px-3 py-1 tracking-widest">
//                       Recommended
//                     </div>
//                   </div>
//                 )}

//                 <div className="mb-6">
//                   <h3 className={`font-serif text-3xl mb-2 ${theme.text}`}>
//                     {pkg.name}
//                   </h3>
//                 </div>

//                 <div className={`mb-8 pb-8 border-b ${theme.border}`}>
//                   <div className="flex items-baseline gap-1">
//                     <span className="text-sm text-stone-500">₱</span>
//                     <span className={`text-4xl font-light ${theme.text}`}>
//                       {pkg.pricePerHead.toLocaleString()}
//                     </span>
//                     <span className="text-xs text-stone-500 uppercase tracking-wide">
//                       / head
//                     </span>
//                   </div>
//                 </div>

//                 <ul className="space-y-4 mb-8 flex-grow">
//                   {features.slice(0, 5).map((feat, i) => (
//                     <li
//                       key={i}
//                       className={`flex items-start gap-3 text-sm ${
//                         darkMode ? "text-stone-400" : "text-stone-600"
//                       }`}
//                     >
//                       <Check
//                         className={`w-4 h-4 mt-0.5 ${
//                           isSelected ? "text-[#C9A25D]" : "text-stone-300"
//                         }`}
//                       />
//                       <span className="font-light">{feat}</span>
//                     </li>
//                   ))}
//                 </ul>

//                 <div
//                   className={`mt-auto w-full py-3 text-center text-xs uppercase tracking-[0.2em] font-bold border transition-colors duration-300 ${
//                     isSelected
//                       ? "bg-[#C9A25D] text-white border-[#C9A25D]"
//                       : `${
//                           darkMode
//                             ? "border-stone-700 text-stone-400"
//                             : "border-stone-200 text-stone-400"
//                         } group-hover:border-[#C9A25D] group-hover:text-[#C9A25D]`
//                   }`}
//                 >
//                   {isSelected ? "Selected" : "Select Package"}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* DETAILS SCROLL SECTION */}
//       <div
//         ref={detailsRef}
//         className="max-w-6xl mx-auto px-6 mt-24 scroll-mt-24"
//       >
//         {selectedPkgIndex !== null && (
//           <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
//             <div className="text-center mb-16">
//               <span className="text-[#C9A25D] text-[10px] uppercase tracking-[0.3em] font-bold block mb-4">
//                 Package Details
//               </span>
//               <h2
//                 className={`font-serif text-4xl md:text-5xl ${theme.text} mb-4`}
//               >
//                 {totals.pkg.name}
//               </h2>
//               <div className="w-16 h-[1px] bg-[#C9A25D] mx-auto"></div>
//               <div className="mt-4 animate-bounce">
//                 <ChevronDown className="w-5 h-5 mx-auto text-stone-400" />
//               </div>
//             </div>

//             {/* Note: If your API returns specific menu items, map them here. 
//                   Since 'inclusions' is a simple array in previous code, 
//                   we'll display them in a grid styling. */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               <div className={`p-8 border ${theme.border} rounded`}>
//                 <h3 className={`font-serif text-2xl ${theme.text} mb-6`}>
//                   What's Included
//                 </h3>
//                 <ul className="space-y-3">
//                   {totals.pkg.inclusions.map((inc, i) => (
//                     <li
//                       key={i}
//                       className={`flex items-start gap-3 text-sm ${theme.subText}`}
//                     >
//                       <div className="w-1.5 h-1.5 rounded-full bg-[#C9A25D] mt-2"></div>
//                       {inc}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Placeholder Visuals since API might not have images yet */}
//               <div className="grid grid-cols-2 gap-4">
//                 <img
//                   src={PLACEHOLDER_IMAGES[0]}
//                   alt="Food"
//                   className="w-full h-48 object-cover rounded opacity-80"
//                 />
//                 <img
//                   src={PLACEHOLDER_IMAGES[1]}
//                   alt="Setup"
//                   className="w-full h-48 object-cover rounded opacity-80"
//                 />
//                 <img
//                   src={PLACEHOLDER_IMAGES[2]}
//                   alt="Detail"
//                   className="w-full h-48 object-cover rounded col-span-2 opacity-80"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* BOTTOM ACTION BAR */}
//       <div
//         className={`fixed bottom-0 left-0 w-full border-t transition-transform duration-500 z-50 ${
//           darkMode ? "bg-[#111] border-stone-800" : "bg-white border-stone-200"
//         } ${selectedPkgIndex !== null ? "translate-y-0" : "translate-y-full"}`}
//       >
//         <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
//           <div className="flex items-center gap-6">
//             <div
//               className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center text-[#C9A25D] ${
//                 darkMode ? "bg-white/5" : "bg-[#C9A25D]/10"
//               }`}
//             >
//               <Utensils className="w-5 h-5" />
//             </div>
//             <div>
//               <span className="text-[10px] uppercase tracking-widest text-stone-500 block mb-1">
//                 Current Selection
//               </span>
//               <h4 className={`font-serif text-2xl leading-none ${theme.text}`}>
//                 {totals.pkg?.name}
//               </h4>
//             </div>
//           </div>

//           <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
//             <div className="text-right">
//               <span className="text-[10px] uppercase tracking-widest text-stone-500 block mb-1">
//                 Estimated Total
//               </span>
//               <span className="text-xl md:text-3xl font-light text-[#C9A25D]">
//                 ₱ {totals.grandTotal.toLocaleString()}
//               </span>
//             </div>
//             <button
//               onClick={handleProceedToReview}
//               className={`px-8 py-4 text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 flex items-center gap-2 ${
//                 darkMode
//                   ? "bg-stone-200 text-stone-900 hover:bg-[#C9A25D] hover:text-white"
//                   : "bg-[#0c0c0c] text-white hover:bg-[#C9A25D]"
//               }`}
//             >
//               Proceed to Review <ArrowRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProposalSelection;
