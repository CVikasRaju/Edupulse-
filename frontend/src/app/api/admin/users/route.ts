// ══════════════════════════════════════════
// EduPulse — Admin User Management API
// POST   /api/admin/users  — create a user (auth user + profile)
// PATCH  /api/admin/users  — update a user (profile + optional email/password)
// DELETE /api/admin/users?id=... — delete a user (related rows, profile, auth)
//
// Uses the SUPABASE_SERVICE_ROLE_KEY server-side so admins can manage
// auth users (create / update / delete) directly from the admin panel.
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const ROLES = ["admin", "mentor", "mentee"];

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("Profile")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return null;
  return supabase;
}

/** Best-effort delete of every row referencing a profile, so the hard delete succeeds. */
async function cleanupRelated(admin: any, id: string, role?: string) {
  const tries: Array<[string, any]> = [];

  // Faculty-owned courses (only when deleting a mentor/admin who teaches)
  if (role === "mentor" || role === "admin") {
    const { data: courses } = await admin.from("Course").select("id").eq("faculty_id", id);
    const courseIds = (courses ?? []).map((c: any) => c.id);
    if (courseIds.length > 0) {
      const { data: assignments } = await admin
        .from("Assignment")
        .select("id")
        .in("course_id", courseIds);
      const assignmentIds = (assignments ?? []).map((a: any) => a.id);
      if (assignmentIds.length > 0) {
        tries.push(["Submission", admin.from("Submission").delete().in("assignment_id", assignmentIds)]);
      }
      tries.push(["Assignment", admin.from("Assignment").delete().in("course_id", courseIds)]);
      tries.push(["CourseMaterial", admin.from("CourseMaterial").delete().in("course_id", courseIds)]);
      tries.push(["CourseEnrollment", admin.from("CourseEnrollment").delete().in("course_id", courseIds)]);
      tries.push(["Course", admin.from("Course").delete().in("id", courseIds)]);
    }
  }

  tries.push(
    ["MentorSession", admin.from("MentorSession").delete().or(`mentor_id.eq.${id},mentee_id.eq.${id}`)],
    ["MentorAvailability", admin.from("MentorAvailability").delete().eq("mentor_id", id)],
    ["Alert", admin.from("Alert").delete().or(`student_id.eq.${id},mentor_id.eq.${id}`)],
    ["Notification", admin.from("Notification").delete().eq("user_id", id)],
    ["Interaction", admin.from("Interaction").delete().or(`mentor_id.eq.${id},mentee_id.eq.${id}`)],
    ["Allocation", admin.from("Allocation").delete().or(`mentor_id.eq.${id},mentee_id.eq.${id}`)],
    ["Grade", admin.from("Grade").delete().eq("student_id", id)],
    ["AttendanceRecord", admin.from("AttendanceRecord").delete().eq("student_id", id)],
    ["GraceRequest", admin.from("GraceRequest").delete().eq("student_id", id)],
    ["Achievement", admin.from("Achievement").delete().eq("student_id", id)],
    ["FacultyAchievement", admin.from("FacultyAchievement").delete().eq("faculty_id", id)],
    ["Submission", admin.from("Submission").delete().eq("student_id", id)]
  );

  for (const [table, query] of tries) {
    try {
      await query;
    } catch (err) {
      console.error(`[admin users] cleanup ${table} failed (non-fatal):`, err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await requireAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, password, role, department, year, section, usn, employee_id, designation, phone, address, linkedin_url, github_url, year_of_joining } = body;

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "full_name, email and password are required" },
        { status: 400 }
      );
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "role must be admin, mentor or mentee" }, { status: 400 });
    }

    let admin;
    try {
      admin = serviceClient();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }

    // 1) Create the auth user
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) {
      return NextResponse.json(
        { error: `Failed to create account: ${authErr.message}` },
        { status: 400 }
      );
    }

    // 2) Create the matching profile row
    const { error: profileErr } = await admin.from("Profile").insert({
      id: authUser.user!.id,
      role,
      full_name,
      email,
      department: department || null,
      year: year ? Number(year) : null,
      section: section || null,
      usn: usn || null,
      employee_id: employee_id || null,
      designation: designation || null,
      phone: phone || null,
      address: address || null,
      linkedin_url: linkedin_url || null,
      github_url: github_url || null,
      year_of_joining: year_of_joining ? Number(year_of_joining) : null,
      is_profile_complete: true,
      is_active: true,
    });

    if (profileErr) {
      // Roll back the auth user so we never leave an orphaned login
      await admin.auth.admin.deleteUser(authUser.user!.id).catch(() => {});
      return NextResponse.json(
        { error: `Failed to create profile: ${profileErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ id: authUser.user!.id }, { status: 201 });
  } catch (e: any) {
    console.error("[admin users] POST error:", e);
    return NextResponse.json({ error: e.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await requireAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, password, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    let admin;
    try {
      admin = serviceClient();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }

    if ("role" in fields && !ROLES.includes(fields.role)) {
      return NextResponse.json(
        { error: "role must be admin, mentor or mentee" },
        { status: 400 }
      );
    }

    // Only touch the auth record when something that lives in auth actually
    // changed (email / password). Fetching the current profile first lets us
    // skip a pointless (and potentially failing) email write on every save.
    const { data: currentProfile } = await admin
      .from("Profile")
      .select("email")
      .eq("id", id)
      .maybeSingle();

    const emailChanged = fields.email && fields.email !== currentProfile?.email;
    if (emailChanged) {
      const { error: mailErr } = await admin.auth.admin.updateUserById(id, {
        email: fields.email,
      });
      if (mailErr) {
        return NextResponse.json(
          { error: `Email change failed: ${mailErr.message}` },
          { status: 400 }
        );
      }
    }
    if (password) {
      const { error: pwErr } = await admin.auth.admin.updateUserById(id, {
        password,
      });
      if (pwErr) {
        return NextResponse.json(
          { error: `Password change failed: ${pwErr.message}` },
          { status: 400 }
        );
      }
    }

    const profilePatch: Record<string, any> = {};
    for (const k of [
      "full_name", "role", "department", "section", "usn", "employee_id",
      "designation", "email", "is_active", "phone", "address",
      "linkedin_url", "github_url",
    ]) {
      if (k in fields) profilePatch[k] = fields[k];
    }
    if ("year" in fields) profilePatch.year = fields.year ? Number(fields.year) : null;
    if ("year_of_joining" in fields) {
      profilePatch.year_of_joining = fields.year_of_joining ? Number(fields.year_of_joining) : null;
    }

    if (Object.keys(profilePatch).length > 0) {
      profilePatch.updated_at = new Date().toISOString();
      const { error: perr } = await admin.from("Profile").update(profilePatch).eq("id", id);
      if (perr) {
        return NextResponse.json(
          { error: `Failed to update profile: ${perr.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true, emailChanged: !!emailChanged });
  } catch (e: any) {
    console.error("[admin users] PATCH error:", e);
    return NextResponse.json({ error: e.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await requireAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const admin = serviceClient();
    const { data: profile } = await admin.from("Profile").select("role").eq("id", id).maybeSingle();
    const role = profile?.role;

    // Delete dependent rows first so the RESTRICT FKs don't block us
    await cleanupRelated(admin, id, role);

    const { error: perr } = await admin.from("Profile").delete().eq("id", id);
    if (perr) {
      // Hard delete blocked — soft-disable the account instead, and say so clearly
      try {
        await admin
          .from("Profile")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch {
        // non-fatal
      }
      return NextResponse.json(
        { error: `Could not fully delete ${role ?? "user"} because some records still reference them — the account was DEACTIVATED instead (login blocked). ${perr.message}` },
        { status: 400 }
      );
    }

    const { error: aerr } = await admin.auth.admin.deleteUser(id);
    if (aerr) {
      return NextResponse.json(
        { error: `Profile deleted, but login cleanup failed: ${aerr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[admin users] DELETE error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete user" }, { status: 500 });
  }
}
