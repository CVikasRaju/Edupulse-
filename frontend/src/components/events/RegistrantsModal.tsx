"use client";

import { X, Users, GraduationCap, Mail, CalendarDays } from "lucide-react";

interface Registrant {
  id: string;
  student_id: string;
  registered_at: string;
  student?: {
    id?: string;
    full_name?: string;
    usn?: string;
    email?: string;
    department?: string;
    year?: number | null;
  } | null;
}

interface RegistrantsModalProps {
  event: { id: string; title: string; date: string; capacity?: number | null };
  registrants: Registrant[];
  onClose: () => void;
}

export default function RegistrantsModal({ event, registrants, onClose }: RegistrantsModalProps) {
  const capacity = event.capacity;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg shadow-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-text-primary truncate">{event.title}</h2>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" />
              {new Date(event.date).toLocaleString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon ml-3 flex-shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex items-center justify-between border-b border-surface-border bg-surface/60">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <Users className="w-4 h-4 text-accent" />
            <span className="font-semibold">{registrants.length}</span>
            <span className="text-text-muted">registered</span>
          </div>
          {capacity ? (
            <span className="text-xs text-text-muted">
              Capacity {capacity} · {Math.max(0, capacity - registrants.length)} seats left
            </span>
          ) : (
            <span className="text-xs text-text-muted">No capacity limit</span>
          )}
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {registrants.length > 0 ? (
            registrants.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-button bg-surface border border-surface-border">
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                  {(r.student?.full_name ?? "?")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {r.student?.full_name ?? "Unknown student"}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                    {r.student?.usn && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {r.student.usn}
                      </span>
                    )}
                    {r.student?.department && <span>{r.student.department}</span>}
                    {r.student?.year ? <span>Year {r.student.year}</span> : null}
                  </div>
                </div>
                {r.student?.email && (
                  <div className="text-xs text-text-muted flex items-center gap-1 min-w-0" title={r.student.email}>
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{r.student.email}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-text-muted">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No registrations yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
