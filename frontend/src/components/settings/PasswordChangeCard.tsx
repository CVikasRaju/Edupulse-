"use client";

// EduPulse — Change Password card (shared by all roles)
// Verifies the current password, then updates it via Supabase Auth.

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { KeyRound, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function PasswordChangeCard() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (newPw.length < 6) {
      setMsg({ ok: false, text: "New password must be at least 6 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ ok: false, text: "New password and confirmation do not match." });
      return;
    }
    if (currentPw === newPw) {
      setMsg({ ok: false, text: "New password must be different from the current one." });
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        setMsg({ ok: false, text: "Not authenticated. Please log in again." });
        setBusy(false);
        return;
      }

      // 1) Verify the current password is correct before allowing a change
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInError) {
        setMsg({ ok: false, text: "Current password is incorrect." });
        setBusy(false);
        return;
      }

      // 2) Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPw,
      });
      if (updateError) {
        setMsg({ ok: false, text: `Failed to update password: ${updateError.message}` });
        setBusy(false);
        return;
      }

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setMsg({ ok: true, text: "Password updated successfully." });
    } catch {
      setMsg({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-semibold text-text-primary">Change Password</h3>
      </div>
      <p className="text-xs text-text-muted mb-5 ml-12">
        Verify your current password, then set a new one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              className="input pr-10"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              aria-label={showPw ? "Hide passwords" : "Show passwords"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">New Password</label>
            <input
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="input"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="input"
              placeholder="Re-enter new password"
            />
          </div>
        </div>

        {msg && (
          <div
            className={`flex items-start gap-2 text-sm rounded-input px-4 py-3 border ${
              msg.ok
                ? "bg-success/10 text-success border-success/20"
                : "bg-danger/10 text-danger border-danger/20"
            }`}
          >
            {msg.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span className="break-all">{msg.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {busy ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
