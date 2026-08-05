"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import Reveal from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Plus,
  X,
  Loader2,
  Trash2,
  Tag,
} from "lucide-react";

export default function AdminCalendar() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("CalendarEvent")
      .select("*")
      .order("date", { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from("CalendarEvent").insert({
      id: newId(),
      title: fd.get("title") as string,
      type: fd.get("type") as string,
      date: new Date(fd.get("date") as string).toISOString(),
      department: (fd.get("department") as string) || null,
      academic_year: (fd.get("academic_year") as string) || null,
    });

    if (error) {
      setMsg({ ok: false, text: `Failed to create event: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "Event added to the academic calendar." });
      setShowModal(false);
      fetchEvents();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this calendar event?")) return;
    setDeletingId(id);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("CalendarEvent").delete().eq("id", id);
    if (error) {
      setMsg({ ok: false, text: `Failed to delete event: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "Event deleted." });
      fetchEvents();
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  return (
    <AppShell role="admin">
      <Reveal>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Academic Calendar</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage exams, holidays, and events shown to students</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>
      </Reveal>

      {msg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          msg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.length > 0 ? upcoming.map((e, eIdx) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(eIdx * 0.04, 0.3), duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-button bg-surface border border-surface-border group hover:border-accent/30 transition-colors"
              >
                <div className="text-center bg-accent/10 rounded-lg px-3 py-1.5 min-w-[52px]">
                  <div className="text-accent font-bold">{new Date(e.date).getDate()}</div>
                  <div className="text-accent text-[10px]">{new Date(e.date).toLocaleString("en-IN", { month: "short" })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{e.title}</div>
                  <div className="text-xs text-text-muted flex items-center gap-2">
                    {e.type && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{e.type}</span>}
                    {e.department && <span>{e.department}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="btn-icon text-text-muted hover:text-danger">
                  {deletingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </motion.div>
            )) : (
              <p className="text-text-muted text-sm py-6 text-center">No upcoming events.</p>
            )}
          </div>
        </div>
        </Reveal>

        <Reveal delay={0.1}>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Past ({past.length})</h2>
          <div className="space-y-2">
            {past.length > 0 ? past.slice(-15).reverse().map((e, eIdx) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(eIdx * 0.03, 0.25), duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-button bg-surface border border-surface-border opacity-70"
              >
                <div className="text-center bg-surface-border/40 rounded-lg px-3 py-1.5 min-w-[52px]">
                  <div className="text-text-muted font-bold">{new Date(e.date).getDate()}</div>
                  <div className="text-text-muted text-[10px]">{new Date(e.date).toLocaleString("en-IN", { month: "short" })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{e.title}</div>
                  {e.type && <div className="text-xs text-text-muted">{e.type}</div>}
                </div>
                <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="btn-icon text-text-muted hover:text-danger">
                  {deletingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </motion.div>
            )) : (
              <p className="text-text-muted text-sm py-6 text-center">No past events.</p>
            )}
          </div>
        </div>
        </Reveal>
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="card w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">New Calendar Event</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="label">Title</label>
                <input type="text" name="title" required className="input" placeholder="e.g. Internal Exam 2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select name="type" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option value="Exam">Exam</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Event">Event</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" name="date" required className="input text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Department (optional)</label>
                  <input type="text" name="department" className="input" placeholder="Computer Science" />
                </div>
                <div>
                  <label className="label">Academic Year (optional)</label>
                  <input type="text" name="academic_year" className="input" placeholder="2025-26" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                  Add Event
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
