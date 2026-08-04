"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Loader2,
  Upload,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function MentorAttendance() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<any[]>([]);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  // Grace request review state
  const [graceRequests, setGraceRequests] = useState<any[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [graceMsg, setGraceMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!graceMsg) return;
    const t = setTimeout(() => setGraceMsg(null), 4000);
    return () => clearTimeout(t);
  }, [graceMsg]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: allocations } = await supabase
        .from("Allocation")
        .select(`Profile!Allocation_mentee_id_fkey(id, full_name, usn)`)
        .eq("mentor_id", user.id).eq("is_active", true);

      const menteeList = allocations?.map((a: any) => a.Profile) || [];
      setMentees(menteeList);
      if (menteeList.length > 0) setSelectedMentee(menteeList[0].id);

      // Pending grace requests from this mentor's mentees
      const menteeIds = menteeList.map((m: any) => m.id);
      if (menteeIds.length > 0) {
        const { data } = await supabase
          .from("GraceRequest")
          .select("*, student:student_id(id, full_name, usn)")
          .in("student_id", menteeIds)
          .eq("status", "Pending")
          .order("created_at", { ascending: false });
        setGraceRequests(data || []);
      } else {
        setGraceRequests([]);
      }

      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedMentee) return;
    const fetch = async () => {
      setLoadingAttendance(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("AttendanceRecord")
        .select("*")
        .eq("student_id", selectedMentee)
        .order("date", { ascending: false });
      setAttendanceData(data || []);
      setLoadingAttendance(false);
    };
    fetch();
  }, [selectedMentee]);

  const handleGraceDecision = async (id: string, status: "Approved" | "Rejected") => {
    setActingOn(id);
    setGraceMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const request = graceRequests.find((r: any) => r.id === id);

    const { error } = await supabase
      .from("GraceRequest")
      .update({ status, mentor_remarks: status === "Approved" ? "Approved by mentor" : "Rejected by mentor", reviewed_by: user?.id ?? null })
      .eq("id", id);

    if (error) {
      setGraceMsg({ ok: false, text: `Failed to update request: ${error.message}` });
    } else {
      setGraceMsg({
        ok: true,
        text: `${request?.student?.full_name ?? "Student"}'s grace request ${status === "Approved" ? "approved" : "rejected"}.`,
      });
      setGraceRequests((prev) => prev.filter((r) => r.id !== id));

      // Notify the student of the decision
      try {
        await supabase.from("Notification").insert({
          id: newId(),
          user_id: request?.student_id,
          title: status === "Approved" ? "Grace Request Approved" : "Grace Request Rejected",
          message: `Your grace request for ${request?.subject_name ?? "attendance"} was ${status.toLowerCase()} by your mentor.`,
          category: "Academic",
          link: "/student/academics",
        });
      } catch {
        // best-effort
      }
    }
    setActingOn(null);
  };

  const subjectSummary = attendanceData.reduce((acc: any, rec: any) => {
    if (!acc[rec.subject_name]) acc[rec.subject_name] = { present: 0, total: 0 };
    acc[rec.subject_name].total++;
    if (rec.status === "Present") acc[rec.subject_name].present++;
    return acc;
  }, {});

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Attendance & Grace Requests</h1>
          <p className="text-text-muted text-sm mt-0.5">Monitor attendance and review student grace requests</p>
        </div>
        <Link href="/mentor/attendance/upload" className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Sheet
        </Link>
      </div>

      {graceMsg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          graceMsg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {graceMsg.text}
        </div>
      )}

      {/* Pending Grace Requests */}
      <div className="card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h2 className="font-heading font-semibold text-text-primary">Pending Grace Requests</h2>
          {graceRequests.length > 0 && (
            <span className="badge badge-danger text-[10px] ml-auto">{graceRequests.length} pending</span>
          )}
        </div>
        {graceRequests.length > 0 ? (
          <div className="space-y-3">
            {graceRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-button bg-surface border border-surface-border flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary">{req.student?.full_name ?? "Student"}</span>
                    <span className="text-xs text-text-muted font-mono">{req.student?.usn}</span>
                    <span className="badge badge-accent text-[10px]">{req.reason_type}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{req.reason}</p>
                  {req.subject_name && <p className="text-xs text-text-muted mt-0.5">Subject: {req.subject_name}</p>}
                  {req.date_from && req.date_to && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(req.date_from).toLocaleDateString("en-IN")} → {new Date(req.date_to).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGraceDecision(req.id, "Approved")}
                    disabled={actingOn === req.id}
                    className="btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleGraceDecision(req.id, "Rejected")}
                    disabled={actingOn === req.id}
                    className="btn-sm bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-text-muted text-sm flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4 opacity-40" />
            No pending grace requests.
          </div>
        )}
      </div>

      {mentees.length > 0 ? (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            {mentees.map((m) => (
              <button key={m.id} onClick={() => setSelectedMentee(m.id)}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${selectedMentee === m.id ? "bg-accent text-background" : "bg-surface text-text-muted hover:text-text-primary"}`}>
                {m.full_name}
              </button>
            ))}
          </div>

          {loadingAttendance ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : Object.keys(subjectSummary).length > 0 ? (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>Percentage</th><th>Status</th></tr></thead>
                <tbody>
                  {Object.entries(subjectSummary).map(([subject, stats]: any) => {
                    const pct = (stats.present / stats.total) * 100;
                    return (
                      <tr key={subject}>
                        <td className="font-medium">{subject}</td>
                        <td>{stats.present}</td>
                        <td>{stats.total}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-surface-border overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? "#6FCF97" : "#E07070" }} />
                            </div>
                            <span style={{ color: pct >= 75 ? "#6FCF97" : "#E07070" }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${pct >= 75 ? "badge-success" : "badge-danger"}`}>{pct >= 75 ? "Safe" : "Shortage"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card py-12 text-center text-text-muted">No attendance records for this student yet.</div>
          )}
        </>
      ) : (
        <div className="card py-12 text-center text-text-muted">No mentees assigned to you yet.</div>
      )}
    </AppShell>
  );
}
