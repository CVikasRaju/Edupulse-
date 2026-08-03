// ══════════════════════════════════════════
// EduPulse — Session Request API
// POST /api/session-requests — student requests a session with mentor
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the logged-in user is a mentee
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });
    if (profile?.role !== "mentee") {
      return NextResponse.json(
        { error: "Only students can request sessions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, mode, type, topics } = body;

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    // Find the student's allocated mentor
    const allocation = await prisma.allocation.findFirst({
      where: { mentee_id: user.id, is_active: true },
      include: { mentor: true },
    });

    if (!allocation?.mentor) {
      return NextResponse.json(
        { error: "No mentor allocated to you yet" },
        { status: 400 }
      );
    }

    const mentor = allocation.mentor;
    const topicLabel = type === "Academic" ? "Academic Guidance"
      : type === "Career" ? "Career & Placement"
      : "Personal/General";

    // Notify the mentor of the session request
    await prisma.notification.create({
      data: {
        user_id: mentor.id,
        title: "Session Request",
        message: `${profile.full_name} requested a ${topicLabel} session on ${new Date(date).toLocaleDateString("en-IN")} (${mode}). Topic: ${topics || "Not specified"}`,
        category: "Mentorship",
        link: "/mentor/schedule",
      },
    });

    return NextResponse.json(
      { success: true, message: "Session request sent to your mentor" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Session request error:", error);
    return NextResponse.json(
      { error: "Failed to send session request" },
      { status: 500 }
    );
  }
}
