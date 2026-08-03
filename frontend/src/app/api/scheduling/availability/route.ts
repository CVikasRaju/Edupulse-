// ══════════════════════════════════════════
// EduPulse — Mentor Availability API
// GET/POST /api/scheduling/availability
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const availabilities = await prisma.mentorAvailability.findMany({
      where: { mentor_id: mentorId, is_active: true },
      orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
    });

    return NextResponse.json({ availabilities });
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

    // Check for conflicts
    const existing = await prisma.mentorAvailability.findFirst({
      where: {
        mentor_id: user.id,
        day_of_week,
        is_active: true,
        OR: [
          {
            start_time: { lte: start_time },
            end_time: { gt: start_time },
          },
          {
            start_time: { lt: end_time },
            end_time: { gte: end_time },
          },
          {
            start_time: { gte: start_time },
            end_time: { lte: end_time },
          },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "This time slot conflicts with an existing availability window",
        },
        { status: 409 }
      );
    }

    const availability = await prisma.mentorAvailability.create({
      data: {
        mentor_id: user.id,
        day_of_week,
        start_time,
        end_time,
        duration_minutes: duration_minutes ?? 30,
        location,
      },
    });

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

    // Soft delete — set is_active to false
    await prisma.mentorAvailability.updateMany({
      where: { id, mentor_id: user.id },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}
