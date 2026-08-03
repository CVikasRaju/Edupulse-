// ══════════════════════════════════════════
// EduPulse — Alert Evaluation Engine
// Evaluates alert rules against student data
// and generates alerts for at-risk students
// ══════════════════════════════════════════

import { prisma } from "./prisma";

interface EvaluationResult {
  studentId: string;
  ruleId: string;
  triggered: boolean;
  metricValue: number;
  threshold: number;
  context?: Record<string, unknown>;
}

// ─── Operator Evaluation ────────────────────────────

function evaluateOperator(
  operator: string,
  value: number,
  threshold: number
): boolean {
  switch (operator) {
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "eq":
      return Math.abs(value - threshold) < 0.001;
    default:
      return false;
  }
}

// ─── Compute Student Metrics ────────────────────────

async function computeStudentMetrics(studentId: string) {
  // Fetch grades, attendance, interactions in parallel
  const [grades, attendanceRecords, interactions] = await Promise.all([
    prisma.grade.findMany({
      where: { student_id: studentId },
      orderBy: [{ semester: "asc" }, { created_at: "desc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: { student_id: studentId },
      orderBy: { date: "desc" },
    }),
    prisma.interaction.findMany({
      where: { mentee_id: studentId },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  // Latest CGPA
  const latestGrade = grades[grades.length - 1];
  const cgpa = latestGrade?.cgpa ?? 0;

  // Latest SGPA (most recent semester)
  const semesters = Array.from(new Set(grades.map((g) => g.semester))).sort(
    (a, b) => b - a
  );
  const latestSemester = semesters[0];
  const latestSemGrades = grades.filter((g) => g.semester === latestSemester);
  const sgpa =
    latestSemGrades.length > 0
      ? latestSemGrades[0]?.sgpa ?? 0
      : 0;

  // Previous semester SGPA for trend
  const prevSemester = semesters[1];
  const prevSemGrades = grades.filter((g) => g.semester === prevSemester);
  const prevSgpa =
    prevSemGrades.length > 0 ? prevSemGrades[0]?.sgpa ?? 0 : 0;

  // Attendance percentage (last 30 records)
  const recentAttendance = attendanceRecords.slice(0, 30);
  const totalPresent = recentAttendance.filter(
    (a) => a.status === "Present"
  ).length;
  const attendancePct =
    recentAttendance.length > 0
      ? Math.round((totalPresent / recentAttendance.length) * 100)
      : 100;

  // Monthly attendance trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentForTrend = attendanceRecords.filter(
    (a) => new Date(a.date) >= sixMonthsAgo
  );
  const monthlyMap: Record<string, { present: number; total: number }> = {};
  for (const rec of recentForTrend) {
    const monthKey = new Date(rec.date).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { present: 0, total: 0 };
    monthlyMap[monthKey].total++;
    if (rec.status === "Present") monthlyMap[monthKey].present++;
  }
  const attendanceTrend = Object.entries(monthlyMap)
    .map(([month, { present, total }]) => ({
      month,
      percentage: Math.round((present / total) * 100),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Days since last interaction
  const lastInteraction = interactions[0];
  const daysSinceInteraction = lastInteraction
    ? Math.floor(
        (Date.now() - new Date(lastInteraction.date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  // Consecutive low SGPA count
  let consecutiveLowSgpa = 0;
  for (const sem of semesters) {
    const semGrades = grades.filter((g) => g.semester === sem);
    const semSgpa = semGrades[0]?.sgpa ?? 0;
    if (semSgpa < 6.0) {
      consecutiveLowSgpa++;
    } else {
      break;
    }
  }

  // Attendance drop (compare last 15 vs previous 15)
  const first15 = attendanceRecords.slice(0, 15);
  const next15 = attendanceRecords.slice(15, 30);
  const first15Pct =
    first15.length > 0
      ? Math.round(
          (first15.filter((a) => a.status === "Present").length /
            first15.length) *
            100
        )
      : 100;
  const next15Pct =
    next15.length > 0
      ? Math.round(
          (next15.filter((a) => a.status === "Present").length /
            next15.length) *
            100
        )
      : 100;
  const attendanceDropPct = next15Pct - first15Pct; // negative means drop

  return {
    cgpa,
    sgpa,
    prevSgpa,
    attendancePct,
    attendanceTrend,
    daysSinceInteraction,
    consecutiveLowSgpa,
    attendanceDropPct,
    lastInteractionDate: lastInteraction?.date?.toISOString() ?? null,
  };
}

// ─── Evaluate Single Rule ───────────────────────────

async function evaluateRule(
  rule: {
    id: string;
    type: string;
    metric: string;
    operator: string;
    threshold: number;
    consecutive: number;
  },
  studentId: string
): Promise<EvaluationResult | null> {
  const metrics = await computeStudentMetrics(studentId);

  let metricValue = 0;
  let context: Record<string, unknown> = {};

  switch (rule.metric) {
    case "attendance_pct":
      metricValue = metrics.attendancePct;
      break;
    case "cgpa":
      metricValue = metrics.cgpa;
      break;
    case "sgpa":
      metricValue = metrics.sgpa;
      break;
    case "days_since_interaction":
      metricValue = metrics.daysSinceInteraction;
      break;
    case "consecutive_low_sgpa":
      metricValue = metrics.consecutiveLowSgpa;
      break;
    case "attendance_drop":
      metricValue = Math.abs(metrics.attendanceDropPct);
      context = {
        currentPct: metrics.attendancePct,
        previousPct:
          metrics.attendanceTrend.length >= 2
            ? metrics.attendanceTrend[metrics.attendanceTrend.length - 2]
                ?.percentage
            : metrics.attendancePct,
        trend: metrics.attendanceTrend,
      };
      break;
    default:
      return null;
  }

  const triggered = evaluateOperator(rule.operator, metricValue, rule.threshold);

  return {
    studentId,
    ruleId: rule.id,
    triggered,
    metricValue,
    threshold: rule.threshold,
    context,
  };
}

// ─── Check for Duplicate Active Alert ───────────────

async function hasActiveAlert(
  ruleId: string,
  studentId: string
): Promise<boolean> {
  const existing = await prisma.alert.findFirst({
    where: {
      rule_id: ruleId,
      student_id: studentId,
      status: { in: ["active", "acknowledged"] },
    },
  });
  return !!existing;
}

// ─── Main Evaluation Function ───────────────────────

export async function evaluateAllRules(mentorId?: string) {
  // Get all active rules
  const rules = await prisma.alertRule.findMany({
    where: { is_active: true },
  });

  if (rules.length === 0) return { evaluated: 0, alertsCreated: 0 };

  // Get students to evaluate
  let studentIds: string[];
  if (mentorId) {
    const allocations = await prisma.allocation.findMany({
      where: { mentor_id: mentorId, is_active: true },
    });
    studentIds = allocations.map((a) => a.mentee_id);
  } else {
    const students = await prisma.profile.findMany({
      where: { role: "mentee", is_active: true },
    });
    studentIds = students.map((s) => s.id);
  }

  let alertsCreated = 0;
  let evaluated = 0;

  for (const studentId of studentIds) {
    for (const rule of rules) {
      evaluated++;
      const result = await evaluateRule(rule, studentId);
      if (!result || !result.triggered) continue;

      // Check for consecutive requirement
      if (rule.consecutive > 1) {
        // For consecutive rules, check if the metric has been breaching
        // for `consecutive` periods (simplified: check recent data points)
        const metrics = await computeStudentMetrics(studentId);
        if (rule.metric === "consecutive_low_sgpa") {
          if (metrics.consecutiveLowSgpa < rule.consecutive) continue;
        }
      }

      // Don't create duplicate active alerts
      const alreadyActive = await hasActiveAlert(rule.id, studentId);
      if (alreadyActive) continue;

      // Find the mentor for this student
      const allocation = await prisma.allocation.findFirst({
        where: { mentee_id: studentId, is_active: true },
      });

      // Generate alert message
      const student = await prisma.profile.findUnique({
        where: { id: studentId },
      });

      const severityLabel =
        rule.severity === "critical"
          ? "🔴 CRITICAL"
          : rule.severity === "warning"
          ? "🟡 WARNING"
          : "ℹ️ INFO";

      const title = `${severityLabel}: ${student?.full_name ?? "Student"} — ${rule.name}`;
      const message = generateAlertMessage(rule, result, student?.full_name);

      await prisma.alert.create({
        data: {
          rule_id: rule.id,
          student_id: studentId,
          mentor_id: allocation?.mentor_id ?? null,
          title,
          message,
          severity: rule.severity,
          status: "active",
          metric_value: result.metricValue,
          threshold_value: result.threshold,
          context: (result.context as any) ?? undefined,
        },
      });

      // Also create a notification for the mentor
      if (allocation?.mentor_id) {
        await prisma.notification.create({
          data: {
            user_id: allocation.mentor_id,
            title,
            message,
            category: "Mentorship",
            link: "/mentor/dashboard",
          },
        });
      }

      alertsCreated++;
    }
  }

  return { evaluated, alertsCreated };
}

// ─── Message Generator ──────────────────────────────

function generateAlertMessage(
  rule: { type: string; metric: string; name: string },
  result: { metricValue: number; threshold: number },
  studentName?: string
): string {
  const name = studentName ?? "Student";

  switch (rule.metric) {
    case "attendance_pct":
      return `${name}'s attendance has dropped to ${result.metricValue}%, below the ${result.threshold}% threshold.`;
    case "cgpa":
      return `${name}'s CGPA is ${result.metricValue.toFixed(2)}, below the ${result.threshold.toFixed(2)} threshold.`;
    case "sgpa":
      return `${name}'s current semester SGPA is ${result.metricValue.toFixed(2)}, below the ${result.threshold.toFixed(2)} threshold.`;
    case "days_since_interaction":
      return `No mentor interaction with ${name} for ${result.metricValue} days (threshold: ${result.threshold} days).`;
    case "consecutive_low_sgpa":
      return `${name} has ${result.metricValue} consecutive semesters with SGPA below ${result.threshold}.`;
    case "attendance_drop":
      return `${name}'s attendance dropped by ${result.metricValue.toFixed(0)} percentage points recently.`;
    default:
      return `Alert triggered for ${name}: ${rule.name}`;
  }
}

// ─── Seed Default Rules ─────────────────────────────

export async function seedDefaultAlertRules() {
  const existingCount = await prisma.alertRule.count();
  if (existingCount > 0) return;

  const defaultRules = [
    {
      name: "Low Attendance",
      type: "attendance_drop",
      metric: "attendance_pct",
      operator: "lt",
      threshold: 75,
      consecutive: 1,
      severity: "warning",
    },
    {
      name: "Critical Attendance",
      type: "attendance_drop",
      metric: "attendance_pct",
      operator: "lt",
      threshold: 60,
      consecutive: 1,
      severity: "critical",
    },
    {
      name: "Low CGPA",
      type: "grade_decline",
      metric: "cgpa",
      operator: "lt",
      threshold: 5.5,
      consecutive: 1,
      severity: "warning",
    },
    {
      name: "Critical CGPA",
      type: "grade_decline",
      metric: "cgpa",
      operator: "lt",
      threshold: 4.0,
      consecutive: 1,
      severity: "critical",
    },
    {
      name: "Consecutive Low SGPA",
      type: "grade_decline",
      metric: "consecutive_low_sgpa",
      operator: "gte",
      threshold: 2,
      consecutive: 2,
      severity: "critical",
    },
    {
      name: "No Mentor Contact",
      type: "engagement_gap",
      metric: "days_since_interaction",
      operator: "gt",
      threshold: 30,
      consecutive: 1,
      severity: "warning",
    },
    {
      name: "Long Engagement Gap",
      type: "engagement_gap",
      metric: "days_since_interaction",
      operator: "gt",
      threshold: 60,
      consecutive: 1,
      severity: "critical",
    },
    {
      name: "Attendance Dropping",
      type: "attendance_drop",
      metric: "attendance_drop",
      operator: "gte",
      threshold: 15,
      consecutive: 1,
      severity: "warning",
    },
  ];

  for (const rule of defaultRules) {
    await prisma.alertRule.create({ data: rule });
  }
}
