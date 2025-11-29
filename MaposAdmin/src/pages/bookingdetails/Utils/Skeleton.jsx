import React from "react";

/**
 * Reusable Skeleton Component
 * @param {string} className - Tailwind classes for width, height, margin, etc.
 * @param {object} props - Any other props to pass to the div
 */
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-100 ${className}`}
      {...props}
    />
  );
};
