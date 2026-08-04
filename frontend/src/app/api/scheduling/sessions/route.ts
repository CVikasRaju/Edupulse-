// ══════════════════════════════════════════
// EduPulse — Mentor Session API
// GET/POST/PATCH /api/scheduling/sessions
//
// Uses the Supabase client (same proven pattern as the
// rest of the app) instead of Prisma.
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { newId } from "@/lib/id";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from("Profile")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    let query = supabase.from("MentorSession").select("*");

    if (profile?.role === "mentor") {
      query = query.eq("mentor_id", user.id);
    } else if (profile?.role === "mentee") {
      query = query.eq("mentee_id", user.id);
    }

    if (status) query = query.eq("status", status);
    if (from) query = query.gte("date", new Date(from).toISOString());
    if (to) query = query.lte("date", new Date(to).toISOString());

    query = query.order("date", { ascending: true }).order("start_time", { ascending: true });

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
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

    const body = await request.json();
    const {
      mentor_id,
      mentee_id,
      availability_id,
      date,
      start_time,
      end_time,
      duration_minutes,
      type,
      topic,
      notes,
      meeting_link,
      location,
    } = body;

    // Validate required fields
    if (!mentor_id || !mentee_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        {
          error:
            "mentor_id, mentee_id, date, start_time, and end_time are required",
        },
        { status: 400 }
      );
    }

    const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time)) {
      return NextResponse.json(
        { error: "Invalid time format (expected HH:MM)" },
        { status: 400 }
      );
    }

    const isoDate = new Date(date).toISOString();

    // Check for scheduling conflicts (no double-booking)
    const { data: conflicts, error: conflictError } = await supabase
      .from("MentorSession")
      .select("id, date, start_time, end_time")
      .eq("mentor_id", mentor_id)
      .eq("date", isoDate)
      .not("status", "in", '("cancelled","no_show")')
      .or(
        `and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`
      );

    if (conflictError) {
      return NextResponse.json(
        { error: `Failed to check session conflicts: ${conflictError.message}` },
        { status: 500 }
      );
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "This time slot conflicts with an existing session",
          conflict: conflicts[0],
        },
        { status: 409 }
      );
    }

    // Verify availability exists (if provided)
    if (availability_id) {
      const { data: availability } = await supabase
        .from("MentorAvailability")
        .select("id, is_active")
        .eq("id", availability_id)
        .maybeSingle();

      if (!availability || !availability.is_active) {
        return NextResponse.json(
          { error: "Invalid or inactive availability slot" },
          { status: 400 }
        );
      }
    }

    const { data: session, error: insertError } = await supabase
      .from("MentorSession")
      .insert({
        id: newId(),
        mentor_id,
        mentee_id,
        availability_id: availability_id || null,
        date: isoDate,
        start_time,
        end_time,
        duration_minutes: duration_minutes ?? 30,
        status: "scheduled",
        type: type ?? "1-on-1",
        topic: topic || null,
        notes: notes || null,
        meeting_link: meeting_link || null,
        location: location || null,
        updated_at: new Date().toISOString(),
      })
      .select("*, mentor:mentor_id(id, full_name, email), mentee:mentee_id(id, full_name, usn)")
      .single();

    if (insertError) {
      console.error("Session insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to create session: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Notify both mentor and mentee (best-effort)
    const { data: menteeProfile } = await supabase
      .from("Profile")
      .select("full_name")
      .eq("id", mentee_id)
      .maybeSingle();

    try {
      await supabase.from("Notification").insert([
        {
          id: newId(),
          user_id: mentor_id,
          title: "New Session Booked",
          message: `Session with ${menteeProfile?.full_name ?? "student"} on ${new Date(date).toLocaleDateString("en-IN")}`,
          category: "Mentorship",
          link: "/mentor/dashboard",
        },
        {
          id: newId(),
          user_id: mentee_id,
          title: "Session Scheduled",
          message: `Your mentorship session is scheduled for ${new Date(date).toLocaleDateString("en-IN")} at ${start_time}`,
          category: "Mentorship",
          link: "/student/mentorship",
        },
      ]);
    } catch (notifErr) {
      console.error("Session notification error (non-fatal):", notifErr);
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Session create error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes, topic } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (topic !== undefined) updateData.topic = topic;

    const { data: session, error } = await supabase
      .from("MentorSession")
      .update(updateData)
      .eq("id", id)
      .select("*, mentor:mentor_id(id, full_name, email), mentee:mentee_id(id, full_name, usn)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update session: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
