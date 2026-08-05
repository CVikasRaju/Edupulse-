"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageSquare,
  Star,
  ChevronRight,
  Bell,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import TiltCard from "@/components/ui/TiltCard";
import Reveal from "@/components/ui/Reveal";

export default function MentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [allocationsRes, interactionsRes, coursesRes, notificationsRes, sessionsRes] = await Promise.all([
        supabase.from("Allocation").select("*, mentee:mentee_id(*)").eq("mentor_id", user.id).eq("is_active", true),
        supabase.from("Interaction").select("*").eq("mentor_id", user.id).order("date", { ascending: false }).limit(10),
        supabase.from("Course").select("*").eq("faculty_id", user.id),
        supabase.from("Notification").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
        supabase.from("MentorSession").select("*, mentee:mentee_id(full_name, usn)").eq("mentor_id", user.id).eq("status", "scheduled").gte("date", new Date().toISOString()).order("date").limit(10),
      ]);

      const mentees = (allocationsRes.data ?? []).map((a: any) => a.mentee);
      const menteeIds = mentees.map((m: any) => m?.id).filter(Boolean);

      const [pendingAchRes, pendingGraceRes] = await Promise.all([
        supabase.from("Achievement").select("*").in("student_id", menteeIds).eq("status", "Pending"),
        supabase.from("GraceRequest").select("*, student:student_id(*)").in("student_id", menteeIds).eq("status", "Pending"),
      ]);

      const interactions = interactionsRes.data ?? [];

      // NBA scores per mentee
      const achievementsRes = await supabase.from("Achievement").select("student_id, nba_points, status").in("student_id", menteeIds).eq("status", "Verified");
      const nbaByMentee: Record<string, number> = {};
      for (const a of achievementsRes.data ?? []) {
        nbaByMentee[a.student_id] = (nbaByMentee[a.student_id] ?? 0) + (a.nba_points ?? 0);
      }

      setData({
        mentees,
        interactions,
        courses: coursesRes.data ?? [],
        pendingAchievements: pendingAchRes.data ?? [],
        pendingGraceRequests: pendingGraceRes.data ?? [],
        nbaByMentee,
        notifications: notificationsRes.data ?? [],
        upcomingSessions: sessionsRes.data ?? [],
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppShell role="mentor">
        <div className="flex items-center justify-center h-64 gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
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

  const { mentees, interactions, courses, pendingAchievements, pendingGraceRequests, nbaByMentee, notifications, upcomingSessions } = data;
  const unacknowledged = interactions.filter((i: any) => !i.is_acknowledged);
  const recentInteractions = interactions.slice(0, 4);
  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("Notification")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setData((prev: any) => ({
      ...prev,
      notifications: (prev.notifications ?? []).map((n: any) => ({ ...n, is_read: true })),
    }));
  };

  return (
    <AppShell role="mentor">
      <Reveal>
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">
              Welcome <span className="inline-block animate-float">👋</span>
            </h1>
            <p className="text-text-muted text-sm mt-0.5">Your <span className="text-gradient font-medium">mentor dashboard</span></p>
          </div>
          {/* Notifications bell */}
          <Link
            href="/mentor/dashboard#notifications"
            className="relative flex items-center gap-2 px-4 py-2 rounded-button bg-glass/[0.04] border border-glass/10 backdrop-blur-sm hover:border-accent/40 transition-all"
          >
            <Bell className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-text-primary">Notifications</span>
            {unreadNotifications.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-ink text-[10px] font-bold flex items-center justify-center"
              >
                {unreadNotifications.length}
              </motion.span>
            )}
          </Link>
        </div>
      </Reveal>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Mentees", value: mentees.length, icon: Users, color: "bg-accent/10 text-accent", href: "/mentor/mentees" },
          { label: "Pending Achievements", value: pendingAchievements.length, icon: Trophy, color: "bg-highlight/10 text-highlight", href: "/mentor/achievements" },
          { label: "Grace Requests", value: pendingGraceRequests.length, icon: AlertCircle, color: pendingGraceRequests.length > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success", href: "/mentor/attendance" },
          { label: "My Courses", value: courses.length, icon: BookOpen, color: "bg-secondary/10 text-secondary", href: "/mentor/courses" },
        ].map(({ label, value, icon: Icon, color, href }, idx) => (
          <Reveal key={label} delay={idx * 0.06}>
            <Link href={href} className="block h-full">
              <TiltCard intensity={6} className="h-full">
                <div className="card card-interactive p-5 flex flex-col gap-3 group h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">{label}</span>
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.1 }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-heading font-bold text-text-primary">
                      <AnimatedCounter value={value} />
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5" />
                  </div>
                </div>
              </TiltCard>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Notifications & Upcoming Sessions strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" id="notifications">
        {/* Notifications */}
        <Reveal delay={0.1}>
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                Notifications
              </h2>
              <div className="flex items-center gap-3">
                {unreadNotifications.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-accent hover:underline">
                    Mark all read
                  </button>
                )}
                {unreadNotifications.length > 0 && (
                  <span className="badge badge-danger text-[10px]">{unreadNotifications.length} new</span>
                )}
              </div>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {notifications.map((n: any, idx: number) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    className={`p-3 rounded-button border transition-colors ${
                      !n.is_read
                        ? "bg-accent/10 border-accent/30"
                        : "bg-glass/[0.03] border-glass/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${!n.is_read ? "text-accent" : "text-text-primary"}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {n.message && <p className="text-xs text-text-muted mt-0.5">{n.message}</p>}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No notifications yet.</p>
            )}
          </div>
        </Reveal>

        {/* Upcoming Booked Sessions */}
        <Reveal delay={0.16}>
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-secondary" />
                Upcoming Booked Sessions
              </h2>
              <Link href="/mentor/schedule" className="text-xs text-accent hover:underline">Manage</Link>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {upcomingSessions.map((s: any) => (
                  <motion.div
                    key={s.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-2.5 rounded-button bg-glass/[0.03] border border-glass/10"
                  >
                    <div className="text-center flex-shrink-0 w-11 rounded-lg bg-secondary/10 py-1">
                      <div className="text-base font-heading font-bold text-secondary">
                        {new Date(s.date).getDate()}
                      </div>
                      <div className="text-[9px] text-text-muted uppercase">
                        {new Date(s.date).toLocaleDateString("en-IN", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{s.mentee?.full_name ?? "Student"}</div>
                      <div className="text-xs text-text-muted">
                        {s.start_time} - {s.end_time}
                        {s.topic ? ` · ${s.topic}` : ""}
                      </div>
                    </div>
                    <span className="badge badge-accent text-[10px]">{s.type ?? "1-on-1"}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No upcoming booked sessions.</p>
            )}
          </div>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentees Overview */}
        <Reveal delay={0.2} className="lg:col-span-2">
          <div className="card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-text-primary">My Mentees</h2>
              <Link href="/mentor/mentees" className="text-xs text-accent hover:underline">View all</Link>
            </div>
            {mentees.length > 0 ? (
              <div className="space-y-3">
                {mentees.map((mentee: any, idx: number) => {
                  if (!mentee) return null;
                  const nba = nbaByMentee[mentee.id] ?? 0;
                  return (
                    <motion.div
                      key={mentee.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                      whileHover={{ x: 6 }}
                      className="flex items-center gap-4 p-3 rounded-button hover:bg-accent-light transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0" style={{ boxShadow: "0 0 12px rgba(232,168,124,0.2)" }}>
                        {mentee.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">{mentee.full_name}</div>
                        <div className="text-xs text-text-muted">{mentee.usn} · Year {mentee.year} {mentee.section}</div>
                      </div>
                      <div className="text-xs text-accent font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" />{nba} pts
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No mentees assigned yet.</p>
            )}
          </div>
        </Reveal>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending Actions */}
          <Reveal delay={0.26}>
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-text-primary mb-4">Pending Actions</h2>
              <div className="space-y-3">
                {pendingAchievements.length > 0 && (
                  <Link href="/mentor/achievements" className="flex items-center gap-3 p-2.5 rounded-button bg-highlight/10 border border-highlight/20 hover:bg-highlight/15 transition-colors group">
                    <motion.div whileHover={{ rotate: 15 }}>
                      <Trophy className="w-4 h-4 text-highlight flex-shrink-0" />
                    </motion.div>
                    <span className="text-sm text-text-primary">{pendingAchievements.length} achievement{pendingAchievements.length > 1 ? "s" : ""} to verify</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
                {pendingGraceRequests.length > 0 && (
                  <Link href="/mentor/attendance" className="flex items-center gap-3 p-2.5 rounded-button bg-danger/10 border border-danger/20 hover:bg-danger/15 transition-colors group">
                    <motion.div whileHover={{ rotate: 15 }}>
                      <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                    </motion.div>
                    <span className="text-sm text-text-primary">{pendingGraceRequests.length} grace request{pendingGraceRequests.length !== 1 ? "s" : ""} pending</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
                {unacknowledged.length > 0 && (
                  <div className="flex items-center gap-3 p-2.5 rounded-button bg-secondary/10 border border-secondary/20">
                    <MessageSquare className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-text-primary">{unacknowledged.length} session{unacknowledged.length !== 1 ? "s" : ""} pending ack.</span>
                  </div>
                )}
                {unacknowledged.length === 0 && pendingAchievements.length === 0 && pendingGraceRequests.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-success text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    All caught up!
                  </motion.div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Recent Sessions */}
          <Reveal delay={0.32}>
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-text-primary mb-4">Recent Sessions</h2>
              {recentInteractions.length > 0 ? (
                <div className="space-y-3">
                  {recentInteractions.map((i: any, idx: number) => {
                    const mentee = mentees.find((m: any) => m?.id === i.mentee_id);
                    return (
                      <motion.div
                        key={i.id}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(idx * 0.06, 0.3) }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-xs font-bold flex-shrink-0 mt-0.5">
                          {mentee?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary truncate">{mentee?.full_name ?? "Unknown"}</div>
                          <div className="text-xs text-text-muted">
                            {i.type} · {new Date(i.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        {!i.is_acknowledged && (
                          <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5 animate-pulse" title="Not yet acknowledged" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No sessions logged yet.</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </AppShell>
  );
}
