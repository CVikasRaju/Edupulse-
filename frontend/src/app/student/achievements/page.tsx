"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import Reveal from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { Plus, Trophy, Award, Search, Filter, Calendar, X, Loader2, AlertCircle } from "lucide-react";

export default function StudentAchievements() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchAchs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("Achievement")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      setAchievements(data || []);
      setLoading(false);
    };
    fetchAchs();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("Achievement").insert({
      id: newId(),
      student_id: user.id,
      title: fd.get("title") as string,
      category: fd.get("category") as string,
      issuing_body: fd.get("issuing_body") as string,
      date: new Date(fd.get("date") as string).toISOString(),
      level: fd.get("level") as string,
      status: "Pending",
      nba_points: 0
    });

    if (error) {
      setFormError(error.message || "Failed to add achievement. Please try again.");
    } else {
      setShowModal(false);
      window.location.reload();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AppShell role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="student">
      <Reveal>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">Achievements</h1>
          <p className="text-text-muted text-sm mt-0.5">Track and manage your accomplishments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Achievement
        </button>
      </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.length > 0 ? (
          achievements.map((ach, idx) => (
            <Reveal key={ach.id} delay={Math.min(idx * 0.06, 0.4)}>
            <div className="card p-5 group hover:border-accent/40 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className={`badge ${ach.status === "Verified" ? "badge-success" : "badge-accent"}`}>
                  {ach.status}
                </span>
              </div>
              <h3 className="font-heading font-bold text-text-primary text-lg">{ach.title}</h3>
              <p className="text-text-muted text-sm mt-1 mb-4">{ach.issuing_body}</p>
              <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(ach.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />{ach.level}</div>
              </div>
            </div>
            </Reveal>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">
            No achievements found. Click the button to add your first one!
          </div>
        )}
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="card w-full max-w-lg shadow-2xl"
          >
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
              <div>
                <label className="label">Title</label>
                <input type="text" name="title" required className="input" placeholder="e.g. Smart India Hackathon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <input type="text" name="category" required className="input" placeholder="e.g. Technical" />
                </div>
                <div>
                  <label className="label">Level</label>
                  <select name="level" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option value="College">College</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Issuing Body</label>
                <input type="text" name="issuing_body" required className="input" placeholder="e.g. Ministry of Education" />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" name="date" required className="input" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Achievement
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
