import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
    Loader2, Check, ShieldCheck, Download, UploadCloud,
    ArrowLeft, Search, Plus, Trash2, MapPin, Calendar, Clock,
    Utensils, Grid, Music
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { verifyProposalToken, confirmProposalSelection } from "../../api/bookingService";

// --- MOCK INVENTORY WITH IMAGES ---
const INVENTORY = [
    { id: 1, category: "Main Course", name: "Slow Roasted Beef", price: 0, description: "Swap included dish", image: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=400" },
    { id: 2, category: "Main Course", name: "Chicken Cordon Bleu", price: 0, description: "Swap included dish", image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?q=80&w=400" },
    { id: 3, category: "Main Course", name: "Pork Humba Bisaya", price: 0, description: "Swap included dish", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=400" },
    { id: 5, category: "Dessert", name: "Mango Tapioca", price: 0, description: "Swap included dish", image: "https://images.unsplash.com/photo-1628286940860-23b9d07267eb?q=80&w=400" },
    { id: 101, category: "Add-on", name: "Whole Lechon (Cebu)", price: 8500, description: "Serves 30-40 pax", image: "https://images.unsplash.com/photo-1594144379309-847253503b46?q=80&w=400" },
    { id: 102, category: "Add-on", name: "Sushi Platter", price: 2500, description: "50 pcs mixed maki", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400" },
    { id: 103, category: "Service", name: "Mobile Bar", price: 15000, description: "4 hours free flowing", image: "https://images.unsplash.com/photo-1534079824641-7688cb62f4f2?q=80&w=400" },
    { id: 104, category: "Service", name: "Lights & Sounds", price: 5000, description: "Mood upgrade", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400" },
    { id: 105, category: "Add-on", name: "Grazing Table", price: 6000, description: "Cold cuts & cheese", image: "https://images.unsplash.com/photo-1549488352-22668e9e3c35?q=80&w=400" },
];

const CATEGORIES = [
    { id: "All", label: "All", icon: Grid },
    { id: "Main Course", label: "Dishes", icon: Utensils },
    { id: "Add-on", label: "Add-ons", icon: Plus },
    { id: "Service", label: "Services", icon: Music },
];

const ProposalSelection = () => {
    const { token } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [proposal, setProposal] = useState(null);
    const [selectedPkgIndex, setSelectedPkgIndex] = useState(null);

    // Logic
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [customSelections, setCustomSelections] = useState([]);

    // --- NEW: HOVER STATE ---
    const [hoveredItem, setHoveredItem] = useState(null);

    // Checkout State
    const [paymentStep, setPaymentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const invoiceRef = useRef(null);

    // Form Fields
    const [paymentForm, setPaymentForm] = useState({
        accountName: "",
        accountNumber: "",
        refNumber: "",
        notes: "",
        proofFile: null
    });

    // --- INIT ---
    useEffect(() => {
        const init = async () => {
            try {
                const data = await verifyProposalToken(token);
                setProposal(data);

                // --- IMPROVED SELECTION LOGIC ---
                const indexParam = searchParams.get("pkgIndex");

                if (indexParam !== null && !isNaN(indexParam)) {
                    // Priority 1: Use the index from the URL (Email Link)
                    setSelectedPkgIndex(parseInt(indexParam));
                } else if (data.selectedPackage) {
                    // Priority 2: Use previously saved selection from Database (if they come back later)
                    const idx = data.options.findIndex(p => p.name === data.selectedPackage.name);
                    setSelectedPkgIndex(idx !== -1 ? idx : 0);
                } else {
                    // Priority 3 (FAIL-SAFE): Default to the first package (Index 0)
                    // This prevents the "No package selected" screen
                    setSelectedPkgIndex(0);
                }

            } catch (err) {
                setError(err.message || "Invalid or Expired Link");
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

    const filteredItems = INVENTORY.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handleInputChange = (e) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setPaymentForm({ ...paymentForm, proofFile: e.target.files[0] });
    };

    const handleSubmitForVerification = async () => {
        if (!paymentForm.accountName || !paymentForm.accountNumber || !paymentForm.refNumber) return alert("Please fill in payment details.");

        setIsSubmitting(true);
        try {
            const payload = {
                token,
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
            alert("Submission failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadPDF = () => {
        const element = invoiceRef.current;
        const opt = { margin: 10, filename: `Invoice_${proposal.refId}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(element).save();
    };

    // --- CALCULATIONS ---
    const getTotals = () => {
        // Safety check: ensure proposal and options exist
        if (!proposal || !proposal.options || selectedPkgIndex === null) return null;

        // Safety check: ensure the index is within bounds of the array
        const pkg = proposal.options[selectedPkgIndex] || proposal.options[0];

        const pax = parseInt(proposal.pax) || 0;
        const pricePerHead = parseInt(pkg.pricePerHead) || 0;

        const packageTotal = (pricePerHead * pax);
        const addOnsTotal = customSelections.reduce((sum, item) => sum + (item.price || 0), 0);
        const grandTotal = packageTotal + addOnsTotal;
        const downpayment = 5000;
        const remaining = grandTotal - downpayment;

        return { pkg, packageTotal, addOnsTotal, grandTotal, downpayment, remaining };
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-[#C9A25D] w-10 h-10" /></div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-stone-50 text-red-500 font-bold">{error}</div>;

    const totals = getTotals();

    if (!totals) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-600">
                <p className="mb-4">No package selected.</p>
                {/* You could add buttons here to let them manually select a package if the link failed */}
                <button
                    onClick={() => setSelectedPkgIndex(0)} // Fallback to first package
                    className="px-4 py-2 bg-[#C9A25D] text-white rounded"
                >
                    Load Default Package
                </button>
            </div>
        );
    }
    // ==========================================
    // VIEW 2: SPLIT SCREEN LAYOUT
    // ==========================================
    return (
        <div className="flex flex-col h-screen bg-stone-50 font-sans text-stone-800 overflow-hidden">

            {/* 1. TOP NAV */}
            <div className="bg-[#111] text-white py-4 px-6 flex justify-between items-center z-50 shadow-md shrink-0 h-16">
                <button onClick={() => { setSelectedPkgIndex(null); setSearchParams({}); }} className="text-stone-400 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Change Package
                </button>
                <div className="font-serif text-xl tracking-widest font-bold">MAPOS<span className="text-[#C9A25D]">.</span></div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* --- LEFT SIDEBAR (Menu) --- */}
                <aside className="w-[300px] bg-white border-r border-stone-200 flex flex-col shrink-0 z-40 relative">

                    {/* Header */}
                    <div className="p-5 border-b border-stone-100 bg-white z-10">
                        <h3 className="font-serif text-lg text-stone-900 mb-4">Available Menu</h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-2.5 text-stone-400" size={14} />
                            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-200 rounded focus:border-[#C9A25D] outline-none" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${activeCategory === cat.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List Items with Hover Events */}
                    <div className="overflow-y-auto p-3 space-y-2 bg-stone-50/20 flex-1">
                        {filteredItems.map(item => {
                            const isSelected = customSelections.find(i => i.id === item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item)}
                                    onMouseEnter={() => setHoveredItem(item)} // <--- HOVER START
                                    onMouseLeave={() => setHoveredItem(null)} // <--- HOVER END
                                    className={`p-3 rounded border cursor-pointer transition-all hover:shadow-sm flex justify-between items-start relative
                                    ${isSelected ? 'bg-[#C9A25D]/5 border-[#C9A25D]' : 'bg-white border-stone-100'}`}
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

                {/* --- HOVER PREVIEW CARD (Floating) --- */}
                {hoveredItem && (
                    <div
                        className="fixed left-[320px] top-24 z-50 w-64 bg-white p-3 rounded-lg shadow-2xl border border-stone-200 animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none"
                    >
                        <div className="w-full h-32 bg-stone-100 rounded-md mb-3 overflow-hidden">
                            <img
                                src={hoveredItem.image}
                                alt={hoveredItem.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1">{hoveredItem.name}</h4>
                        <p className="text-xs text-stone-500 mb-2">{hoveredItem.description}</p>
                        <p className="text-[#C9A25D] font-bold text-sm">
                            {hoveredItem.price > 0 ? `+ ₱${hoveredItem.price.toLocaleString()}` : "Included"}
                        </p>
                    </div>
                )}


                {/* --- RIGHT MAIN CONTENT (Invoice & Payment) --- */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-50">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                        {/* INVOICE CARD */}
                        <div className="lg:col-span-7">
                            <div ref={invoiceRef} className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 flex flex-col">
                                {/* ... (Invoice Content Same as Before) ... */}
                                <div className="flex justify-between items-start border-b border-stone-100 pb-6 mb-6">
                                    <div><h2 className="font-serif text-3xl text-stone-900 mb-2">Event Invoice</h2><p className="text-xs uppercase tracking-wider text-stone-500">Ref: {proposal.refId}</p></div>
                                    <div className="text-right"><div className="inline-block bg-[#C9A25D]/10 text-[#C9A25D] px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">{proposal.status === 'Confirmed' ? 'Confirmed' : 'Draft'}</div></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 bg-stone-50 p-4 rounded border border-stone-100 text-xs">
                                    <div className="flex items-center gap-2"><Calendar size={12} className="text-[#C9A25D]" /> <span className="font-bold">{proposal.eventDate}</span></div>
                                    <div className="flex items-center gap-2"><Clock size={12} className="text-[#C9A25D]" /> <span>{proposal.startTime} - {proposal.endTime}</span></div>
                                    <div className="flex items-center gap-2 col-span-2"><MapPin size={12} className="text-[#C9A25D]" /> <span>{proposal.venue}</span></div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-1"><h3 className="font-serif text-lg text-stone-900">{totals.pkg.name}</h3><p className="font-mono text-stone-800 font-bold">₱{totals.packageTotal.toLocaleString()}</p></div>
                                    <p className="text-[10px] text-stone-500 uppercase tracking-wide">Base Package ({proposal.pax} Guests)</p>
                                </div>

                                <div className="flex-1">
                                    {customSelections.length > 0 && (
                                        <div className="mb-6 border-t border-stone-100 pt-4">
                                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-3">Add-ons & Upgrades</p>
                                            <div className="space-y-2">
                                                {customSelections.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs group">
                                                        <div className="flex items-center gap-2"><button onClick={() => toggleItem(item)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button><span className="text-stone-700">{item.name}</span></div>
                                                        <span className="font-mono text-stone-600">{item.price > 0 ? `₱ ${item.price.toLocaleString()}` : 'Free'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto space-y-3 pt-6 border-t-2 border-stone-100">
                                    <div className="flex justify-between items-center"><span className="font-serif text-xl font-bold">Grand Total</span><span className="font-serif text-2xl text-stone-900 font-bold">₱ {totals.grandTotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm text-[#C9A25D]"><span className="font-bold uppercase text-xs">Less: Reservation Fee</span><span className="font-bold">- ₱ {totals.downpayment.toLocaleString()}</span></div>
                                    <div className="flex justify-between items-center pt-2"><span className="font-serif text-lg text-stone-400">Balance Due</span><span className="font-serif text-xl text-stone-400">₱ {totals.remaining.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* PAYMENT CARD */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-4 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
                                {/* ... (Payment UI Same as Before) ... */}
                                <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-6 text-white text-center">
                                    <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Reservation Fee</p>
                                    <h2 className="text-4xl font-serif text-[#C9A25D]">₱ 5,000.00</h2>
                                    <p className="text-[10px] mt-2 opacity-50">Secure Payment Gateway</p>
                                </div>

                                {paymentStep === 1 && (
                                    <div className="p-6">
                                        <div className="bg-stone-50 rounded-xl border-2 border-dashed border-stone-300 p-4 text-center mb-6">
                                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-3 tracking-[0.2em]">Scan with GCash/Maya</p>
                                            <div className="bg-white p-2 rounded-lg shadow-sm border border-stone-100 inline-block w-full max-w-[200px]">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=MAPOS-${proposal.refId}`} alt="Scan" className="w-full h-auto object-contain mix-blend-multiply" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <input name="accountName" value={paymentForm.accountName} onChange={handleInputChange} type="text" placeholder="Account Name" className="w-full border border-stone-300 p-3 rounded text-sm focus:border-[#C9A25D] outline-none transition-colors" />
                                            <input name="accountNumber" value={paymentForm.accountNumber} onChange={handleInputChange} type="text" placeholder="Account Number" className="w-full border border-stone-300 p-3 rounded text-sm focus:border-[#C9A25D] outline-none transition-colors" />
                                            <input name="refNumber" value={paymentForm.refNumber} onChange={handleInputChange} type="text" placeholder="Reference Number" className="w-full border border-stone-300 p-3 rounded text-sm focus:border-[#C9A25D] outline-none transition-colors" />
                                            <textarea name="notes" value={paymentForm.notes} onChange={handleInputChange} rows="2" placeholder="Dietary restrictions / Notes..." className="w-full border border-stone-300 p-3 rounded text-sm focus:border-[#C9A25D] outline-none resize-none transition-colors"></textarea>
                                            <div className="relative border border-stone-300 rounded bg-stone-50 p-2 cursor-pointer group hover:bg-stone-100">
                                                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <div className="flex items-center gap-3 text-stone-500 group-hover:text-[#C9A25D]"><UploadCloud size={16} /> <span className="text-xs">{paymentForm.proofFile ? paymentForm.proofFile.name : "Upload Proof"}</span></div>
                                            </div>
                                            <button onClick={handleSubmitForVerification} disabled={isSubmitting} className="w-full bg-[#C9A25D] hover:bg-[#b08d55] text-white py-4 font-bold uppercase text-xs tracking-widest rounded shadow-lg mt-2">
                                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Submit for Verification"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {paymentStep === 3 && (
                                    <div className="p-10 text-center">
                                        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
                                        <h3 className="font-serif text-2xl mb-2">Submitted!</h3>
                                        <p className="text-xs text-stone-500 mb-6">Your payment is being verified.</p>
                                        <button onClick={downloadPDF} className="text-xs font-bold uppercase underline text-stone-800">Download Receipt</button>
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