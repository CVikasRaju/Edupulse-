"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  BookOpen,
  Users,
  Calendar,
  Loader2,
  GraduationCap,
  FileText,
  Link2,
  StickyNote,
  ExternalLink,
  Bell,
} from "lucide-react";

export default function StudentCourses() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/course-materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials ?? []);
      }
    } catch {
      // keep existing materials
    }
  }, []);

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
    loadMaterials();
  }, [loadMaterials]);

  const courseMaterials = (courseId: string) =>
    materials.filter((m) => m.course_id === courseId);

  const fileIconFor = (type?: string) =>
    type === "LINK" ? (
      <Link2 className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );

  if (loading) return <AppShell role="student"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  const totalNotes = materials.length;

  return (
    <AppShell role="student">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary">My Courses</h1>
        <p className="text-text-muted text-sm mt-0.5">Courses you are enrolled in & notes shared by your faculty</p>
      </div>

      {enrollments.length > 0 ? (
        <div className="space-y-6">
          {/* Summary strip */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="card px-5 py-3 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <div>
                <div className="text-lg font-heading font-bold text-text-primary">{enrollments.length}</div>
                <div className="text-xs text-text-muted">Courses</div>
              </div>
            </div>
            <div className="card px-5 py-3 flex items-center gap-3">
              <StickyNote className="w-5 h-5 text-accent" />
              <div>
                <div className="text-lg font-heading font-bold text-text-primary">{totalNotes}</div>
                <div className="text-xs text-text-muted">Notes Available</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {enrollments.map((e) => {
              const mats = courseMaterials(e.Course?.id);
              return (
                <div key={e.id} className="card p-5 group hover:border-accent/40 transition-all duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="badge badge-secondary">{mats.length} note{mats.length === 1 ? "" : "s"}</span>
                  </div>
                  <h3 className="font-heading font-bold text-text-primary">{e.Course?.name}</h3>
                  <p className="font-mono text-xs text-text-muted mt-1">{e.Course?.code}</p>
                  <div className="mt-4 space-y-2 text-sm text-text-muted">
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{e.Course?.Profile?.full_name || "N/A"}</div>
                    <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" />Semester {e.Course?.semester}</div>
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{e.Course?.academic_year}</div>
                  </div>
                  <div className="mt-3">
                    <span className={`badge ${e.status === "Active" ? "badge-success" : "badge-accent"}`}>{e.status}</span>
                  </div>

                  {/* Notes from faculty */}
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                      <StickyNote className="w-3 h-3" /> Notes from Faculty
                    </h4>
                    {mats.length > 0 ? (
                      <div className="space-y-2">
                        {mats.map((m) => (
                          <a
                            key={m.id}
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 bg-surface rounded-input px-3 py-2.5 border border-surface-border hover:border-accent/40 hover:bg-accent/5 transition-colors group/note"
                          >
                            <span className="text-accent flex-shrink-0">{fileIconFor(m.file_type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary truncate group-hover/note:text-accent">{m.title}</div>
                              <div className="text-[11px] text-text-muted">
                                {m.file_type === "LINK" ? "External link" : m.file_type} · {new Date(m.created_at).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted flex items-center gap-1.5">
                        <Bell className="w-3 h-3" /> No notes uploaded yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
