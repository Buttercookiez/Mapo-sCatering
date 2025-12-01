import React from "react";
import { Skeleton } from "../../Utils/Skeleton"; // Adjust path if needed

const BookingLoadingLayout = ({ theme }) => {
  return (
    <div className={`flex-1 h-full flex flex-col ${theme.bg} overflow-hidden`}>
      {/* Header Skeleton */}
      <div
        className={`h-16 flex items-center justify-between px-6 border-b ${theme.border} ${theme.cardBg}`}
      >
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-2"></div>
          <div className="flex flex-col gap-2">
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div
          className={`w-full lg:w-80 border-r ${theme.border} ${theme.cardBg} p-6 lg:p-8 space-y-8`}
        >
          <Skeleton className="w-32 h-3 mx-auto mb-6" />
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-16 rounded-full mb-3" />
            <Skeleton className="w-40 h-6 mb-2" />
            <div className="flex gap-3 mt-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 mt-1" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-20 h-2" />
                  <Skeleton className="w-full h-4" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="w-full h-24 rounded-sm" />
        </div>

        {/* Main Content Skeleton */}
        <div className={`flex-1 flex flex-col ${theme.bg}`}>
          {/* Tabs Skeleton */}
          <div
            className={`flex items-center border-b ${theme.border} ${theme.cardBg} px-6 gap-6`}
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-4">
                <Skeleton className="w-24 h-4" />
              </div>
            ))}
          </div>

          {/* Content Body Skeleton */}
          <div className="p-8 lg:p-12 max-w-4xl mx-auto w-full space-y-6">
            <Skeleton className="w-64 h-8 mb-6" />
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border ${theme.border} ${theme.cardBg} rounded-sm`}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-24 h-2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                </div>
              ))}
              <div className="col-span-2 pt-4 border-t border-dashed border-stone-200 dark:border-stone-800">
                <Skeleton className="w-full h-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingLoadingLayout;