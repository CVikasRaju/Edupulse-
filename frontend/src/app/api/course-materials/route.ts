// ══════════════════════════════════════════
// EduPulse — Course Materials (Notes) API
// GET    /api/course-materials — list notes
//          mentor:  notes for courses they teach
//          student: notes for courses they are enrolled in
// POST   /api/course-materials — upload a note (mentor only, must teach the course)
// DELETE /api/course-materials?id=... — delete a note (mentor who owns the course)
//
// Uses the Supabase client (same proven pattern as the rest of the app)
// instead of Prisma.
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { newId } from "@/lib/id";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("Profile")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let materials: any[] = [];

    if (profile.role === "mentor") {
      // Notes for courses this mentor teaches
      const courseRes = await supabase
        .from("Course")
        .select("id")
        .eq("faculty_id", user.id);
      const courseIds = (courseRes.data ?? []).map((c: any) => c.id);

      if (courseIds.length > 0) {
        const { data, error } = await supabase
          .from("CourseMaterial")
          .select("*, course:course_id(id, name, code, faculty_id)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false });
        if (error) throw error;
        materials = data ?? [];
      }
    } else if (profile.role === "mentee") {
      // Notes for courses the student is enrolled in
      const enrollRes = await supabase
        .from("CourseEnrollment")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "Active");
      const courseIds = (enrollRes.data ?? []).map((e: any) => e.course_id);

      if (courseIds.length > 0) {
        const { data, error } = await supabase
          .from("CourseMaterial")
          .select("*, course:course_id(id, name, code)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false });
        if (error) throw error;
        materials = data ?? [];
      }
    } else {
      // Admin — all materials
      const { data, error } = await supabase
        .from("CourseMaterial")
        .select("*, course:course_id(id, name, code, faculty_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      materials = data ?? [];
    }

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Course materials GET error:", error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("Profile")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "mentor") {
      return NextResponse.json(
        { error: "Only faculty can upload notes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { course_id, title, description, file_url, file_type } = body;

    if (!course_id || !title || !file_url) {
      return NextResponse.json(
        { error: "course_id, title and file_url are required" },
        { status: 400 }
      );
    }

    // Verify the mentor actually teaches this course
    const { data: course } = await supabase
      .from("Course")
      .select("id, name, code")
      .eq("id", course_id)
      .eq("faculty_id", user.id)
      .maybeSingle();

    if (!course) {
      return NextResponse.json(
        { error: "You can only upload notes to courses you teach" },
        { status: 403 }
      );
    }

    const { data: material, error: insertError } = await supabase
      .from("CourseMaterial")
      .insert({
        id: newId(),
        course_id,
        title,
        description: description || null,
        file_url,
        file_type: file_type || null,
        uploaded_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Course material insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to upload note: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Notify all enrolled students that new notes were uploaded (best-effort)
    const enrollRes = await supabase
      .from("CourseEnrollment")
      .select("student_id")
      .eq("course_id", course_id)
      .eq("status", "Active");

    const studentIds = (enrollRes.data ?? []).map((e: any) => e.student_id);
    if (studentIds.length > 0) {
      try {
        await supabase.from("Notification").insert(
          studentIds.map((sid: string) => ({
            id: newId(),
            user_id: sid,
            title: "New Notes Uploaded",
            message: `${profile.full_name} uploaded "${title}" for ${course.name}${course.code ? ` (${course.code})` : ""}.`,
            category: "Academic",
            link: "/student/courses",
          }))
        );
      } catch (notifErr) {
        console.error("Course material notification error (non-fatal):", notifErr);
      }
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("Course materials POST error:", error);
    return NextResponse.json({ error: "Failed to upload note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("Profile")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "mentor") {
      return NextResponse.json(
        { error: "Only faculty can delete notes" },
        { status: 403 }
      );
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify the material belongs to a course this mentor teaches
    const { data: material } = await supabase
      .from("CourseMaterial")
      .select("*, course:course_id(faculty_id)")
      .eq("id", id)
      .maybeSingle();

    if (!material || material.course?.faculty_id !== user.id) {
      return NextResponse.json(
        { error: "Note not found or you do not own it" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("CourseMaterial")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete note: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Best-effort cleanup: remove the uploaded file from Supabase Storage
    if (material.file_url?.includes("/storage/v1/object/public/course-materials/")) {
      try {
        const filePath = material.file_url.split("/storage/v1/object/public/course-materials/")[1];
        await supabase.storage.from("course-materials").remove([filePath]);
      } catch (storageErr) {
        // Non-fatal: row is already deleted; orphan cleanup is best-effort
        console.error("Storage cleanup error:", storageErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course materials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
