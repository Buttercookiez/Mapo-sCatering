// src/pages/Packages/PackageFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Loader2, Save } from 'lucide-react';

// --- SHARED CONSTANTS ---
export const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];
export const CATEGORIES = ["budget", "mid", "high"];
export const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)" },
    { id: "selection2", label: "Classic (61-150 Pax)" },
    { id: "selection3", label: "Grand (150+ Pax)" }
];

const PackageFormModal = ({ isOpen, onClose, packageData, onSave, isSaving, theme, mode }) => {
    // Default form state
    const defaultForm = {
        name: '',
        pricePerHead: '', 
        description: '',
        inclusions: [''],
        eventType: EVENT_TYPES[0],
        categoryId: CATEGORIES[0],
        selectionId: SELECTIONS[0].id,
        selectionLabel: SELECTIONS[0].label
    };

    const [formData, setFormData] = useState(defaultForm);
    const isViewMode = mode === 'view';

    useEffect(() => {
        if (packageData) {
            setFormData({ ...packageData });
        } else {
            setFormData(defaultForm);
        }
    }, [packageData, isOpen]);

    if (!isOpen) return null;

    const handleInclusionChange = (index, value) => {
        const newInclusions = [...formData.inclusions];
        newInclusions[index] = value;
        setFormData({ ...formData, inclusions: newInclusions });
    };

    const addInclusion = () => {
        setFormData({ ...formData, inclusions: [...formData.inclusions, ""] });
    };

    const removeInclusion = (index) => {
        const newInclusions = formData.inclusions.filter((_, i) => i !== index);
        setFormData({ ...formData, inclusions: newInclusions });
    };

    const handleSelectionChange = (e) => {
        const selected = SELECTIONS.find(s => s.id === e.target.value);
        setFormData({
            ...formData,
            selectionId: selected.id,
            selectionLabel: selected.label
        });
    };

    // --- UPDATED STYLES FOR CONSISTENCY ---
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

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        
                        {/* --- ADD MODE: Selection Dropdowns --- */}
                        {mode === 'create' && (
                            <>
                                <div className="col-span-1">
                                    <label className={labelClass}>Event Type</label>
                                    <select 
                                        value={formData.eventType} 
                                        onChange={e => setFormData({...formData, eventType: e.target.value})} 
                                        className={selectClass}
                                    >
                                        {EVENT_TYPES.map(type => <option key={type} value={type} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{type}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className={labelClass}>Category Tier</label>
                                    <select 
                                        value={formData.categoryId} 
                                        onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                                        className={selectClass}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{cat}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Pax Selection</label>
                                    <select 
                                        value={formData.selectionId} 
                                        onChange={handleSelectionChange} 
                                        className={selectClass}
                                    >
                                        {SELECTIONS.map(sel => <option key={sel.id} value={sel.id} className="bg-white dark:bg-[#141414] text-stone-900 dark:text-stone-200">{sel.label}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

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

                        {/* --- EDIT/VIEW MODE: Read-only Tier Info --- */}
                        {mode !== 'create' && (
                            <div className="col-span-1">
                                <label className={labelClass}>Category Tier</label>
                                <input type="text" value={formData.category || formData.categoryId} disabled className={`${inputClass} opacity-50`} />
                            </div>
                        )}

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
                                        
                                        {/* FIXED: Changed from box style to transparent line style for consistency */}
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
                                                title="Remove Item"
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

                {/* Footer - Removed conflicting background color */}
                <div className={`p-6 border-t ${theme.border} flex justify-end gap-3`}>
                    <button onClick={onClose} disabled={isSaving} className={`px-6 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:opacity-70 transition-opacity`}>
                        {isViewMode ? 'Close' : 'Cancel'}
                    </button>
                    
                    {!isViewMode && (
                        <button 
                            onClick={() => onSave(formData, mode === 'edit')} 
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