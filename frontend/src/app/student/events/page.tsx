"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import { useUser } from "@/hooks/useUser";
import {
  eventTypeClass,
  formatEventDateTime,
  eventDateParts,
  isEventUpcoming,
} from "@/lib/events";
import {
  Loader2,
  Clock,
  MapPin,
  Users,
  Tag,
  Search,
  CheckCircle2,
  Ban,
  X,
  CalendarDays,
  CalendarCheck,
  PartyPopper,
} from "lucide-react";

const TYPE_FILTERS = ["All", "Workshop", "Hackathon", "Seminar", "Exam", "Event", "Club", "Other"];

export default function StudentEvents() {
  const { profile, loading: profileLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tab, setTab] = useState<"upcoming" | "mine">("upcoming");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const [eventsRes, regsRes] = await Promise.all([
      supabase.from("CalendarEvent").select("*").order("date", { ascending: true }),
      supabase.from("EventRegistration").select("id, event_id, student_id, registered_at"),
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

  const myIds = new Set(
    registrations.filter((r) => r.student_id === profile?.id).map((r) => r.event_id)
  );
  const myRegistrations = registrations.filter((r) => r.student_id === profile?.id);

  const countFor = (eventId: string) =>
    registrations.filter((r) => r.event_id === eventId).length;

  const isRegistered = (eventId: string) => myIds.has(eventId);
  const isFull = (e: any) => !!e.capacity && countFor(e.id) >= e.capacity;

  const handleRegister = async (eventId: string) => {
    if (!profile) return;
    setBusyId(eventId);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("EventRegistration").insert({
      id: newId(),
      event_id: eventId,
      student_id: profile.id,
      status: "registered",
    });
    if (error) {
      setMsg({ ok: false, text: `Registration failed: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "You're registered! See you at the event." });
      await fetchAll();
    }
    setBusyId(null);
  };

  const handleCancel = async (eventId: string) => {
    if (!profile) return;
    setBusyId(eventId);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("EventRegistration")
      .delete()
      .eq("event_id", eventId)
      .eq("student_id", profile.id);
    if (error) {
      setMsg({ ok: false, text: `Failed to cancel: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "Registration cancelled." });
      await fetchAll();
      if (selected) setSelected(null);
    }
    setBusyId(null);
  };

  if (loading || profileLoading) {
    return (
      <AppShell role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const upcoming = events.filter((e) => isEventUpcoming(e.date));
  const past = events.filter((e) => !isEventUpcoming(e.date));

  const list =
    tab === "upcoming"
      ? upcoming.filter((e) => {
          const matchesType = typeFilter === "All" || e.type === typeFilter;
          const q = search.trim().toLowerCase();
          const matchesSearch =
            !q ||
            (e.title?.toLowerCase().includes(q) ?? false) ||
            (e.location?.toLowerCase().includes(q) ?? false) ||
            (e.description?.toLowerCase().includes(q) ?? false);
          return matchesType && matchesSearch;
        })
      : myRegistrations
          .map((r) => events.find((e) => e.id === r.event_id))
          .filter(Boolean)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const renderCard = (e: any) => {
    const parts = eventDateParts(e.date);
    const registered = isRegistered(e.id);
    const full = isFull(e);
    const regCount = countFor(e.id);
    return (
      <div
        key={e.id}
        className="card p-5 flex flex-col hover:border-accent/30 transition-colors cursor-pointer"
        onClick={() => setSelected(e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-center bg-accent/10 rounded-xl px-3.5 py-2 min-w-[60px] flex-shrink-0">
            <div className="text-accent text-xl font-bold leading-none">{parts.day}</div>
            <div className="text-accent text-xs font-medium">{parts.month} {parts.year}</div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${eventTypeClass(e.type)}`}>
            {e.type ?? "Other"}
          </span>
        </div>

        <h3 className="font-semibold text-text-primary mt-3">{e.title}</h3>

        <div className="text-xs text-text-muted space-y-1.5 mt-2 flex-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatEventDateTime(e.date)}
          </div>
          {e.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {e.location}
            </div>
          )}
          {e.description && (
            <p className="line-clamp-2 pt-1 text-text-muted/90">{e.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border">
          <div className="text-xs text-text-muted flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-accent" />
            {regCount}{e.capacity ? ` / ${e.capacity}` : ""} registered
          </div>

          {tab === "upcoming" ? (
            <button
              disabled={busyId === e.id}
              onClick={(ev) => {
                ev.stopPropagation();
                if (registered) handleCancel(e.id);
                else if (!full) handleRegister(e.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-1 ${
                registered
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : full
                    ? "bg-surface border border-surface-border text-text-muted cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              {busyId === e.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : registered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                </>
              ) : full ? (
                "Full"
              ) : (
                "Register"
              )}
            </button>
          ) : (
            <button
              disabled={busyId === e.id}
              onClick={(ev) => {
                ev.stopPropagation();
                handleCancel(e.id);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-1 bg-danger/10 text-danger hover:bg-danger/20"
            >
              {busyId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Events</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Discover workshops, hackathons & seminars — register in one click
        </p>
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
          onClick={() => setTab("upcoming")}
          className={`px-4 py-2 text-sm font-medium rounded-input transition-colors ${tab === "upcoming" ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 text-sm font-medium rounded-input transition-colors ${tab === "mine" ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"}`}
        >
          My Events ({myRegistrations.length})
        </button>
      </div>

      {tab === "upcoming" && (
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
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  typeFilter === t
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-surface border-surface-border text-text-muted hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((e: any) => renderCard(e))}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          {tab === "upcoming" ? (
            <>
              <PartyPopper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{events.length === 0 ? "No events scheduled yet. Check back soon!" : "No events match your filters."}</p>
            </>
          ) : (
            <>
              <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>You haven&apos;t registered for any events yet.</p>
            </>
          )}
        </div>
      )}

      {past.length > 0 && tab === "upcoming" && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Recently Completed
          </h2>
          <div className="flex gap-2 flex-wrap">
            {past.slice(-4).reverse().map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className="card px-4 py-2.5 text-left text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {e.title} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="card w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-surface-border sticky top-0 bg-surface z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading font-bold text-text-primary">{selected.title}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${eventTypeClass(selected.type)}`}>
                    {selected.type ?? "Other"}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {formatEventDateTime(selected.date)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-icon ml-3 flex-shrink-0" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.location && (
                  <div className="flex items-center gap-2 text-text-primary">
                    <MapPin className="w-4 h-4 text-accent flex-shrink-0" /> {selected.location}
                  </div>
                )}
                {selected.department && (
                  <div className="flex items-center gap-2 text-text-primary">
                    <Tag className="w-4 h-4 text-accent flex-shrink-0" /> {selected.department}
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-primary">
                  <Users className="w-4 h-4 text-accent flex-shrink-0" />
                  {countFor(selected.id)}
                  {selected.capacity ? ` / ${selected.capacity}` : ""} registered
                </div>
                {selected.academic_year && (
                  <div className="flex items-center gap-2 text-text-primary">
                    <CalendarDays className="w-4 h-4 text-accent flex-shrink-0" /> {selected.academic_year}
                  </div>
                )}
              </div>

              {selected.description && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">About this event</h3>
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{selected.description}</p>
                </div>
              )}

              {tab === "upcoming" && (
                <div className="pt-2">
                  {isRegistered(selected.id) ? (
                    <button
                      disabled={busyId === selected.id}
                      onClick={() => handleCancel(selected.id)}
                      className="w-full btn-danger"
                    >
                      {busyId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Cancel Registration
                    </button>
                  ) : isFull(selected) ? (
                    <div className="w-full py-3 rounded-button text-center text-sm bg-surface border border-surface-border text-text-muted">
                      This event is full
                    </div>
                  ) : (
                    <button
                      disabled={busyId === selected.id}
                      onClick={() => handleRegister(selected.id)}
                      className="w-full btn-primary"
                    >
                      {busyId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Register for this Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
