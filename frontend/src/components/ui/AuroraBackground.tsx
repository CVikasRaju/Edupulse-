import React from "react";

interface AuroraBackgroundProps {
  className?: string;
  /** Reduce opacity of the blobs */
  subtle?: boolean;
}

/** Animated aurora glow blobs + grid overlay. Place behind content.
 *  Colors use CSS vars so they adapt to the active theme automatically. */
export default function AuroraBackground({
  className = "",
  subtle = false,
}: AuroraBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Drifting blobs */}
      <div
        className={`aurora ${subtle ? "aurora-subtle" : ""} w-[480px] h-[480px] -top-32 -left-24`}
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.5), transparent 65%)",
          animation: "aurora-drift 22s ease-in-out infinite",
        }}
      />
      <div
        className={`aurora ${subtle ? "aurora-subtle" : ""} w-[420px] h-[420px] top-1/4 -right-32`}
        style={{
          background:
            "radial-gradient(circle, rgb(var(--highlight) / 0.42), transparent 65%)",
          animation: "aurora-drift 26s ease-in-out infinite reverse",
        }}
      />
      <div
        className={`aurora ${subtle ? "aurora-subtle" : ""} w-[380px] h-[380px] -bottom-24 left-1/3`}
        style={{
          background:
            "radial-gradient(circle, rgb(var(--secondary) / 0.42), transparent 65%)",
          animation: "aurora-drift 30s ease-in-out infinite",
        }}
      />
    </div>
  );
}
