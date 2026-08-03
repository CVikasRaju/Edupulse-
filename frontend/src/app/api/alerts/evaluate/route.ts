// ══════════════════════════════════════════
// EduPulse — Alert Evaluation API
// POST /api/alerts/evaluate
// Triggers evaluation of all alert rules
// ══════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { evaluateAllRules, seedDefaultAlertRules } from "@/lib/alerts";
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

    // Seed default rules if none exist
    await seedDefaultAlertRules();

    const body = await request.json().catch(() => ({}));
    const mentorId = body.mentorId as string | undefined;

    // Only admins or the specific mentor can trigger evaluation
    const result = await evaluateAllRules(mentorId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Alert evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate alerts" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all alert rules
    const { data: rules } = await supabase
      .from("AlertRule")
      .select("*")
      .order("created_at", { ascending: false });

    // Get active alerts
    const { data: activeAlerts } = await supabase
      .from("Alert")
      .select("*, student:student_id(full_name, usn, department, year), rule:rule_id(name, type, severity)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      rules: rules ?? [],
      activeAlerts: activeAlerts ?? [],
    });
  } catch (error) {
    console.error("Alert fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
