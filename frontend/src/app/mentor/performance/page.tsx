"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Trophy,
  Bell,
  ChevronRight,
  Loader2,
  Shield,
  Target,
  Calendar,
  X,
  CheckCircle2,
  Eye,
} from "lucide-react";
import Link from "next/link";

// ─── Risk Badge ─────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const config = {
    low: { label: "On Track", class: "badge-success", icon: CheckCircle2 },
    medium: { label: "Watch", class: "badge-accent", icon: Eye },
    high: { label: "At Risk", class: "badge-danger", icon: AlertTriangle },
    critical: { label: "Critical", class: "badge-danger", icon: AlertTriangle },
  }[level] ?? { label: level, class: "badge-accent", icon: AlertTriangle };

  return (
    <span className={`badge ${config.class}`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Mini Trend Bar ─────────────────────────────────

function TrendBar({
  data,
  color,
  height = 40,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            height: `${Math.max((val / max) * 100, 8)}%`,
            background: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────

export default function MentorPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMentee, setSelectedMentee] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all performance data via Supabase client-side
    const [allocationsRes, interactionsRes, allGradesRes, allAttendRes, allAchRes, allAlertsRes, sessionsRes] =
      await Promise.all([
        supabase.from("Allocation").select("*, mentee:mentee_id(*)").eq("mentor_id", user.id).eq("is_active", true),
        supabase.from("Interaction").select("*").eq("mentor_id", user.id).order("date", { ascending: false }),
        supabase.from("Grade").select("*").order("semester"),
        supabase.from("AttendanceRecord").select("*").order("date", { ascending: false }),
        supabase.from("Achievement").select("student_id, nba_points, status").eq("status", "Verified"),
        supabase.from("Alert").select("*, rule:rule_id(name, type, severity)").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("MentorSession").select("*, mentee:mentee_id(full_name, usn)").eq("mentor_id", user.id).eq("status", "scheduled").gte("date", new Date().toISOString()).order("date").limit(10),
      ]);

    const allocations = (allocationsRes.data ?? []).map((a: any) => a.mentee).filter(Boolean);
    const menteeIds = allocations.map((m: any) => m.id);
    const allGrades = (allGradesRes.data ?? []).filter((g: any) => menteeIds.includes(g.student_id));
    const allAttendance = (allAttendRes.data ?? []).filter((a: any) => menteeIds.includes(a.student_id));
    const interactions = (interactionsRes.data ?? []);
    const allAchievements = (allAchRes.data ?? []).filter((a: any) => menteeIds.includes(a.student_id));
    const allAlerts = (allAlertsRes.data ?? []);

    // Group data by student
    const gradeMap: Record<string, any[]> = {};
    const attendMap: Record<string, any[]> = {};
    const interactMap: Record<string, any[]> = {};
    const nbaMap: Record<string, number> = {};
    const alertMap: Record<string, number> = {};

    for (const g of allGrades) {
      if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
      gradeMap[g.student_id].push(g);
    }
    for (const a of allAttendance) {
      if (!attendMap[a.student_id]) attendMap[a.student_id] = [];
      attendMap[a.student_id].push(a);
    }
    for (const i of interactions) {
      if (!interactMap[i.mentee_id]) interactMap[i.mentee_id] = [];
      interactMap[i.mentee_id].push(i);
    }
    for (const a of allAchievements) {
      nbaMap[a.student_id] = (nbaMap[a.student_id] ?? 0) + (a.nba_points ?? 0);
    }
    for (const alert of allAlerts) {
      alertMap[alert.student_id] = (alertMap[alert.student_id] ?? 0) + 1;
    }

    // Compute per-mentee performance
    const mentees = allocations.map((student: any) => {
      const grades = gradeMap[student.id] ?? [];
      const attendance = attendMap[student.id] ?? [];
      const menteeInteractions = interactMap[student.id] ?? [];

      const latestGrade = grades[grades.length - 1];
      const cgpa = latestGrade?.cgpa ?? 0;

      // SGPA trend
      const semMap: Record<number, number[]> = {};
      for (const g of grades) {
        if (g.sgpa != null) {
          if (!semMap[g.semester]) semMap[g.semester] = [];
          semMap[g.semester].push(g.sgpa);
        }
      }
      const sgpaTrend = Object.entries(semMap)
        .map(([sem, gpas]) => ({
          semester: Number(sem),
          gpa: Number((gpas.reduce((s: number, v: number) => s + v, 0) / gpas.length).toFixed(2)),
        }))
        .sort((a, b) => a.semester - b.semester);

      // Attendance
      const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
      const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 100;

      // Monthly attendance trend
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentForTrend = attendance.filter((a: any) => new Date(a.date) >= sixMonthsAgo);
      const monthlyMap: Record<string, { present: number; total: number }> = {};
      for (const rec of recentForTrend) {
        const monthKey = new Date(rec.date).toISOString().slice(0, 7);
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { present: 0, total: 0 };
        monthlyMap[monthKey].total++;
        if (rec.status === "Present") monthlyMap[monthKey].present++;
      }
      const attendanceTrend = Object.entries(monthlyMap)
        .map(([month, { present, total }]) => ({ month, pct: Math.round((present / total) * 100) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Risk
      const riskFactors: string[] = [];
      if (cgpa < 4.0) riskFactors.push("Critical CGPA");
      else if (cgpa < 5.5) riskFactors.push("Low CGPA");
      if (attendancePct < 60) riskFactors.push("Critical Attendance");
      else if (attendancePct < 75) riskFactors.push("Low Attendance");

      const lastInteraction = menteeInteractions[0];
      const daysSinceInteraction = lastInteraction
        ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (daysSinceInteraction > 60) riskFactors.push("No recent contact");
      else if (daysSinceInteraction > 30) riskFactors.push("Infrequent contact");
      if ((alertMap[student.id] ?? 0) > 0) riskFactors.push("Active alerts");

      const riskLevel = riskFactors.some((f) => f.startsWith("Critical"))
        ? "critical"
        : riskFactors.length >= 2
        ? "high"
        : riskFactors.length === 1
        ? "medium"
        : "low";

      return {
        student,
        cgpa,
        attendancePct,
        sgpaTrend,
        attendanceTrend,
        riskLevel,
        riskFactors,
        lastInteraction: lastInteraction?.date ?? null,
        daysSinceInteraction,
        nbaScore: nbaMap[student.id] ?? 0,
        activeAlerts: alertMap[student.id] ?? 0,
        totalSessions: menteeInteractions.length,
      };
    });

    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const m of mentees) {
      riskCounts[m.riskLevel as keyof typeof riskCounts]++;
    }

    setData({
      mentees,
      riskCounts,
      totalAlerts: allAlerts.length,
      upcomingSessions: sessionsRes.data ?? [],
      recentAlerts: allAlerts.slice(0, 10),
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
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="mentor">
        <div className="text-center text-text-muted py-20">Failed to load data.</div>
      </AppShell>
    );
  }

  const { mentees, riskCounts, totalAlerts, upcomingSessions, recentAlerts } = data;
  const filtered = filter === "all" ? mentees : mentees.filter((m: any) => m.riskLevel === filter);

  return (
    <AppShell role="mentor">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Performance Overview</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Monitor your mentees&apos; academic trajectories at a glance
          </p>
        </div>
        <button onClick={handleEvaluateAlerts} disabled={evaluating} className="btn-primary flex items-center gap-2">
          {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {evaluating ? "Evaluating..." : "Run Risk Scan"}
        </button>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Mentees", value: mentees.length, icon: Users, color: "bg-accent/10 text-accent" },
          { label: "On Track", value: riskCounts.low, icon: CheckCircle2, color: "bg-success/10 text-success" },
          { label: "Watch", value: riskCounts.medium, icon: Eye, color: "bg-accent/10 text-accent" },
          { label: "At Risk", value: riskCounts.high, icon: AlertTriangle, color: "bg-danger/10 text-danger" },
          { label: "Critical", value: riskCounts.critical, icon: AlertTriangle, color: "bg-danger/15 text-danger" },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: "all", label: "All" },
          { key: "critical", label: "Critical" },
          { key: "high", label: "At Risk" },
          { key: "medium", label: "Watch" },
          { key: "low", label: "On Track" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === key
                ? "bg-accent text-background"
                : "bg-surface border border-surface-border text-text-muted hover:border-accent/30"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1.5 opacity-70">
                {key === "all" ? mentees.length : mentees.filter((m: any) => m.riskLevel === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentee Performance Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-text-muted">No mentees match this filter.</div>
          ) : (
            filtered.map((mentee: any) => (
              <div
                key={mentee.student.id}
                onClick={() => setSelectedMentee(mentee)}
                className={`card p-5 cursor-pointer transition-all hover:border-accent/30 ${
                  mentee.riskLevel === "critical"
                    ? "border-danger/30"
                    : mentee.riskLevel === "high"
                    ? "border-danger/20"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
                    {mentee.student.full_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary text-sm">{mentee.student.full_name}</span>
                      <RiskBadge level={mentee.riskLevel} />
                      {mentee.activeAlerts > 0 && (
                        <span className="badge badge-danger text-[10px]">
                          <Bell className="w-2.5 h-2.5" /> {mentee.activeAlerts}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mb-3">
                      {mentee.student.usn} · Year {mentee.student.year} · {mentee.student.department}
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* CGPA */}
                      <div>
                        <div className="text-xs text-text-muted mb-1">CGPA</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-heading font-bold ${mentee.cgpa >= 7 ? "text-success" : mentee.cgpa >= 5.5 ? "text-accent" : "text-danger"}`}>
                            {Number(mentee.cgpa).toFixed(2)}
                          </span>
                          {mentee.sgpaTrend.length >= 2 && (
                            mentee.sgpaTrend[mentee.sgpaTrend.length - 1]?.gpa >= mentee.sgpaTrend[mentee.sgpaTrend.length - 2]?.gpa ? (
                              <TrendingUp className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-danger" />
                            )
                          )}
                        </div>
                        {mentee.sgpaTrend.length > 0 && (
                          <TrendBar
                            data={mentee.sgpaTrend.map((s: any) => s.gpa)}
                            color={mentee.cgpa >= 7 ? "#6FCF97" : mentee.cgpa >= 5.5 ? "#E8A87C" : "#E07070"}
                            height={24}
                          />
                        )}
                      </div>

                      {/* Attendance */}
                      <div>
                        <div className="text-xs text-text-muted mb-1">Attendance</div>
                        <span className={`text-lg font-heading font-bold ${mentee.attendancePct >= 75 ? "text-success" : mentee.attendancePct >= 60 ? "text-accent" : "text-danger"}`}>
                          {mentee.attendancePct}%
                        </span>
                        {mentee.attendanceTrend.length > 0 && (
                          <TrendBar
                            data={mentee.attendanceTrend.map((t: any) => t.pct)}
                            color={mentee.attendancePct >= 75 ? "#6FCF97" : mentee.attendancePct >= 60 ? "#E8A87C" : "#E07070"}
                            height={24}
                          />
                        )}
                      </div>

                      {/* Sessions & NBA */}
                      <div>
                        <div className="text-xs text-text-muted mb-1">Sessions</div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-sm font-semibold text-text-primary">{mentee.totalSessions}</span>
                        </div>
                        <div className="text-xs text-text-muted mt-2 mb-1">NBA Score</div>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-accent" />
                          <span className="text-sm font-semibold text-accent">{mentee.nbaScore}</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {mentee.riskFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {mentee.riskFactors.map((f: string, i: number) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              f.startsWith("Critical")
                                ? "bg-danger/15 text-danger"
                                : f.includes("alert")
                                ? "bg-highlight/15 text-highlight"
                                : "bg-accent/15 text-accent"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Sessions */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Upcoming Sessions
            </h3>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-button hover:bg-accent-light transition-colors">
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs font-bold text-accent">
                        {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric" })}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(s.date).toLocaleDateString("en-IN", { month: "short" })}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{s.mentee?.full_name ?? "Student"}</div>
                      <div className="text-xs text-text-muted">{s.start_time} - {s.end_time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No upcoming sessions.</p>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                <Bell className="w-4 h-4 text-danger" />
                Active Alerts
              </h3>
              {totalAlerts > 0 && (
                <Link href="/admin/alerts" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              )}
            </div>
            {recentAlerts.length > 0 ? (
              <div className="space-y-2">
                {recentAlerts.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-button text-xs ${
                      alert.severity === "critical"
                        ? "bg-danger/10 border border-danger/20"
                        : alert.severity === "warning"
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-surface border border-surface-border"
                    }`}
                  >
                    <div className="font-medium text-text-primary truncate">{alert.title}</div>
                    <div className="text-text-muted mt-0.5 truncate">{alert.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle2 className="w-4 h-4" />
                No active alerts
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/mentor/schedule" className="flex items-center gap-3 p-2.5 rounded-button hover:bg-accent-light transition-colors text-sm text-text-primary">
                <Calendar className="w-4 h-4 text-accent" />
                Manage Schedule
              </Link>
              <Link href="/mentor/mentees" className="flex items-center gap-3 p-2.5 rounded-button hover:bg-accent-light transition-colors text-sm text-text-primary">
                <Users className="w-4 h-4 text-secondary" />
                View All Mentees
              </Link>
              <Link href="/mentor/reports" className="flex items-center gap-3 p-2.5 rounded-button hover:bg-accent-light transition-colors text-sm text-text-primary">
                <TrendingUp className="w-4 h-4 text-highlight" />
                Generate Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mentee Detail Modal */}
      {selectedMentee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold">
                  {selectedMentee.student.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="font-heading font-bold text-text-primary">{selectedMentee.student.full_name}</h2>
                  <p className="text-xs text-text-muted">{selectedMentee.student.usn} · {selectedMentee.student.department}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMentee(null)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              {/* Risk Factors */}
              {selectedMentee.riskFactors.length > 0 && (
                <div className="p-4 rounded-card bg-danger/5 border border-danger/20">
                  <h3 className="text-sm font-semibold text-danger mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Factors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentee.riskFactors.map((f: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-danger/10 text-danger">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-card bg-surface border border-surface-border text-center">
                  <div className={`text-3xl font-heading font-bold ${selectedMentee.cgpa >= 7 ? "text-success" : selectedMentee.cgpa >= 5.5 ? "text-accent" : "text-danger"}`}>
                    {Number(selectedMentee.cgpa).toFixed(2)}
                  </div>
                  <div className="text-xs text-text-muted mt-1">CGPA</div>
                </div>
                <div className="p-4 rounded-card bg-surface border border-surface-border text-center">
                  <div className={`text-3xl font-heading font-bold ${selectedMentee.attendancePct >= 75 ? "text-success" : selectedMentee.attendancePct >= 60 ? "text-accent" : "text-danger"}`}>
                    {selectedMentee.attendancePct}%
                  </div>
                  <div className="text-xs text-text-muted mt-1">Attendance</div>
                </div>
                <div className="p-4 rounded-card bg-surface border border-surface-border text-center">
                  <div className="text-3xl font-heading font-bold text-accent">{selectedMentee.nbaScore}</div>
                  <div className="text-xs text-text-muted mt-1">NBA Score</div>
                </div>
              </div>

              {/* SGPA Trend */}
              {selectedMentee.sgpaTrend.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">SGPA Trend</h3>
                  <div className="flex items-end gap-2 h-32 border-b border-surface-border pb-1">
                    {selectedMentee.sgpaTrend.map(({ semester, gpa }: any) => {
                      const heightPct = Math.max((gpa / 10) * 100, 10);
                      return (
                        <div key={semester} className="flex flex-col items-center justify-end gap-1 flex-1 h-full">
                          <div className="text-[10px] font-bold text-accent">{gpa.toFixed(2)}</div>
                          <div
                            className="w-full rounded-t-sm bg-accent/80 hover:bg-accent transition-colors"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[10px] font-mono text-text-muted mt-1">S{semester}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Engagement */}
              <div className="p-4 rounded-card bg-surface border border-surface-border">
                <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  Engagement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Last interaction:</span>
                    <span className="ml-2 text-text-primary font-medium">
                      {selectedMentee.lastInteraction
                        ? new Date(selectedMentee.lastInteraction).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Days since contact:</span>
                    <span className={`ml-2 font-medium ${selectedMentee.daysSinceInteraction > 30 ? "text-danger" : "text-success"}`}>
                      {selectedMentee.daysSinceInteraction === 999 ? "N/A" : selectedMentee.daysSinceInteraction}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Total sessions:</span>
                    <span className="ml-2 text-text-primary font-medium">{selectedMentee.totalSessions}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Active alerts:</span>
                    <span className={`ml-2 font-medium ${selectedMentee.activeAlerts > 0 ? "text-danger" : "text-success"}`}>
                      {selectedMentee.activeAlerts}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
