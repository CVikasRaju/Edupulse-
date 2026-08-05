"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** rgba color for the spotlight, e.g. "232, 168, 124" */
  color?: string;
}

/** Card with a soft spotlight that follows the cursor. */
export default function SpotlightCard({
  children,
  className = "",
  color = "232, 168, 124",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  const sx = useSpring(mx, { stiffness: 120, damping: 24 });
  const sy = useSpring(my, { stiffness: 120, damping: 24 });

  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${sx}px ${sy}px, rgba(${color}, 0.14), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: spotlight }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
