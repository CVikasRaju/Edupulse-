"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import EventFormModal from "@/components/events/EventFormModal";
import RegistrantsModal from "@/components/events/RegistrantsModal";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  eventTypeClass,
  formatEventDateTime,
  eventDateParts,
  isEventUpcoming,
} from "@/lib/events";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  Clock,
  MapPin,
  Users,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";

export default function MentorEvents() {
  const { profile, loading: profileLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [regEvent, setRegEvent] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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

  if (loading || profileLoading) {
    return (
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const myEvents = events.filter((e) => e.created_by === profile?.id);
  const otherEvents = events.filter((e) => e.created_by !== profile?.id);
  const list = tab === "mine" ? myEvents : otherEvents;

  const renderEventRow = (e: any, canManage: boolean) => {
    const parts = eventDateParts(e.date);
    const regCount = countFor(e.id);
    return (
      <div key={e.id} className="card p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
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
            {e.created_by === profile?.id && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent">
                Mine
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1.5 flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatEventDateTime(e.date)}</span>
            {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
            {isEventUpcoming(e.date) ? (
              <span className="text-success">Upcoming</span>
            ) : (
              <span className="text-text-muted">Completed</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center px-3 py-1.5 rounded-lg border border-surface-border bg-surface">
            <div className="text-xs font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-accent" />
              {regCount}{e.capacity ? ` / ${e.capacity}` : ""}
            </div>
            <div className="text-[10px] text-text-muted">Registered</div>
          </div>

          {canManage ? (
            <>
              <button onClick={() => setRegEvent(e)} className="btn-ghost text-xs" title="View registrations">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button onClick={() => setEditTarget(e)} className="btn-icon text-text-muted hover:text-accent" title="Edit event">
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
            </>
          ) : (
            <button onClick={() => setRegEvent(e)} className="btn-ghost text-xs" title="View registrations">
              <Eye className="w-3.5 h-3.5" /> Registrations
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Events</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Organize workshops & sessions for your mentees, or browse campus events
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          msg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-input bg-surface border border-surface-border w-fit">
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 text-sm font-medium rounded-input transition-colors ${tab === "mine" ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"}`}
        >
          My Events ({myEvents.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium rounded-input transition-colors ${tab === "all" ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"}`}
        >
          All Campus Events ({otherEvents.length})
        </button>
      </div>

      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((e) => renderEventRow(e, tab === "mine"))}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>
            {tab === "mine"
              ? "You haven't created any events yet. Click \"New Event\" to organize one."
              : "No other campus events right now."}
          </p>
        </div>
      )}

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
    </AppShell>
  );
}
