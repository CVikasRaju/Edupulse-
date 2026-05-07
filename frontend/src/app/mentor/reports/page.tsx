"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Download, CheckCircle2, Loader2 } from "lucide-react";

export default function MentorReports() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [menteesData, setMenteesData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: allocations } = await supabase
        .from("Allocation")
        .select(`Profile!Allocation_mentee_id_fkey(id, full_name, usn, email)`)
        .eq("mentor_id", user.id).eq("is_active", true);

      const menteeList = allocations?.map((a: any) => a.Profile) || [];

      const enriched = await Promise.all(
        menteeList.map(async (m: any) => {
          const [gradesRes, achRes] = await Promise.all([
            supabase.from("Grade").select("cgpa").eq("student_id", m.id).order("semester", { ascending: false }).limit(1),
            supabase.from("Achievement").select("id").eq("student_id", m.id).eq("status", "Verified"),
          ]);
          return {
            ...m,
            cgpa: gradesRes.data?.[0]?.cgpa ?? "N/A",
            verified_achievements: achRes.data?.length ?? 0,
          };
        })
      );

      setMenteesData(enriched);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    const csv = [
      ["Student Name", "USN", "Email", "CGPA", "Verified Achievements"],
      ...menteesData.map(m => [m.full_name, m.usn, m.email, m.cgpa, m.verified_achievements]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Mentees_Academic_Report.csv";
    a.click();
    setTimeout(() => setDownloading(false), 800);
  };

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Reports</h1>
          <p className="text-text-muted text-sm mt-0.5">Academic summary for your mentees</p>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="btn-primary">
          {downloading ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating..." : "Download CSV"}
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Student</th><th>USN</th><th>CGPA</th><th>Achievements</th></tr></thead>
          <tbody>
            {menteesData.length > 0 ? menteesData.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.full_name}</td>
                <td className="font-mono text-xs text-text-muted">{m.usn}</td>
                <td><span className="badge badge-accent">{m.cgpa}</span></td>
                <td>{m.verified_achievements} verified</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-8 text-text-muted">No mentees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
