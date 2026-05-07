"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mail,
  Phone,
  X,
  Loader2,
} from "lucide-react";

export default function StudentMentorship() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [allocationRes, interactionsRes] = await Promise.all([
        supabase.from("Allocation").select("*, mentor:mentor_id(*)").eq("mentee_id", user.id).eq("is_active", true).maybeSingle(),
        supabase.from("Interaction").select("*").eq("mentee_id", user.id).order("date", { ascending: false }),
      ]);

      setData({
        allocation: allocationRes.data,
        mentor: allocationRes.data?.mentor ?? null,
        interactions: interactionsRes.data ?? [],
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    const supabase = createClient();
    await supabase.from("Interaction").update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() }).eq("id", id);
    setData((prev: any) => ({
      ...prev,
      interactions: prev.interactions.map((i: any) => i.id === id ? { ...i, is_acknowledged: true } : i),
    }));
  };

  if (loading) {
    return (
      <AppShell role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const mentor = data?.mentor;
  const interactions = data?.interactions ?? [];
  const pendingAck = interactions.filter((i: any) => !i.is_acknowledged);

  return (
    <AppShell role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Mentorship</h1>
        <p className="text-text-muted text-sm mt-0.5">Your mentor &amp; interaction history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor Profile Card */}
        <div className="lg:col-span-1">
          {mentor ? (
            <div className="card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 text-accent text-2xl font-bold">
                {mentor.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="font-heading font-bold text-text-primary text-lg">{mentor.full_name}</h2>
              <p className="text-text-muted text-sm">{mentor.designation}</p>
              <p className="text-text-muted text-xs">{mentor.department}</p>
              <div className="mt-2">
                <span className="badge badge-secondary">{mentor.employee_id}</span>
              </div>

              <div className="mt-5 space-y-2 text-left">
                {mentor.email && (
                  <a href={`mailto:${mentor.email}`} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{mentor.email}</span>
                  </a>
                )}
                {mentor.phone && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {mentor.phone}
                  </div>
                )}
              </div>

              <button onClick={() => setShowRequestModal(true)} className="btn-ghost btn-sm mt-5 w-full">
                <MessageSquare className="w-3.5 h-3.5" />
                Request Session
              </button>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
              <p className="text-text-muted">No mentor assigned yet.</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card p-5 mt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Sessions</span>
                <span className="font-semibold text-text-primary">{interactions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Pending Acknowledgement</span>
                <span className={`font-semibold ${pendingAck.length > 0 ? "text-danger" : "text-success"}`}>
                  {pendingAck.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Duration</span>
                <span className="font-semibold text-text-primary">
                  {interactions.reduce((s: number, i: any) => s + (i.duration_minutes || 0), 0)} mins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interaction Timeline */}
        <div className="lg:col-span-2">
          {pendingAck.length > 0 && (
            <div className="mb-4 p-4 rounded-card bg-danger/10 border border-danger/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-danger">
                  {pendingAck.length} session{pendingAck.length > 1 ? "s" : ""} awaiting your acknowledgement
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Please acknowledge your mentor's interaction logs.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {interactions.map((interaction: any) => (
              <div key={interaction.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`badge ${
                        interaction.type === "Academic" ? "badge-accent" :
                        interaction.type === "Career" ? "badge-secondary" :
                        interaction.type === "Personal" ? "badge-highlight" : "badge-accent"
                      }`}>{interaction.type}</span>
                      <span className="badge bg-surface-border/50 text-text-muted">{interaction.mode}</span>
                      {interaction.is_acknowledged ? (
                        <span className="text-xs flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-3 h-3" /> Acknowledged
                        </span>
                      ) : (
                        <span className="text-xs flex items-center gap-1 text-danger">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                      <Calendar className="w-3 h-3" />
                      {new Date(interaction.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {interaction.duration_minutes && (
                        <span className="ml-2">· {interaction.duration_minutes} minutes</span>
                      )}
                    </div>

                    {interaction.topics && (
                      <div className="mb-2">
                        <div className="text-xs text-text-muted font-medium mb-1">Topics Discussed</div>
                        <p className="text-sm text-text-primary">{interaction.topics}</p>
                      </div>
                    )}

                    {interaction.remarks && (
                      <div className="mb-2">
                        <div className="text-xs text-text-muted font-medium mb-1">Mentor Remarks</div>
                        <p className="text-sm text-text-muted italic">"{interaction.remarks}"</p>
                      </div>
                    )}

                    {interaction.follow_up_required && (
                      <div className={`mt-2 text-xs rounded-input px-3 py-2 flex items-center gap-2 ${
                        interaction.is_follow_up_resolved
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-accent/10 text-accent border border-accent/20"
                      }`}>
                        {interaction.is_follow_up_resolved ? (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        )}
                        Follow-up: {interaction.follow_up_notes}
                        {interaction.is_follow_up_resolved && " ✓ Resolved"}
                      </div>
                    )}
                  </div>

                  {!interaction.is_acknowledged && (
                    <button onClick={() => handleAcknowledge(interaction.id)} className="btn-primary btn-sm flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}

            {interactions.length === 0 && (
              <div className="card p-12 text-center">
                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
                <p className="text-text-muted">No interactions logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Session Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Request Mentor Session</h2>
              <button onClick={() => setShowRequestModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowRequestModal(false); }} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preferred Date</label>
                  <input type="date" name="date" required className="input text-sm" style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="label">Meeting Mode</label>
                  <select name="mode" required className="input bg-surface border-surface-border text-text-primary h-[42px] px-3 rounded-input outline-none focus:border-accent">
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Session Type</label>
                <select name="type" required className="input bg-surface border-surface-border text-text-primary h-[42px] px-3 rounded-input outline-none focus:border-accent">
                  <option value="Academic">Academic Guidance</option>
                  <option value="Career">Career &amp; Placement</option>
                  <option value="Personal">Personal/General</option>
                </select>
              </div>
              <div>
                <label className="label">Topics to Discuss</label>
                <textarea name="topics" rows={3} required className="input py-2" placeholder="Briefly list the topics..." />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
