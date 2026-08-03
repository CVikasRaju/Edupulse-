"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Loader2,
  Shield,
  Bell,
  CheckCircle2,
  Eye,
  X,
  Filter,
  Download,
} from "lucide-react";
import Link from "next/link";

// ─── Risk Badge ─────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const config = {
    low: { label: "On Track", class: "badge-success" },
    medium: { label: "Watch", class: "badge-accent" },
    high: { label: "At Risk", class: "badge-danger" },
    critical: { label: "Critical", class: "badge-danger" },
  }[level] ?? { label: level, class: "badge-accent" };

  return <span className={`badge ${config.class}`}>{config.label}</span>;
}

// ─── Risk Distribution Ring ─────────────────────────

function RiskRing({ counts }: { counts: { low: number; medium: number; high: number; critical: number } }) {
  const total = counts.low + counts.medium + counts.high + counts.critical;
  if (total === 0) return <div className="text-text-muted text-sm">No data</div>;

  const segments = [
    { count: counts.low, color: "#6FCF97", label: "Low" },
    { count: counts.medium, color: "#E8A87C", label: "Medium" },
    { count: counts.high, color: "#E07070", label: "High" },
    { count: counts.critical, color: "#D45F5F", label: "Critical" },
  ];

  let cumPercent = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const percent = (seg.count / total) * 100;
            const dashLength = (percent / 100) * circumference;
            const dashOffset = (cumPercent / 100) * circumference;
            cumPercent += percent;
            return (
              <circle
                key={i}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
                opacity={seg.count > 0 ? 1 : 0.2}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-heading font-bold text-text-primary">{total}</span>
          <span className="text-[10px] text-text-muted">Students</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs text-text-muted">{seg.label}</span>
            <span className="text-xs font-semibold text-text-primary ml-auto">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Department Bar ─────────────────────────────────

function DeptBar({ dept, avgCgpa, avgAttendance, atRiskCount, total }: {
  dept: string; avgCgpa: number; avgAttendance: number; atRiskCount: number; total: number;
}) {
  return (
    <div className="p-3 rounded-button hover:bg-accent-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-text-muted" />
          {dept}
        </span>
        {atRiskCount > 0 && (
          <span className="badge badge-danger text-[10px]">
            <AlertTriangle className="w-2.5 h-2.5" /> {atRiskCount} at risk
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-text-muted">Avg CGPA</span>
          <div className={`font-semibold ${avgCgpa >= 7 ? "text-success" : avgCgpa >= 5.5 ? "text-accent" : "text-danger"}`}>
            {avgCgpa.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-text-muted">Avg Attendance</span>
          <div className={`font-semibold ${avgAttendance >= 75 ? "text-success" : avgAttendance >= 60 ? "text-accent" : "text-danger"}`}>
            {avgAttendance}%
          </div>
        </div>
        <div>
          <span className="text-text-muted">Students</span>
          <div className="font-semibold text-text-primary">{total}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────

export default function AdminPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [evaluating, setEvaluating] = useState(false);

  const fetchData = async () => {
    const supabase = createClient();

    const [studentsRes, mentorsRes, allGradesRes, allAttendRes, allInteractionsRes, allAlertsRes, allocsRes, sessionsRes] =
      await Promise.all([
        supabase.from("Profile").select("*").eq("role", "mentee").eq("is_active", true),
        supabase.from("Profile").select("*").eq("role", "mentor").eq("is_active", true),
        supabase.from("Grade").select("student_id, cgpa, sgpa, semester").order("semester"),
        supabase.from("AttendanceRecord").select("student_id, status, date").order("date", { ascending: false }),
        supabase.from("Interaction").select("mentee_id, date, mentor_id").order("date", { ascending: false }),
        supabase.from("Alert").select("*, rule:rule_id(name, type, severity), student:student_id(full_name, usn, department, year)").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("Allocation").select("mentor_id, mentee_id").eq("is_active", true),
        supabase.from("MentorSession").select("mentor_id").eq("status", "scheduled").gte("date", new Date().toISOString()),
      ]);

    const students = studentsRes.data ?? [];
    const mentors = mentorsRes.data ?? [];
    const allGrades = allGradesRes.data ?? [];
    const allAttendance = allAttendRes.data ?? [];
    const allInteractions = allInteractionsRes.data ?? [];
    const allAlerts = allAlertsRes.data ?? [];
    const allocs = allocsRes.data ?? [];
    const sessions = sessionsRes.data ?? [];

    // Group data by student
    const gradeMap: Record<string, any[]> = {};
    const attendMap: Record<string, any[]> = {};
    const interactMap: Record<string, any[]> = {};
    const allocMap: Record<string, string> = {}; // mentee_id -> mentor_id

    for (const g of allGrades) {
      if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
      gradeMap[g.student_id].push(g);
    }
    for (const a of allAttendance) {
      if (!attendMap[a.student_id]) attendMap[a.student_id] = [];
      attendMap[a.student_id].push(a);
    }
    for (const i of allInteractions) {
      if (!interactMap[i.mentee_id]) interactMap[i.mentee_id] = [];
      interactMap[i.mentee_id].push(i);
    }
    for (const a of allocs) {
      allocMap[a.mentee_id] = a.mentor_id;
    }

    // Compute per-student metrics
    let riskLow = 0, riskMedium = 0, riskHigh = 0, riskCritical = 0;
    const deptStats: Record<string, { cgpaSum: number; attendSum: number; count: number; atRisk: number }> = {};
    const studentMetrics: any[] = [];

    for (const student of students) {
      const grades = gradeMap[student.id] ?? [];
      const attendance = attendMap[student.id] ?? [];
      const interactions = interactMap[student.id] ?? [];

      const latestGrade = grades[grades.length - 1];
      const cgpa = latestGrade?.cgpa ?? 0;

      const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
      const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 100;

      const riskFactors: string[] = [];
      if (cgpa < 4.0) riskFactors.push("Critical CGPA");
      else if (cgpa < 5.5) riskFactors.push("Low CGPA");
      if (attendancePct < 60) riskFactors.push("Critical Attendance");
      else if (attendancePct < 75) riskFactors.push("Low Attendance");

      const lastInteraction = interactions[0];
      const daysSinceInteraction = lastInteraction
        ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (daysSinceInteraction > 60) riskFactors.push("No recent contact");

      const hasActiveAlert = allAlerts.some((a: any) => a.student_id === student.id);
      if (hasActiveAlert) riskFactors.push("Active alerts");

      const riskLevel = riskFactors.some((f) => f.startsWith("Critical"))
        ? "critical"
        : riskFactors.length >= 2
        ? "high"
        : riskFactors.length === 1
        ? "medium"
        : "low";

      if (riskLevel === "critical") riskCritical++;
      else if (riskLevel === "high") riskHigh++;
      else if (riskLevel === "medium") riskMedium++;
      else riskLow++;

      // Department stats
      const dept = student.department ?? "Unknown";
      if (!deptStats[dept]) deptStats[dept] = { cgpaSum: 0, attendSum: 0, count: 0, atRisk: 0 };
      deptStats[dept].cgpaSum += cgpa;
      deptStats[dept].attendSum += attendancePct;
      deptStats[dept].count++;
      if (riskLevel === "high" || riskLevel === "critical") deptStats[dept].atRisk++;

      studentMetrics.push({
        ...student,
        cgpa,
        attendancePct,
        riskLevel,
        riskFactors,
        mentor_id: allocMap[student.id] ?? null,
      });
    }

    const departmentStats = Object.entries(deptStats).map(([department, stats]) => ({
      department,
      avgCgpa: stats.count > 0 ? Number((stats.cgpaSum / stats.count).toFixed(2)) : 0,
      avgAttendance: stats.count > 0 ? Math.round(stats.attendSum / stats.count) : 0,
      atRiskCount: stats.atRisk,
      total: stats.count,
    }));

    // Mentor activity
    const allocCountMap: Record<string, number> = {};
    const sessionCountMap: Record<string, number> = {};
    for (const a of allocs) allocCountMap[a.mentor_id] = (allocCountMap[a.mentor_id] ?? 0) + 1;
    for (const s of sessions) sessionCountMap[s.mentor_id] = (sessionCountMap[s.mentor_id] ?? 0) + 1;

    const mentorAlertMap: Record<string, number> = {};
    for (const alert of allAlerts) {
      if (alert.mentor_id) mentorAlertMap[alert.mentor_id] = (mentorAlertMap[alert.mentor_id] ?? 0) + 1;
    }

    const mentorActivity = mentors.map((m: any) => ({
      mentor: m,
      menteeCount: allocCountMap[m.id] ?? 0,
      sessionCount: sessionCountMap[m.id] ?? 0,
      alertCount: mentorAlertMap[m.id] ?? 0,
    }));

    setData({
      totalStudents: students.length,
      totalFaculty: mentors.length,
      riskDistribution: { low: riskLow, medium: riskMedium, high: riskHigh, critical: riskCritical },
      departmentStats,
      studentMetrics,
      topAlerts: allAlerts,
      mentorActivity,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEvaluateAlerts = async () => {
    setEvaluating(true);
    try {
      await fetch("/api/alerts/evaluate", { method: "POST" });
      await fetchData();
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="admin">
        <div className="text-center text-text-muted py-20">Failed to load data.</div>
      </AppShell>
    );
  }

  const { totalStudents, totalFaculty, riskDistribution, departmentStats, studentMetrics, topAlerts, mentorActivity } = data;
  const departments = ["all", ...Array.from(new Set(departmentStats.map((d: any) => d.department)))];

  // Filter students
  const filteredStudents = studentMetrics.filter((s: any) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
    return true;
  });

  return (
    <AppShell role="admin">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Performance Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">
            全校 student performance overview across all departments
          </p>
        </div>
        <button onClick={handleEvaluateAlerts} disabled={evaluating} className="btn-primary flex items-center gap-2">
          {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {evaluating ? "Scanning..." : "Run Risk Scan"}
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: totalStudents, color: "bg-accent/10 text-accent", icon: Users },
          { label: "Total Faculty", value: totalFaculty, color: "bg-secondary/10 text-secondary", icon: Users },
          { label: "At Risk", value: riskDistribution.high + riskDistribution.critical, color: "bg-danger/10 text-danger", icon: AlertTriangle },
          { label: "Active Alerts", value: topAlerts.length, color: "bg-highlight/10 text-highlight", icon: Bell },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-muted text-xs">{label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-heading font-bold text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Risk Distribution */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            Risk Distribution
          </h3>
          <RiskRing counts={riskDistribution} />
        </div>

        {/* Department Overview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              Department Breakdown
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {departmentStats.map((dept: any) => (
              <DeptBar key={dept.department} {...dept} />
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="input w-auto text-xs py-1.5"
        >
          {departments.map((d: any) => (
            <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
          ))}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="input w-auto text-xs py-1.5"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">At Risk</option>
          <option value="medium">Watch</option>
          <option value="low">On Track</option>
        </select>
        <span className="text-xs text-text-muted ml-auto">{filteredStudents.length} students</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Dept</th>
                  <th>CGPA</th>
                  <th>Attendance</th>
                  <th>Risk</th>
                  <th>Mentor</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.slice(0, 50).map((s: any) => {
                  const mentor = mentorActivity.find((m: any) => m.mentor.id === s.mentor_id);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold flex-shrink-0">
                            {s.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{s.full_name}</div>
                            <div className="text-[10px] text-text-muted">{s.usn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-text-muted">{s.department ?? "—"}</td>
                      <td>
                        <span className={`text-sm font-semibold ${s.cgpa >= 7 ? "text-success" : s.cgpa >= 5.5 ? "text-accent" : "text-danger"}`}>
                          {s.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`text-sm font-semibold ${s.attendancePct >= 75 ? "text-success" : s.attendancePct >= 60 ? "text-accent" : "text-danger"}`}>
                          {s.attendancePct}%
                        </span>
                      </td>
                      <td><RiskBadge level={s.riskLevel} /></td>
                      <td className="text-xs text-text-muted">{mentor?.mentor?.full_name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mentor Activity */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Mentor Activity
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
            {mentorActivity.map((m: any) => (
              <div key={m.mentor.id} className="p-3 rounded-button hover:bg-accent-light transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-[10px] font-bold flex-shrink-0">
                    {m.mentor.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">{m.mentor.full_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-text-muted ml-9">
                  <span>{m.menteeCount} mentees</span>
                  <span>{m.sessionCount} sessions</span>
                  <span className={m.alertCount > 0 ? "text-danger font-semibold" : ""}>
                    {m.alertCount} alerts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
