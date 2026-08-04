// ══════════════════════════════════════════
// EduPulse — Interaction API
// POST /api/interactions — create an interaction log
//
// Uses the Supabase client (same proven pattern as the
// attendance upload) instead of Prisma, so it works with
// the same RLS setup the rest of the app relies on.
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
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
    const { data: profile } = await supabase
      .from("Profile")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "mentor") {
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
    const { data: allocation, error: allocError } = await supabase
      .from("Allocation")
      .select("id")
      .eq("mentor_id", user.id)
      .eq("mentee_id", mentee_id)
      .eq("is_active", true)
      .maybeSingle();

    if (allocError) {
      console.error("Allocation check error:", allocError.message);
      return NextResponse.json(
        { error: "Failed to verify allocation" },
        { status: 500 }
      );
    }

    if (!allocation) {
      return NextResponse.json(
        { error: "This student is not allocated to you" },
        { status: 403 }
      );
    }

    const record = {
      mentor_id: user.id,
      mentee_id,
      date: new Date(date).toISOString(),
      duration_minutes: duration_minutes ? Number(duration_minutes) : null,
      type: type || null,
      mode: mode || null,
      topics: topics || null,
      remarks: remarks || null,
      follow_up_required: Boolean(follow_up_required),
      follow_up_notes: follow_up_notes || null,
      next_interaction_date: next_interaction_date
        ? new Date(next_interaction_date).toISOString()
        : null,
    };

    const { data: interaction, error: insertError } = await supabase
      .from("Interaction")
      .insert(record)
      .select("*")
      .single();

    if (insertError) {
      console.error("Interaction insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to save interaction: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Notify the student that their mentor logged an interaction.
    // Best-effort: never let a notification failure fail the save.
    const notificationMessage = `${profile.full_name} logged a ${
      type ?? "mentorship"
    } session for ${new Date(date).toLocaleDateString("en-IN")}${
      follow_up_required ? " with a follow-up pending." : "."
    }`;

    try {
      await supabase.from("Notification").insert({
        user_id: mentee_id,
        title: "New Interaction Logged",
        message: notificationMessage,
        category: "Mentorship",
        link: "/student/mentorship",
      });
    } catch (notifErr) {
      console.error("Notification create error (non-fatal):", notifErr);
    }

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("Interaction create error:", error);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 }
    );
  }
}
