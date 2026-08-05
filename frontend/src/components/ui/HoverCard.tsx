"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, Building2 } from "lucide-react";

interface HoverCardProps {
  /** The element that triggers the preview on hover. */
  children: ReactNode;
  /** Data to display in the mini profile card. */
  person?: {
    full_name?: string;
    usn?: string;
    email?: string;
    department?: string;
    designation?: string;
    role?: string;
    year?: number | null;
    section?: string;
  } | null;
  /** Optional className for the trigger wrapper (inline-flex by default). */
  className?: string;
}

const CARD_W = 240;
const CARD_H = 150;

/** Mini profile card that pops up when hovering the wrapped element. */
export default function HoverCard({ children, person, className = "" }: HoverCardProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Measure in a rAF so the rect isn't captured mid-enter-animation (e.g. modal scale transform)
      requestAnimationFrame(() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        let top = rect.bottom + 10;
        let left = rect.left;
        // Prefer opening below; flip above if it would overflow the viewport
        if (top + CARD_H > window.innerHeight - 8) top = Math.max(8, rect.top - CARD_H - 10);
        // Clamp horizontally
        left = Math.max(8, Math.min(left, window.innerWidth - CARD_W - 8));
        setPos({ top, left });
        setVisible(true);
      });
    }, 180);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  // Close the card if the page/list scrolls while it's open, so it never floats detached.
  // capture: true catches scrolling inside nested overflow containers (registrant lists, etc.).
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => setVisible(false);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [visible]);

  // Clear any pending open timer if the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const initials = (person?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex items-center cursor-default ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {visible && person && pos && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 400, pointerEvents: "none" }}
                className="w-60 rounded-card border border-glass/10 bg-surface/95 backdrop-blur-xl shadow-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {person.full_name ?? "Unknown"}
                    </div>
                    {person.designation && (
                      <div className="text-xs text-text-muted truncate">{person.designation}</div>
                    )}
                    {person.role && (
                      <div className="text-[10px] uppercase tracking-wider text-accent font-medium">
                        {person.role}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-text-muted">
                  {person.usn && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="font-mono truncate">{person.usn}</span>
                    </div>
                  )}
                  {person.department && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-secondary flex-shrink-0" />
                      <span className="truncate">
                        {person.department}
                        {person.year ? ` · Year ${person.year}` : ""}
                        {person.section ? ` · ${person.section}` : ""}
                      </span>
                    </div>
                  )}
                  {person.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-highlight flex-shrink-0" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
