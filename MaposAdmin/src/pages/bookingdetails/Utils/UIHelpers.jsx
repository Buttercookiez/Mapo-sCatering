import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2 
} from 'lucide-react';

// --- 1. Animation Component (Unchanged) ---
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

// --- 2. Status Badge Helper (Updated) ---
export const STATUS_CONFIG = {
  // 1. Initial Inquiry
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: <AlertCircle size={10} />,
    description: 'New client inquiry waiting for admin review'
  },
  
  // 2. Admin Decision
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: <XCircle size={10} />,
    description: 'Admin rejected the request'
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: <CheckCircle size={10} />,
    description: 'Admin accepted. Proposal tab unlocked.'
  },

  // 3. Proposal Phase
  PROPOSAL_SENT: {
    label: 'Proposal Sent',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: <Clock size={10} />,
    description: 'Proposal sent to client'
  },
  NO_RESPONSE: {
    label: 'No Response',
    color: 'text-stone-500 bg-stone-100 border-stone-200',
    icon: <AlertCircle size={10} />,
    description: '24 hours passed without client action'
  },

  // 4. Payment & Finalization
  VERIFYING: {
    label: 'Verifying',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    icon: <Loader2 size={10} className="animate-spin" />,
    description: 'Client paid and clicked verify. Waiting for admin.'
  },
  RESERVED: {
    label: 'Reserved',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: <CheckCircle size={10} />,
    description: 'Payment verified by admin'
  },

  // Fallback
  DEFAULT: {
    label: 'Unknown',
    color: 'text-stone-400 bg-stone-50 border-stone-200',
    icon: <AlertTriangle size={10} />
  }
};

export const renderStatusBadge = (status) => {
  const statusKey = status ? status.toUpperCase().replace(/\s+/g, '_') : 'DEFAULT';
  
  // 2. Find config or fallback to DEFAULT
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DEFAULT;

  // 3. Render
  return (
    <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm font-medium border transition-colors w-fit ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};