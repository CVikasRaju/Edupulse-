"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Briefcase,
  CircuitBoard,
  Cpu,
  FlaskConical,
  GraduationCap,
  Handshake,
  HardHat,
  Landmark,
  Lightbulb,
  MapPin,
  Menu,
  Phone,
  Waves,
  X,
} from "lucide-react";
import EduPulseLoginDrawer from "@/components/EduPulseLoginDrawer";
import {
  ACADEMICS,
  CAMPUS,
  HIGHLIGHTS,
  PLACEMENT_STATS,
  RECRUITERS,
  type Highlight,
} from "@/lib/campusData";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Academics", href: "#academics" },
  { label: "Placements", href: "#placements" },
  { label: "Campus View", href: "/campus-view" },
];

const HIGHLIGHT_ICONS = {
  landmark: Landmark,
  handshake: Handshake,
  lightbulb: Lightbulb,
  flask: FlaskConical,
  waves: Waves,
};

const ACADEMIC_ICONS = {
  cse: Cpu,
  ece: CircuitBoard,
  civil: HardHat,
  mba: Briefcase,
};

/* ── Logo with graceful fallback ─────────────────────────── */
function LogoMark({ size = 36 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {ok ? (
        <img
          src="/sahyadri-logo.png"
          alt=""
          className="h-full w-full object-contain p-0.5"
          onError={() => setOk(false)}
        />
      ) : (
        <span
          className="font-heading font-extrabold text-[#8B0000]"
          style={{ fontSize: size * 0.5 }}
        >
          S
        </span>
      )}
    </span>
  );
}

/* ── Bento card by tone ──────────────────────────────────── */
function HighlightCard({ h }: { h: Highlight }) {
  const Icon = HIGHLIGHT_ICONS[h.icon];
  const tones: Record<Highlight["tone"], string> = {
    light:
      "bg-white border border-slate-200 text-slate-900 hover:border-[#8B0000]/40 hover:shadow-xl",
    navy: "bg-[#0F2537] border border-[#0F2537] text-white hover:shadow-xl hover:shadow-slate-900/20",
    crimson:
      "bg-[#8B0000] border border-[#8B0000] text-white hover:bg-[#A31D1D] hover:shadow-xl hover:shadow-red-900/25",
  };
  const muted =
    h.tone === "light" ? "text-slate-500" : "text-red-100/80";
  const chip =
    h.tone === "light"
      ? "bg-[#8B0000]/10 text-[#8B0000]"
      : "bg-white/15 text-white";

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${tones[h.tone]} ${h.className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            h.tone === "light" ? "bg-[#8B0000]/10 text-[#8B0000]" : "bg-white/15 text-white"
          }`}
        >
          <Icon size={20} />
        </span>
        {h.value && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${chip}`}
          >
            {h.title}
          </span>
        )}
      </div>
      <div className="mt-6">
        {h.value && (
          <p className="font-heading text-4xl font-extrabold tracking-tight">
            {h.value}
          </p>
        )}
        {!h.value && (
          <p className="font-heading text-xl font-bold tracking-tight">{h.title}</p>
        )}
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{h.desc}</p>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function PortalHome() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Deep-link: /?login=1 opens the EduPulse drawer */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      setDrawerOpen(true);
    }
  }, []);

  const openDrawer = () => {
    setMobileOpen(false);
    setDrawerOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-body text-slate-800">
      <style dangerouslySetInnerHTML={{ __html: "html{scroll-behavior:smooth}" }} />

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <LogoMark size={36} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-heading text-sm font-extrabold tracking-tight text-[#0F2537] sm:text-base">
                Sahyadri College of Engineering &amp; Management
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Autonomous · Adyar, Mangaluru
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2537]"
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={openDrawer}
              className="ml-3 inline-flex items-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#A31D1D]"
            >
              EduPulse Login <ArrowRight size={14} />
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={openDrawer}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#A31D1D]"
                >
                  EduPulse Login <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden bg-[#0F2537] pt-16 text-white">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0F2537_0%,#14324c_55%,#0F2537_100%)]" />
          <div className="absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-[#8B0000]/40 blur-3xl" />
          <div className="absolute bottom-[-25%] left-[-5%] h-96 w-96 rounded-full bg-[#A31D1D]/25 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-200">
              <Award size={13} className="text-[#E8A87C]" />
              NAAC A Grade · NBA Accredited · Autonomous · NIRF Listed
            </span>

            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Sahyadri College of{" "}
              <span className="text-[#F3B1B1]">Engineering &amp; Management</span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-slate-300 md:text-2xl">
              {CAMPUS.tagline}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              An autonomous, NAAC A-grade institution on a riverside campus at Adyar,
              Mangaluru — where engineering, management and research meet. Established
              by the {CAMPUS.foundedBy}.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/campus-view"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B0000] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition hover:-translate-y-0.5 hover:bg-[#A31D1D]"
              >
                Explore Campus View <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={openDrawer}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
              >
                EduPulse Login <GraduationCap size={16} />
              </button>
            </div>

            <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
              {[
                ["Est.", "2007"],
                ["Grade", "NAAC A"],
                ["Status", "Autonomous"],
                ["Start-ups", "22 on campus"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {k}
                  </dt>
                  <dd className="mt-1 font-heading text-xl font-extrabold text-white">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* ─── Bento highlights ───────────────────────────────── */}
      <section id="highlights" className="scroll-mt-24 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8B0000]">
              Why Sahyadri
            </p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#0F2537] md:text-4xl">
              A campus built for ambitious engineers
            </h2>
            <p className="mt-3 text-slate-600">
              Accredited programmes, research depth and an industry-connected
              ecosystem — in one riverside campus.
            </p>
          </div>

          <div className="grid auto-rows-min grid-cols-2 gap-4 md:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <HighlightCard key={h.id} h={h} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Academics ──────────────────────────────────────── */}
      <section
        id="academics"
        className="scroll-mt-24 border-y border-slate-200 bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8B0000]">
                Academics
              </p>
              <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#0F2537] md:text-4xl">
                Programmes &amp; departments
              </h2>
              <p className="mt-3 text-slate-600">
                Autonomous, outcome-based curriculum across engineering and
                management, supported by dedicated labs, libraries and staff wings.
              </p>
            </div>
            <Link
              href="/campus-view"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#8B0000] transition hover:text-[#A31D1D]"
            >
              View floor blueprints <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ACADEMICS.map((a, i) => {
              const Icon = ACADEMIC_ICONS[a.id as keyof typeof ACADEMIC_ICONS];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#8B0000]/35 hover:shadow-lg"
                >
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2537] text-white">
                    <Icon size={20} />
                  </span>
                  <h3 className="font-heading text-base font-bold text-[#0F2537]">
                    {a.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {a.desc}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#8B0000]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8B0000]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Placements ─────────────────────────────────────── */}
      <section id="placements" className="scroll-mt-24 bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8B0000]">
              Placements
            </p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#0F2537] md:text-4xl">
              Careers that start on campus
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              A dedicated Department of Placement &amp; Training prepares students
              with aptitude, group discussions and interview rounds — with
              recruiters visiting every season and 22 student start-ups incubated
              on campus.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PLACEMENT_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-[#8B0000]/35 hover:shadow-md"
                >
                  <p className="font-heading text-2xl font-extrabold text-[#8B0000]">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={openDrawer}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0F2537] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#14324c]"
            >
              Track your progress on EduPulse <ArrowRight size={15} />
            </button>
          </div>

          <div className="rounded-3xl border border-[#0F2537] bg-[#0F2537] p-7 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300">
              <Handshake size={16} className="text-[#E8A87C]" />
              Hiring partners
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {RECRUITERS.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#E8A87C]/50 hover:text-white"
                >
                  {r}
                </span>
              ))}
            </div>
            <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
              * Illustrative recruiter list — live placement data arrives with the
              EduPulse placements module.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA band ───────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#8B0000] to-[#A31D1D] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
              Experience the campus before you visit
            </h2>
            <p className="mt-3 text-red-100">
              Tour the galleries, zoom into architectural blueprints and navigate
              all six floors in 3D — right from your browser.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/campus-view"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-[#8B0000] transition hover:-translate-y-0.5 hover:bg-red-50"
            >
              Open Campus View <MapPin size={16} />
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              EduPulse Login
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="bg-[#0F2537] text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <span className="font-heading text-sm font-extrabold leading-tight text-white">
                Sahyadri College of
                <br />
                Engineering &amp; Management
              </span>
            </div>
            <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-slate-400">
              <span className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#E8A87C]" />
                {CAMPUS.address}
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-[#E8A87C]" />
                {CAMPUS.phone1} · {CAMPUS.phone2}
              </span>
            </address>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-white">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-slate-400 transition hover:text-[#E8A87C]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="text-slate-400 transition hover:text-[#E8A87C]"
                >
                  EduPulse Login
                </button>
              </li>
              <li>
                <Link href="/login" className="text-slate-400 transition hover:text-[#E8A87C]">
                  Full login page
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-white">
              Accreditations
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CAMPUS.accreditation.map((a) => (
                <li key={a} className="flex items-start gap-2 text-slate-400">
                  <Award size={14} className="mt-0.5 shrink-0 text-[#E8A87C]" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-white">
              Campus
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Explore the riverfront campus in 2D and 3D: photo gallery,
              architectural blueprints of all six floors, and step-by-step indoor
              wayfinding.
            </p>
            <Link
              href="/campus-view"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#A31D1D]"
            >
              Campus View <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {CAMPUS.name} · Established by the{" "}
              {CAMPUS.foundedBy}
            </p>
            <p>
              Powered by <span className="font-semibold text-slate-300">EduPulse</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ─── Login drawer ───────────────────────────────────── */}
      <EduPulseLoginDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
