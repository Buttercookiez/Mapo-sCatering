import React from "react";
import {
  DollarSign,
  Wallet,
  AlertCircle,
  Bell,
  FileText,
  CreditCard,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

const PaymentsTab = ({ details, theme, darkMode }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Cost",
            val: details.budget,
            color: "text-[#C9A25D]",
            icon: DollarSign,
          },
          {
            label: "Amount Paid",
            val: (details.reservationFee || 0) + (details.downpayment || 0),
            color: "text-emerald-600 dark:text-emerald-400",
            icon: Wallet,
          },
          {
            label: "Remaining Balance",
            val: details.balance,
            color: "text-red-500 dark:text-red-400",
            icon: AlertCircle,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-6 border ${theme.border} ${theme.cardBg} rounded-sm flex flex-col justify-between h-32 shadow-sm transition-all duration-300 hover:border-[#C9A25D] hover:bg-[#C9A25D]/5 hover:shadow-md group cursor-pointer`}
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                {stat.label}
              </p>
              <stat.icon
                size={18}
                className="text-stone-300 dark:text-stone-600 group-hover:text-[#C9A25D] transition-colors"
                strokeWidth={1.5}
              />
            </div>
            <p className={`font-serif text-3xl ${stat.color}`}>
              ₱ {Number(stat.val).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className={`border ${theme.border} ${theme.cardBg} rounded-sm`}>
        <div
          className={`flex justify-between items-center p-6 border-b ${theme.border}`}
        >
          <h4 className={`font-serif text-xl ${theme.text}`}>
            Payment Schedule
          </h4>
          <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#C9A25D] border border-[#C9A25D] px-4 py-2 rounded-sm hover:bg-[#C9A25D] hover:text-white transition-colors bg-transparent">
            <Bell size={12} /> Send Reminder
          </button>
        </div>
        <div
          className={`grid grid-cols-12 gap-4 px-6 py-3 border-b ${theme.border} text-[10px] uppercase tracking-widest text-stone-400`}
        >
          <div className="col-span-4">Description</div>
          <div className="col-span-3">Due Date</div>
          <div className="col-span-3 text-right">Amount</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div
          className={`divide-y ${
            darkMode ? "divide-stone-800" : "divide-stone-100"
          }`}
        >
          {[
            {
              label: "Reservation Fee",
              amount: details.reservationFee,
              status: details.reservationStatus,
              due: "On Booking",
              icon: FileText,
            },
            {
              label: "50% Downpayment",
              amount: details.downpayment,
              status: details.downpaymentStatus,
              due: "TBD",
              icon: CreditCard,
            },
            {
              label: "Final Balance",
              amount: details.balance,
              status: "Unpaid",
              due: "TBD",
              icon: DollarSign,
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 gap-4 items-center px-6 py-5 ${theme.hoverBg} transition-colors duration-300 group`}
            >
              <div className="col-span-4 flex items-center gap-4">
                <div
                  className={`p-2 rounded-full border ${theme.border} text-stone-400 bg-white dark:bg-transparent group-hover:border-[#C9A25D] group-hover:text-[#C9A25D] transition-colors`}
                >
                  <row.icon size={16} />
                </div>
                <span
                  className={`text-sm font-bold ${theme.text} group-hover:text-[#C9A25D] transition-colors`}
                >
                  {row.label}
                </span>
              </div>
              <div className="col-span-3 text-xs text-stone-500 dark:text-stone-400">
                Due: {row.due}
              </div>
              <div className="col-span-3 text-right">
                <span
                  className={`font-serif text-lg font-medium ${theme.text}`}
                >
                  ₱ {Number(row.amount).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;