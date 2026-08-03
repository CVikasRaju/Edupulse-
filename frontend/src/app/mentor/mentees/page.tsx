"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  User,
  Loader2,
  X,
  Calendar,
  Clock,
  MessageSquare,
  Trophy,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

export default function MentorMentees() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // View Profile modal state
  const [selectedMentee, setSelectedMentee] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Add Interaction modal state
  const [interactionMentee, setInteractionMentee] = useState<any>(null);
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    duration_minutes: "30",
    type: "Academic",
    mode: "In-Person",
    topics: "",
    remarks: "",
    follow_up_required: false,
    follow_up_notes: "",
    next_interaction_date: "",
  });
  const [interactionError, setInteractionError] = useState("");

  useEffect(() => {
    const fetchMentees = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get allocations for this mentor
      const { data: allocations } = await supabase
        .from("Allocation")
        .select(`
          id,
          Profile!Allocation_mentee_id_fkey (
            id,
            full_name,
            email,
            usn,
            department,
            year,
            section
          )
        `)
        .eq("mentor_id", user.id)
        .eq("is_active", true);

      const menteesList = allocations?.map((a: any) => a.Profile) || [];
      setMentees(menteesList);
      setLoading(false);
    };
    fetchMentees();
  }, []);

  const fetchMenteeDetails = async (menteeId: string) => {
    setDetailsLoading(true);
    setDetails(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [gradesRes, attendanceRes, achievementsRes, interactionsRes] = await Promise.all([
      supabase.from("Grade").select("*").eq("student_id", menteeId).order("semester", { ascending: true }),
      supabase.from("AttendanceRecord").select("*").eq("student_id", menteeId).order("date", { ascending: false }).limit(20),
      supabase.from("Achievement").select("*").eq("student_id", menteeId).order("created_at", { ascending: false }),
      supabase.from("Interaction").select("*").eq("mentee_id", menteeId).eq("mentor_id", user?.id).order("date", { ascending: false }).limit(10),
    ]);

    const grades = gradesRes.data ?? [];
    const attendance = attendanceRes.data ?? [];
    const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
    const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : null;
    const latestCgpa = grades.length > 0 ? (grades[grades.length - 1]?.cgpa ?? 0) : null;

    setDetails({
      grades,
      attendance,
      attendancePct,
      latestCgpa,
      achievements: achievementsRes.data ?? [],
      interactions: interactionsRes.data ?? [],
    });
    setDetailsLoading(false);
  };

  const openProfile = async (mentee: any) => {
    setSelectedMentee(mentee);
    await fetchMenteeDetails(mentee.id);
  };

  const openInteractionModal = (mentee: any) => {
    setInteractionError("");
    setInteractionForm({
      date: new Date().toISOString().split("T")[0],
      duration_minutes: "30",
      type: "Academic",
      mode: "In-Person",
      topics: "",
      remarks: "",
      follow_up_required: false,
      follow_up_notes: "",
      next_interaction_date: "",
    });
    setInteractionMentee(mentee);
  };

  const handleAddInteraction = async () => {
    if (!interactionMentee) return;
    setSavingInteraction(true);
    setInteractionError("");

    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentee_id: interactionMentee.id,
          date: interactionForm.date,
          duration_minutes: interactionForm.duration_minutes,
          type: interactionForm.type,
          mode: interactionForm.mode,
          topics: interactionForm.topics || undefined,
          remarks: interactionForm.remarks || undefined,
          follow_up_required: interactionForm.follow_up_required,
          follow_up_notes: interactionForm.follow_up_notes || undefined,
          next_interaction_date: interactionForm.next_interaction_date || undefined,
        }),
      });

      if (res.ok) {
        setInteractionMentee(null);
        // Refresh details if profile modal is open for same student
        if (selectedMentee?.id === interactionMentee.id) {
          await fetchMenteeDetails(interactionMentee.id);
        }
      } else {
        const err = await res.json();
        setInteractionError(err.error || "Failed to add interaction");
      }
    } catch (e) {
      setInteractionError("Something went wrong. Please try again.");
    } finally {
      setSavingInteraction(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const filtered = mentees.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.usn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">Your Mentees</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage and track your assigned students</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or USN..."
            className="input pl-9 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map((m) => (
            <div key={m.id} className="card p-5 group hover:border-accent/40 transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                  {m.full_name?.[0] ?? "?"}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-text-primary group-hover:text-accent transition-colors">{m.full_name}</h3>
                  <p className="text-text-muted text-xs font-mono">{m.usn}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Department</span>
                  <span className="text-text-primary font-medium">{m.department}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Current Year</span>
                  <span className="text-text-primary font-medium">Year {m.year}{m.section ? ` · Section ${m.section}` : ""}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openProfile(m)} className="btn-ghost btn-sm flex-1 text-xs">
                  <User className="w-3.5 h-3.5" /> View Details
                </button>
                <button onClick={() => openInteractionModal(m)} className="btn-primary btn-sm flex-1 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Add Interaction
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">
            {mentees.length === 0
              ? "You don't have any mentees assigned yet."
              : "No mentees match your search."}
          </div>
        )}
      </div>

      {/* ─── View Details Modal ─────────────────────────── */}
      {selectedMentee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-surface-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold">
                  {selectedMentee.full_name?.[0] ?? "?"}
                </div>
                <div>
                  <h2 className="font-heading font-bold text-text-primary">{selectedMentee.full_name}</h2>
                  <p className="text-xs text-text-muted font-mono">{selectedMentee.usn} · {selectedMentee.department}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMentee(null)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : details ? (
                <div className="space-y-6">
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-button bg-accent/10 border border-accent/20">
                      <div className="text-[10px] text-text-muted font-medium uppercase">CGPA</div>
                      <div className="text-xl font-heading font-bold text-accent">{details.latestCgpa ?? "N/A"}</div>
                    </div>
                    <div className="p-3 rounded-button bg-secondary/10 border border-secondary/20">
                      <div className="text-[10px] text-text-muted font-medium uppercase">Attendance</div>
                      <div className="text-xl font-heading font-bold text-secondary">
                        {details.attendancePct !== null ? `${details.attendancePct}%` : "N/A"}
                      </div>
                    </div>
                    <div className="p-3 rounded-button bg-highlight/10 border border-highlight/20">
                      <div className="text-[10px] text-text-muted font-medium uppercase">Achievements</div>
                      <div className="text-xl font-heading font-bold text-highlight">{details.achievements.length}</div>
                    </div>
                    <div className="p-3 rounded-button bg-surface border border-surface-border">
                      <div className="text-[10px] text-text-muted font-medium uppercase">Sessions</div>
                      <div className="text-xl font-heading font-bold text-text-primary">{details.interactions.length}</div>
                    </div>
                  </div>

                  {/* Grades */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-accent" /> Recent Grades
                    </h3>
                    {details.grades.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-text-muted text-xs border-b border-surface-border">
                              <th className="py-2 pr-4">Sem</th>
                              <th className="py-2 pr-4">Subject</th>
                              <th className="py-2 pr-4">Grade</th>
                              <th className="py-2">SGPA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.grades.slice(-6).reverse().map((g: any) => (
                              <tr key={g.id} className="border-b border-surface-border/50">
                                <td className="py-2 pr-4 text-text-muted">{g.semester}</td>
                                <td className="py-2 pr-4 text-text-primary">{g.subject_name}</td>
                                <td className="py-2 pr-4"><span className="badge badge-accent">{g.grade_letter ?? "—"}</span></td>
                                <td className="py-2 text-text-primary">{g.sgpa ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No grade data yet.</p>
                    )}
                  </div>

                  {/* Attendance */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-secondary" /> Recent Attendance
                    </h3>
                    {details.attendance.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {details.attendance.slice(0, 12).map((a: any) => (
                          <span
                            key={a.id}
                            className={`text-[10px] px-2 py-1 rounded-button border ${
                              a.status === "Present"
                                ? "bg-success/10 text-success border-success/20"
                                : a.status === "Late"
                                ? "bg-accent/10 text-accent border-accent/20"
                                : "bg-danger/10 text-danger border-danger/20"
                            }`}
                          >
                            {a.status} · {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No attendance data yet.</p>
                    )}
                  </div>

                  {/* Achievements */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-highlight" /> Achievements
                    </h3>
                    {details.achievements.length > 0 ? (
                      <div className="space-y-2">
                        {details.achievements.slice(0, 5).map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-button bg-surface border border-surface-border">
                            <Trophy className="w-4 h-4 text-highlight flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-text-primary truncate">{a.title}</div>
                              <div className="text-xs text-text-muted">{a.category} · {a.level ?? "—"}</div>
                            </div>
                            <span className={`badge text-[10px] ${
                              a.status === "Verified" ? "badge-success" :
                              a.status === "Pending" ? "badge-accent" : "badge-danger"
                            }`}>{a.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No achievements yet.</p>
                    )}
                  </div>

                  {/* Interactions */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-secondary" /> Interaction History
                    </h3>
                    {details.interactions.length > 0 ? (
                      <div className="space-y-2">
                        {details.interactions.map((i: any) => (
                          <div key={i.id} className="p-3 rounded-button bg-surface border border-surface-border">
                            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                              <Clock className="w-3 h-3" />
                              {new Date(i.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {i.duration_minutes && <span>· {i.duration_minutes} min</span>}
                              <span className="badge badge-accent text-[10px]">{i.type ?? "General"}</span>
                            </div>
                            {i.topics && <p className="text-sm text-text-primary">{i.topics}</p>}
                            {i.remarks && <p className="text-xs text-text-muted italic mt-1">&ldquo;{i.remarks}&rdquo;</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No interactions logged yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Interaction Modal ───────────────────────── */}
      {interactionMentee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-heading font-bold text-text-primary">Add Interaction</h2>
                <p className="text-xs text-text-muted">{interactionMentee.full_name} · {interactionMentee.usn}</p>
              </div>
              <button onClick={() => setInteractionMentee(null)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={interactionForm.date}
                    onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                    className="input"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <select
                    value={interactionForm.duration_minutes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, duration_minutes: e.target.value })}
                    className="input"
                  >
                    {[15, 20, 30, 45, 60, 90].map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={interactionForm.type}
                    onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                    className="input"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="label">Mode</label>
                  <select
                    value={interactionForm.mode}
                    onChange={(e) => setInteractionForm({ ...interactionForm, mode: e.target.value })}
                    className="input"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Topics Discussed</label>
                <input
                  value={interactionForm.topics}
                  onChange={(e) => setInteractionForm({ ...interactionForm, topics: e.target.value })}
                  placeholder="e.g., Mid-sem exam prep, project guidance"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <textarea
                  value={interactionForm.remarks}
                  onChange={(e) => setInteractionForm({ ...interactionForm, remarks: e.target.value })}
                  placeholder="Notes about the session..."
                  className="input min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-button bg-surface border border-surface-border">
                <input
                  type="checkbox"
                  id="follow-up"
                  checked={interactionForm.follow_up_required}
                  onChange={(e) => setInteractionForm({ ...interactionForm, follow_up_required: e.target.checked })}
                  className="w-4 h-4 accent-accent"
                />
                <label htmlFor="follow-up" className="text-sm text-text-primary">Follow-up required</label>
              </div>

              {interactionForm.follow_up_required && (
                <>
                  <div>
                    <label className="label">Follow-up Notes</label>
                    <input
                      value={interactionForm.follow_up_notes}
                      onChange={(e) => setInteractionForm({ ...interactionForm, follow_up_notes: e.target.value })}
                      placeholder="What needs to be followed up?"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Next Interaction Date</label>
                    <input
                      type="date"
                      value={interactionForm.next_interaction_date}
                      onChange={(e) => setInteractionForm({ ...interactionForm, next_interaction_date: e.target.value })}
                      className="input"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </>
              )}

              {interactionError && (
                <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-2.5">
                  {interactionError}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setInteractionMentee(null)} className="btn-ghost">Cancel</button>
              <button
                onClick={handleAddInteraction}
                disabled={savingInteraction || !interactionForm.date}
                className="btn-primary"
              >
                {savingInteraction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Interaction
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
