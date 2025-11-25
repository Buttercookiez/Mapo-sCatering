import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, AlertCircle, AlertTriangle } from 'lucide-react';

// --- 1. Animation Component ---
export const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// --- 2. Status Badge Helper ---
export const renderStatusBadge = (status) => {
  const badgeBase = "flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm font-medium border transition-colors w-fit";
  
  switch (status) {
    case 'Reserved':
      return <span className={`${badgeBase} text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/10`}><CheckCircle size={10} /> Reserved</span>;
    case 'Proposal Sent':
      return <span className={`${badgeBase} text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/10`}><Clock size={10} /> Sent</span>;
    case 'Pending Review':
    case 'Pending':
      return <span className={`${badgeBase} text-stone-600 bg-stone-100 border-stone-200 dark:text-stone-400 dark:bg-stone-800 dark:border-stone-700`}><AlertCircle size={10} /> New</span>;
    case 'Paid':
    case 'Confirmed':
      return <span className={`${badgeBase} text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/10`}><CheckCircle size={10} /> Confirmed</span>;
    case 'Unpaid':
      return <span className={`${badgeBase} text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/10`}><AlertTriangle size={10} /> Unpaid</span>;
    default: return null;
  }
};