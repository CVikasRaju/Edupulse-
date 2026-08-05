"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import { useUser } from "@/hooks/useUser";
import { CalendarDays, Loader2, X, MapPin, Users, Type, AlignLeft, Hash } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";

const EVENT_TYPES = ["Workshop", "Hackathon", "Seminar", "Exam", "Event", "Club", "Holiday", "Submission", "Other"];

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: CalendarEvent | null; // pass an event to edit, null/undefined to create
}

/** Convert ISO timestamp -> local `datetime-local` input value */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventFormModal({ open, onClose, onSaved, initial }: EventFormModalProps) {
  const { profile } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const title = String(fd.get("title") || "").trim();
    const startRaw = String(fd.get("start") || "");
    if (!title || !startRaw) {
      setError("Title and start date/time are required.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const payload = {
      title,
      type: (fd.get("type") as string) || "Event",
      date: new Date(startRaw).toISOString(),
      end_date: fd.get("end") ? new Date(fd.get("end") as string).toISOString() : null,
      location: (fd.get("location") as string)?.trim() || null,
      department: (fd.get("department") as string)?.trim() || null,
      academic_year: (fd.get("academic_year") as string)?.trim() || null,
      capacity: fd.get("capacity") ? Number(fd.get("capacity")) || null : null,
      description: (fd.get("description") as string)?.trim() || null,
    };

    if (isEdit && initial) {
      const { error: updateError } = await supabase
        .from("CalendarEvent")
        .update(payload)
        .eq("id", initial.id);
      if (updateError) {
        setError(`Failed to update event: ${updateError.message}`);
        setSubmitting(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("CalendarEvent").insert({
        ...payload,
        id: newId(),
        created_by: profile?.id ?? null,
        is_active: true,
      });
      if (insertError) {
        setError(`Failed to create event: ${insertError.message}`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    onSaved();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-surface z-10">
          <h2 className="font-heading font-bold text-text-primary">
            {isEdit ? "Edit Event" : "Create New Event"}
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Title
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              className="input"
              placeholder="e.g. AI & Data Engineering Workshop"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                name="type"
                defaultValue={initial?.type ?? "Workshop"}
                className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacity (optional)</label>
              <input
                type="number"
                name="capacity"
                min={1}
                defaultValue={initial?.capacity ?? ""}
                className="input"
                placeholder="e.g. 120"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Start (date & time)
              </label>
              <input
                type="datetime-local"
                name="start"
                required
                defaultValue={toLocalInput(initial?.date)}
                className="input text-sm"

              />
            </div>
            <div>
              <label className="label">End (optional)</label>
              <input
                type="datetime-local"
                name="end"
                defaultValue={toLocalInput(initial?.end_date)}
                className="input text-sm"

              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location (optional)
              </label>
              <input
                type="text"
                name="location"
                defaultValue={initial?.location ?? ""}
                className="input"
                placeholder="e.g. Seminar Hall 2"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Department (optional)
              </label>
              <input
                type="text"
                name="department"
                defaultValue={initial?.department ?? ""}
                className="input"
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div>
            <label className="label">Academic Year (optional)</label>
            <input
              type="text"
              name="academic_year"
              defaultValue={initial?.academic_year ?? ""}
              className="input"
              placeholder="2025-26"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description (optional)
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
              className="input resize-y"
              placeholder="What is this event about? Who should attend?"
            />
          </div>

          {error && (
            <div className="text-sm rounded-input px-4 py-3 border bg-danger/10 text-danger border-danger/20">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              {isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
