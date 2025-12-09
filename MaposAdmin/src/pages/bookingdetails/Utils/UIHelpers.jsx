import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2 
} from 'lucide-react';

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

// --- 2. CONFIGURATION: Status Definitions ---
export const STATUS_CONFIG = {
  // New Inquiry Stage
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20',
    icon: <AlertCircle size={10} />
  },
  PENDING_REVIEW: { 
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20',
    icon: <AlertCircle size={10} />
  },
  
  // Admin Decisions (Negative)
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
    icon: <XCircle size={10} />
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
    icon: <XCircle size={10} />
  },
  
  // Admin Decisions (Positive)
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    icon: <CheckCircle size={10} />
  },

  // Proposal Stage
  PROPOSAL_SENT: {
    label: 'Sent',
    color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    icon: <Clock size={10} />
  },
  NO_RESPONSE: {
    label: 'No Response',
    color: 'text-stone-500 bg-stone-100 border-stone-200 dark:text-stone-400 dark:bg-stone-800 dark:border-stone-700',
    icon: <AlertCircle size={10} />
  },

  // Payment Stage
  VERIFYING: {
    label: 'Verifying',
    color: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20',
    icon: <Loader2 size={10} className="animate-spin" />
  },
  RESERVED: {
    label: 'Reserved',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    icon: <CheckCircle size={10} />
  },

  // Fallbacks
  UNPAID: {
    label: 'Unpaid',
    color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
    icon: <AlertTriangle size={10} />
  },
  DEFAULT: {
    label: 'Unknown',
    color: 'text-stone-400 bg-stone-50 border-stone-200',
    icon: <AlertTriangle size={10} />
  }
};

// --- 3. HELPER: Render Function ---
export const renderStatusBadge = (status) => {
  const statusKey = status ? status.trim().toUpperCase().replace(/\s+/g, '_') : 'DEFAULT';
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DEFAULT;

  return (
    <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm font-medium border transition-colors w-fit ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};