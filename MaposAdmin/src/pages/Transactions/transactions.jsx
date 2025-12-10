import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom"; 
import {
  Filter,
  Download,
  CreditCard,
  Check,
  X,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// FIREBASE IMPORTS
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

import Sidebar from "../../components/layout/Sidebar";
import DashboardNavbar from "../../components/layout/Navbar";

// --- UI COMPONENTS ---

// FadeIn Component
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  theme,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div
        className={`w-full max-w-md p-6 rounded-sm border shadow-2xl transform scale-100 ${theme.cardBg} ${theme.border} ${theme.text}`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#C9A25D]/10 rounded-full">
            <AlertTriangle className="text-[#C9A25D]" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-medium mb-2">
              Confirm Verification
            </h3>
            <p className={`text-sm ${theme.subText} mb-6 leading-relaxed`}>
              Are you sure you want to verify this payment? This will mark the
              transaction as complete, update the booking status to "Reserved", and send a confirmation email to the client.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold border ${theme.border} hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors rounded-sm`}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-[#C9A25D] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#b08d4d] transition-colors rounded-sm flex items-center gap-2"
              >
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                {isLoading ? "Processing..." : "Confirm Verify"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const ToastNotification = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-sm shadow-xl border animate-in slide-in-from-right duration-300 
      ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200"
          : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
      }`}
    >
      {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <div>
        <h4 className="font-semibold text-sm">
          {isSuccess ? "Success" : "Error"}
        </h4>
        <p className="text-xs opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const Transactions = () => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time & Data State
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI Action State
  const [processingId, setProcessingId] = useState(null);

  // Modal & Toast State
  const [modalState, setModalState] = useState({
    isOpen: false,
    targetId: null,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const location = useLocation();

  // Theme Management
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const theme = {
    bg: darkMode ? "bg-[#0c0c0c]" : "bg-[#FAFAFA]",
    cardBg: darkMode ? "bg-[#141414]" : "bg-white",
    text: darkMode ? "text-stone-200" : "text-stone-900",
    subText: darkMode ? "text-stone-500" : "text-stone-500",
    border: darkMode ? "border-stone-800" : "border-stone-300",
    hoverBg: "hover:bg-[#C9A25D]/5",
  };

  // --- 1. REAL-TIME LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.clientEmail || "N/A",
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          refNumber: data.referenceNumber,
          date: data.submittedAt
            ? new Date(data.submittedAt).toLocaleDateString()
            : "N/A",
          status: data.status,
        };
      });
      setTransactions(liveData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. HANDLE NOTIFICATION REDIRECT ---
  useEffect(() => {
    if (!isLoading && transactions.length > 0 && location.state?.verifyId) {
      const targetId = location.state.verifyId;
      const exists = transactions.find(t => t.id === targetId);
      if (exists && exists.status === 'Pending') {
        setModalState({ isOpen: true, targetId: targetId });
        // Clean up history so it doesn't reopen on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, isLoading, transactions]);

  // --- 3. ACTION HANDLERS ---

  const requestVerification = (id, e) => {
    e.stopPropagation();
    setModalState({ isOpen: true, targetId: id });
  };

  const confirmVerification = async () => {
    const id = modalState.targetId;
    if (!id) return;

    setProcessingId(id);

    try {
      // 1. Send API Request
      await axios.patch(
        `http://localhost:5000/api/inquiries/payments/${id}/verify`
      );

      // 2. OPTIMISTIC UI UPDATE
      // Immediately mark as Verified in local state without waiting for snapshot
      setTransactions(prevTransactions => 
        prevTransactions.map(item => 
            item.id === id ? { ...item, status: "Verified" } : item
        )
      );

      // 3. Show Success Toast
      setToast({
        show: true,
        message: "Payment verified and email sent successfully.",
        type: "success",
      });

    } catch (error) {
      console.error(error);
      setToast({
        show: true,
        message: "Failed to verify payment. Please try again.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
      setModalState({ isOpen: false, targetId: null });
    }
  };

  // --- 4. FILTER LOGIC ---
  const filteredTransactions = transactions.filter(
    (t) =>
      t.refNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex h-screen w-full overflow-hidden font-sans ${theme.bg} ${theme.text}`}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <DashboardNavbar
          activeTab="Transactions"
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main Layout Container */}
        <div className="h-full flex flex-col p-6 md:p-12 pb-12 overflow-hidden">
          {/* Header Section */}
          <div className="flex-none flex justify-between items-end mb-8">
            <div>
              <h2 className={`font-serif text-3xl italic ${theme.text}`}>
                Verification Queue
              </h2>
              <p className={`text-xs mt-1 ${theme.subText}`}>
                Verify payments to book dates.
              </p>
            </div>
          </div>

          {/* Table Container */}
          <FadeIn className="flex-1 min-h-0 flex flex-col">
            <div
              className={`flex-1 min-h-0 flex flex-col border ${theme.border} ${theme.cardBg} rounded-sm shadow-sm`}
            >
              {/* TABLE HEADER */}
              <div
                className={`flex-none grid grid-cols-12 gap-4 px-6 py-4 border-b ${
                  theme.border
                } ${
                  darkMode
                    ? "bg-[#1c1c1c] text-stone-400"
                    : "bg-stone-50 text-stone-600"
                } text-[10px] uppercase tracking-[0.15em] font-semibold select-none`}
              >
                <div className="col-span-3">Email</div>
                <div className="col-span-3">Account Name</div>
                <div className="col-span-2">Account Number</div>
                <div className="col-span-3">Ref Number</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* TABLE BODY */}
              <div
                className={`flex-1 overflow-y-auto no-scrollbar divide-y ${
                  darkMode ? "divide-stone-800" : "divide-stone-100"
                }`}
              >
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-[#C9A25D] mb-4" />{" "}
                    <span className="text-xs uppercase tracking-widest text-stone-500">
                      Loading Transactions...
                    </span>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-500">
                    <span className="text-xs uppercase tracking-widest">
                      No pending transactions.
                    </span>
                  </div>
                ) : (
                  filteredTransactions.map((trx) => (
                    <div
                      key={trx.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-5 items-center ${theme.cardBg} ${theme.hoverBg} transition-colors`}
                    >
                      <div
                        className={`col-span-3 text-sm ${theme.subText} truncate`}
                      >
                        {trx.email}
                      </div>
                      <div
                        className={`col-span-3 text-sm font-medium ${theme.text}`}
                      >
                        {trx.accountName}
                      </div>
                      <div
                        className={`col-span-2 text-sm ${theme.subText} font-mono`}
                      >
                        {trx.accountNumber}
                      </div>

                      <div className="col-span-3 flex flex-col">
                        <span className={`font-mono text-xs ${theme.text}`}>
                          {trx.refNumber}
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {trx.date}
                        </span>
                      </div>

                      {/* ACTION COLUMN */}
                      <div className="col-span-1 flex justify-center">
                        {processingId === trx.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-[#C9A25D]"
                          />
                        ) : trx.status === "Pending" ? (
                          <button
                            onClick={(e) => requestVerification(trx.id, e)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A25D] text-white hover:bg-[#b08d4d] transition-colors rounded-sm shadow-sm"
                          >
                            <span className="text-[9px] uppercase tracking-widest font-semibold">
                              Verify
                            </span>
                            <Check size={12} />
                          </button>
                        ) : (
                          <div className="text-emerald-500 flex items-center gap-1">
                            <Check size={16} />
                            <span className="text-[9px] uppercase tracking-widest">
                              Done
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* --- MODAL & TOAST RENDER --- */}
        <ConfirmationModal
          isOpen={modalState.isOpen}
          theme={theme}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          onConfirm={confirmVerification}
          isLoading={processingId !== null}
        />

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </main>
    </div>
  );
};

export default Transactions;