"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, Plus, X, Loader2, Users, GraduationCap } from "lucide-react";

export default function MentorCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("Course").select("*").eq("faculty_id", user.id).order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("Course").insert({
      faculty_id: user.id,
      name: fd.get("name") as string,
      code: fd.get("code") as string,
      semester: parseInt(fd.get("semester") as string),
      department: fd.get("department") as string,
      academic_year: fd.get("academic_year") as string,
    });
    setShowModal(false);
    window.location.reload();
  };

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">My Courses</h1>
          <p className="text-text-muted text-sm mt-0.5">Courses you teach</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Course</button>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="card p-5 group hover:border-accent/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit mb-4"><BookOpen className="w-5 h-5" /></div>
              <h3 className="font-heading font-bold text-text-primary">{c.name}</h3>
              <p className="font-mono text-xs text-text-muted mt-1">{c.code}</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="badge badge-secondary">Sem {c.semester}</span>
                <span className="badge badge-secondary">{c.department}</span>
                <span className="badge badge-accent">{c.academic_year}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No courses added yet.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Course</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="label">Course Name</label><input name="name" required className="input" placeholder="e.g. Database Systems" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Course Code</label><input name="code" className="input" placeholder="e.g. 21CS51" /></div>
                <div><label className="label">Semester</label><input type="number" name="semester" min="1" max="8" className="input" placeholder="5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Department</label><input name="department" className="input" placeholder="Computer Science" /></div>
                <div><label className="label">Academic Year</label><input name="academic_year" className="input" placeholder="2024-25" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
