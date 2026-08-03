"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  MapPin,
  Video,
  AlertCircle,
} from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return [`${h}:00`, `${h}:30`];
}).flat();

export default function MentorSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [tab, setTab] = useState<"availability" | "sessions">("availability");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [formDay, setFormDay] = useState(1);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("09:30");
  const [formDuration, setFormDuration] = useState(30);
  const [formLocation, setFormLocation] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [availRes, sessionsRes, allocsRes] = await Promise.all([
      supabase.from("MentorAvailability").select("*").eq("mentor_id", user.id).eq("is_active", true).order("day_of_week"),
      supabase.from("MentorSession").select("*, mentee:mentee_id(full_name, usn, email)").eq("mentor_id", user.id).order("date", { ascending: false }).limit(50),
      supabase.from("Allocation").select("*, mentee:mentee_id(id, full_name, usn)").eq("mentor_id", user.id).eq("is_active", true),
    ]);

    setAvailabilities(availRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setMentees((allocsRes.data ?? []).map((a: any) => a.mentee).filter(Boolean));
    setLoading(false);
  };

  const handleAddAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/scheduling/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: formDay,
          start_time: formStart,
          end_time: formEnd,
          duration_minutes: formDuration,
          location: formLocation || undefined,
        }),
      });

      if (res.ok) {
        const { availability } = await res.json();
        setAvailabilities((prev) => [...prev, availability].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)));
        setShowAddForm(false);
        setFormLocation("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add availability");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    const res = await fetch(`/api/scheduling/availability?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleUpdateSession = async (id: string, status: string) => {
    const res = await fetch("/api/scheduling/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
  };

  // Group availability by day
  const byDay: Record<number, any[]> = {};
  for (const a of availabilities) {
    if (!byDay[a.day_of_week]) byDay[a.day_of_week] = [];
    byDay[a.day_of_week].push(a);
  }

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled");
  const pastSessions = sessions.filter((s) => s.status !== "scheduled");

  if (loading) {
    return (
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Schedule</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage your availability and mentorship sessions</p>
        </div>
        {tab === "availability" && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Availability
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "availability", label: "Availability", icon: Clock },
          { key: "sessions", label: "Sessions", icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all ${
              tab === key ? "bg-accent text-background" : "bg-surface border border-surface-border text-text-muted hover:border-accent/30"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Availability Tab */}
      {tab === "availability" && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div key={day} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-text-primary text-sm">{DAYS[day]}</h3>
                {byDay[day]?.length > 0 && (
                  <span className="badge badge-accent text-[10px]">{byDay[day].length} slot{byDay[day].length > 1 ? "s" : ""}</span>
                )}
              </div>
              {byDay[day]?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {byDay[day].map((slot: any) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-button bg-accent-light border border-accent/20 text-sm"
                    >
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span className="text-text-primary font-medium">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <span className="text-text-muted text-xs">({slot.duration_minutes}min)</span>
                      {slot.location && (
                        <span className="text-text-muted text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {slot.location}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAvailability(slot.id)}
                        className="text-text-muted hover:text-danger transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-xs">No availability set</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sessions Tab */}
      {tab === "sessions" && (
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Upcoming Sessions ({upcomingSessions.length})
            </h3>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="card p-4 flex items-center gap-4">
                    <div className="text-center flex-shrink-0 w-14">
                      <div className="text-lg font-heading font-bold text-accent">
                        {new Date(session.date).getDate()}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(session.date).toLocaleDateString("en-IN", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">{session.mentee?.full_name ?? "Student"}</span>
                        <span className="badge badge-accent text-[10px]">{session.type}</span>
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.start_time} - {session.end_time}</span>
                        {session.topic && <span>📋 {session.topic}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateSession(session.id, "completed")}
                        className="btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateSession(session.id, "cancelled")}
                        className="btn-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
                        title="Cancel"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
                {pastSessions.slice(0, 20).map((session) => (
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
                      <div className="text-sm text-text-primary">{session.mentee?.full_name ?? "Student"}</div>
                      <div className="text-xs text-text-muted">{session.start_time} - {session.end_time}</div>
                    </div>
                    <span className={`badge text-[10px] ${
                      session.status === "completed" ? "badge-success" :
                      session.status === "cancelled" ? "badge-danger" :
                      session.status === "no_show" ? "badge-danger" : "badge-accent"
                    }`}>
                      {session.status === "no_show" ? "No Show" : session.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Availability Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Availability</h2>
              <button onClick={() => setShowAddForm(false)} className="btn-icon">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Day of Week</label>
                <select value={formDay} onChange={(e) => setFormDay(Number(e.target.value))} className="input">
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <select value={formStart} onChange={(e) => setFormStart(e.target.value)} className="input">
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">End Time</label>
                  <select value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="input">
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Session Duration (minutes)</label>
                <select value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} className="input">
                  {[15, 20, 30, 45, 60].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Location (optional)</label>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Room 301 or Google Meet"
                  className="input"
                />
              </div>
            </div>
            <div className="p-5 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleAddAvailability} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
