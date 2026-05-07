"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Upload,
  X,
  Loader2,
} from "lucide-react";

type Tab = "attendance" | "grades" | "assignments" | "grace";

export default function StudentAcademics() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [gradesRes, attendanceRes, graceRes] = await Promise.all([
        supabase.from("Grade").select("*").eq("student_id", user.id).order("semester"),
        supabase.from("AttendanceRecord").select("*").eq("student_id", user.id).order("date", { ascending: false }),
        supabase.from("GraceRequest").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
      ]);

      const attendance = attendanceRes.data ?? [];
      const subjectMap: Record<string, { present: number; total: number; code: string }> = {};
      
      attendance.forEach((rec: any) => {
        if (!subjectMap[rec.subject_name]) {
          subjectMap[rec.subject_name] = { present: 0, total: 0, code: rec.subject_code || "N/A" };
        }
        subjectMap[rec.subject_name].total++;
        if (rec.status === "Present") subjectMap[rec.subject_name].present++;
      });

      const attendanceSummary = Object.entries(subjectMap).map(([subject, stats]: any) => ({
        subject,
        code: stats.code,
        present: stats.present,
        total: stats.total,
        percentage: (stats.present / stats.total) * 100,
      }));

      setData({
        user,
        grades: gradesRes.data ?? [],
        attendanceRecords: attendance,
        attendanceSummary,
        graceRequests: graceRes.data ?? [],
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCreateGrace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("GraceRequest").insert({
      student_id: user.id,
      reason: fd.get("reason") as string,
      reason_type: fd.get("type") as string,
      status: "Pending",
      subject_name: fd.get("subject") as string,
      date_from: new Date(fd.get("dateFrom") as string).toISOString(),
      date_to: new Date(fd.get("dateTo") as string).toISOString(),
    });

    if (!error) {
      setShowGraceModal(false);
      // Refresh data
      window.location.reload();
    }
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

  const { grades, attendanceSummary, graceRequests } = data;

  const gradeBySemester = grades.reduce((acc: any, g: any) => {
    if (!acc[g.semester]) acc[g.semester] = [];
    acc[g.semester].push(g);
    return acc;
  }, {});

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "attendance", label: "Attendance", icon: CheckCircle2 },
    { key: "grades", label: "Grades", icon: BookOpen },
    { key: "grace", label: "Grace Requests", icon: AlertTriangle },
  ];

  return (
    <AppShell role="student">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Academics</h1>
        <p className="text-text-muted text-sm mt-0.5">Real-time attendance, grades & grace requests</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface rounded-button mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === key ? "bg-accent text-background shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center">
              <div className="text-text-muted text-sm mb-1">Overall Attendance</div>
              <div className="text-4xl font-heading font-bold text-success">
                {attendanceSummary.length > 0 
                  ? Math.round(attendanceSummary.reduce((acc: number, s: any) => acc + s.percentage, 0) / attendanceSummary.length) 
                  : 0}%
              </div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-text-muted text-sm mb-1">Subjects Tracked</div>
              <div className="text-4xl font-heading font-bold text-text-primary">{attendanceSummary.length}</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-text-muted text-sm mb-1">Grace Requests</div>
              <div className="text-4xl font-heading font-bold text-accent">{graceRequests.length}</div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Subject-wise Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Present</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceSummary.map((s: any) => (
                    <tr key={s.subject}>
                      <td className="font-medium">{s.subject}</td>
                      <td className="font-mono text-text-muted text-xs">{s.code}</td>
                      <td>{s.present}</td>
                      <td>{s.total}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-border overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${s.percentage}%`,
                                background: s.percentage >= 85 ? "#6FCF97" : s.percentage >= 75 ? "#E8A87C" : "#E07070",
                              }}
                            />
                          </div>
                          <span style={{ color: s.percentage >= 85 ? "#6FCF97" : s.percentage >= 75 ? "#E8A87C" : "#E07070" }}>
                            {s.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.percentage >= 75 ? "badge-success" : "badge-danger"}`}>
                          {s.percentage >= 75 ? "Safe" : "Shortage"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="space-y-6">
          {Object.entries(gradeBySemester)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([sem, semesterGrades]: any) => (
              <div key={sem} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-text-primary">Semester {sem}</h2>
                  <div className="flex gap-3">
                    <span className="badge badge-accent">SGPA: {semesterGrades[0]?.sgpa}</span>
                    <span className="badge badge-secondary">CGPA: {semesterGrades[0]?.cgpa}</span>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>Total</th>
                      <th>Grade</th>
                      <th>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterGrades.map((g: any) => (
                      <tr key={g.id}>
                        <td className="font-medium">{g.subject_name}</td>
                        <td className="font-mono text-xs text-text-muted">{g.subject_code}</td>
                        <td className="font-semibold">{g.total_marks}</td>
                        <td>
                          <span className={`badge ${g.grade_letter === 'S' ? 'badge-success' : 'badge-accent'}`}>
                            {g.grade_letter}
                          </span>
                        </td>
                        <td>{g.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}

      {activeTab === "grace" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowGraceModal(true)} className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              New Grace Request
            </button>
          </div>
          {graceRequests.map((req: any) => (
            <div key={req.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary">{req.subject_name}</h3>
                    <span className={`badge ${req.status === "Approved" ? "badge-success" : "badge-accent"}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm mt-1">{req.reason}</p>
                </div>
                <div className="text-xs text-text-muted">{new Date(req.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGraceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">New Grace Request</h2>
              <button onClick={() => setShowGraceModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateGrace} className="p-5 space-y-4">
              <div>
                <label className="label">Subject</label>
                <input type="text" name="subject" required className="input" placeholder="Subject name..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select name="type" className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                    <option value="Medical">Medical</option>
                    <option value="Event">Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date From</label>
                  <input type="date" name="dateFrom" required className="input text-sm" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea name="reason" rows={3} required className="input py-2" placeholder="Briefly explain..."></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowGraceModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
