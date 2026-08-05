"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TiltCard from "@/components/ui/TiltCard";
import Reveal from "@/components/ui/Reveal";
import SpotlightCard from "@/components/ui/SpotlightCard";

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <TiltCard intensity={6} className="h-full">
        <div className="card card-interactive p-5 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm">{label}</span>
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
          </div>
          <div>
            <div className="text-3xl font-heading font-bold text-text-primary">
              <AnimatedCounter value={value} />
            </div>
            {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

function AttendanceBar({ subject, percentage, delay = 0 }: { subject: string; percentage: number; delay?: number }) {
  const color = percentage >= 85 ? "#6FCF97" : percentage >= 75 ? "#E8A87C" : "#E07070";
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-text-muted truncate flex-shrink-0">{subject}</div>
      <div className="flex-1 h-2 bg-glass/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 10px ${color}44` }}
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
        <div className="flex items-center justify-center h-64 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
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
      <Reveal>
        <div className="flex items-start justify-between mb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-heading font-bold text-text-primary"
            >
              Good morning <span className="inline-block animate-float">👋</span>
            </motion.h1>
            <p className="text-text-muted text-sm mt-0.5">
              Welcome to your <span className="text-gradient font-medium">EduPulse</span> dashboard
            </p>
          </div>
          <Link href="/student/feed" className="relative">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="btn-ghost btn-sm">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
          </Link>
        </div>
      </Reveal>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">

        {/* CGPA — large */}
        <Reveal delay={0.05} className="lg:col-span-2 lg:row-span-2">
          <TiltCard intensity={4} className="h-full">
            <div className="card card-interactive p-6 h-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm font-medium">Academic Health</span>
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`badge ${health.healthStatus === "good" ? "badge-success" : health.healthStatus === "warning" ? "badge-accent" : "badge-danger"}`}
                >
                  {health.healthStatus === "good" ? "✓ On Track" : health.healthStatus === "warning" ? "⚠ Watch Out" : "Needs Help"}
                </motion.span>
              </div>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <div className="text-6xl font-heading font-bold text-text-primary">
                    <AnimatedCounter value={Number(health.cgpa)} decimals={2} />
                  </div>
                  <div className="text-text-muted text-sm mt-1">Current CGPA</div>
                </div>
                <div>
                  <div className={`text-4xl font-heading font-bold ${health.attendance >= 75 ? "text-success" : "text-danger"}`}>
                    <AnimatedCounter value={health.attendance} suffix="%" />
                  </div>
                  <div className="text-text-muted text-sm mt-1">Attendance</div>
                </div>
              </div>
              {/* Semester GPA Chart */}
              {health.semesterGpas.length > 0 && (
                <div className="mt-2 w-full pt-4">
                  <div className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Semester GPA Trend</div>
                  <div className="flex items-end gap-2 h-24 w-full border-b border-glass/10 pb-1">
                    {health.semesterGpas.map(({ semester, gpa }: any, idx: number) => {
                      const heightPct = Math.max((gpa / 10) * 100, 10);
                      return (
                        <div key={semester} className="flex flex-col items-center justify-end gap-1 flex-1 h-full">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            whileInView={{ height: `${heightPct}%`, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full rounded-t-sm relative group cursor-help bg-gradient-to-t from-accent/60 to-accent hover:to-accent-hover"
                            style={{ boxShadow: "0 0 14px rgba(232,168,124,0.25)" }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-accent/20 px-2 py-1 flex items-center justify-center text-xs font-bold text-accent rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-max shadow-md">
                              {gpa.toFixed(2)}
                            </div>
                          </motion.div>
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
          </TiltCard>
        </Reveal>

        {/* NBA Score */}
        <div className="cursor-pointer" onClick={() => setShowNbaModal(true)}>
          <StatCard
            label="NBA Score"
            value={nbaScore}
            sub="Verified achievement points"
            color="bg-accent/10 text-accent"
            icon={Award}
            delay={0.1}
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
            delay={0.16}
          />
        </Link>

        {/* Subject Attendance */}
        <Reveal delay={0.22} className="lg:col-span-2">
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Subject Attendance
              </span>
              <Link href="/student/academics" className="text-xs text-accent hover:underline">Details</Link>
            </div>
            {attendanceSummary.length > 0 ? (
              <div className="space-y-3">
                {attendanceSummary.map((s: any, idx: number) => (
                  <AttendanceBar key={s.subject} subject={s.subject} percentage={s.percentage} delay={idx * 0.06} />
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No attendance records found.</p>
            )}
          </div>
        </Reveal>

        {/* Recent Announcements */}
        <Reveal delay={0.28} className="lg:col-span-2">
          <SpotlightCard className="h-full rounded-card" color="192, 132, 252">
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Recent Announcements
              </span>
              <Link href="/student/feed" className="text-xs text-accent hover:underline">See all</Link>
            </div>
            {feed.length > 0 ? (
              <div className="space-y-3">
                {feed.slice(0, 3).map((post: any, idx: number) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-start gap-3 p-2 rounded-button hover:bg-glass/[0.04] transition-colors"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      post.type === "Placement" ? "bg-success" :
                      post.type === "Hackathon" ? "bg-accent" :
                      post.type === "Event" ? "bg-highlight" : "bg-secondary"
                    }`} style={{ boxShadow: "0 0 8px currentColor" }} />
                    <div className="min-w-0">
                      <div className="text-sm text-text-primary font-medium truncate">{post.title}</div>
                      <div className="text-xs text-text-muted">
                        {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No announcements yet.</p>
            )}
          </div>
          </SpotlightCard>
        </Reveal>

        {/* Achievements preview */}
        <Reveal delay={0.34} className="lg:col-span-2">
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-muted text-sm font-medium flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                My Achievements
              </span>
              <Link href="/student/achievements" className="text-xs text-accent hover:underline">View all</Link>
            </div>
            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.slice(0, 3).map((ach: any, idx: number) => (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-center gap-3 p-2 rounded-button hover:bg-glass/[0.04] transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ach.status === "Verified" ? "bg-success" :
                      ach.status === "Pending" ? "bg-accent animate-pulse" : "bg-danger"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{ach.title}</div>
                      <div className="text-xs text-text-muted">{ach.category} · {ach.nba_points} pts</div>
                    </div>
                    <span className={`badge text-[10px] ${
                      ach.status === "Verified" ? "badge-success" :
                      ach.status === "Pending" ? "badge-accent" : "badge-danger"
                    }`}>{ach.status}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No achievements logged yet.</p>
            )}
          </div>
        </Reveal>
      </div>

      {/* NBA Breakdown Modal */}
      <AnimatePresence>
        {showNbaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setShowNbaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-glass/10">
                <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  NBA Points Breakdown
                </h2>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowNbaModal(false)} className="btn-icon">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 scrollbar-hide">
                {verifiedAchievements.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-4">No verified points yet.</p>
                ) : (
                  verifiedAchievements.map((ach: any, idx: number) => (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-button bg-glass/[0.03] border border-glass/10 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{ach.title}</div>
                          <div className="text-xs text-text-muted">{ach.category} · {ach.level || "Regional"}</div>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className="text-sm font-bold text-accent"
                      >
                        +{ach.nba_points}
                      </motion.div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="p-4 bg-glass/[0.03] border-t border-glass/10 rounded-b-card flex justify-between items-center">
                <span className="text-sm font-medium text-text-muted">Total Score</span>
                <span className="text-2xl font-heading font-bold text-text-primary">
                  <AnimatedCounter value={nbaScore} />
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
