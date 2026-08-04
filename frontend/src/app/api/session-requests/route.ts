// ══════════════════════════════════════════
// EduPulse — Session Request API
// POST /api/session-requests — student requests a session with mentor
//
// Uses the Supabase client (same proven pattern as the
// rest of the app) instead of Prisma.
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

    // Ensure the logged-in user is a mentee
    const { data: profile } = await supabase
      .from("Profile")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "mentee") {
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
    const { data: allocation } = await supabase
      .from("Allocation")
      .select("mentor:mentor_id(id, full_name)")
      .eq("mentee_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const mentor = allocation?.mentor as { id: string; full_name: string } | undefined;

    if (!mentor) {
      return NextResponse.json(
        { error: "No mentor allocated to you yet" },
        { status: 400 }
      );
    }

    const topicLabel =
      type === "Academic"
        ? "Academic Guidance"
        : type === "Career"
        ? "Career & Placement"
        : "Personal/General";

    // Notify the mentor of the session request (best-effort)
    try {
      await supabase.from("Notification").insert({
        user_id: mentor.id,
        title: "Session Request",
        message: `${profile.full_name} requested a ${topicLabel} session on ${new Date(date).toLocaleDateString("en-IN")} (${mode}). Topic: ${topics || "Not specified"}`,
        category: "Mentorship",
        link: "/mentor/schedule",
      });
    } catch (notifErr) {
      console.error("Session request notification error (non-fatal):", notifErr);
    }

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
