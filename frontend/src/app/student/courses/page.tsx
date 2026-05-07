"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, Users, Calendar, Loader2, GraduationCap } from "lucide-react";

export default function StudentCourses() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("CourseEnrollment")
        .select(`
          id, status, enrolled_at,
          Course (
            id, name, code, semester, department, academic_year,
            Profile!Course_faculty_id_fkey(full_name)
          )
        `)
        .eq("student_id", user.id);

      setEnrollments(data || []);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  if (loading) return <AppShell role="student"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="student">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">My Courses</h1>
        <p className="text-text-muted text-sm mt-0.5">Courses you are currently enrolled in</p>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((e) => (
            <div key={e.id} className="card p-5 group hover:border-accent/40 transition-all duration-300">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-text-primary">{e.Course?.name}</h3>
              <p className="font-mono text-xs text-text-muted mt-1">{e.Course?.code}</p>
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{e.Course?.Profile?.full_name || "N/A"}</div>
                <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" />Semester {e.Course?.semester}</div>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{e.Course?.academic_year}</div>
              </div>
              <div className="mt-4">
                <span className={`badge ${e.status === "Active" ? "badge-success" : "badge-accent"}`}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>You are not enrolled in any courses yet.</p>
          <p className="text-sm mt-1">Contact your admin to get enrolled.</p>
        </div>
      )}
    </AppShell>
  );
}
