"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import {
  Trophy,
  Award,
  Calendar,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
} from "lucide-react";

export default function MentorAchievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  // Student achievement verification
  const [pendingAchs, setPendingAchs] = useState<any[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"verify" | "mine">("verify");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!verifyMsg) return;
    const t = setTimeout(() => setVerifyMsg(null), 4000);
    return () => clearTimeout(t);
  }, [verifyMsg]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [myRes, allocsRes] = await Promise.all([
        supabase.from("FacultyAchievement").select("*").eq("faculty_id", user.id).order("created_at", { ascending: false }),
        supabase.from("Allocation").select("mentee_id").eq("mentor_id", user.id).eq("is_active", true),
      ]);

      setAchievements(myRes.data || []);
      const menteeIds = (allocsRes.data ?? []).map((a: any) => a.mentee_id);

      // Pending achievements submitted by this mentor's mentees
      if (menteeIds.length > 0) {
        const { data } = await supabase
          .from("Achievement")
          .select("*, student:student_id(id, full_name, usn)")
          .in("student_id", menteeIds)
          .eq("status", "Pending")
          .order("created_at", { ascending: false });
        setPendingAchs(data || []);
      } else {
        setPendingAchs([]);
      }

      setLoading(false);
    };
    fetch();
  }, []);

  const handleVerify = async (id: string, status: "Verified" | "Rejected") => {
    setActingOn(id);
    setVerifyMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ach = pendingAchs.find((a: any) => a.id === id);

    const { error } = await supabase
      .from("Achievement")
      .update({ status, verified_by: user?.id ?? null, verified_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setVerifyMsg({ ok: false, text: `Failed to update: ${error.message}` });
    } else {
      setVerifyMsg({
        ok: true,
        text: `${ach?.student?.full_name ?? "Student"}'s achievement ${status === "Verified" ? "verified" : "rejected"}.`,
      });
      setPendingAchs((prev) => prev.filter((a) => a.id !== id));

      // Notify the student
      try {
        await supabase.from("Notification").insert({
          id: newId(),
          user_id: ach?.student_id,
          title: status === "Verified" ? "Achievement Verified" : "Achievement Rejected",
          message: `Your achievement "${ach?.title}" was ${status.toLowerCase()} by your mentor.`,
          category: "Achievement",
          link: "/student/achievements",
        });
      } catch {
        // best-effort
      }
    }
    setActingOn(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const { error } = await supabase.from("FacultyAchievement").insert({
      id: newId(),
      faculty_id: user.id,
      title: fd.get("title") as string,
      type: fd.get("type") as string,
      issuing_body: fd.get("issuing_body") as string,
      level: fd.get("level") as string,
      date: new Date(fd.get("date") as string).toISOString(),
    });
    if (error) {
      setFormError(error.message || "Failed to add achievement. Please try again.");
    } else {
      setShowModal(false);
      window.location.reload();
    }
    setSubmitting(false);
  };

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Achievements</h1>
          <p className="text-text-muted text-sm mt-0.5">Verify mentee achievements & track your own</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Achievement</button>
      </div>

      {verifyMsg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          verifyMsg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {verifyMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("verify")}
          className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all ${
            tab === "verify" ? "bg-accent text-background" : "bg-surface border border-surface-border text-text-muted hover:border-accent/30"
          }`}
        >
          <Users className="w-4 h-4" />
          Verify Mentees
          {pendingAchs.length > 0 && <span className="badge badge-danger text-[10px]">{pendingAchs.length}</span>}
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all ${
            tab === "mine" ? "bg-accent text-background" : "bg-surface border border-surface-border text-text-muted hover:border-accent/30"
          }`}
        >
          <Trophy className="w-4 h-4" />
          My Achievements
        </button>
      </div>

      {tab === "verify" && (
        <div className="space-y-3">
          {pendingAchs.length > 0 ? (
            pendingAchs.map((a) => (
              <div key={a.id} className="card p-4 flex items-start gap-3 flex-wrap">
                <div className="p-2.5 rounded-xl bg-highlight/10 text-highlight flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-bold text-text-primary">{a.title}</h3>
                    <span className="badge badge-accent text-[10px]">{a.category}</span>
                    {a.level && <span className="badge badge-secondary text-[10px]">{a.level}</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {a.student?.full_name} · {a.student?.usn}
                  </p>
                  {a.issuing_body && <p className="text-sm text-text-muted mt-1">{a.issuing_body}</p>}
                  {a.description && <p className="text-sm text-text-muted mt-0.5">{a.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(a.id, "Verified")}
                    disabled={actingOn === a.id}
                    className="btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => handleVerify(a.id, "Rejected")}
                    disabled={actingOn === a.id}
                    className="btn-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card py-12 text-center text-text-muted">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pending achievement verifications.</p>
            </div>
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.length > 0 ? achievements.map((a) => (
            <div key={a.id} className="card p-5 hover:border-accent/40 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="badge badge-accent">{a.type}</span>
              </div>
              <h3 className="font-heading font-bold text-text-primary">{a.title}</h3>
              <p className="text-text-muted text-sm mt-1">{a.issuing_body}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.date).toLocaleDateString()}</span>
                {a.level && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{a.level}</span>}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-text-muted card"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No achievements yet. Add your first one!</p></div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Achievement</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{formError}</span>
                </div>
              )}
              <div><label className="label">Title</label><input type="text" name="title" required className="input" placeholder="e.g. Published paper in IEEE" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type</label>
                  <select name="type" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option>Publication</option><option>Workshop</option><option>Award</option><option>Patent</option><option>Other</option>
                  </select>
                </div>
                <div><label className="label">Level</label>
                  <select name="level" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option>Institution</option><option>National</option><option>International</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Issuing Body / Journal</label><input name="issuing_body" required className="input" placeholder="e.g. IEEE Transactions" /></div>
              <div><label className="label">Date</label><input type="date" name="date" required className="input" style={{ colorScheme: "dark" }} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
