import React from "react";

interface BorderBeamProps {
  children: React.ReactNode;
  className?: string;
  /** Always-on beam vs beam on hover */
  always?: boolean;
}

/** Wraps content in a relative container with a rotating light beam border. */
export default function BorderBeam({
  children,
  className = "",
  always = false,
}: BorderBeamProps) {
  return (
    <div className={`relative ${className}`}>
      {always && <div className="border-beam" aria-hidden />}
      <div
        className={`relative z-[1] ${always ? "" : "group"}`}
      >
        {children}
        {!always && (
          <div
            className="border-beam opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
