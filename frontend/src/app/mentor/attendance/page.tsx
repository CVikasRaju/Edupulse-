"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle2, XCircle, Clock, Search, Loader2, Upload } from "lucide-react";
import Link from "next/link";

export default function MentorAttendance() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<any[]>([]);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

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
          <h1 className="text-2xl font-heading font-bold text-text-primary">Attendance Tracker</h1>
          <p className="text-text-muted text-sm mt-0.5">Monitor attendance for your mentees</p>
        </div>
        <Link href="/mentor/attendance/upload" className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Sheet
        </Link>
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
