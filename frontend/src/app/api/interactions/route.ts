// ══════════════════════════════════════════
// EduPulse — Interaction API
// POST /api/interactions — create an interaction log
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

    // Ensure the logged-in user is a mentor
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });
    if (profile?.role !== "mentor") {
      return NextResponse.json(
        { error: "Only mentors can log interactions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      mentee_id,
      date,
      duration_minutes,
      type,
      mode,
      topics,
      remarks,
      follow_up_required,
      follow_up_notes,
      next_interaction_date,
    } = body;

    if (!mentee_id || !date) {
      return NextResponse.json(
        { error: "mentee_id and date are required" },
        { status: 400 }
      );
    }

    // Verify the mentee is actually allocated to this mentor
    const allocation = await prisma.allocation.findFirst({
      where: {
        mentor_id: user.id,
        mentee_id,
        is_active: true,
      },
    });

    if (!allocation) {
      return NextResponse.json(
        { error: "This student is not allocated to you" },
        { status: 403 }
      );
    }

    const interaction = await prisma.interaction.create({
      data: {
        mentor_id: user.id,
        mentee_id,
        date: new Date(date),
        duration_minutes: duration_minutes ? Number(duration_minutes) : null,
        type: type || null,
        mode: mode || null,
        topics: topics || null,
        remarks: remarks || null,
        follow_up_required: Boolean(follow_up_required),
        follow_up_notes: follow_up_notes || null,
        next_interaction_date: next_interaction_date
          ? new Date(next_interaction_date)
          : null,
      },
      include: { mentee: true },
    });

    // Notify the student that their mentor logged an interaction
    await prisma.notification.create({
      data: {
        user_id: mentee_id,
        title: "New Interaction Logged",
        message: `${profile.full_name} logged a ${type ?? "mentorship"} session for ${new Date(date).toLocaleDateString("en-IN")}${follow_up_required ? " with a follow-up pending." : "."}`,
        category: "Mentorship",
        link: "/student/mentorship",
      },
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("Interaction create error:", error);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 }
    );
  }
}
