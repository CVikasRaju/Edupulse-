"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, Plus, X, Loader2, Users } from "lucide-react";

export default function AdminCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [faculty, setFaculty] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [coursesRes, facultyRes] = await Promise.all([
        supabase.from("Course").select(`*, Profile!Course_faculty_id_fkey(full_name)`).order("created_at", { ascending: false }),
        supabase.from("Profile").select("id, full_name").eq("role", "mentor"),
      ]);
      setCourses(coursesRes.data || []);
      setFaculty(facultyRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    await supabase.from("Course").insert({
      faculty_id: fd.get("faculty_id") as string,
      name: fd.get("name") as string,
      code: fd.get("code") as string,
      semester: parseInt(fd.get("semester") as string),
      department: fd.get("department") as string,
      academic_year: fd.get("academic_year") as string,
    });
    setShowModal(false);
    window.location.reload();
  };

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="admin">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Course Management</h1>
          <p className="text-text-muted text-sm mt-0.5">All courses across departments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Course</button>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Semester</th><th>Academic Year</th></tr></thead>
          <tbody>
            {courses.length > 0 ? courses.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="font-mono text-xs text-text-muted">{c.code}</td>
                <td>{c.Profile?.full_name}</td>
                <td><span className="badge badge-secondary">Sem {c.semester}</span></td>
                <td>{c.academic_year}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-8 text-text-muted">No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Course</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="label">Faculty</label>
                <select name="faculty_id" required className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none">
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                </select>
              </div>
              <div><label className="label">Course Name</label><input name="name" required className="input" placeholder="e.g. Database Systems" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Code</label><input name="code" className="input" placeholder="21CS51" /></div>
                <div><label className="label">Semester</label><input type="number" name="semester" min="1" max="8" className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Department</label><input name="department" className="input" placeholder="CSE" /></div>
                <div><label className="label">Academic Year</label><input name="academic_year" className="input" placeholder="2024-25" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
