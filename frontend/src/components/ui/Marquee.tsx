import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  /** seconds for one full loop */
  speed?: number;
  reverse?: boolean;
}

/** Infinite horizontal marquee. Duplicate the children to create a seamless loop. */
export default function Marquee({
  children,
  className = "",
  speed = 30,
  reverse = false,
}: MarqueeProps) {
  return (
    <div
      className={`marquee ${className}`}
      style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
    >
      <div
        className="marquee-track"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
