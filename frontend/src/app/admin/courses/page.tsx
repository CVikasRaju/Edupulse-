"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import { BookOpen, Plus, X, Loader2, Users, UserPlus, CheckCircle2, Sparkles } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export default function AdminCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [faculty, setFaculty] = useState<any[]>([]);
  // Enroll modal state
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      id: newId(),
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

  const openEnroll = async (course: any) => {
    setEnrollCourse(course);
    setSelectedStudents([]);
    setEnrollMsg(null);
    const supabase = createClient();
    const { data } = await supabase
      .from("Profile")
      .select("id, full_name, usn, department")
      .eq("role", "mentee")
      .order("full_name");
    setStudents(data || []);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    if (!enrollCourse || selectedStudents.length === 0) return;
    setEnrolling(true);
    setEnrollMsg(null);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("CourseEnrollment")
      .select("student_id")
      .eq("course_id", enrollCourse.id);
    const already = new Set((existing ?? []).map((e: any) => e.student_id));
    const toEnroll = selectedStudents.filter((id) => !already.has(id));

    if (toEnroll.length === 0) {
      setEnrollMsg({ ok: true, text: "All selected students are already enrolled." });
      setEnrolling(false);
      return;
    }

    const { error } = await supabase.from("CourseEnrollment").insert(
      toEnroll.map((student_id) => ({
        id: newId(),
        student_id,
        course_id: enrollCourse.id,
        status: "Active",
      }))
    );

    if (error) {
      setEnrollMsg({ ok: false, text: `Enrollment failed: ${error.message}` });
    } else {
      setEnrollMsg({ ok: true, text: `Enrolled ${toEnroll.length} student${toEnroll.length > 1 ? "s" : ""} in ${enrollCourse.name}.` });
      setSelectedStudents([]);
    }
    setEnrolling(false);
  };

  if (loading) return <AppShell role="admin"><div className="flex items-center justify-center h-64 gap-3"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles className="w-8 h-8 text-accent" /></motion.div></div></AppShell>;

  return (
    <AppShell role="admin">
      <Reveal>
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">Course Management</h1>
          <p className="text-text-muted text-sm mt-0.5">All courses across departments</p>
          </div>
          <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Course</motion.button>
        </div>
      </Reveal>

      {enrollMsg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          enrollMsg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {enrollMsg.text}
        </div>
      )}

      <Reveal delay={0.1}>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Semester</th><th>Academic Year</th><th>Actions</th></tr></thead>
          <tbody>
            {courses.length > 0 ? courses.map((c, idx) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              >
                <td className="font-medium">{c.name}</td>
                <td className="font-mono text-xs text-text-muted">{c.code}</td>
                <td>{c.Profile?.full_name}</td>
                <td><span className="badge badge-secondary">Sem {c.semester}</span></td>
                <td>{c.academic_year}</td>
                <td>
                  <button onClick={() => openEnroll(c)} className="text-accent text-xs font-semibold hover:underline flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" /> Enroll Students
                  </button>
                </td>
              </motion.tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted">No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </Reveal>

      <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Course</h2>
              <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></motion.button>
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
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" className="btn-primary">Create</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {enrollCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEnrollCourse(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-heading font-bold text-text-primary">Enroll Students</h2>
                <p className="text-xs text-text-muted">{enrollCourse.name} · {enrollCourse.code}</p>
              </div>
              <motion.button whileHover={{ rotate: 90 }} onClick={() => setEnrollCourse(null)} className="btn-icon"><X className="w-5 h-5" /></motion.button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-button border cursor-pointer transition-colors ${
                        selectedStudents.includes(s.id)
                          ? "bg-accent/10 border-accent/40"
                          : "bg-surface border-surface-border hover:border-accent/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="w-4 h-4 accent-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-primary truncate">{s.full_name}</div>
                        <div className="text-xs text-text-muted">{s.usn}{s.department ? ` · ${s.department}` : ""}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-text-muted">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No students found.</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-surface-border flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">{selectedStudents.length} selected</span>
              <div className="flex gap-3">
                <button onClick={() => setEnrollCourse(null)} className="btn-ghost">Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleEnroll} disabled={enrolling || selectedStudents.length === 0} className="btn-primary">
                  {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Enroll Selected
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </AppShell>
  );
}
