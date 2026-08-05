"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import Reveal from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Plus,
  Loader2,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  CalendarDays,
} from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const getNextOccurrence = (dayOfWeek: number) => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const next = new Date(now);
    next.setDate(next.getDate() + daysUntil);
    return next.toISOString().split("T")[0];
  };

  const fetchData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [allocRes, sessionsRes] = await Promise.all([
      supabase.from("Allocation").select("*, mentor:mentor_id(*)").eq("mentee_id", user.id).eq("is_active", true).maybeSingle(),
      supabase.from("MentorSession").select("*, mentor:mentor_id(full_name, email)").eq("mentee_id", user.id).order("date", { ascending: false }).limit(30),
    ]);

    const allocation = allocRes.data;
    if (allocation?.mentor) {
      setMentor(allocation.mentor);

      const availRes = await supabase
        .from("MentorAvailability")
        .select("*")
        .eq("mentor_id", allocation.mentor.id)
        .eq("is_active", true)
        .order("day_of_week");

      setAvailability(availRes.data ?? []);
    }

    setSessions(sessionsRes.data ?? []);
    setLoading(false);
  };

  const handleBookSession = async () => {
    if (!selectedSlot || !selectedDate || !mentor) return;
    setSaving(true);

    try {
      const res = await fetch("/api/scheduling/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: mentor.id,
          mentee_id: (await createClient().auth.getUser()).data.user?.id,
          availability_id: selectedSlot.id,
          date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          duration_minutes: selectedSlot.duration_minutes,
          topic: topic || undefined,
          notes: notes || undefined,
          location: selectedSlot.location,
        }),
      });

      if (res.ok) {
        const { session } = await res.json();
        setSessions((prev) => [session, ...prev]);
        setShowBookForm(false);
        setSelectedSlot(null);
        setSelectedDate("");
        setTopic("");
        setNotes("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to book session");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSession = async (id: string) => {
    const res = await fetch("/api/scheduling/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    if (res.ok) {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));
    }
  };

  // Group availability by day
  const byDay: Record<number, any[]> = {};
  for (const a of availability) {
    if (!byDay[a.day_of_week]) byDay[a.day_of_week] = [];
    byDay[a.day_of_week].push(a);
  }

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled");
  const pastSessions = sessions.filter((s) => s.status !== "scheduled");

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
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Schedule Session</h1>
        <p className="text-text-muted text-sm mt-0.5">Book a mentorship session with your mentor</p>
      </div>
      </Reveal>

      {/* Mentor Info */}
      {mentor ? (
        <Reveal>
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary font-bold">
            {mentor.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h2 className="font-heading font-semibold text-text-primary">{mentor.full_name}</h2>
            <p className="text-xs text-text-muted">{mentor.designation ?? "Faculty"} · {mentor.department ?? ""}</p>
          </div>
        </div>
        </Reveal>
      ) : (
        <div className="card p-8 text-center text-text-muted mb-6">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No mentor allocated yet. Please contact your administrator.</p>
        </div>
      )}

      {/* Available Slots */}
      {mentor && availability.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Mentor&apos;s Available Slots
            </h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 0].filter((d) => byDay[d]?.length > 0).map((day, dIdx) => (
              <Reveal key={day} delay={Math.min(dIdx * 0.06, 0.3)}>
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">{DAYS[day]}</h4>
                <div className="flex flex-wrap gap-2">
                  {byDay[day].map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setSelectedDate(getNextOccurrence(slot.day_of_week));
                        setShowBookForm(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-button bg-accent-light border border-accent/20 text-sm hover:bg-accent/20 hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span className="text-text-primary font-medium">{slot.start_time} - {slot.end_time}</span>
                      {slot.location && (
                        <span className="text-text-muted text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {slot.location}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {mentor && availability.length === 0 && (
        <div className="card p-8 text-center text-text-muted mb-6">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Your mentor hasn&apos;t set up availability yet.</p>
          <p className="text-xs mt-1">Check back later or contact them directly.</p>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-6">
        {/* Upcoming */}
        <div>
          <h3 className="font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            My Sessions ({upcomingSessions.length})
          </h3>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-2">
              {upcomingSessions.map((session, idx) => (
                <Reveal key={session.id} delay={Math.min(idx * 0.05, 0.3)}>
                <div className="card p-4 flex items-center gap-4">
                  <div className="text-center flex-shrink-0 w-14">
                    <div className="text-lg font-heading font-bold text-accent">
                      {new Date(session.date).getDate()}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {new Date(session.date).toLocaleDateString("en-IN", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {session.mentor?.full_name ?? "Mentor"}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.start_time} - {session.end_time}</span>
                      {session.topic && <span>📋 {session.topic}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelSession(session.id)}
                    className="btn-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
                    title="Cancel"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-text-muted text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No upcoming sessions
            </div>
          )}
        </div>

        {/* Past */}
        {pastSessions.length > 0 && (
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-3">Past Sessions</h3>
            <div className="space-y-2">
              {pastSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="card p-3 flex items-center gap-3 opacity-70">
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="text-sm font-bold text-text-muted">
                      {new Date(session.date).getDate()}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {new Date(session.date).toLocaleDateString("en-IN", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary">{session.mentor?.full_name ?? "Mentor"}</div>
                    <div className="text-xs text-text-muted">{session.start_time} - {session.end_time}</div>
                  </div>
                  <span className={`badge text-[10px] ${
                    session.status === "completed" ? "badge-success" :
                    session.status === "cancelled" ? "badge-danger" : "badge-accent"
                  }`}>
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Session Modal */}
      {showBookForm && selectedSlot && (
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
              <h2 className="font-heading font-bold text-text-primary">Book Session</h2>
              <button onClick={() => setShowBookForm(false)} className="btn-icon">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-button bg-accent-light border border-accent/20">
                <div className="text-sm font-medium text-text-primary">{mentor?.full_name}</div>
                <div className="text-xs text-text-muted mt-1">
                  {DAYS[selectedSlot.day_of_week]} · {selectedSlot.start_time} - {selectedSlot.end_time}
                  {selectedSlot.location && ` · ${selectedSlot.location}`}
                </div>
              </div>

              <div>
                <label className="label">Preferred Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Topic (optional)</label>
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="input">
                  <option value="">Select a topic</option>
                  <option value="Academic">Academic</option>
                  <option value="Career">Career Guidance</option>
                  <option value="Personal">Personal</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="input min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-5 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setShowBookForm(false)} className="btn-ghost">Cancel</button>
              <button
                onClick={handleBookSession}
                disabled={saving || !selectedDate}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Book Session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
