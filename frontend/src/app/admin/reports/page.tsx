"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Download, BarChart3, Loader2 } from "lucide-react";

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [profilesRes, gradesRes, achRes, graceRes] = await Promise.all([
        supabase.from("Profile").select("role"),
        supabase.from("Grade").select("cgpa, student_id"),
        supabase.from("Achievement").select("status"),
        supabase.from("GraceRequest").select("status"),
      ]);

      const profiles = profilesRes.data || [];
      const grades = gradesRes.data || [];
      const achievements = achRes.data || [];
      const graceRequests = graceRes.data || [];

      const cgpas = grades.map((g: any) => g.cgpa).filter(Boolean);
      const avgCGPA = cgpas.length ? (cgpas.reduce((a: number, b: number) => a + b, 0) / cgpas.length).toFixed(2) : "N/A";

      setStats({
        totalStudents: profiles.filter((p: any) => p.role === "mentee").length,
        totalFaculty: profiles.filter((p: any) => p.role === "mentor").length,
        avgCGPA,
        pendingGrace: graceRequests.filter((r: any) => r.status === "Pending").length,
        verifiedAchievements: achievements.filter((a: any) => a.status === "Verified").length,
        pendingAchievements: achievements.filter((a: any) => a.status === "Pending").length,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  const cards = [
    { label: "Total Students", value: stats.totalStudents, color: "text-accent" },
    { label: "Total Faculty", value: stats.totalFaculty, color: "text-success" },
    { label: "Average CGPA", value: stats.avgCGPA, color: "text-accent" },
    { label: "Pending Grace Requests", value: stats.pendingGrace, color: "text-warning" },
    { label: "Verified Achievements", value: stats.verifiedAchievements, color: "text-success" },
    { label: "Pending Achievements", value: stats.pendingAchievements, color: "text-warning" },
  ];

  return (
    <AppShell role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Platform Reports</h1>
        <p className="text-text-muted text-sm mt-0.5">Live statistics from the database</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-6">
            <div className="text-text-muted text-sm mb-2">{card.label}</div>
            <div className={`text-4xl font-heading font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
