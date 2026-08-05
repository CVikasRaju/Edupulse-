"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
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
  AlertCircle,
  Sparkles,
} from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import Reveal from "@/components/ui/Reveal";

type Tab = "attendance" | "grades" | "assignments" | "grace";

export default function StudentAcademics() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [data, setData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
    setSubmitting(true);
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("GraceRequest").insert({
      id: newId(),
      student_id: user.id,
      reason: fd.get("reason") as string,
      reason_type: fd.get("type") as string,
      status: "Pending",
      subject_name: fd.get("subject") as string,
      date_from: new Date(fd.get("dateFrom") as string).toISOString(),
      date_to: new Date(fd.get("dateTo") as string).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setFormError(error.message || "Failed to submit grace request. Please try again.");
    } else {
      setShowGraceModal(false);
      // Refresh data
      window.location.reload();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AppShell role="student">
        <div className="flex items-center justify-center h-64 gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
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
      <Reveal>
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-text-primary">Academics</h1>
          <p className="text-text-muted text-sm mt-0.5">Real-time attendance, grades & grace requests</p>
        </div>
      </Reveal>

      <div className="flex gap-1 p-1 bg-surface rounded-button mb-6 overflow-x-auto scrollbar-hide relative">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              activeTab === key ? "text-ink" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {activeTab === key && (
              <motion.span
                layoutId="academics-tab-pill"
                className="absolute inset-0 rounded-button bg-accent shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {activeTab === "attendance" && (
        <motion.div key="attendance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Reveal delay={0.05}>
              <div className="card p-5 text-center">
                <div className="text-text-muted text-sm mb-1">Overall Attendance</div>
                <div className="text-4xl font-heading font-bold text-success">
                  <AnimatedCounter
                    value={attendanceSummary.length > 0
                      ? Math.round(attendanceSummary.reduce((acc: number, s: any) => acc + s.percentage, 0) / attendanceSummary.length)
                      : 0}
                    suffix="%"
                  />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="card p-5 text-center">
                <div className="text-text-muted text-sm mb-1">Subjects Tracked</div>
                <div className="text-4xl font-heading font-bold text-text-primary">
                  <AnimatedCounter value={attendanceSummary.length} />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="card p-5 text-center">
                <div className="text-text-muted text-sm mb-1">Grace Requests</div>
                <div className="text-4xl font-heading font-bold text-accent">
                  <AnimatedCounter value={graceRequests.length} />
                </div>
              </div>
            </Reveal>
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
                  {attendanceSummary.map((s: any, idx: number) => {
                    const color = s.percentage >= 85 ? "#6FCF97" : s.percentage >= 75 ? "#E8A87C" : "#E07070";
                    return (
                    <motion.tr
                      key={s.subject}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    >
                      <td className="font-medium">{s.subject}</td>
                      <td className="font-mono text-text-muted text-xs">{s.code}</td>
                      <td>{s.present}</td>
                      <td>{s.total}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-border overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${s.percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.9, delay: 0.1 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                              style={{ background: color }}
                            />
                          </div>
                          <span style={{ color }}>{s.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.percentage >= 75 ? "badge-success" : "badge-danger"}`}>
                          {s.percentage >= 75 ? "Safe" : "Shortage"}
                        </span>
                      </td>
                    </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "grades" && (
        <motion.div key="grades" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">
          {Object.entries(gradeBySemester)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([sem, semesterGrades]: any, semIdx: number) => (
              <Reveal key={sem} delay={semIdx * 0.06}>
              <div className="card p-5">
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
                    {semesterGrades.map((g: any, idx: number) => (
                      <motion.tr
                        key={g.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                      >
                        <td className="font-medium">{g.subject_name}</td>
                        <td className="font-mono text-xs text-text-muted">{g.subject_code}</td>
                        <td className="font-semibold">{g.total_marks}</td>
                        <td>
                          <span className={`badge ${g.grade_letter === 'S' ? 'badge-success' : 'badge-accent'}`}>
                            {g.grade_letter}
                          </span>
                        </td>
                        <td>{g.credits}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </Reveal>
            ))}
        </motion.div>
      )}

      {activeTab === "grace" && (
        <motion.div key="grace" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setShowGraceModal(true)} className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              New Grace Request
            </motion.button>
          </div>
          {graceRequests.map((req: any, idx: number) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.06, 0.4) }}
              whileHover={{ y: -2 }}
              className="card p-5"
            >
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
            </motion.div>
          ))}
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showGraceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowGraceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">New Grace Request</h2>
              <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowGraceModal(false)} className="btn-icon"><X className="w-5 h-5" /></motion.button>
            </div>
            <form onSubmit={handleCreateGrace} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{formError}</span>
                </div>
              )}
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
                  <input type="date" name="dateFrom" required className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea name="reason" rows={3} required className="input py-2" placeholder="Briefly explain..."></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowGraceModal(false)} className="btn-ghost">Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </AppShell>
  );
}
