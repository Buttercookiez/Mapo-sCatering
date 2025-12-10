import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Check,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Utensils,
  Grid,
  Music,
  Info,
  ArrowLeft,
  MessageSquare,
  User,
  Mail,
  Tag,
  UtensilsCrossed,
  MailCheck,
  Star,
  Edit3,
  X,
  FileCheck,
  PartyPopper,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import {
  verifyProposalToken,
  confirmProposalSelection,
} from "../../api/bookingService";

// --- FIREBASE IMPORTS FOR REALTIME UPDATES ---
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

import { useAddons } from "../../hooks/useAddons";

const CATEGORIES = [
  { id: "All", label: "All", icon: Grid },
  { id: "Food", label: "Food Add-ons", icon: Utensils },
  { id: "Service", label: "Services", icon: Music },
];

const ProposalSelection = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  // --- REALTIME DATA HOOK ---
  const { addons: inventoryData, loading: addonsLoading } = useAddons();

  // --- STATE ---
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [bookingStatus, setBookingStatus] = useState("Pending");

  // Package & Selection
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customSelections, setCustomSelections] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Payment & Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const invoiceRef = useRef(null);

  const [paymentForm, setPaymentForm] = useState({
    accountName: "",
    accountNumber: "",
    refNumber: "",
    notes: "",
    proofFile: null,
  });

  // --- 1. INITIALIZE & READ URL PARAM ---
  useEffect(() => {
    const init = async () => {
      try {
        const data = await verifyProposalToken(token);
        setProposal(data);

        // Set initial status
        if (data.currentStatus) {
          setBookingStatus(data.currentStatus);
        }

        if (data.clientNotes) {
          setPaymentForm((prev) => ({ ...prev, notes: data.clientNotes }));
        }

        const indexParam = searchParams.get("pkgIndex");
        if (indexParam !== null && !isNaN(indexParam)) {
          const idx = parseInt(indexParam);
          if (idx >= 0 && idx < data.options.length) {
            setSelectedPkgIndex(idx);
          }
        } else if (data.selectedPackage) {
          const idx = data.options.findIndex(
            (p) => p.name === data.selectedPackage.name
          );
          setSelectedPkgIndex(idx !== -1 ? idx : 0);
        }
      } catch (err) {
        console.error(err);
        setError("This proposal link is invalid or has expired.");
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [token, searchParams]);

  // --- 2. NEW: REAL-TIME STATUS LISTENER ---
  // This listens for changes in Firestore. When Admin clicks "Verify", this updates instantly.
  useEffect(() => {
    if (!proposal?.refId) return;

    // Query the 'bookings' collection where bookingId matches the proposal refId
    const q = query(
      collection(db, "bookings"),
      where("bookingId", "==", proposal.refId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        // Update local status automatically
        if (docData.bookingStatus) {
          setBookingStatus(docData.bookingStatus);
        }
      }
    });

    return () => unsubscribe();
  }, [proposal?.refId]);

  // --- LOGIC FLAGS ---
  const showPaymentForm = [
    "Pending",
    "Accepted",
    "Proposal Sent",
    "Sent",
    "Open",
  ].includes(bookingStatus);
  const isVerifying = [
    "Verifying",
    "For Verification",
    "Payment Submitted",
  ].includes(bookingStatus);
  const isReserved = ["Reserved", "Confirmed", "Paid", "Booked"].includes(
    bookingStatus
  );

  // --- HANDLERS ---
  const toggleItem = (item) => {
    if (isVerifying || isReserved) return;

    const exists = customSelections.find((i) => i.id === item.id);
    if (exists) {
      setCustomSelections(customSelections.filter((i) => i.id !== item.id));
    } else {
      setCustomSelections([...customSelections, item]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 1. Account Number: Numbers only, max 11 digits
    if (name === "accountNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 11) {
        setPaymentForm((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    // 2. Ref Number: Numbers only (no specific length limit enforced unless you need one)
    if (name === "refNumber") {
      const numericValue = value.replace(/\D/g, "");
      setPaymentForm((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    // 3. All other text fields
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreSubmitValidation = () => {
    // Check if empty fields exist
    if (
      !paymentForm.accountName ||
      !paymentForm.refNumber ||
      !paymentForm.accountNumber
    ) {
      return alert(
        "Please fill in all payment details (Sender Name, Account Number & Reference Number)."
      );
    }

    // specific validation for 11 digits
    if (paymentForm.accountNumber.length !== 11) {
      return alert("Account Number must be exactly 11 digits.");
    }

    setShowTermsModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const currentTotals = getTotals();

      const payload = {
        token,
        selectedPackage: proposal.options[selectedPkgIndex],
        selectedAddOns: customSelections.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category,
          id: item.id,
        })),
        clientNotes: paymentForm.notes,
        paymentDetails: {
          amount: 5000,
          totalEventCost: currentTotals.grandTotal,
          accountName: paymentForm.accountName,
          accountNumber: paymentForm.accountNumber,
          refNumber: paymentForm.refNumber,
          timestamp: new Date().toISOString(),
        },
      };

      await confirmProposalSelection(payload);
      setBookingStatus("Verifying");
      setShowTermsModal(false);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CALCULATIONS ---
  const getTotals = () => {
    if (!proposal || !proposal.options) return null;
    const pkg = proposal.options[selectedPkgIndex];
    const pax = parseInt(proposal.pax) || 0;
    const pricePerHead = parseInt(pkg.pricePerHead) || 0;
    const packageTotal = pricePerHead * pax;
    const addOnsTotal = customSelections.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0
    );
    const grandTotal = packageTotal + addOnsTotal;
    const downpayment = 5000;
    const remaining = grandTotal - downpayment;
    return {
      pkg,
      packageTotal,
      addOnsTotal,
      grandTotal,
      downpayment,
      remaining,
    };
  };

  const filteredItems = inventoryData.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (pageLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-[#C9A25D] w-10 h-10" />
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 text-red-500 font-bold">
        {error}
      </div>
    );

  const totals = getTotals();

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans text-stone-800 overflow-hidden">
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleFinalSubmit}
        isSubmitting={isSubmitting}
        darkMode={false}
      />

      {/* --- TOP NAV --- */}
      <div className="bg-[#1c1c1c] text-white py-0 px-6 flex justify-between items-center z-50 shadow-md shrink-0 h-16 border-b border-[#333]">
        <div className="flex items-center gap-4">
          <div className="font-serif text-xl tracking-widest font-bold flex items-center gap-1">
            MAPOS<span className="text-[#C9A25D]">.</span>
          </div>
          {showPaymentForm && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#333] rounded-full border border-stone-700 ml-4">
              <span className="text-[10px] uppercase text-stone-400">
                Selected Package:
              </span>
              <span className="text-xs font-bold text-[#C9A25D] uppercase tracking-wider">
                {totals.pkg.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT SIDEBAR (Add-ons) */}
        {/* Hide sidebar if Reserved or Verifying to prevent changes */}
        {!isVerifying && !isReserved && (
          <aside className="w-[320px] bg-white border-r border-stone-200 flex flex-col shrink-0 z-40 relative">
            <div className="p-5 bg-stone-50 border-b border-stone-200 overflow-y-auto max-h-[35%]">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-[#C9A25D]" />
                <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wide">
                  Included in {totals.pkg.name}
                </h4>
              </div>
              <ul className="space-y-2">
                {totals.pkg.inclusions.map((inc, i) => (
                  <li
                    key={i}
                    className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 shrink-0"></div>
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-b border-stone-100 bg-white shadow-sm z-10">
              <h3 className="font-serif text-md text-stone-900 mb-3">
                Add Extras & Upgrades
              </h3>
              <div className="relative mb-3">
                <Search
                  className="absolute left-2.5 top-2.5 text-stone-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded focus:border-[#C9A25D] outline-none"
                />
              </div>
              <div className="flex gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                      activeCategory === cat.id
                        ? "bg-stone-800 text-white border-stone-800"
                        : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto p-3 space-y-2 bg-white flex-1">
              {addonsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-stone-300" size={24} />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-4 text-xs text-stone-400">
                  No items found.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = customSelections.find(
                    (i) => i.id === item.id
                  );
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`p-3 rounded border cursor-pointer transition-all hover:shadow-sm flex justify-between items-start relative
                                            ${
                                              isSelected
                                                ? "bg-[#C9A25D]/5 border-[#C9A25D]"
                                                : "bg-white border-stone-100 hover:border-stone-300"
                                            }
                                            ${
                                              !showPaymentForm
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }
                                            `}
                    >
                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isSelected ? "text-[#C9A25D]" : "text-stone-800"
                          }`}
                        >
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <div
                        className={`mt-0.5 ml-2 p-1 rounded-full ${
                          isSelected
                            ? "bg-[#C9A25D] text-white"
                            : "bg-stone-100 text-stone-300"
                        }`}
                      >
                        {isSelected ? <Check size={10} /> : <Plus size={10} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* HOVER PREVIEW CARD */}
        {hoveredItem && showPaymentForm && (
          <div className="fixed left-[340px] top-40 z-50 w-64 bg-white p-3 rounded-lg shadow-2xl border border-stone-200 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full h-32 bg-stone-100 rounded-md mb-3 overflow-hidden">
              <img
                src={hoveredItem.image}
                alt={hoveredItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=No+Image";
                }}
              />
            </div>
            <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1">
              {hoveredItem.name}
            </h4>
            <p className="text-[#C9A25D] font-bold text-sm">
              {hoveredItem.price > 0
                ? `+ ₱${Number(hoveredItem.price).toLocaleString()}`
                : "Included"}
            </p>
          </div>
        )}

        {/* RIGHT MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f5f5f4]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: INVOICE */}
            <div className="lg:col-span-7">
              <div
                ref={invoiceRef}
                className="bg-white p-8 rounded-sm shadow-sm border border-stone-200 flex flex-col min-h-[600px]"
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-stone-100 pb-6 mb-6">
                  <div>
                    <h2 className="font-serif text-3xl text-stone-900 mb-2">
                      Event Proposal
                    </h2>
                    <p className="text-xs uppercase tracking-wider text-stone-500">
                      Ref: {proposal.refId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-[#C9A25D]/10 text-[#C9A25D] px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                      {totals.pkg.name} Package
                    </div>
                  </div>
                </div>
                {/* Client Info */}
                <div className="mb-6 pb-6 border-b border-stone-100">
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider flex items-center gap-1">
                      Prepared For
                    </p>
                    <div>
                      <span className="font-serif text-xl text-stone-900 flex items-center gap-2">
                        <User size={16} className="text-[#C9A25D]" />{" "}
                        {proposal.clientName || "Client"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-stone-50 p-4 rounded border border-stone-100 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#C9A25D]" />{" "}
                    <span className="font-bold text-stone-800">
                      {proposal.eventDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#C9A25D]" />{" "}
                    <span>
                      {proposal.startTime} - {proposal.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-[#C9A25D]" />
                    <span>{proposal.eventType}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 col-span-2 border-t border-stone-200">
                    <MapPin size={14} className="text-[#C9A25D]" />{" "}
                    <span>{proposal.venue}</span>
                  </div>
                </div>
                {/* Base Cost */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm text-stone-800">
                      {totals.pkg.name} Base Cost
                    </h3>
                    <p className="font-mono text-stone-800">
                      ₱ {totals.packageTotal.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-wide">
                    ₱{totals.pkg.pricePerHead.toLocaleString()} x{" "}
                    {parseInt(proposal.pax) || 0} Guests
                  </p>
                </div>
                {/* Selected Add-ons */}
                <div>
                  {customSelections.length > 0 && (
                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <p className="text-[10px] font-bold uppercase text-stone-400 mb-3">
                        Add-ons & Upgrades
                      </p>
                      <div className="space-y-2">
                        {customSelections.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs group hover:bg-stone-50 p-1 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {showPaymentForm && (
                                <button
                                  onClick={() => toggleItem(item)}
                                  className="text-stone-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <span className="text-stone-700">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono text-stone-600">
                              {item.price > 0
                                ? `₱ ${Number(item.price).toLocaleString()}`
                                : "Free"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* NOTES SECTION */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <UtensilsCrossed size={14} className="text-[#C9A25D]" />
                    <h3 className="text-xs font-bold uppercase text-stone-500 tracking-wider">
                      Dietary Restrictions & Requests
                    </h3>
                  </div>
                  {showPaymentForm ? (
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-200 rounded p-3 text-xs focus:border-[#C9A25D] outline-none resize-none placeholder:text-stone-400"
                      placeholder="E.g., No pork, allergies to seafood, request for high chairs..."
                    />
                  ) : (
                    <div className="p-3 bg-stone-50 border border-stone-100 rounded text-xs text-stone-600 italic">
                      {paymentForm.notes ||
                        "No specific restrictions or notes indicated."}
                    </div>
                  )}
                </div>
                {/* Total Calculation */}
                <div className="mt-auto space-y-3 pt-6 border-t-2 border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-xl font-bold">
                      Grand Total
                    </span>
                    <span className="font-serif text-2xl text-stone-900 font-bold">
                      ₱ {totals.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-[#C9A25D]">
                    <span className="font-bold uppercase text-xs">
                      Reservation Fee
                    </span>
                    <span className="font-bold">
                      - ₱ {totals.downpayment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <span className="font-serif text-lg text-stone-400">
                      Balance Due
                    </span>
                    <span className="font-serif text-xl text-stone-400">
                      ₱ {totals.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: PAYMENT & STATUS */}
            <div className="lg:col-span-5">
              <div className="sticky top-4 bg-white rounded-sm shadow-lg border border-stone-200 overflow-hidden transition-all duration-300">
                {/* A. HEADER BAR */}
                <div className="bg-[#1c1c1c] p-6 text-white text-center">
                  {showPaymentForm ? (
                    <>
                      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
                        To Secure This Date
                      </p>
                      <h2 className="text-3xl font-serif text-[#C9A25D]">
                        ₱ 5,000.00
                      </h2>
                    </>
                  ) : isVerifying ? (
                    <h2 className="text-xl font-serif text-[#C9A25D] tracking-wider">
                      VERIFICATION PENDING
                    </h2>
                  ) : (
                    // THIS HEADER UPDATES AUTOMATICALLY
                    <h2 className="text-xl font-serif text-[#C9A25D] tracking-wider flex items-center justify-center gap-2">
                      <Star size={20} fill="#C9A25D" /> BOOKING CONFIRMED
                    </h2>
                  )}
                </div>

                {/* B. FORM STATE */}
                {showPaymentForm && (
                  <div className="p-6">
                    <div className="bg-stone-50 rounded border border-stone-200 p-6 text-center mb-6">
                      <p className="text-[10px] font-bold uppercase text-stone-400 mb-4 tracking-[0.2em]">
                        Scan to Pay
                      </p>
                      <div className="bg-white p-2 rounded shadow-sm border border-stone-100 inline-block w-full max-w-[280px] mx-auto">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=PAY-MAPOS-${proposal?.refId}`}
                          alt="Scan"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                      <div className="mt-5 pt-4 border-t border-stone-200">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-widest text-stone-400">
                            GCash / Bank Transfer
                          </span>
                          <span className="font-serif text-lg text-stone-900 font-bold">
                            MAPOS CATERING
                          </span>
                          <span className="font-mono text-md text-[#C9A25D] font-bold">
                            0917-123-4567
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase text-stone-400 mb-1 tracking-wider">
                        Enter Your Payment Details:
                      </div>
                      <input
                        name="accountName"
                        value={paymentForm.accountName}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Sender Name"
                        className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none"
                      />
                      <input
                        name="accountNumber"
                        value={paymentForm.accountNumber}
                        onChange={handleInputChange}
                        type="text"
                        inputMode="numeric" // Opens number pad on mobile
                        maxLength={11}
                        placeholder="Sender Account Number"
                        className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none"
                      />

                      {/* --- Reference Number Input --- */}
                      <input
                        name="refNumber"
                        value={paymentForm.refNumber}
                        onChange={handleInputChange}
                        type="text"
                        inputMode="numeric" // Opens number pad on mobile
                        placeholder="Transaction Ref No."
                        className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none"
                      />

                      <button
                        onClick={handlePreSubmitValidation}
                        disabled={isSubmitting}
                        className="w-full bg-[#C9A25D] hover:bg-[#b08d55] text-white py-4 font-bold uppercase text-xs tracking-[0.15em] rounded shadow-lg mt-4 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Processing..." : "Confirm & Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* C. VERIFYING STATE */}
                {isVerifying && (
                  <div className="p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-[#C9A25D]/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <FileCheck size={40} className="text-[#C9A25D]" />
                    </div>
                    <h3 className="font-serif text-2xl text-stone-900 mb-3">
                      Verification in Progress
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-xs">
                      Thank you! We have received your payment details. Please
                      wait while our admin verifies your transaction. You will
                      receive a notification once approved.
                    </p>
                    <div className="w-full bg-stone-50 border border-stone-100 p-4 rounded text-xs text-stone-400 uppercase tracking-widest flex justify-between items-center">
                      <span>Current Status</span>
                      <span className="text-[#C9A25D] font-bold flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A25D] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A25D]"></span>
                        </span>
                        Awaiting Approval
                      </span>
                    </div>
                  </div>
                )}

                {/* D. RESERVED/CONFIRMED STATE - (DISPLAYS AUTOMATICALLY WHEN VERIFIED) */}
                {isReserved && (
                  <div className="p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-100">
                      <PartyPopper size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="font-serif text-2xl text-stone-900 mb-2">
                      Congratulations!
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-xs">
                      Your booking is officially confirmed. We have received
                      your reservation payment.
                    </p>

                    <div className="w-full bg-stone-50 border border-stone-200 p-5 rounded-sm text-left mb-6">
                      <div className="flex justify-between items-center mb-2 border-b border-stone-100 pb-2">
                        <span className="text-xs uppercase text-stone-400 font-bold tracking-wider">
                          Event Date
                        </span>
                        <span className="text-sm font-bold text-stone-800">
                          {proposal.eventDate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase text-stone-400 font-bold tracking-wider">
                          Ref ID
                        </span>
                        <span className="text-sm font-mono text-stone-800">
                          {proposal.refId}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-stone-900 text-white text-xs uppercase tracking-widest font-bold rounded hover:bg-black transition-colors"
                    >
                      Download Receipt / Print
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- TERMS MODAL ---
const TermsModal = ({ isOpen, onClose, onAccept, isSubmitting, darkMode }) => {
  if (!isOpen) return null;
  const theme = {
    bg: darkMode ? "bg-[#111]" : "bg-white",
    text: darkMode ? "text-stone-300" : "text-stone-600",
    heading: darkMode ? "text-stone-100" : "text-stone-900",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    secondaryBg: darkMode ? "bg-stone-900" : "bg-stone-50",
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 font-sans">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div
        className={`relative w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden ${theme.bg} animate-[fadeIn_0.3s_ease-out]`}
      >
        <div
          className={`flex justify-between items-center p-6 border-b ${theme.border}`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#C9A25D]" />
            <h3 className={`font-serif text-2xl ${theme.heading}`}>
              Terms & Conditions
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors ${theme.text}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className={`p-6 max-h-[50vh] overflow-y-auto stop-scroll-propagation text-sm leading-relaxed ${theme.text}`}
        >
          <p className="mb-4">
            <strong>1. Booking Confirmation</strong> A booking is only
            tentatively confirmed upon the receipt of this inquiry. A formal
            contract and a <strong>non-refundable</strong> down payment of
            ₱5,000 are required to secure the date.
          </p>
          <p className="mb-4">
            <strong>2. Payment Terms</strong> The remaining balance is due 14
            days prior to the event date. We accept bank transfers, credit
            cards, and checks.
          </p>
          <p className="mb-4">
            <strong>3. Cancellation Policy</strong> Cancellations made 30 days
            prior to the event are eligible for a 50% refund of the deposit.
            Cancellations made within 30 days are non-refundable.
          </p>
          <p className="mb-4">
            <strong>4. Guest Count</strong> Final guest count must be confirmed
            7 days before the event. We will charge based on the guaranteed
            count or actual attendance, whichever is higher.
          </p>
          <p className="mb-4">
            <strong>5. Damages</strong> The client is responsible for any
            damages to the venue or equipment caused by their guests during the
            event.
          </p>
          <p className="mb-4">
            <strong>6. Force Majeure</strong> We are not liable for failure to
            perform obligations due to events beyond our control (e.g., natural
            disasters, government lockdowns).
          </p>
          <p className="mb-4 text-red-500 font-bold bg-red-50 p-3 rounded border border-red-100">
            IMPORTANT: The Reservation Fee (₱ 5,000.00) is strictly
            non-refundable and non-transferable.
          </p>
          <p className="italic opacity-70">
            By clicking "Accept & Submit", you acknowledge that you have read
            and understood these terms.
          </p>
        </div>
        <div
          className={`p-6 border-t ${theme.border} ${theme.secondaryBg} flex flex-col-reverse md:flex-row gap-4 justify-end`}
        >
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
            className={`px-8 py-3 text-xs uppercase tracking-widest font-bold bg-[#C9A25D] text-white hover:bg-[#b08d4b] transition-all shadow-lg flex justify-center items-center gap-2`}
          >
            {isSubmitting ? "Processing..." : "Accept & Submit Inquiry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalSelection;
