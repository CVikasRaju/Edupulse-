"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export const THEME_STORAGE_KEY = "edupulse-theme";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

/** Returns the OS color-scheme preference (never throws). */
export function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

/** Resolve a mode into the concrete theme to apply. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemPreference() : mode;
}

/** Read the stored mode from localStorage (defaults to "system"). */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}

/** Apply a mode: sets `data-theme` (resolved) + persists the mode to localStorage. */
export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(mode));
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

interface ThemeToggleProps {
  className?: string;
  label?: string;
}

const MODES: { value: ThemeMode; label: string; icon: typeof Monitor; hint: string }[] = [
  { value: "system", label: "System", icon: Monitor, hint: "Follow device" },
  { value: "light", label: "Light", icon: Sun, hint: "Bright & airy" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Aurora nights" },
];

const MENU_W = 180;
const MENU_H = 196; // header + 3 two-line options

/** Three-state theme picker with OS-following + cross-device sync. */
export default function ThemeToggle({ className = "", label }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Init + listeners
  useEffect(() => {
    const initial = getStoredTheme();
    setMode(initial);
    applyTheme(initial);

    // Keep in sync across multiple toggles on the same page + other tabs
    const sync = () => setMode(getStoredTheme());
    window.addEventListener("edupulse-themechange", sync);
    window.addEventListener("storage", sync);

    // Follow OS preference changes while in "system" mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOsChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", onOsChange);

    // Cross-device sync: pull saved preference from the user's profile
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("Profile")
          .select("theme_preference")
          .eq("id", user.id)
          .single();
        const pref = data?.theme_preference as ThemeMode | undefined;
        if (pref === "light" || pref === "dark" || pref === "system") {
          setMode(pref);
          applyTheme(pref);
        }
      } catch {
        /* column may not exist yet on the DB — keep local preference */
      }
    })();

    return () => {
      window.removeEventListener("edupulse-themechange", sync);
      window.removeEventListener("storage", sync);
      mq.removeEventListener?.("change", onOsChange);
      cancelled = true;
    };
  }, []);

  const toggleMenu = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      let left = rect.right - MENU_W;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
      let top = rect.bottom + 8;
      if (top + MENU_H > window.innerHeight - 8) top = Math.max(8, rect.top - MENU_H - 8);
      setMenuPos({ top, left });
    }
    setOpen(true);
  }, [open]);

  const choose = useCallback(
    (next: ThemeMode) => {
      if (next === mode) {
        setOpen(false);
        return;
      }
      setMode(next);
      applyTheme(next);
      setOpen(false);
      window.dispatchEvent(new Event("edupulse-themechange"));

      // Persist to profile so the choice follows the user across devices
      (async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("Profile").update({ theme_preference: next }).eq("id", user.id);
          }
        } catch {
          /* ignore */
        }
      })();
    },
    [mode]
  );

  const ActiveIcon = mode === "system" ? Monitor : mode === "dark" ? Moon : Sun;

  return (
    <>
      <motion.button
        ref={btnRef}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleMenu}
        title={`Theme: ${mode[0].toUpperCase()}${mode.slice(1)}`}
        aria-label="Change theme"
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-2 rounded-button border border-glass/10 bg-glass/[0.04] backdrop-blur-sm text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-200 ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={mode}
            initial={{ rotate: -120, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 120, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <ActiveIcon className="w-4 h-4" />
          </motion.span>
        </AnimatePresence>
        {label && <span className="text-xs font-medium">{label}</span>}
      </motion.button>

      {/* Rendered through a portal so ancestor transforms (sidebar motion) never
          break the fixed positioning. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && menuPos && (
              <motion.div
                key="theme-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[290]"
                onClick={() => setOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="w-[180px] rounded-card border border-glass/10 bg-surface/95 backdrop-blur-xl shadow-2xl p-1.5"
                  style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Appearance
                  </div>
                  {MODES.map(({ value, label: itemLabel, icon: Icon, hint }) => {
                    const active = mode === value;
                    return (
                      <button
                        key={value}
                        onClick={() => choose(value)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-button text-sm transition-colors ${
                          active
                            ? "bg-accent/10 text-accent"
                            : "text-text-muted hover:text-text-primary hover:bg-glass/[0.04]"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left leading-tight">
                          <span className="block text-sm font-medium">{itemLabel}</span>
                          <span className="block text-[10px] text-text-muted">{hint}</span>
                        </span>
                        {active && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
