"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  TrendingUp,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  BookOpen,
  Bell,
  Award,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="card card-interactive p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-heading font-bold text-text-primary">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function AttendanceBar({ subject, percentage }: { subject: string; percentage: number }) {
  const color = percentage >= 85 ? "#6FCF97" : percentage >= 75 ? "#E8A87C" : "#E07070";
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-text-muted truncate flex-shrink-0">{subject}</div>
      <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right" style={{ color }}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showNbaModal, setShowNbaModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch all data in parallel
      const [gradesRes, achievementsRes, attendanceRes, interactionsRes, notifRes, feedRes, allocationRes] =
        await Promise.all([
          supabase.from("Grade").select("*").eq("student_id", user.id).order("semester"),
          supabase.from("Achievement").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
          supabase.from("AttendanceRecord").select("*").eq("student_id", user.id).order("date", { ascending: false }),
          supabase.from("Interaction").select("*").eq("mentee_id", user.id).order("date", { ascending: false }).limit(5),
          supabase.from("Notification").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("FeedPost").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("Allocation").select("*, mentor:mentor_id(*)").eq("mentee_id", user.id).eq("is_active", true).maybeSingle(),
        ]);

      const grades = gradesRes.data ?? [];
      const achievements = achievementsRes.data ?? [];
      const attendance = attendanceRes.data ?? [];
      const notifications = notifRes.data ?? [];
      const feed = feedRes.data ?? [];

      // Academic health
      const latestGrade = grades[grades.length - 1];
      const cgpa = latestGrade?.cgpa ?? 0;
      const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
      const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;
      const healthStatus = cgpa >= 7 && attendancePct >= 75 ? "good" : cgpa >= 5.5 || attendancePct >= 65 ? "warning" : "danger";

      // Semester GPAs
      const semMap: Record<number, number[]> = {};
      for (const g of grades) {
        if (g.sgpa != null) {
          if (!semMap[g.semester]) semMap[g.semester] = [];
          semMap[g.semester].push(g.sgpa);
        }
      }
      const semesterGpas = Object.entries(semMap)
        .map(([sem, gpas]) => ({ semester: Number(sem), gpa: Number((gpas.reduce((s: number, v: number) => s + v, 0) / gpas.length).toFixed(2)) }))
        .sort((a, b) => a.semester - b.semester);

      // Per-subject attendance
      const subjectMap: Record<string, { present: number; total: number }> = {};
      for (const rec of attendance) {
        if (!subjectMap[rec.subject_name]) subjectMap[rec.subject_name] = { present: 0, total: 0 };
        subjectMap[rec.subject_name].total++;
        if (rec.status === "Present") subjectMap[rec.subject_name].present++;
      }
      const attendanceSummary = Object.entries(subjectMap).map(([subject, { present, total }]) => ({
        subject, percentage: Math.round((present / total) * 100),
      }));

      // NBA score
      const nbaScore = achievements.filter((a: any) => a.status === "Verified").reduce((s: number, a: any) => s + (a.nba_points ?? 0), 0);

      setData({
        user,
        grades,
        achievements,
        attendance,
        attendanceSummary,
        interactions: interactionsRes.data ?? [],
        notifications,
        feed,
        allocation: allocationRes.data,
        academicHealth: { cgpa, attendance: attendancePct, semesterGpas, healthStatus },
        nbaScore,
        unreadCount: notifications.filter((n: any) => !n.is_read).length,
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppShell role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="student">
        <div className="text-center text-text-muted py-20">Failed to load data. Please refresh.</div>
      </AppShell>
    );
  }

  const { achievements, attendanceSummary, feed, notifications, academicHealth: health, nbaScore, unreadCount } = data;
  const verifiedAchievements = achievements.filter((a: any) => a.status === "Verified");

  return (
    <AppShell role="student">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Good morning 👋
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome to your EduPulse dashboard
          </p>
        </div>
        <Link href="/student/feed" className="relative">
          <button className="btn-ghost btn-sm">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">

        {/* CGPA — large */}
        <div className="card card-interactive p-6 lg:col-span-2 lg:row-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm font-medium">Academic Health</span>
            <span className={`badge ${health.healthStatus === "good" ? "badge-success" : health.healthStatus === "warning" ? "badge-accent" : "badge-danger"}`}>
              {health.healthStatus === "good" ? "✓ On Track" : health.healthStatus === "warning" ? "⚠ Watch Out" : "Needs Help"}
            </span>
          </div>
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <div className="text-6xl font-heading font-bold text-text-primary">{Number(health.cgpa).toFixed(2)}</div>
              <div className="text-text-muted text-sm mt-1">Current CGPA</div>
            </div>
            <div>
              <div className={`text-4xl font-heading font-bold ${health.attendance >= 75 ? "text-success" : "text-danger"}`}>
                {health.attendance}%
              </div>
              <div className="text-text-muted text-sm mt-1">Attendance</div>
            </div>
          </div>
          {/* Semester GPA Chart */}
          {health.semesterGpas.length > 0 && (
            <div className="mt-2 w-full pt-4">
              <div className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Semester GPA Trend</div>
              <div className="flex items-end gap-2 h-24 w-full border-b border-surface-border pb-1">
                {health.semesterGpas.map(({ semester, gpa }: any) => {
                  const heightPct = Math.max((gpa / 10) * 100, 10);
                  return (
                    <div key={semester} className="flex flex-col items-center justify-end gap-1 flex-1 h-full">
                      <div
                        className="w-full rounded-t-sm transition-all duration-500 relative group cursor-help bg-accent/80 hover:bg-accent"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-accent/20 px-2 py-1 flex items-center justify-center text-xs font-bold text-accent rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-max shadow-md">
                          {gpa.toFixed(2)}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted mt-1">S{semester}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {health.semesterGpas.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              No grade data yet. Grades will appear once uploaded.
            </div>
          )}
        </div>

        {/* NBA Score */}
        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowNbaModal(true)}>
          <StatCard
            label="NBA Score"
            value={nbaScore}
            sub="Verified achievement points"
            color="bg-accent/10 text-accent"
            icon={Award}
          />
        </div>

        {/* Notifications count */}
        <Link href="/student/feed" className="block">
          <StatCard
            label="Unread Notifications"
            value={unreadCount}
            sub={`${achievements.filter((a: any) => a.status === "Pending").length} achievement(s) pending`}
            color="bg-highlight/10 text-highlight"
            icon={AlertCircle}
          />
        </Link>

        {/* Subject Attendance */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Subject Attendance
            </span>
            <Link href="/student/academics" className="text-xs text-accent hover:underline">Details</Link>
          </div>
          {attendanceSummary.length > 0 ? (
            <div className="space-y-3">
              {attendanceSummary.map((s: any) => (
                <AttendanceBar key={s.subject} subject={s.subject} percentage={s.percentage} />
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No attendance records found.</p>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Recent Announcements
            </span>
            <Link href="/student/feed" className="text-xs text-accent hover:underline">See all</Link>
          </div>
          {feed.length > 0 ? (
            <div className="space-y-3">
              {feed.slice(0, 3).map((post: any) => (
                <div key={post.id} className="flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    post.type === "Placement" ? "bg-success" :
                    post.type === "Hackathon" ? "bg-accent" :
                    post.type === "Event" ? "bg-highlight" : "bg-secondary"
                  }`} />
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary font-medium truncate">{post.title}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No announcements yet.</p>
          )}
        </div>

        {/* Achievements preview */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              My Achievements
            </span>
            <Link href="/student/achievements" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.slice(0, 3).map((ach: any) => (
                <div key={ach.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ach.status === "Verified" ? "bg-success" :
                    ach.status === "Pending" ? "bg-accent" : "bg-danger"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{ach.title}</div>
                    <div className="text-xs text-text-muted">{ach.category} · {ach.nba_points} pts</div>
                  </div>
                  <span className={`badge text-[10px] ${
                    ach.status === "Verified" ? "badge-success" :
                    ach.status === "Pending" ? "badge-accent" : "badge-danger"
                  }`}>{ach.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No achievements logged yet.</p>
          )}
        </div>
      </div>

      {/* NBA Breakdown Modal */}
      {showNbaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                NBA Points Breakdown
              </h2>
              <button onClick={() => setShowNbaModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 scrollbar-hide">
              {verifiedAchievements.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">No verified points yet.</p>
              ) : (
                verifiedAchievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-center justify-between p-3 rounded-button bg-surface border border-surface-border hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{ach.title}</div>
                        <div className="text-xs text-text-muted">{ach.category} · {ach.level || "Regional"}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-accent">+{ach.nba_points}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-surface-border/30 border-t border-surface-border rounded-b-card flex justify-between items-center">
              <span className="text-sm font-medium text-text-muted">Total Score</span>
              <span className="text-2xl font-heading font-bold text-text-primary">{nbaScore}</span>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
