"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { CalendarDays, Clock, Tag, Loader2 } from "lucide-react";

export default function StudentCalendar() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("CalendarEvent")
        .select("*")
        .order("date", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading) return <AppShell role="student"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = events.filter(e => new Date(e.date) < new Date());

  return (
    <AppShell role="student">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Academic Calendar</h1>
        <p className="text-text-muted text-sm mt-0.5">Upcoming and past college events</p>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <div key={event.id} className="card p-4 flex items-center gap-4">
                <div className="text-center bg-accent/10 rounded-xl px-4 py-2 min-w-[56px]">
                  <div className="text-accent text-xl font-bold">{new Date(event.date).getDate()}</div>
                  <div className="text-accent text-xs font-medium">{new Date(event.date).toLocaleString("en-IN", { month: "short" })}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                    {event.type && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{event.type}</span>}
                    {event.department && <span>{event.department}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Past Events</h2>
          <div className="space-y-3 opacity-60">
            {past.map((event) => (
              <div key={event.id} className="card p-4 flex items-center gap-4">
                <div className="text-center bg-surface rounded-xl px-4 py-2 min-w-[56px]">
                  <div className="text-text-muted text-xl font-bold">{new Date(event.date).getDate()}</div>
                  <div className="text-text-muted text-xs font-medium">{new Date(event.date).toLocaleString("en-IN", { month: "short" })}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{event.title}</h3>
                  {event.type && <span className="text-xs text-text-muted">{event.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="card py-16 text-center text-text-muted">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No events scheduled.</p>
        </div>
      )}
    </AppShell>
  );
}
