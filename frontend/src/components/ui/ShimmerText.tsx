import React from "react";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

/** Animated shimmering gradient text. */
export default function ShimmerText({ children, className = "" }: ShimmerTextProps) {
  return <span className={`shimmer-text ${className}`}>{children}</span>;
}
