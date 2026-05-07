"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, BookOpen, Users, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Role = "mentee" | "mentor" | "admin";

const ROLE_LABELS = {
  mentee: { label: "Student", icon: BookOpen, desc: "Access your academics, achievements & mentorship" },
  mentor: { label: "Faculty / Mentor", icon: Users, desc: "Manage your mentees, courses & grades" },
  admin: { label: "Administrator", icon: Shield, desc: "Full platform oversight & management" },
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

      // Step 3: Redirect based on role from DB
      const role = profile.role as Role;
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,168,124,0.07) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,158,135,0.06) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-surface rounded-2xl mb-4 shadow-xl border border-surface-border">
            <img
              src="/sahyadri-logo.png"
              alt="Sahyadri College Logo"
              className="w-auto h-16 object-contain"
              onError={(e) => {
                // Fallback if logo not found
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="w-16 h-16 flex items-center justify-center">
              <span className="text-3xl font-heading font-bold text-accent">EP</span>
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">EduPulse</h1>
          <p className="text-text-muted text-sm mt-1">
            Sahyadri College of Engineering &amp; Management
          </p>
        </div>

        {/* Role Selector */}
        <div className="card p-1.5 mb-6 grid grid-cols-3 gap-1">
          {(Object.entries(ROLE_LABELS) as [Role, (typeof ROLE_LABELS)[Role]][]).map(
            ([role, { label, icon: Icon }]) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-button text-xs font-medium transition-all duration-200 ${
                  selectedRole === role
                    ? "bg-accent text-background shadow-sm"
                    : "text-text-muted hover:text-text-primary hover:bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            )
          )}
        </div>

        <p className="text-center text-text-muted text-xs mb-5">
          {ROLE_LABELS[selectedRole].desc}
        </p>

        {/* Form Card */}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-2.5 whitespace-pre-line break-all">
                {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-input bg-accent/5 border border-accent/10">
            <p className="text-xs text-text-muted text-center">
              Use your Sahyadri College email and your assigned password.
            </p>
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          © 2024 EduPulse · Sahyadri College of Engineering &amp; Management, Mangalore
        </p>
      </div>
    </div>
  );
}
