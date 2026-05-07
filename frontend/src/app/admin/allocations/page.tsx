"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { UserPlus, Search, Filter, X, Loader2, Users } from "lucide-react";

export default function AdminAllocations() {
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    const [allocRes, profileRes] = await Promise.all([
      supabase.from("Allocation").select(`
        id,
        is_active,
        mentor:Profile!Allocation_mentor_id_fkey(full_name, email),
        mentee:Profile!Allocation_mentee_id_fkey(full_name, email, usn)
      `),
      supabase.from("Profile").select("id, full_name, role")
    ]);

    setAllocations(allocRes.data || []);
    setMentors(profileRes.data?.filter(p => p.role === "mentor") || []);
    setStudents(profileRes.data?.filter(p => p.role === "mentee") || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    
    const { error } = await supabase.from("Allocation").insert({
      mentor_id: fd.get("mentor") as string,
      mentee_id: fd.get("student") as string,
      is_active: true
    });

    if (!error) {
      setShowModal(false);
      fetchData();
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

  return (
    <AppShell role="admin">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Mentor-Mentee Allocations</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage mentorship pairings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" /> New Allocation
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mentor</th>
                <th>Mentee (Student)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium text-text-primary">{a.mentor.full_name}</div>
                    <div className="text-xs text-text-muted">{a.mentor.email}</div>
                  </td>
                  <td>
                    <div className="font-medium text-text-primary">{a.mentee.full_name}</div>
                    <div className="text-xs text-text-muted">{a.mentee.usn}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.is_active ? "badge-success" : "badge-danger"}`}>
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="text-accent text-xs font-semibold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">New Pairing</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="label">Select Mentor</label>
                <select name="mentor" required className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                  {mentors.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Select Student</label>
                <select name="student" required className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Confirm Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
