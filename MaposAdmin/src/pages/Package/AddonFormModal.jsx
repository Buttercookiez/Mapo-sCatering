import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ["Food", "Service"];

const AddonFormModal = ({ isOpen, onClose, itemData, onSave, isSaving, theme, mode }) => {
    const defaultForm = {
        name: '',
        price: '', 
        description: '',
        category: CATEGORIES[0],
        image: ''
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        if (itemData) {
            setFormData({ ...itemData });
        } else {
            setFormData(defaultForm);
        }
    }, [itemData, isOpen]);

    if (!isOpen) return null;

    const inputClass = `w-full bg-transparent border-b ${theme.border} py-3 text-sm focus:outline-none focus:border-[#C9A25D] ${theme.text} placeholder-stone-500 transition-colors`;
    const labelClass = "text-[10px] uppercase tracking-widest text-stone-400 mb-1 block font-semibold";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg ${theme.cardBg} rounded-sm shadow-2xl border ${theme.border} flex flex-col`}>
                
                {/* Header */}
                <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
                    <div>
                        <h2 className={`font-serif text-2xl ${theme.text}`}>
                            {mode === 'create' ? 'New Add-on' : 'Edit Add-on'}
                        </h2>
                    </div>
                    <button onClick={onClose} disabled={isSaving} className="text-stone-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className={labelClass}>Item Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Chocolate Fountain" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className={`font-serif text-lg ${inputClass}`} 
                            />
                        </div>

                        <div className="col-span-1">
                            <label className={labelClass}>Category</label>
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                className={`${inputClass} appearance-none cursor-pointer bg-[#1c1c1c]`}
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#141414] text-white">{cat}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-span-1">
                            <label className={labelClass}>Price</label>
                            <div className="relative">
                                <span className="absolute left-0 top-3 text-stone-400 text-sm">₱</span>
                                <input 
                                    type="number" 
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})} 
                                    className={`${inputClass} pl-4`} 
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Description / Details</label>
                            <textarea 
                                rows={2} 
                                placeholder="e.g. Includes setup and 3 hours service"
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                className={`${inputClass} resize-none`} 
                            />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Image URL (Optional)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="https://..." 
                                    value={formData.image} 
                                    onChange={e => setFormData({...formData, image: e.target.value})} 
                                    className={inputClass} 
                                />
                                <div className={`w-12 h-10 border ${theme.border} flex items-center justify-center rounded-sm overflow-hidden bg-stone-100 dark:bg-stone-800`}>
                                    {formData.image ? <img src={formData.image} alt="Prev" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-stone-500" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${theme.border} flex justify-end gap-3`}>
                    <button onClick={onClose} disabled={isSaving} className={`px-6 py-2 text-xs uppercase tracking-widest border ${theme.border} ${theme.text} hover:opacity-70 transition-opacity`}>Cancel</button>
                    <button 
                        onClick={() => onSave(formData, mode === 'edit')} 
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#1c1c1c] text-white text-xs uppercase tracking-widest hover:bg-[#C9A25D] transition-colors rounded-sm flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                        {isSaving ? "Saving..." : mode === 'edit' ? "Save Changes" : "Create Add-on"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddonFormModal;