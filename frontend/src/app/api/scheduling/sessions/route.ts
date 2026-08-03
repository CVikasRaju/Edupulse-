// ══════════════════════════════════════════
// EduPulse — Mentor Session API
// GET/POST /api/scheduling/sessions
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
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Get user profile to determine role
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    const where: Record<string, unknown> = {};

    if (profile?.role === "mentor") {
      where.mentor_id = user.id;
    } else if (profile?.role === "mentee") {
      where.mentee_id = user.id;
    }

    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const sessions = await prisma.mentorSession.findMany({
      where,
      include: { mentor: true, mentee: true },
      orderBy: [{ date: "asc" }, { start_time: "asc" }],
    });

    return NextResponse.json({ sessions });
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

    // Check for scheduling conflicts (no double-booking)
    const conflict = await prisma.mentorSession.findFirst({
      where: {
        mentor_id,
        date: new Date(date),
        status: { notIn: ["cancelled", "no_show"] },
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

    if (conflict) {
      return NextResponse.json(
        {
          error:
            "This time slot conflicts with an existing session",
          conflict: {
            id: conflict.id,
            date: conflict.date,
            start_time: conflict.start_time,
            end_time: conflict.end_time,
          },
        },
        { status: 409 }
      );
    }

    // Verify availability exists (if provided)
    if (availability_id) {
      const availability = await prisma.mentorAvailability.findUnique({
        where: { id: availability_id },
      });

      if (!availability || !availability.is_active) {
        return NextResponse.json(
          { error: "Invalid or inactive availability slot" },
          { status: 400 }
        );
      }
    }

    const session = await prisma.mentorSession.create({
      data: {
        mentor_id,
        mentee_id,
        availability_id,
        date: new Date(date),
        start_time,
        end_time,
        duration_minutes: duration_minutes ?? 30,
        status: "scheduled",
        type: type ?? "1-on-1",
        topic,
        notes,
        meeting_link,
        location,
      },
      include: { mentor: true, mentee: true },
    });

    // Create notifications for both mentor and mentee
    const menteeProfile = await prisma.profile.findUnique({
      where: { id: mentee_id },
    });

    await prisma.notification.createMany({
      data: [
        {
          user_id: mentor_id,
          title: "New Session Booked",
          message: `Session with ${menteeProfile?.full_name ?? "student"} on ${new Date(date).toLocaleDateString("en-IN")}`,
          category: "Mentorship",
          link: "/mentor/dashboard",
        },
        {
          user_id: mentee_id,
          title: "Session Scheduled",
          message: `Your mentorship session is scheduled for ${new Date(date).toLocaleDateString("en-IN")} at ${start_time}`,
          category: "Mentorship",
          link: "/student/mentorship",
        },
      ],
    });

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

    const session = await prisma.mentorSession.update({
      where: { id },
      data: updateData,
      include: { mentor: true, mentee: true },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
