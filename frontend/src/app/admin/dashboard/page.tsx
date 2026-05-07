"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  UserCheck,
  Trophy,
  AlertCircle,
  Activity,
  ChevronRight,
  Loader2,
  Upload,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const [studentsRes, mentorsRes, allocationsRes, pendingAchRes, pendingGraceRes, recentAchRes, profilesRes] =
        await Promise.all([
          supabase.from("Profile").select("id", { count: "exact" }).eq("role", "mentee"),
          supabase.from("Profile").select("id", { count: "exact" }).eq("role", "mentor"),
          supabase.from("Allocation").select("id", { count: "exact" }).eq("is_active", true),
          supabase.from("Achievement").select("id", { count: "exact" }).eq("status", "Pending"),
          supabase.from("GraceRequest").select("id", { count: "exact" }).eq("status", "Pending"),
          supabase.from("Achievement").select("*, student:student_id(full_name)").order("created_at", { ascending: false }).limit(5),
          supabase.from("Profile").select("*").order("created_at", { ascending: false }).limit(10),
        ]);

      const totalNbaRes = await supabase.from("Achievement").select("nba_points").eq("status", "Verified");
      const totalNba = (totalNbaRes.data ?? []).reduce((sum: number, a: any) => sum + (a.nba_points ?? 0), 0);

      const mentorsWithAllocsRes = await supabase.from("Profile").select("id, full_name, department, designation").eq("role", "mentor");
      const mentors = mentorsWithAllocsRes.data ?? [];
      const mentorIds = mentors.map((m: any) => m.id);

      const [allAllocsRes, allSessionsRes] = await Promise.all([
        supabase.from("Allocation").select("mentor_id").in("mentor_id", mentorIds).eq("is_active", true),
        supabase.from("Interaction").select("mentor_id").in("mentor_id", mentorIds),
      ]);

      const allocsByMentor: Record<string, number> = {};
      const sessionsByMentor: Record<string, number> = {};
      for (const a of allAllocsRes.data ?? []) allocsByMentor[a.mentor_id] = (allocsByMentor[a.mentor_id] ?? 0) + 1;
      for (const s of allSessionsRes.data ?? []) sessionsByMentor[s.mentor_id] = (sessionsByMentor[s.mentor_id] ?? 0) + 1;

      setData({
        totalStudents: studentsRes.count ?? 0,
        totalFaculty: mentorsRes.count ?? 0,
        totalAllocations: allocationsRes.count ?? 0,
        pendingAch: pendingAchRes.count ?? 0,
        pendingGrace: pendingGraceRes.count ?? 0,
        totalNba,
        recentAchievements: recentAchRes.data ?? [],
        incompleteCount: (profilesRes.data ?? []).filter((p: any) => !p.is_profile_complete && p.role === "mentee").length,
        mentors: mentors.map((m: any) => ({
          ...m,
          menteeCount: allocsByMentor[m.id] ?? 0,
          sessionCount: sessionsByMentor[m.id] ?? 0,
        })),
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const { totalStudents, totalFaculty, totalAllocations, pendingAch, pendingGrace, totalNba, recentAchievements, incompleteCount, mentors } = data;

  return (
    <AppShell role="admin">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">Admin Overview</h1>
          <p className="text-text-muted text-sm mt-1">Platform health &amp; system-wide management — Sahyadri College of Engineering &amp; Management</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/attendance/upload" className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Attendance
          </Link>
          <Link href="/admin/feed" className="btn-secondary flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Post Announcement
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: totalStudents, icon: Users, color: "bg-accent/10 text-accent", href: "/admin/users?role=mentee" },
          { label: "Faculty / Mentors", value: totalFaculty, icon: UserCheck, color: "bg-secondary/10 text-secondary", href: "/admin/users?role=mentor" },
          { label: "Active Allocations", value: totalAllocations, icon: Activity, color: "bg-highlight/10 text-highlight", href: "/admin/allocations" },
          { label: "Total NBA Points", value: Math.round(totalNba), icon: Trophy, color: "bg-success/10 text-success", href: "/admin/achievements" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <div className="card card-interactive p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-heading font-bold text-text-primary">{value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(pendingAch > 0 || pendingGrace > 0 || incompleteCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {pendingAch > 0 && (
            <Link href="/admin/achievements?filter=Pending">
              <div className="card p-4 border-highlight/30 bg-highlight/5 flex items-center gap-3 hover:border-highlight/50 transition-colors cursor-pointer">
                <Trophy className="w-5 h-5 text-highlight flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">{pendingAch} Achievements Pending</div>
                  <div className="text-xs text-text-muted">Awaiting faculty verification</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
              </div>
            </Link>
          )}
          {pendingGrace > 0 && (
            <Link href="/admin/audit">
              <div className="card p-4 border-danger/30 bg-danger/5 flex items-center gap-3 hover:border-danger/50 transition-colors cursor-pointer">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">{pendingGrace} Grace Requests</div>
                  <div className="text-xs text-text-muted">Pending mentor review</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
              </div>
            </Link>
          )}
          {incompleteCount > 0 && (
            <Link href="/admin/users">
              <div className="card p-4 border-accent/30 bg-accent/5 flex items-center gap-3 hover:border-accent/50 transition-colors">
                <Users className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">{incompleteCount} Incomplete Profiles</div>
                  <div className="text-xs text-text-muted">Students with missing data</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievement activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-text-primary">Recent Achievements</h2>
            <Link href="/admin/achievements" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((ach: any) => (
                <div key={ach.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ach.status === "Verified" ? "bg-success" :
                    ach.status === "Pending" ? "bg-accent animate-pulse" : "bg-danger"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{ach.title}</div>
                    <div className="text-xs text-text-muted">{ach.student?.full_name} · {ach.nba_points} pts</div>
                  </div>
                  <span className={`badge text-[10px] ${
                    ach.status === "Verified" ? "badge-success" :
                    ach.status === "Pending" ? "badge-accent" : "badge-danger"
                  }`}>{ach.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No achievement data yet.</p>
          )}
        </div>

        {/* Mentorship coverage */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-text-primary mb-4">Mentorship Coverage</h2>
          {mentors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Dept.</th>
                    <th>Mentees</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((mentor: any) => (
                    <tr key={mentor.id}>
                      <td className="font-medium">{mentor.full_name}</td>
                      <td className="text-text-muted text-xs">{mentor.department}</td>
                      <td><span className="badge badge-accent">{mentor.menteeCount}</span></td>
                      <td><span className="badge badge-secondary">{mentor.sessionCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-muted text-sm">No mentors found.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
