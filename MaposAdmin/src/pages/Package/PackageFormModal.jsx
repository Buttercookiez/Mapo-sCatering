import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Loader2, Save } from 'lucide-react';

export const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

export const SERVICE_TYPES = [
    { id: "full", label: "Full Service" },
    { id: "service", label: "Service Only" }
];

export const CATEGORIES = [
    { id: "budget", label: "Budget Friendly" },
    { id: "mid", label: "Premium Selection" },
    { id: "high", label: "Luxury/High End" }
];

export const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)", min: 30, max: 60 },
    { id: "selection2", label: "Classic (61-150 Pax)", min: 61, max: 150 },
    { id: "selection3", label: "Grand (150+ Pax)", min: 151, max: 1000 }
];

const PackageFormModal = ({ isOpen, onClose, packageData, onSave, isSaving, theme, mode }) => {
    const defaultForm = {
        name: '',
        pricePerHead: '', 
        description: '',
        inclusions: [''],
        eventType: EVENT_TYPES[0],
        serviceType: SERVICE_TYPES[0].id, // Default to 'full'
        categoryId: CATEGORIES[0].id,
        selectionId: SELECTIONS[0].id,
    };

    const [formData, setFormData] = useState(defaultForm);
    const isViewMode = mode === 'view';

    useEffect(() => {
        if (packageData) {
            // When editing/viewing, try to detect service type from ID or Label if not explicitly stored
            let detectedService = 'full';
            if (packageData.id && packageData.id.includes('-service-')) detectedService = 'service';
            
            setFormData({ 
                ...packageData,
                serviceType: detectedService 
            });
        } else {
            setFormData(defaultForm);
        }
    }, [packageData, isOpen]);

    if (!isOpen) return null;

    // --- Helpers ---
    const handleInclusionChange = (index, value) => {
        const newInclusions = [...(formData.inclusions || [])];
        newInclusions[index] = value;
        setFormData({ ...formData, inclusions: newInclusions });
    };

    const addInclusion = () => {
        setFormData({ ...formData, inclusions: [...(formData.inclusions || []), ""] });
    };

    const removeInclusion = (index) => {
        const newInclusions = formData.inclusions.filter((_, i) => i !== index);
        setFormData({ ...formData, inclusions: newInclusions });
    };

    // --- Internal Save Handler ---
    const handleInternalSave = () => {
        const selectedCat = CATEGORIES.find(c => c.id === formData.categoryId) || CATEGORIES[0];
        const selectedSel = SELECTIONS.find(s => s.id === formData.selectionId) || SELECTIONS[0];
        const selectedService = SERVICE_TYPES.find(s => s.id === formData.serviceType) || SERVICE_TYPES[0];

        const payload = {
            ...formData,
            // Fields for DB Structure
            category: selectedCat.label,
            categoryId: selectedCat.id,
            selectionLabel: selectedService.label, // "Full Service" or "Service Only"
            paxLabel: selectedSel.label,
            minPax: selectedSel.min,
            maxPax: selectedSel.max
        };
        
        onSave(payload, mode === 'edit');
    };

    const inputClass = `w-full bg-transparent border-b ${theme.border} py-3 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text} placeholder-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`;
    const selectClass = `w-full bg-transparent border-b ${theme.border} py-3 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text} appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`;
    const labelClass = "text-[10px] uppercase tracking-widest text-stone-400 mb-1 block font-semibold";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col max-h-[90vh]`}>
                
                {/* Header */}
                <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
                    <div>
                        <h2 className={`font-serif text-2xl ${theme.text}`}>
                            {mode === 'create' ? 'Create New Package' : mode === 'edit' ? 'Edit Package' : 'Package Details'}
                        </h2>
                        {mode !== 'create' && <span className="text-xs text-[#C9A25D] uppercase tracking-widest">{formData.id}</span>}
                    </div>
                    <button onClick={onClose} disabled={isSaving} className="text-stone-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        
                        {/* --- SELECTION DROPDOWNS --- */}
                        <div className="col-span-1">
                            <label className={labelClass}>Event Type</label>
                            <select 
                                disabled={mode !== 'create'}
                                value={formData.eventType} 
                                onChange={e => setFormData({...formData, eventType: e.target.value})} 
                                className={selectClass}
                            >
                                {EVENT_TYPES.map(type => <option key={type} value={type} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{type}</option>)}
                            </select>
                        </div>

                        {/* NEW: SERVICE TYPE SELECTION */}
                        <div className="col-span-1">
                            <label className={labelClass}>Service Type</label>
                            <select 
                                disabled={mode !== 'create'}
                                value={formData.serviceType} 
                                onChange={e => setFormData({...formData, serviceType: e.target.value})} 
                                className={selectClass}
                            >
                                {SERVICE_TYPES.map(type => <option key={type.id} value={type.id} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{type.label}</option>)}
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className={labelClass}>Category Tier</label>
                            <select 
                                disabled={mode !== 'create'}
                                value={formData.categoryId} 
                                onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                                className={selectClass}
                            >
                                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{cat.label}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Pax Selection</label>
                            <select 
                                disabled={mode !== 'create'}
                                value={formData.selectionId} 
                                onChange={e => setFormData({...formData, selectionId: e.target.value})} 
                                className={selectClass}
                            >
                                {SELECTIONS.map(sel => <option key={sel.id} value={sel.id} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{sel.label}</option>)}
                            </select>
                        </div>

                        {/* REST OF FORM */}
                        <div className="col-span-2">
                            <label className={labelClass}>Package Name</label>
                            <input 
                                type="text" 
                                disabled={isViewMode}
                                placeholder="e.g. Wedding Budget Friendly - Lite" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className={`font-serif text-xl ${inputClass}`} 
                            />
                        </div>
                        
                        <div className="col-span-1">
                            <label className={labelClass}>Base Price (Per Head)</label>
                            <div className="relative">
                                <span className="absolute left-0 top-3 text-stone-400 text-sm">₱</span>
                                <input 
                                    type="number" 
                                    disabled={isViewMode}
                                    value={formData.pricePerHead} 
                                    onChange={e => setFormData({...formData, pricePerHead: e.target.value})} 
                                    className={`${inputClass} pl-4`} 
                                />
                            </div>
                        </div>

                         <div className="col-span-1">
                            <label className={labelClass}>Package ID</label>
                            <input type="text" value={formData.id || "Auto-generated"} disabled className={`${inputClass} opacity-50`} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea 
                                rows={2} 
                                disabled={isViewMode}
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                className={`${inputClass} resize-none`} 
                            />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Inclusions</label>
                            <div className="space-y-2 mt-2">
                                {formData.inclusions && formData.inclusions.map((inc, idx) => (
                                    <div key={idx} className="flex gap-3 items-center group">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#C9A25D] flex-shrink-0 mt-1"></div>
                                        <input 
                                            type="text" 
                                            disabled={isViewMode}
                                            value={inc} 
                                            onChange={(e) => handleInclusionChange(idx, e.target.value)}
                                            className={`flex-1 bg-transparent border-b ${theme.border} py-1 text-sm ${theme.text} focus:border-[#C9A25D] focus:outline-none transition-colors placeholder-stone-600`}
                                            placeholder="Add item details..."
                                        />
                                        {!isViewMode && (
                                            <button 
                                                onClick={() => removeInclusion(idx)} 
                                                className="text-stone-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!isViewMode && (
                                    <button onClick={addInclusion} className="text-xs flex items-center gap-1 text-[#C9A25D] hover:underline mt-3 uppercase tracking-widest font-medium">
                                        <Plus size={12}/> Add Inclusion
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${theme.border} flex justify-end gap-3`}>
                    <button onClick={onClose} disabled={isSaving} className={`px-6 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:opacity-70 transition-opacity`}>
                        {isViewMode ? 'Close' : 'Cancel'}
                    </button>
                    {!isViewMode && (
                        <button 
                            onClick={handleInternalSave} 
                            disabled={isSaving}
                            className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                            {isSaving ? "Saving..." : mode === 'edit' ? "Save Changes" : "Create Package"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageFormModal;