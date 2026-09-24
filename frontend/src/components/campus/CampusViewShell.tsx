"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Images, Navigation, Ruler } from "lucide-react";
import CampusGallery from "./CampusGallery";
import BlueprintViewer from "./BlueprintViewer";
import CampusNavigatorView from "./CampusNavigatorView";
import { CAMPUS } from "@/lib/campusData";

const TABS = [
  {
    key: "gallery",
    label: "Campus Gallery",
    icon: Images,
    hint: "Photos from across the campus — riverfront, courtyards, labs and seminar halls.",
  },
  {
    key: "blueprints",
    label: "Architectural Blueprints",
    icon: Ruler,
    hint: "High-resolution floor plans — pan, pinch and zoom from Ground to Fifth floor.",
  },
  {
    key: "navigation",
    label: "Campus Navigation",
    icon: Navigation,
    hint: "Search a start and destination, then hand off seamlessly to the 3D multi-floor navigator.",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CampusViewShell() {
  const [tab, setTab] = useState<TabKey>("gallery");
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  /* Deep-link: /campus-view?tab=blueprints|navigation|gallery */
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "gallery" || t === "blueprints" || t === "navigation") setTab(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] font-body text-[#FAFAF9]">
      {/* ── Module header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#0F0F0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to home</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1 className="truncate font-heading text-base font-bold sm:text-lg">
              SCEM Campus View
            </h1>
            <p className="hidden truncate text-[11px] text-[#78716C] sm:block">
              {CAMPUS.name} · Adyar, Mangaluru
            </p>
          </div>

          <span className="whitespace-nowrap rounded-full border border-[#E8A87C]/30 bg-[#E8A87C]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8A87C] sm:text-[11px]">
            3D Ready
          </span>
        </div>

        {/* ── Sub-navigation tabs ─────────────────────────── */}
        <div className="border-t border-[#1D1D1D]">
          <div
            role="tablist"
            aria-label="Campus View sections"
            className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                    on
                      ? "text-[#0F0F0F]"
                      : "text-[#A8A29E] hover:bg-[#1A1A1A] hover:text-[#FAFAF9]"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="campus-tab-pill"
                      className="absolute inset-0 rounded-lg bg-[#E8A87C]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon size={15} className="relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Tab content ───────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-5 text-sm text-[#A8A29E]">{active.hint}</p>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "gallery" && <CampusGallery />}
          {tab === "blueprints" && <BlueprintViewer />}
          {tab === "navigation" && <CampusNavigatorView />}
        </motion.div>
      </div>
    </div>
  );
}
