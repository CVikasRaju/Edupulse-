"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Trophy, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AdminAchievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("Achievement")
        .select(`*, Profile!Achievement_student_id_fkey(full_name, usn, department)`)
        .order("created_at", { ascending: false });
      setAchievements(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from("Achievement").update({ status }).eq("id", id);
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Achievement Verification</h1>
        <p className="text-text-muted text-sm mt-0.5">Review and verify student achievements</p>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Achievement</th><th>Category</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {achievements.length > 0 ? achievements.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="font-medium">{a.Profile?.full_name}</div>
                  <div className="text-xs text-text-muted">{a.Profile?.usn}</div>
                </td>
                <td className="font-medium">{a.title}</td>
                <td>{a.category}</td>
                <td><span className="badge badge-secondary">{a.level}</span></td>
                <td><span className={`badge ${a.status === "Verified" ? "badge-success" : a.status === "Rejected" ? "badge-danger" : "badge-accent"}`}>{a.status}</span></td>
                <td>
                  {a.status === "Pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(a.id, "Verified")} className="text-success hover:opacity-80 transition-opacity"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => updateStatus(a.id, "Rejected")} className="text-danger hover:opacity-80 transition-opacity"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted">No achievements submitted yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
