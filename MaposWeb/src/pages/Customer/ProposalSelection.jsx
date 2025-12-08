import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
    Loader2, Check, ShieldCheck, UploadCloud,
    Search, Plus, Trash2, MapPin, Calendar, Clock,
    Utensils, Grid, Music, Info, ArrowLeft
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { verifyProposalToken, confirmProposalSelection } from "../../api/bookingService";

// --- MOCK INVENTORY (ADD-ONS) ---
const INVENTORY = [
    { id: 101, category: "Add-on", name: "Whole Lechon (Cebu)", price: 8500, description: "Serves 30-40 pax", image: "https://images.unsplash.com/photo-1594144379309-847253503b46?q=80&w=400" },
    { id: 102, category: "Add-on", name: "Sushi Platter", price: 2500, description: "50 pcs mixed maki", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400" },
    { id: 103, category: "Service", name: "Mobile Bar", price: 15000, description: "4 hours free flowing", image: "https://images.unsplash.com/photo-1534079824641-7688cb62f4f2?q=80&w=400" },
    { id: 104, category: "Service", name: "Lights & Sounds", price: 5000, description: "Mood upgrade", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400" },
    { id: 105, category: "Add-on", name: "Grazing Table", price: 6000, description: "Cold cuts & cheese", image: "https://images.unsplash.com/photo-1549488352-22668e9e3c35?q=80&w=400" },
    { id: 1, category: "Main Course", name: "Slow Roasted Beef", price: 1200, description: "Extra serving per head", image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=400" },
];

const CATEGORIES = [
    { id: "All", label: "All", icon: Grid },
    { id: "Add-on", label: "Food Add-ons", icon: Utensils },
    { id: "Service", label: "Services", icon: Music },
];

const ProposalSelection = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [proposal, setProposal] = useState(null);
    
    // CRITICAL: This determines which package renders based on the email link
    const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);

    // Filter & Selection State
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [customSelections, setCustomSelections] = useState([]);
    const [hoveredItem, setHoveredItem] = useState(null);

    // Payment & Form State
    const [paymentStep, setPaymentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const invoiceRef = useRef(null);
    const [paymentForm, setPaymentForm] = useState({
        accountName: "",
        accountNumber: "",
        refNumber: "",
        notes: "",
        proofFile: null
    });

    // --- 1. INITIALIZE & READ URL PARAM ---
    useEffect(() => {
        const init = async () => {
            try {
                // Verify Token with Backend
                const data = await verifyProposalToken(token);
                setProposal(data);

                // --- LOGIC: READ PACKAGE INDEX FROM URL ---
                const indexParam = searchParams.get("pkgIndex");

                if (indexParam !== null && !isNaN(indexParam)) {
                    const idx = parseInt(indexParam);
                    // Security Check: Ensure index exists in the options array
                    if (idx >= 0 && idx < data.options.length) {
                        setSelectedPkgIndex(idx);
                    }
                } else if (data.selectedPackage) {
                    // Fallback: If client is revisiting and already confirmed a package
                    const idx = data.options.findIndex(p => p.name === data.selectedPackage.name);
                    setSelectedPkgIndex(idx !== -1 ? idx : 0);
                } 
                // Default remains 0 (Package 1) if no param is found

            } catch (err) {
                console.error(err);
                setError("This proposal link is invalid or has expired.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [token, searchParams]);

    // --- HANDLERS ---
    const toggleItem = (item) => {
        const exists = customSelections.find(i => i.id === item.id);
        if (exists) {
            setCustomSelections(customSelections.filter(i => i.id !== item.id));
        } else {
            setCustomSelections([...customSelections, item]);
        }
    };

    const handleInputChange = (e) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setPaymentForm({ ...paymentForm, proofFile: e.target.files[0] });
    };

    const handleSubmitForVerification = async () => {
        if (!paymentForm.accountName || !paymentForm.refNumber) return alert("Please fill in payment details.");

        setIsSubmitting(true);
        try {
            const payload = {
                token,
                // IMPORTANT: Send the package corresponding to the selected index
                selectedPackage: proposal.options[selectedPkgIndex], 
                selectedAddOns: customSelections,
                clientNotes: paymentForm.notes,
                paymentDetails: {
                    amount: 5000,
                    accountName: paymentForm.accountName,
                    accountNumber: paymentForm.accountNumber,
                    refNumber: paymentForm.refNumber,
                    timestamp: new Date().toISOString()
                }
            };
            await confirmProposalSelection(payload);
            setPaymentStep(3);
        } catch (err) {
            alert("Submission failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadPDF = () => {
        const element = invoiceRef.current;
        const opt = { 
            margin: 10, 
            filename: `Invoice_${proposal.refId}.pdf`, 
            image: { type: 'jpeg', quality: 0.98 }, 
            html2canvas: { scale: 2 }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };
        html2pdf().set(opt).from(element).save();
    };

    // --- CALCULATIONS ---
    const getTotals = () => {
        if (!proposal || !proposal.options) return null;

        // Get the specific package object based on the URL index
        const pkg = proposal.options[selectedPkgIndex]; 
        
        const pax = parseInt(proposal.pax) || 0;
        const pricePerHead = parseInt(pkg.pricePerHead) || 0;

        const packageTotal = (pricePerHead * pax);
        const addOnsTotal = customSelections.reduce((sum, item) => sum + (item.price || 0), 0);
        const grandTotal = packageTotal + addOnsTotal;
        const downpayment = 5000;
        const remaining = grandTotal - downpayment;

        return { pkg, packageTotal, addOnsTotal, grandTotal, downpayment, remaining };
    };

    // --- RENDER HELPERS ---
    const filteredItems = INVENTORY.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-[#C9A25D] w-10 h-10" /></div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-stone-50 text-red-500 font-bold">{error}</div>;

    const totals = getTotals();

    return (
        <div className="flex flex-col h-screen bg-stone-50 font-sans text-stone-800 overflow-hidden">

            {/* --- TOP NAV (CLEAN, NO TABS) --- */}
            <div className="bg-[#1c1c1c] text-white py-0 px-6 flex justify-between items-center z-50 shadow-md shrink-0 h-16 border-b border-[#333]">
                <div className="flex items-center gap-4">
                     <div className="font-serif text-xl tracking-widest font-bold flex items-center gap-1">
                        MAPOS<span className="text-[#C9A25D]">.</span>
                    </div>
                    {/* Visual Badge showing the Selected Package */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#333] rounded-full border border-stone-700 ml-4">
                        <span className="text-[10px] uppercase text-stone-400">Selected Package:</span>
                        <span className="text-xs font-bold text-[#C9A25D] uppercase tracking-wider">{totals.pkg.name}</span>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT LAYOUT --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT SIDEBAR (INCLUSIONS + MENU) */}
                <aside className="w-[320px] bg-white border-r border-stone-200 flex flex-col shrink-0 z-40 relative">

                    {/* 1. CURRENT PACKAGE INCLUSIONS */}
                    <div className="p-5 bg-stone-50 border-b border-stone-200 overflow-y-auto max-h-[35%]">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={14} className="text-[#C9A25D]" />
                            <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wide">
                                Included in {totals.pkg.name}
                            </h4>
                        </div>
                        <ul className="space-y-2">
                            {totals.pkg.inclusions.map((inc, i) => (
                                <li key={i} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 shrink-0"></div>
                                    {inc}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2. SEARCH & FILTER */}
                    <div className="p-4 border-b border-stone-100 bg-white shadow-sm z-10">
                        <h3 className="font-serif text-md text-stone-900 mb-3">Add Extras & Upgrades</h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-2.5 text-stone-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search inventory..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded focus:border-[#C9A25D] outline-none" 
                            />
                        </div>
                        <div className="flex gap-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${activeCategory === cat.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. ADD-ON ITEMS LIST */}
                    <div className="overflow-y-auto p-3 space-y-2 bg-white flex-1">
                        {filteredItems.map(item => {
                            const isSelected = customSelections.find(i => i.id === item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item)}
                                    onMouseEnter={() => setHoveredItem(item)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`p-3 rounded border cursor-pointer transition-all hover:shadow-sm flex justify-between items-start relative
                                    ${isSelected ? 'bg-[#C9A25D]/5 border-[#C9A25D]' : 'bg-white border-stone-100 hover:border-stone-300'}`}
                                >
                                    <div>
                                        <h4 className={`text-xs font-bold ${isSelected ? 'text-[#C9A25D]' : 'text-stone-800'}`}>{item.name}</h4>
                                        <p className="text-[10px] text-stone-400 mt-0.5">{item.description}</p>
                                    </div>
                                    <div className={`mt-0.5 ml-2 p-1 rounded-full ${isSelected ? 'bg-[#C9A25D] text-white' : 'bg-stone-100 text-stone-300'}`}>
                                        {isSelected ? <Check size={10} /> : <Plus size={10} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* HOVER PREVIEW CARD (FLOATING) */}
                {hoveredItem && (
                    <div className="fixed left-[340px] top-40 z-50 w-64 bg-white p-3 rounded-lg shadow-2xl border border-stone-200 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-full h-32 bg-stone-100 rounded-md mb-3 overflow-hidden">
                            <img src={hoveredItem.image} alt={hoveredItem.name} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1">{hoveredItem.name}</h4>
                        <p className="text-[#C9A25D] font-bold text-sm">
                            {hoveredItem.price > 0 ? `+ ₱${hoveredItem.price.toLocaleString()}` : "Included"}
                        </p>
                    </div>
                )}


                {/* RIGHT MAIN CONTENT (INVOICE + PAYMENT) */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f5f5f4]">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* COLUMN 1: INVOICE */}
                        <div className="lg:col-span-7">
                            <div ref={invoiceRef} className="bg-white p-8 rounded-sm shadow-sm border border-stone-200 flex flex-col min-h-[600px]">
                                
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-stone-100 pb-6 mb-6">
                                    <div>
                                        <h2 className="font-serif text-3xl text-stone-900 mb-2">Event Proposal</h2>
                                        <p className="text-xs uppercase tracking-wider text-stone-500">Ref: {proposal.refId}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-block bg-[#C9A25D]/10 text-[#C9A25D] px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                                            {totals.pkg.name} Package
                                        </div>
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="grid grid-cols-2 gap-4 mb-6 bg-stone-50 p-4 rounded border border-stone-100 text-xs text-stone-600">
                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-[#C9A25D]" /> <span className="font-bold text-stone-800">{proposal.eventDate}</span></div>
                                    <div className="flex items-center gap-2"><Clock size={14} className="text-[#C9A25D]" /> <span>{proposal.startTime} - {proposal.endTime}</span></div>
                                    <div className="flex items-center gap-2 col-span-2"><MapPin size={14} className="text-[#C9A25D]" /> <span>{proposal.venue}</span></div>
                                </div>

                                {/* Line Items */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-sm text-stone-800">{totals.pkg.name} Base Cost</h3>
                                        <p className="font-mono text-stone-800">₱ {totals.packageTotal.toLocaleString()}</p>
                                    </div>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-wide">
                                        ₱{totals.pkg.pricePerHead.toLocaleString()} x {proposal.pax} Guests
                                    </p>
                                </div>

                                {/* Selected Add-ons */}
                                <div className="flex-1">
                                    {customSelections.length > 0 && (
                                        <div className="mt-4 border-t border-stone-100 pt-4">
                                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-3">Add-ons & Upgrades</p>
                                            <div className="space-y-2">
                                                {customSelections.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs group hover:bg-stone-50 p-1 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => toggleItem(item)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                            <span className="text-stone-700">{item.name}</span>
                                                        </div>
                                                        <span className="font-mono text-stone-600">
                                                            {item.price > 0 ? `₱ ${item.price.toLocaleString()}` : 'Free'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Total Calculation */}
                                <div className="mt-auto space-y-3 pt-6 border-t-2 border-stone-100">
                                    <div className="flex justify-between items-center">
                                        <span className="font-serif text-xl font-bold">Grand Total</span>
                                        <span className="font-serif text-2xl text-stone-900 font-bold">₱ {totals.grandTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[#C9A25D]">
                                        <span className="font-bold uppercase text-xs">Reservation Fee (Required)</span>
                                        <span className="font-bold">- ₱ {totals.downpayment.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                        <span className="font-serif text-lg text-stone-400">Balance Due</span>
                                        <span className="font-serif text-xl text-stone-400">₱ {totals.remaining.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: PAYMENT FORM */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-4 bg-white rounded-sm shadow-lg border border-stone-200 overflow-hidden">
                                
                                <div className="bg-[#1c1c1c] p-6 text-white text-center">
                                    <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">To Secure This Date</p>
                                    <h2 className="text-3xl font-serif text-[#C9A25D]">₱ 5,000.00</h2>
                                </div>

                                {paymentStep === 1 && (
                                    <div className="p-6">
                                        <div className="bg-stone-50 rounded border border-stone-200 p-4 text-center mb-6">
                                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-3 tracking-[0.2em]">Scan to Pay</p>
                                            <div className="bg-white p-2 rounded shadow-sm border border-stone-100 inline-block w-[180px]">
                                                {/* DYNAMIC QR CODE WITH BOOKING ID */}
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=PAY-MAPOS-${proposal.refId}`} 
                                                    alt="Scan" 
                                                    className="w-full h-auto object-contain" 
                                                />
                                            </div>
                                            <p className="text-[10px] text-stone-400 mt-2">GCash / Maya / Bank Transfer</p>
                                        </div>

                                        <div className="space-y-3">
                                            <input name="accountName" value={paymentForm.accountName} onChange={handleInputChange} type="text" placeholder="Sender Name / Account Name" className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none" />
                                            <input name="accountNumber" value={paymentForm.accountNumber} onChange={handleInputChange} type="text" placeholder="Sender Account Number" className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none" />
                                            <input name="refNumber" value={paymentForm.refNumber} onChange={handleInputChange} type="text" placeholder="Transaction Reference No." className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none" />
                                            
                                            <textarea name="notes" value={paymentForm.notes} onChange={handleInputChange} rows="2" placeholder="Special Requests or Dietary Restrictions..." className="w-full bg-stone-50 border border-stone-200 p-3 rounded text-sm focus:border-[#C9A25D] outline-none resize-none"></textarea>
                                            
                                            <div className="relative border-2 border-dashed border-stone-200 rounded bg-stone-50 p-4 cursor-pointer hover:bg-stone-100 hover:border-[#C9A25D] transition-colors">
                                                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <div className="flex flex-col items-center gap-1 text-stone-400">
                                                    <UploadCloud size={20} />
                                                    <span className="text-xs font-bold uppercase">{paymentForm.proofFile ? paymentForm.proofFile.name : "Upload Payment Screenshot"}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleSubmitForVerification} 
                                                disabled={isSubmitting} 
                                                className="w-full bg-[#C9A25D] hover:bg-[#b08d55] text-white py-4 font-bold uppercase text-xs tracking-[0.15em] rounded shadow-lg mt-4 transition-colors disabled:opacity-50"
                                            >
                                                {isSubmitting ? <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> Processing...</div> : "Confirm & Submit"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {paymentStep === 3 && (
                                    <div className="p-10 text-center min-h-[400px] flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in">
                                            <ShieldCheck size={40} />
                                        </div>
                                        <h3 className="font-serif text-2xl mb-2 text-stone-800">Booking Submitted!</h3>
                                        <p className="text-sm text-stone-500 mb-8 px-4">
                                            Thank you, <strong>{proposal.clientName}</strong>. We have received your selection and payment proof. Our team will verify this shortly.
                                        </p>
                                        <button onClick={downloadPDF} className="flex items-center gap-2 mx-auto text-xs font-bold uppercase tracking-widest text-[#C9A25D] hover:underline">
                                            <ArrowLeft size={14} /> Download Receipt PDF
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

export default ProposalSelection;