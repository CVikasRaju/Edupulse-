"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import EventFormModal from "@/components/events/EventFormModal";
import RegistrantsModal from "@/components/events/RegistrantsModal";
import Reveal from "@/components/ui/Reveal";
import TiltCard from "@/components/ui/TiltCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import {
  eventTypeClass,
  formatEventDateTime,
  formatEventTime,
  eventDateParts,
  EVENT_TYPES,
} from "@/lib/events";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  Tag,
  MapPin,
  Clock,
  Users,
  Search,
  CalendarCheck,
  CalendarDays,
  Ticket,
  PartyPopper,
} from "lucide-react";

export default function AdminEvents() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [regEvent, setRegEvent] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const [eventsRes, regsRes] = await Promise.all([
      supabase.from("CalendarEvent").select("*").order("date", { ascending: true }),
      supabase
        .from("EventRegistration")
        .select("id, event_id, student_id, registered_at, student:Profile(id, full_name, usn, email, department, year)"),
    ]);
    setEvents(eventsRes.data || []);
    setRegistrations(regsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? Student registrations for it will also be removed.")) return;
    setDeletingId(id);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("CalendarEvent").delete().eq("id", id);
    if (error) {
      setMsg({ ok: false, text: `Failed to delete event: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "Event deleted." });
      fetchAll();
    }
    setDeletingId(null);
  };

  const countFor = (eventId: string) =>
    registrations.filter((r) => r.event_id === eventId).length;

  const filtered = events.filter((e) => {
    const matchesType = typeFilter === "All" || e.type === typeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (e.title?.toLowerCase().includes(q) ?? false) ||
      (e.location?.toLowerCase().includes(q) ?? false) ||
      (e.department?.toLowerCase().includes(q) ?? false);
    return matchesType && matchesSearch;
  });

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarCheck, color: "text-accent bg-accent/10" },
    { label: "Upcoming", value: upcoming.length, icon: PartyPopper, color: "text-highlight bg-highlight/10" },
    { label: "Past", value: past.length, icon: CalendarDays, color: "text-text-muted bg-text-muted/10" },
    { label: "Registrations", value: registrations.length, icon: Ticket, color: "text-secondary bg-secondary/10" },
  ];

  return (
    <AppShell role="admin">
      <Reveal>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Event Management</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Create and manage workshops, hackathons, seminars & campus events
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => (
          <Reveal key={s.label} delay={idx * 0.07} className="h-full">
            <TiltCard intensity={6} className="h-full">
            <div className="card p-4 flex items-center gap-3 h-full">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-text-primary leading-tight">
                  <AnimatedCounter value={s.value} />
                </div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
            </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="input pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none w-auto"
        >
          <option value="All">All types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Events list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((e, idx) => {
            const parts = eventDateParts(e.date);
            const regCount = countFor(e.id);
            const full = e.capacity && regCount >= e.capacity;
            return (
              <Reveal key={e.id} delay={Math.min(idx * 0.04, 0.3)}>
              <div className="card p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-300">
                <div className="text-center bg-accent/10 rounded-xl px-3.5 py-2 min-w-[60px] flex-shrink-0">
                  <div className="text-accent text-xl font-bold leading-none">{parts.day}</div>
                  <div className="text-accent text-xs font-medium">{parts.month} {parts.year}</div>
                </div>

                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary">{e.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${eventTypeClass(e.type)}`}>
                      {e.type ?? "Other"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatEventDateTime(e.date)}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                    {e.department && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{e.department}</span>}
                  </div>
                  {e.description && (
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-1">{e.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className={`text-center px-3 py-1.5 rounded-lg border ${full ? "border-danger/30 bg-danger/10" : "border-surface-border bg-surface"}`}>
                    <div className="text-xs font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-accent" />
                      {regCount}{e.capacity ? ` / ${e.capacity}` : ""}
                    </div>
                    <div className="text-[10px] text-text-muted">{full ? "Full" : "Registered"}</div>
                  </div>

                  <button
                    onClick={() => setRegEvent(e)}
                    className="btn-ghost text-xs"
                    title="View registrations"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => setEditTarget(e)}
                    className="btn-icon text-text-muted hover:text-accent"
                    title="Edit event"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={deletingId === e.id}
                    className="btn-icon text-text-muted hover:text-danger"
                    title="Delete event"
                  >
                    {deletingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{events.length === 0 ? "No events yet. Create your first event!" : "No events match your filters."}</p>
        </div>
      )}

      <AnimatePresence>
      {showCreate && (
        <EventFormModal
          open
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setMsg({ ok: true, text: "Event created and published to students." });
            fetchAll();
          }}
        />
      )}

      {editTarget && (
        <EventFormModal
          open
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setMsg({ ok: true, text: "Event updated." });
            fetchAll();
          }}
        />
      )}

      {regEvent && (
        <RegistrantsModal
          event={regEvent}
          registrants={registrations.filter((r) => r.event_id === regEvent.id)}
          onClose={() => setRegEvent(null)}
        />
      )}
      </AnimatePresence>
    </AppShell>
  );
}
