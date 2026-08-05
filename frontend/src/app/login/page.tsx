"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, BookOpen, Users, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import AuroraBackground from "@/components/ui/AuroraBackground";
import BorderBeam from "@/components/ui/BorderBeam";
import MagneticButton from "@/components/ui/MagneticButton";
import ThemeToggle from "@/components/ui/ThemeToggle";

type Role = "mentee" | "mentor" | "admin";

const ROLE_LABELS = {
  mentee: { label: "Student", icon: BookOpen, desc: "Access your academics, achievements & mentorship" },
  mentor: { label: "Faculty / Mentor", icon: Users, desc: "Manage your mentees, courses & grades" },
  admin: { label: "Administrator", icon: Shield, desc: "Full platform oversight & management" },
};

const ROLE_COLORS: Record<Role, string> = {
  mentee: "#E8A87C",
  mentor: "#7C9E87",
  admin: "#C084FC",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("mentee");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? "Invalid email or password.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Step 2: Get user profile from Profile table
      const { data: profile, error: profileError } = await supabase
        .from("Profile")
        .select("id, role, full_name, is_active")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle() — won't throw if no row found

      if (profileError) {
        console.error("Profile query error:", profileError);
        // Don't block login — try to redirect based on email pattern
      }

      if (!profile) {
        // Profile missing — could be RLS or missing row
        // Log details to help debug
        console.error(`No profile found for auth user ID: ${userId}, email: ${authData.user.email}`);
        setError(
          `Profile not found. Please run the sync SQL in Supabase first.\n\nDebug: Auth ID = ${userId}`
        );
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

      // Step 3: Verify the account role matches the selected login tab.
      // IMPORTANT: On mismatch we return the SAME generic message as a failed
      // login so we never reveal that an email/password combo is valid or what
      // role an account holds (prevents account/role enumeration).
      const role = profile.role as Role;
      if (role !== selectedRole) {
        await supabase.auth.signOut();
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Step 4: Redirect based on role from DB
      if (role === "mentee") router.push("/student/dashboard");
      else if (role === "mentor") router.push("/mentor/dashboard");
      else if (role === "admin") router.push("/admin/dashboard");
      else {
        setError("Unknown user role. Contact your administrator.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const activeColor = ROLE_COLORS[selectedRole];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated aurora + grid background */}
      <AuroraBackground />

      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-[12%] left-[14%] w-24 h-24 rounded-full bg-accent/10 blur-2xl animate-float" />
        <div className="absolute bottom-[18%] right-[16%] w-32 h-32 rounded-full bg-highlight/10 blur-2xl animate-float-slow" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="inline-flex items-center justify-center p-2 bg-surface/70 backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-glass/10"
          >
            <Image
              src="/sahyadri-logo.png"
              alt="Sahyadri College Logo"
              width={64}
              height={64}
              className="w-auto h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="w-16 h-16 flex items-center justify-center">
              <span className="text-3xl font-heading font-bold text-gradient">EP</span>
            </div>
          </motion.div>
          <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">
            <span className="text-gradient">Edu</span>Pulse
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Sahyadri College of Engineering &amp; Management
          </p>
        </motion.div>

        {/* Role Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-1.5 mb-6 grid grid-cols-3 gap-1"
        >
          {(Object.entries(ROLE_LABELS) as [Role, (typeof ROLE_LABELS)[Role]][]).map(
            ([role, { label, icon: Icon }]) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`relative flex flex-col items-center gap-1 py-2.5 px-2 rounded-button text-xs font-medium transition-colors duration-200 ${
                  selectedRole === role ? "text-ink" : "text-text-muted hover:text-text-primary hover:bg-glass/[0.04]"
                }`}
              >
                {selectedRole === role && (
                  <motion.span
                    layoutId="login-role-pill"
                    className="absolute inset-0 rounded-button"
                    style={{
                      background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
                      boxShadow: `0 4px 18px ${activeColor}44`,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            )
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={selectedRole}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="text-center text-text-muted text-xs mb-5"
          >
            {ROLE_LABELS[selectedRole].desc}
          </motion.p>
        </AnimatePresence>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
        <BorderBeam always className="rounded-card">
          <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@sahyadri.edu.in"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
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
                  <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-2.5 whitespace-pre-line break-all">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <MagneticButton
              id="login-btn"
              type="submit"
              disabled={loading}
              strength={8}
              className="btn-primary w-full btn-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <Sparkles className="w-4 h-4 opacity-70" />
                </>
              )}
            </MagneticButton>
          </form>

          <div className="mt-4 p-3 rounded-input bg-accent/5 border border-accent/10">
            <p className="text-xs text-text-muted text-center">
              Use your Sahyadri College email and your assigned password.
            </p>
          </div>
          </div>
        </BorderBeam>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-text-muted text-xs mt-6"
        >
          © 2024 EduPulse · Sahyadri College of Engineering &amp; Management, Mangalore
        </motion.p>
      </motion.div>
    </div>
  );
}
