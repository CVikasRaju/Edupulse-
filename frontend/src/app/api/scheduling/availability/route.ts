// ══════════════════════════════════════════
// EduPulse — Mentor Availability API
// GET/POST/DELETE /api/scheduling/availability
//
// Uses the Supabase client (same proven pattern as the
// rest of the app) instead of Prisma.
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
    const mentorId = searchParams.get("mentorId") ?? user.id;

    const { data, error } = await supabase
      .from("MentorAvailability")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch availability: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ availabilities: data ?? [] });
  } catch (error) {
    console.error("Availability fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
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
    const { day_of_week, start_time, end_time, duration_minutes, location } =
      body;

    // Validate
    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "day_of_week, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      !TIME_RE.test(start_time) ||
      !TIME_RE.test(end_time) ||
      Number(day_of_week) < 0 ||
      Number(day_of_week) > 6
    ) {
      return NextResponse.json(
        { error: "Invalid time or day_of_week format" },
        { status: 400 }
      );
    }

    // Check for conflicts (overlapping windows on the same day)
    const { data: existing, error: conflictError } = await supabase
      .from("MentorAvailability")
      .select("id")
      .eq("mentor_id", user.id)
      .eq("day_of_week", Number(day_of_week))
      .eq("is_active", true)
      .or(
        `and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`
      );

    if (conflictError) {
      return NextResponse.json(
        { error: `Failed to check conflicts: ${conflictError.message}` },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "This time slot conflicts with an existing availability window",
        },
        { status: 409 }
      );
    }

    const { data: availability, error: insertError } = await supabase
      .from("MentorAvailability")
      .insert({
        mentor_id: user.id,
        day_of_week,
        start_time,
        end_time,
        duration_minutes: duration_minutes ?? 30,
        location: location || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Availability insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to create availability: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error("Availability create error:", error);
    return NextResponse.json(
      { error: "Failed to create availability" },
      { status: 500 }
    );
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 }
      );
    }

    // Soft delete — set is_active to false (only own slots)
    const { error } = await supabase
      .from("MentorAvailability")
      .update({ is_active: false })
      .eq("id", id)
      .eq("mentor_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete availability: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}
