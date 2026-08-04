// ══════════════════════════════════════════
// EduPulse — Course Materials (Notes) API
// GET    /api/course-materials — list notes
//          mentor:  notes for courses they teach
//          student: notes for courses they are enrolled in
// POST   /api/course-materials — upload a note (mentor only, must teach the course)
// DELETE /api/course-materials?id=... — delete a note (mentor who owns the course)
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let materials: any[];

    if (profile.role === "mentor") {
      // Notes for courses this mentor teaches
      materials = await prisma.courseMaterial.findMany({
        where: { course: { faculty_id: user.id } },
        include: { course: true },
        orderBy: { created_at: "desc" },
      });
    } else if (profile.role === "mentee") {
      // Notes for courses the student is enrolled in
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { student_id: user.id, status: "Active" },
        select: { course_id: true },
      });
      const courseIds = enrollments.map((e) => e.course_id);
      materials =
        courseIds.length > 0
          ? await prisma.courseMaterial.findMany({
              where: { course_id: { in: courseIds } },
              include: { course: { select: { id: true, name: true, code: true } } },
              orderBy: { created_at: "desc" },
            })
          : [];
    } else {
      // Admin — all materials
      materials = await prisma.courseMaterial.findMany({
        include: { course: { include: { faculty: { select: { id: true, full_name: true } } } } },
        orderBy: { created_at: "desc" },
      });
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

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
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
    const course = await prisma.course.findFirst({
      where: { id: course_id, faculty_id: user.id },
    });
    if (!course) {
      return NextResponse.json(
        { error: "You can only upload notes to courses you teach" },
        { status: 403 }
      );
    }

    const material = await prisma.courseMaterial.create({
      data: {
        course_id,
        title,
        description: description || null,
        file_url,
        file_type: file_type || null,
        uploaded_by: user.id,
      },
    });

    // Notify all enrolled students that new notes were uploaded
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { course_id, status: "Active" },
      select: { student_id: true },
    });
    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((e) => ({
          user_id: e.student_id,
          title: "New Notes Uploaded",
          message: `${profile.full_name} uploaded "${title}" for ${course.name}${course.code ? ` (${course.code})` : ""}.`,
          category: "Academic",
          link: "/student/courses",
        })),
      });
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

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
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
    const material = await prisma.courseMaterial.findFirst({
      where: { id, course: { faculty_id: user.id } },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Note not found or you do not own it" },
        { status: 404 }
      );
    }

    await prisma.courseMaterial.delete({ where: { id } });

    // Best-effort cleanup: remove the uploaded file from Supabase Storage
    // (only for files in our course-materials bucket, not pasted links)
    if (material.file_url.includes("/storage/v1/object/public/course-materials/")) {
      try {
        const filePath = material.file_url.split("/storage/v1/object/public/course-materials/")[1];
        const storageClient = await createClient();
        await storageClient.storage.from("course-materials").remove([filePath]);
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
