"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Role = "mentee" | "mentor" | "admin";

const ROLES: {
  key: Role;
  label: string;
  icon: typeof BookOpen;
  color: string;
}[] = [
  { key: "mentee", label: "Student", icon: BookOpen, color: "#E8A87C" },
  { key: "mentor", label: "Faculty", icon: Users, color: "#7C9E87" },
  { key: "admin", label: "Admin", icon: Shield, color: "#C084FC" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * EduPulse Login Drawer — right-side slide-in panel, "Warm Slate" aesthetic.
 * Mirrors the auth flow of /login (Supabase password sign-in + Profile role
 * check) and additionally accepts a USN / employee ID (resolved to the
 * account email via a Profile lookup before signing in).
 */
export default function EduPulseLoginDrawer({ open, onClose }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("mentee");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Esc closes · lock background scroll · focus first field */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 400);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  /** Accepts an email, USN or employee ID and resolves it to a login email. */
  const resolveEmail = async (
    supabase: ReturnType<typeof createClient>,
    raw: string,
  ): Promise<string> => {
    if (raw.includes("@")) return raw.toLowerCase();
    if (!/^[a-z0-9 .\-]+$/i.test(raw)) return raw.toLowerCase();
    try {
      const { data } = await supabase
        .from("Profile")
        .select("email")
        .or(`usn.eq.${raw},usn.eq.${raw.toUpperCase()},employee_id.eq.${raw}`)
        .limit(1)
        .maybeSingle();
      if (data?.email) return data.email.toLowerCase();
    } catch {
      /* lookup unavailable — fall back to treating input as the email */
    }
    return raw.toLowerCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const email = await resolveEmail(supabase, userId.trim());

      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        setError(authError?.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Step 2: Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("Profile")
        .select("id, role, full_name, is_active")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile query error:", profileError);
      }

      if (!profile) {
        setError("Profile not found. Please contact your administrator.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!profile.is_active) {
        setError("Your account has been deactivated. Contact your administrator.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 3: Role must match the selected tab. Same generic message as a
      // failed login so we never reveal valid credentials or account roles.
      const profileRole = profile.role as Role;
      if (profileRole !== role) {
        await supabase.auth.signOut();
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Step 4: Redirect by role
      if (role === "mentee") router.push("/student/dashboard");
      else if (role === "mentor") router.push("/mentor/dashboard");
      else router.push("/admin/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const activeColor = ROLES.find((r) => r.key === role)?.color ?? "#E8A87C";

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-label="EduPulse login"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-[#262626] bg-[#0F0F0F] shadow-[-8px_0_30px_rgba(0,0,0,0.55)] sm:w-[440px]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#262626] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8A87C] text-[#0F0F0F]">
                  <GraduationCap size={20} className="shrink-0" />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#FAFAF9]">
                    EduPulse Login
                  </h2>
                  <p className="text-xs text-[#A8A29E]">
                    Sahyadri College of Engineering &amp; Management
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close login drawer"
                className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="font-heading text-xl font-bold text-[#FAFAF9]">
                Welcome back
              </p>
              <p className="mt-1 text-sm text-[#A8A29E]">
                Sign in to your campus account to continue.
              </p>

              {/* Segmented role switcher */}
              <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-[#262626] bg-[#1A1A1A] p-1.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setRole(r.key);
                        setError("");
                      }}
                      className={`relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${
                        active ? "text-[#0F0F0F]" : "text-[#A8A29E] hover:text-[#FAFAF9]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="drawer-role-pill"
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: r.color,
                            boxShadow: `0 4px 16px ${r.color}44`,
                          }}
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon size={14} className="relative z-10" />
                      <span className="relative z-10">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="drawer-userid"
                    className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                  >
                    User ID / USN
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]"
                    />
                    <input
                      id="drawer-userid"
                      ref={inputRef}
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="College email, USN or employee ID"
                      autoComplete="username"
                      required
                      className="w-full rounded-xl border border-[#2A2A2A] bg-[#161616] py-3 pl-10 pr-4 text-sm text-[#FAFAF9] outline-none transition placeholder:text-[#78716C] focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="drawer-password"
                    className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]"
                    />
                    <input
                      id="drawer-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-[#2A2A2A] bg-[#161616] py-3 pl-10 pr-11 text-sm text-[#FAFAF9] outline-none transition placeholder:text-[#78716C] focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#78716C] transition hover:text-[#E8A87C]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="whitespace-pre-line break-words rounded-xl border border-[#7f1d1d] bg-[#2A1414] px-4 py-3 text-sm text-[#fca5a5]">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8A87C] px-5 py-3.5 text-sm font-bold text-[#0F0F0F] transition hover:bg-[#f0b98f] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ boxShadow: "0 6px 24px rgba(232,168,124,0.22)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In as {ROLES.find((r) => r.key === role)?.label}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#78716C]">
                  Students may sign in with their USN or college email.
                </p>
              </form>

              <div className="mt-6 rounded-xl border border-[#262626] bg-[#1A1A1A] p-4">
                <p className="text-xs leading-relaxed text-[#A8A29E]">
                  Signing in is protected by role verification — your account type
                  must match the selected tab.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C084FC] transition hover:text-[#d8b4fe]"
                >
                  Trouble signing in? Open the full login page
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 border-t border-[#262626] bg-[#141414] px-6 py-4">
              <Lock size={12} className="shrink-0" style={{ color: activeColor }} />
              <p className="text-center text-xs text-[#A8A29E]">
                Secure gateway to the EduPulse Campus Ecosystem.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
