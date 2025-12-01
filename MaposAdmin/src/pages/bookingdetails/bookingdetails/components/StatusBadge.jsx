import React from "react";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
    Reviewing: "bg-blue-100 text-blue-700 border-blue-200",
    Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Unpaid: "bg-stone-100 text-stone-600 border-stone-200",
    Draft: "bg-stone-100 text-stone-500 border-stone-200",
  };

  const activeStyle = styles[status] || styles.Draft;

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${activeStyle}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;