"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
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
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function MentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [allocationsRes, interactionsRes, coursesRes] = await Promise.all([
        supabase.from("Allocation").select("*, mentee:mentee_id(*)").eq("mentor_id", user.id).eq("is_active", true),
        supabase.from("Interaction").select("*").eq("mentor_id", user.id).order("date", { ascending: false }).limit(10),
        supabase.from("Course").select("*").eq("faculty_id", user.id),
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
      });
      setLoading(false);
    };

    fetchData();
  }, []);

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

  const { mentees, interactions, courses, pendingAchievements, pendingGraceRequests, nbaByMentee } = data;
  const unacknowledged = interactions.filter((i: any) => !i.is_acknowledged);
  const recentInteractions = interactions.slice(0, 4);

  return (
    <AppShell role="mentor">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome 👋</h1>
        <p className="text-text-muted text-sm mt-0.5">Your mentor dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Mentees", value: mentees.length, icon: Users, color: "bg-accent/10 text-accent", href: "/mentor/mentees" },
          { label: "Pending Achievements", value: pendingAchievements.length, icon: Trophy, color: "bg-highlight/10 text-highlight", href: "/mentor/achievements" },
          { label: "Grace Requests", value: pendingGraceRequests.length, icon: AlertCircle, color: pendingGraceRequests.length > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success", href: "/mentor/attendance" },
          { label: "My Courses", value: courses.length, icon: BookOpen, color: "bg-secondary/10 text-secondary", href: "/mentor/courses" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card card-interactive p-5 flex flex-col gap-3 group">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-sm">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-heading font-bold text-text-primary">{value}</span>
              <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentees Overview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-text-primary">My Mentees</h2>
            <Link href="/mentor/mentees" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {mentees.length > 0 ? (
            <div className="space-y-3">
              {mentees.map((mentee: any) => {
                if (!mentee) return null;
                const nba = nbaByMentee[mentee.id] ?? 0;
                return (
                  <div key={mentee.id} className="flex items-center gap-4 p-3 rounded-button hover:bg-accent-light transition-colors">
                    <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
                      {mentee.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">{mentee.full_name}</div>
                      <div className="text-xs text-text-muted">{mentee.usn} · Year {mentee.year} {mentee.section}</div>
                    </div>
                    <div className="text-xs text-accent font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />{nba} pts
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No mentees assigned yet.</p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending Actions */}
          <div className="card p-5">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Pending Actions</h2>
            <div className="space-y-3">
              {pendingAchievements.length > 0 && (
                <Link href="/mentor/achievements" className="flex items-center gap-3 p-2.5 rounded-button bg-highlight/10 border border-highlight/20 hover:bg-highlight/15 transition-colors">
                  <Trophy className="w-4 h-4 text-highlight flex-shrink-0" />
                  <span className="text-sm text-text-primary">{pendingAchievements.length} achievement{pendingAchievements.length > 1 ? "s" : ""} to verify</span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted ml-auto" />
                </Link>
              )}
              {pendingGraceRequests.length > 0 && (
                <Link href="/mentor/attendance" className="flex items-center gap-3 p-2.5 rounded-button bg-danger/10 border border-danger/20 hover:bg-danger/15 transition-colors">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span className="text-sm text-text-primary">{pendingGraceRequests.length} grace request{pendingGraceRequests.length !== 1 ? "s" : ""} pending</span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted ml-auto" />
                </Link>
              )}
              {unacknowledged.length > 0 && (
                <div className="flex items-center gap-3 p-2.5 rounded-button bg-secondary/10 border border-secondary/20">
                  <MessageSquare className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span className="text-sm text-text-primary">{unacknowledged.length} session{unacknowledged.length !== 1 ? "s" : ""} pending ack.</span>
                </div>
              )}
              {unacknowledged.length === 0 && pendingAchievements.length === 0 && pendingGraceRequests.length === 0 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  All caught up!
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card p-5">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Recent Sessions</h2>
            {recentInteractions.length > 0 ? (
              <div className="space-y-3">
                {recentInteractions.map((i: any) => {
                  const mentee = mentees.find((m: any) => m?.id === i.mentee_id);
                  return (
                    <div key={i.id} className="flex items-start gap-3">
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
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" title="Not yet acknowledged" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No sessions logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
