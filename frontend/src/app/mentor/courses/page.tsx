"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import {
  BookOpen,
  Plus,
  X,
  Loader2,
  FileText,
  Upload,
  Link2,
  Trash2,
  ExternalLink,
  StickyNote,
  AlertCircle,
  Users,
} from "lucide-react";

const STORAGE_BUCKET = "course-materials";

export default function MentorCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteLink, setNoteLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollMsg, setEnrollMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!enrollMsg) return;
    const t = setTimeout(() => setEnrollMsg(null), 4000);
    return () => clearTimeout(t);
  }, [enrollMsg]);

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
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("Course").select("*").eq("faculty_id", user.id).order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    };
    fetch();
    loadMaterials();
  }, [loadMaterials]);

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
    setShowCourseModal(false);
    window.location.reload();
  };

  // Enroll this mentor's allocated mentees into a course they teach.
  // This is what makes courses (and their notes) visible to students.
  const handleEnrollMentees = async (course: any) => {
    setEnrollingId(course.id);
    setEnrollMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnrollingId(null); return; }

    // All mentees allocated to this mentor
    const { data: allocations } = await supabase
      .from("Allocation")
      .select("mentee_id")
      .eq("mentor_id", user.id)
      .eq("is_active", true);
    const menteeIds = (allocations ?? []).map((a: any) => a.mentee_id);

    if (menteeIds.length === 0) {
      setEnrollMsg({ ok: false, text: "You have no allocated mentees to enroll." });
      setEnrollingId(null);
      return;
    }

    // Existing enrollments to avoid unique-constraint errors
    const { data: existing } = await supabase
      .from("CourseEnrollment")
      .select("student_id")
      .eq("course_id", course.id);
    const alreadyEnrolled = new Set((existing ?? []).map((e: any) => e.student_id));

    const toEnroll = menteeIds.filter((id: string) => !alreadyEnrolled.has(id));
    if (toEnroll.length === 0) {
      setEnrollMsg({ ok: true, text: "All your mentees are already enrolled in this course." });
      setEnrollingId(null);
      return;
    }

    const { error } = await supabase.from("CourseEnrollment").insert(
      toEnroll.map((student_id: string) => ({
        student_id,
        course_id: course.id,
        status: "Active",
      }))
    );

    if (error) {
      // If the DB enforces uniqueness at insert time, try upsert semantics
      if (String(error.message).toLowerCase().includes("duplicate")) {
        const { error: upErr } = await supabase.from("CourseEnrollment").upsert(
          toEnroll.map((student_id: string) => ({
            student_id,
            course_id: course.id,
            status: "Active",
          })),
          { onConflict: "student_id,course_id" }
        );
        if (upErr) {
          setEnrollMsg({ ok: false, text: `Enrollment failed: ${upErr.message}` });
        } else {
          setEnrollMsg({ ok: true, text: `Enrolled ${toEnroll.length} mentee${toEnroll.length > 1 ? "s" : ""} in ${course.name}.` });
        }
      } else {
        setEnrollMsg({ ok: false, text: `Enrollment failed: ${error.message}` });
      }
    } else {
      setEnrollMsg({ ok: true, text: `Enrolled ${toEnroll.length} mentee${toEnroll.length > 1 ? "s" : ""} in ${course.name}.` });
    }
    setEnrollingId(null);
  };

  const openNotes = (course: any) => {
    setSelectedCourse(course);
    setNoteTitle("");
    setNoteDesc("");
    setNoteFile(null);
    setNoteLink("");
    setModalError("");
    setShowNotesModal(true);
  };

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setModalError("");
    setUploading(true);
    try {
      let fileUrl = "";
      let fileType: string | null = null;

      if (noteFile) {
        // Upload to Supabase Storage
        const supabase = createClient();
        const ext = noteFile.name.split(".").pop() || "file";
        const safeName = noteFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${selectedCourse.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, noteFile, { upsert: false, cacheControl: "3600" });
        if (upErr) {
          throw new Error(
            `File upload failed: ${upErr.message}. Make sure the "course-materials" storage bucket exists (see setup SQL).`
          );
        }
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        fileUrl = pub.publicUrl;
        fileType = ext.toUpperCase();
      } else if (noteLink.trim()) {
        // Use pasted link directly
        let link = noteLink.trim();
        if (!/^https?:\/\//i.test(link)) link = "https://" + link;
        fileUrl = link;
        fileType = "LINK";
      } else {
        setModalError("Add a file or paste a link.");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/course-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          title: noteTitle.trim(),
          description: noteDesc.trim() || undefined,
          file_url: fileUrl,
          file_type: fileType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload note");

      await loadMaterials();
      setNoteTitle("");
      setNoteDesc("");
      setNoteFile(null);
      setNoteLink("");
      setShowNotesModal(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to upload note. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setModalError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/course-materials?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete note");
      }
      await loadMaterials();
    } catch (err: any) {
      setModalError(err.message || "Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const courseMaterials = (courseId: string) =>
    materials.filter((m) => m.course_id === courseId);

  const fileIconFor = (type?: string) =>
    type === "LINK" ? (
      <Link2 className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );

  if (loading) return <AppShell role="mentor"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></AppShell>;

  return (
    <AppShell role="mentor">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">My Courses</h1>
          <p className="text-text-muted text-sm mt-0.5">Courses you teach & study notes you share</p>
        </div>
        <button onClick={() => setShowCourseModal(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Course</button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {enrollMsg && (
        <div className={`mb-4 text-sm rounded-input px-4 py-3 border ${
          enrollMsg.ok ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {enrollMsg.text}
        </div>
      )}

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const mats = courseMaterials(c.id);
            return (
              <div key={c.id} className="card p-5 group hover:border-accent/40 transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit mb-4"><BookOpen className="w-5 h-5" /></div>
                  <span className="badge badge-secondary">{mats.length} note{mats.length === 1 ? "" : "s"}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEnrollMentees(c)}
                    disabled={enrollingId === c.id}
                    className="btn-ghost btn-sm text-xs"
                    title="Enroll your allocated mentees so they can see this course & its notes"
                  >
                    {enrollingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                    Enroll Mentees
                  </button>
                </div>
                <h3 className="font-heading font-bold text-text-primary">{c.name}</h3>
                <p className="font-mono text-xs text-text-muted mt-1">{c.code}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="badge badge-secondary">Sem {c.semester}</span>
                  <span className="badge badge-secondary">{c.department}</span>
                  <span className="badge badge-accent">{c.academic_year}</span>
                </div>

                {mats.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-border space-y-2 flex-1">
                    {mats.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <span className="text-accent flex-shrink-0">{fileIconFor(m.file_type)}</span>
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-text-primary hover:text-accent truncate flex-1">
                          {m.title}
                        </a>
                      </div>
                    ))}
                    {mats.length > 3 && (
                      <p className="text-xs text-text-muted pl-6">+{mats.length - 3} more</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => openNotes(c)}
                  className="mt-4 btn-primary btn-sm w-full justify-center"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  {mats.length > 0 ? "Manage Notes" : "Upload Notes"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 text-center text-text-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No courses added yet.</p>
          <button onClick={() => setShowCourseModal(true)} className="btn-primary btn-sm mt-4">
            <Plus className="w-3.5 h-3.5" />Add your first course
          </button>
        </div>
      )}

      {/* ── Add Course Modal ── */}
      {showCourseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Course</h2>
              <button onClick={() => setShowCourseModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
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
                <button type="button" onClick={() => setShowCourseModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload Notes Modal ── */}
      {showNotesModal && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <div>
                <h2 className="font-heading font-bold text-text-primary">Study Notes</h2>
                <p className="text-xs text-text-muted mt-0.5">{selectedCourse.name} · {selectedCourse.code}</p>
              </div>
              <button onClick={() => setShowNotesModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {modalError && (
                <div className="flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{modalError}</span>
                </div>
              )}

              {/* Existing notes */}
              {courseMaterials(selectedCourse.id).length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Uploaded Notes ({courseMaterials(selectedCourse.id).length})</h3>
                  {courseMaterials(selectedCourse.id).map((m) => (
                    <div key={m.id} className="flex items-center gap-3 bg-surface rounded-input px-3.5 py-3 border border-surface-border">
                      <span className="text-accent flex-shrink-0">{fileIconFor(m.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text-primary hover:text-accent truncate block">
                          {m.title}
                        </a>
                        {m.description && <p className="text-xs text-text-muted truncate">{m.description}</p>}
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {m.file_type === "LINK" ? "Link" : m.file_type} · {new Date(m.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Open">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteNote(m.id)}
                        disabled={deletingId === m.id}
                        className="btn-icon text-danger hover:bg-danger/10"
                        title="Delete note"
                      >
                        {deletingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-text-muted text-sm">
                  <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No notes uploaded yet for this course.
                </div>
              )}

              {/* Upload form */}
              <form onSubmit={handleUploadNote} className="space-y-4 pt-4 border-t border-surface-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Upload New Note</h3>
                <div>
                  <label className="label">Title</label>
                  <input
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    className="input"
                    placeholder="e.g. Unit 3 — SQL Joins Notes"
                  />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <textarea
                    value={noteDesc}
                    onChange={(e) => setNoteDesc(e.target.value)}
                    rows={2}
                    className="input py-2"
                    placeholder="Short description..."
                  />
                </div>

                <div>
                  <label className="label">File (PDF, DOCX, PPT, image…)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center gap-2 cursor-pointer border border-dashed border-surface-border rounded-input px-4 py-3 text-sm text-text-muted hover:border-accent/40 hover:text-text-primary transition-colors">
                      <Upload className="w-4 h-4 text-accent" />
                      <span className="truncate">{noteFile ? noteFile.name : "Choose a file…"}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setNoteFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {noteFile && (
                      <button type="button" onClick={() => setNoteFile(null)} className="btn-icon text-danger" title="Clear file">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="flex-1 border-t border-surface-border" />
                  <span>or</span>
                  <span className="flex-1 border-t border-surface-border" />
                </div>

                <div>
                  <label className="label">Paste a link instead (Google Drive, etc.)</label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={noteLink}
                      onChange={(e) => setNoteLink(e.target.value)}
                      className="input pl-9"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setShowNotesModal(false)} className="btn-ghost">Close</button>
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload Note</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
