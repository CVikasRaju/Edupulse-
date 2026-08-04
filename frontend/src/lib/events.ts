// Shared display helpers for the Event Management feature.

export const EVENT_TYPES = [
  "Workshop",
  "Hackathon",
  "Seminar",
  "Exam",
  "Event",
  "Club",
  "Holiday",
  "Submission",
  "Other",
];

const TYPE_STYLES: Record<string, string> = {
  Workshop: "bg-accent/10 text-accent border-accent/20",
  Hackathon: "bg-highlight/10 text-highlight border-highlight/20",
  Seminar: "bg-secondary/10 text-secondary border-secondary/20",
  Exam: "bg-danger/10 text-danger border-danger/20",
  Holiday: "bg-success/10 text-success border-success/20",
  Club: "bg-secondary/10 text-secondary border-secondary/20",
  Event: "bg-accent/10 text-accent border-accent/20",
  Submission: "bg-text-muted/10 text-text-muted border-text-muted/20",
  Other: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

export function eventTypeClass(type?: string | null): string {
  return TYPE_STYLES[type ?? "Other"] ?? TYPE_STYLES.Other;
}

export function formatEventDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/** Returns { day, month, year } parts for a date badge */
export function eventDateParts(iso: string): { day: string; month: string; year: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString("en-IN", { month: "short" }),
    year: String(d.getFullYear()),
  };
}

export function isEventUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}
