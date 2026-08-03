// src/lib/actions.ts
// Server-side data fetching functions using Prisma
// All functions run on the server and return plain serializable objects

import { prisma } from "./prisma";

// ─────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { id: userId },
  });
}

// ─────────────────────────────────────────
// STUDENT DASHBOARD DATA
// ─────────────────────────────────────────

export async function getStudentDashboardData(studentId: string) {
  const [grades, achievements, attendanceRecords, interactions, notifications, feedPosts, allocation] =
    await Promise.all([
      prisma.grade.findMany({ where: { student_id: studentId }, orderBy: { semester: "asc" } }),
      prisma.achievement.findMany({ where: { student_id: studentId }, orderBy: { created_at: "desc" } }),
      prisma.attendanceRecord.findMany({ where: { student_id: studentId }, orderBy: { date: "desc" } }),
      prisma.interaction.findMany({ where: { mentee_id: studentId }, orderBy: { date: "desc" }, take: 5 }),
      prisma.notification.findMany({ where: { user_id: studentId }, orderBy: { created_at: "desc" }, take: 20 }),
      prisma.feedPost.findMany({ orderBy: { created_at: "desc" }, take: 10 }),
      prisma.allocation.findFirst({ where: { mentee_id: studentId, is_active: true }, include: { mentor: true } }),
    ]);

  // Compute academic health
  const semesterGpas = computeSemesterGpas(grades);
  const latestCgpa = grades.length > 0 ? (grades[grades.length - 1]?.cgpa ?? 0) : 0;
  const totalPresent = attendanceRecords.filter((a: { status: string }) => a.status === "Present").length;
  const attendancePct = attendanceRecords.length > 0
    ? Math.round((totalPresent / attendanceRecords.length) * 100)
    : 0;

  const healthStatus =
    latestCgpa >= 7 && attendancePct >= 75
      ? "good"
      : latestCgpa >= 5.5 || attendancePct >= 65
      ? "warning"
      : "danger";

  // Compute per-subject attendance summary
  const subjectMap: Record<string, { present: number; total: number }> = {};
  for (const rec of attendanceRecords) {
    if (!subjectMap[rec.subject_name]) subjectMap[rec.subject_name] = { present: 0, total: 0 };
    subjectMap[rec.subject_name].total++;
    if (rec.status === "Present") subjectMap[rec.subject_name].present++;
  }
  const attendanceSummary = Object.entries(subjectMap).map(([subject, { present, total }]) => ({
    subject,
    percentage: Math.round((present / total) * 100),
    present,
    total,
  }));

  // NBA points
  const nbaScore = achievements
    .filter((a: { status: string }) => a.status === "Verified")
    .reduce((sum: number, a: { nba_points: number | null }) => sum + (a.nba_points ?? 0), 0);

  return {
    grades,
    achievements,
    attendanceSummary,
    interactions,
    notifications,
    feedPosts,
    allocation,
    academicHealth: {
      cgpa: latestCgpa,
      attendance: attendancePct,
      semesterGpas,
      healthStatus,
    },
    nbaScore,
    unreadCount: notifications.filter((n: { is_read: boolean }) => !n.is_read).length,
  };
}

// ─────────────────────────────────────────
// MENTOR DASHBOARD DATA
// ─────────────────────────────────────────

export async function getMentorDashboardData(mentorId: string) {
  const [allocations, interactions, courses] = await Promise.all([
    prisma.allocation.findMany({
      where: { mentor_id: mentorId, is_active: true },
      include: { mentee: true },
    }),
    prisma.interaction.findMany({
      where: { mentor_id: mentorId },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.course.findMany({ where: { faculty_id: mentorId } }),
  ]);

  const menteeIds = allocations.map((a: { mentee_id: string }) => a.mentee_id);

  const [pendingAchievements, pendingGraceRequests] = await Promise.all([
    prisma.achievement.findMany({
      where: { student_id: { in: menteeIds }, status: "Pending" },
    }),
    prisma.graceRequest.findMany({
      where: { student_id: { in: menteeIds }, status: "Pending" },
      include: { student: true },
    }),
  ]);

  return {
    mentees: allocations.map((a: { mentee: unknown }) => a.mentee),
    interactions,
    courses,
    pendingAchievements,
    pendingGraceRequests,
  };
}

// ─────────────────────────────────────────
// STUDENT — ACADEMICS PAGE
// ─────────────────────────────────────────

export async function getStudentAcademicsData(studentId: string) {
  const [grades, attendanceRecords, graceRequests] = await Promise.all([
    prisma.grade.findMany({ where: { student_id: studentId }, orderBy: [{ semester: "asc" }, { subject_name: "asc" }] }),
    prisma.attendanceRecord.findMany({ where: { student_id: studentId }, orderBy: { date: "desc" } }),
    prisma.graceRequest.findMany({ where: { student_id: studentId }, orderBy: { created_at: "desc" } }),
  ]);
  return { grades, attendanceRecords, graceRequests };
}

// ─────────────────────────────────────────
// STUDENT — MENTORSHIP PAGE
// ─────────────────────────────────────────

export async function getStudentMentorshipData(studentId: string) {
  const [allocation, interactions] = await Promise.all([
    prisma.allocation.findFirst({
      where: { mentee_id: studentId, is_active: true },
      include: { mentor: true },
    }),
    prisma.interaction.findMany({
      where: { mentee_id: studentId },
      orderBy: { date: "desc" },
    }),
  ]);
  return { allocation, interactions };
}

// ─────────────────────────────────────────
// STUDENT — ACHIEVEMENTS PAGE
// ─────────────────────────────────────────

export async function getStudentAchievements(studentId: string) {
  return prisma.achievement.findMany({
    where: { student_id: studentId },
    orderBy: { created_at: "desc" },
  });
}

// ─────────────────────────────────────────
// STUDENT — COURSES PAGE
// ─────────────────────────────────────────

export async function getStudentCourses(studentId: string) {
  return prisma.courseEnrollment.findMany({
    where: { student_id: studentId },
    include: {
      course: {
        include: {
          faculty: true,
          materials: true,
          assignments: { include: { submissions: { where: { student_id: studentId } } } },
        },
      },
    },
  });
}

// ─────────────────────────────────────────
// STUDENT — FEED PAGE
// ─────────────────────────────────────────

export async function getFeedPosts() {
  return prisma.feedPost.findMany({
    orderBy: { created_at: "desc" },
    include: { author: true },
  });
}

// ─────────────────────────────────────────
// MENTOR — MENTEES PAGE
// ─────────────────────────────────────────

export async function getMentorMentees(mentorId: string) {
  return prisma.allocation.findMany({
    where: { mentor_id: mentorId, is_active: true },
    include: {
      mentee: {
        include: {
          achievements: true,
          graceRequests: true,
          interactionsAsMentee: { where: { mentor_id: mentorId }, orderBy: { date: "desc" }, take: 1 },
        },
      },
    },
  });
}

// ─────────────────────────────────────────
// MENTOR — ATTENDANCE PAGE
// ─────────────────────────────────────────

export async function getMentorAttendanceData(mentorId: string) {
  const allocations = await prisma.allocation.findMany({
    where: { mentor_id: mentorId, is_active: true },
    include: { mentee: true },
  });
  const menteeIds = allocations.map((a: { mentee_id: string }) => a.mentee_id);
  const [attendanceRecords, graceRequests] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { student_id: { in: menteeIds } }, orderBy: { date: "desc" } }),
    prisma.graceRequest.findMany({
      where: { student_id: { in: menteeIds } },
      include: { student: true },
      orderBy: { created_at: "desc" },
    }),
  ]);
  return { mentees: allocations.map((a: { mentee: unknown }) => a.mentee), attendanceRecords, graceRequests };
}

// ─────────────────────────────────────────
// ADMIN DASHBOARD DATA
// ─────────────────────────────────────────

export async function getAdminDashboardData() {
  const [totalStudents, totalMentors, pendingAchievements, pendingGrace, recentUsers, feedPosts] =
    await Promise.all([
      prisma.profile.count({ where: { role: "mentee" } }),
      prisma.profile.count({ where: { role: "mentor" } }),
      prisma.achievement.count({ where: { status: "Pending" } }),
      prisma.graceRequest.count({ where: { status: "Pending" } }),
      prisma.profile.findMany({ orderBy: { created_at: "desc" }, take: 10 }),
      prisma.feedPost.findMany({ orderBy: { created_at: "desc" }, take: 5 }),
    ]);

  return { totalStudents, totalMentors, pendingAchievements, pendingGrace, recentUsers, feedPosts };
}

// ─────────────────────────────────────────
// ADMIN — USERS PAGE
// ─────────────────────────────────────────

export async function getAllProfiles() {
  return prisma.profile.findMany({ orderBy: { created_at: "desc" } });
}

// ─────────────────────────────────────────
// ADMIN — ALLOCATIONS PAGE
// ─────────────────────────────────────────

export async function getAllAllocations() {
  return prisma.allocation.findMany({
    include: { mentor: true, mentee: true },
    orderBy: { allocated_at: "desc" },
  });
}

// ─────────────────────────────────────────
// MENTOR — PERFORMANCE DASHBOARD DATA
// ─────────────────────────────────────────

export async function getMentorPerformanceData(mentorId: string) {
  // Get all mentees with their allocations
  const allocations = await prisma.allocation.findMany({
    where: { mentor_id: mentorId, is_active: true },
    include: { mentee: true },
  });

  const menteeIds = allocations.map((a: { mentee_id: string }) => a.mentee_id);

  // Fetch all data in parallel
  const [allGrades, allAttendance, allInteractions, allAchievements, allAlerts, upcomingSessions] =
    await Promise.all([
      prisma.grade.findMany({ where: { student_id: { in: menteeIds } }, orderBy: { semester: "asc" } }),
      prisma.attendanceRecord.findMany({ where: { student_id: { in: menteeIds } }, orderBy: { date: "desc" } }),
      prisma.interaction.findMany({ where: { mentee_id: { in: menteeIds } }, orderBy: { date: "desc" } }),
      prisma.achievement.findMany({ where: { student_id: { in: menteeIds }, status: "Verified" } }),
      prisma.alert.findMany({
        where: { student_id: { in: menteeIds }, status: { in: ["active", "acknowledged"] } },
        orderBy: { created_at: "desc" },
        include: { rule: true },
      }),
      prisma.mentorSession.findMany({
        where: { mentor_id: mentorId, status: "scheduled", date: { gte: new Date() } },
        include: { mentee: true },
        orderBy: [{ date: "asc" }, { start_time: "asc" }],
        take: 10,
      }),
    ]);

  // Group data by student
  const gradeMap: Record<string, typeof allGrades> = {};
  const attendanceMap: Record<string, typeof allAttendance> = {};
  const interactionMap: Record<string, typeof allInteractions> = {};
  const nbaMap: Record<string, number> = {};
  const alertCountMap: Record<string, number> = {};

  for (const g of allGrades) {
    if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
    gradeMap[g.student_id].push(g);
  }
  for (const a of allAttendance) {
    if (!attendanceMap[a.student_id]) attendanceMap[a.student_id] = [];
    attendanceMap[a.student_id].push(a);
  }
  for (const i of allInteractions) {
    if (!interactionMap[i.mentee_id]) interactionMap[i.mentee_id] = [];
    interactionMap[i.mentee_id].push(i);
  }
  for (const a of allAchievements) {
    nbaMap[a.student_id] = (nbaMap[a.student_id] ?? 0) + (a.nba_points ?? 0);
  }
  for (const alert of allAlerts) {
    alertCountMap[alert.student_id] = (alertCountMap[alert.student_id] ?? 0) + 1;
  }

  // Compute per-mentee performance
  const mentees = allocations.map((a: { mentee: any }) => {
    const student = a.mentee;
    if (!student) return null;
    const sid = student.id;

    const grades = gradeMap[sid] ?? [];
    const attendance = attendanceMap[sid] ?? [];
    const interactions = interactionMap[sid] ?? [];

    // CGPA
    const latestGrade = grades[grades.length - 1];
    const cgpa = latestGrade?.cgpa ?? 0;

    // SGPA trend
    const semMap: Record<number, number[]> = {};
    for (const g of grades) {
      if (g.sgpa != null) {
        if (!semMap[g.semester]) semMap[g.semester] = [];
        semMap[g.semester].push(g.sgpa);
      }
    }
    const sgpaTrend = Object.entries(semMap)
      .map(([sem, gpas]) => ({
        semester: Number(sem),
        gpa: Number((gpas.reduce((s, v) => s + v, 0) / gpas.length).toFixed(2)),
      }))
      .sort((a, b) => a.semester - b.semester);

    // Attendance
    const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
    const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 100;

    // Monthly attendance trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentForTrend = attendance.filter((a: any) => new Date(a.date) >= sixMonthsAgo);
    const monthlyMap: Record<string, { present: number; total: number }> = {};
    for (const rec of recentForTrend) {
      const monthKey = new Date(rec.date).toISOString().slice(0, 7);
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { present: 0, total: 0 };
      monthlyMap[monthKey].total++;
      if (rec.status === "Present") monthlyMap[monthKey].present++;
    }
    const attendanceTrend = Object.entries(monthlyMap)
      .map(([month, { present, total }]) => ({ month, percentage: Math.round((present / total) * 100) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Risk level
    const riskFactors: string[] = [];
    if (cgpa < 4.0) riskFactors.push("Critical CGPA");
    else if (cgpa < 5.5) riskFactors.push("Low CGPA");
    if (attendancePct < 60) riskFactors.push("Critical Attendance");
    else if (attendancePct < 75) riskFactors.push("Low Attendance");

    const lastInteraction = interactions[0];
    const daysSinceInteraction = lastInteraction
      ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceInteraction > 60) riskFactors.push("No recent contact");
    else if (daysSinceInteraction > 30) riskFactors.push("Infrequent contact");

    if ((alertCountMap[sid] ?? 0) > 0) riskFactors.push("Active alerts");

    const riskLevel = riskFactors.some(f => f.startsWith("Critical")) ? "critical"
      : riskFactors.length >= 2 ? "high"
      : riskFactors.length === 1 ? "medium"
      : "low";

    return {
      student,
      cgpa,
      attendancePct,
      sgpaTrend,
      attendanceTrend,
      riskLevel,
      riskFactors,
      lastInteraction: lastInteraction?.date?.toISOString() ?? null,
      daysSinceInteraction,
      nbaScore: nbaMap[sid] ?? 0,
      activeAlerts: alertCountMap[sid] ?? 0,
      totalSessions: interactions.length,
    };
  }).filter(Boolean);

  // Risk counts
  const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const m of mentees) {
    if (m) riskCounts[m.riskLevel as keyof typeof riskCounts]++;
  }

  return {
    mentees,
    riskCounts,
    totalAlerts: allAlerts.length,
    upcomingSessions,
    recentAlerts: allAlerts.slice(0, 10),
  };
}

// ─────────────────────────────────────────
// ADMIN — PERFORMANCE DASHBOARD DATA
// ─────────────────────────────────────────

export async function getAdminPerformanceData() {
  const [totalStudents, totalFaculty, allGrades, allAttendance, allInteractions, allAlerts] =
    await Promise.all([
      prisma.profile.count({ where: { role: "mentee", is_active: true } }),
      prisma.profile.count({ where: { role: "mentor", is_active: true } }),
      prisma.grade.findMany({ orderBy: { semester: "asc" } }),
      prisma.attendanceRecord.findMany({ orderBy: { date: "desc" } }),
      prisma.interaction.findMany({ orderBy: { date: "desc" } }),
      prisma.alert.findMany({
        where: { status: { in: ["active", "acknowledged"] } },
        orderBy: { created_at: "desc" },
        include: { rule: true, student: true },
        take: 20,
      }),
    ]);

  // Group by student
  const gradeMap: Record<string, typeof allGrades> = {};
  const attendanceMap: Record<string, typeof allAttendance> = {};
  const interactionMap: Record<string, string[]> = {}; // mentee_id -> [dates]

  for (const g of allGrades) {
    if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
    gradeMap[g.student_id].push(g);
  }
  for (const a of allAttendance) {
    if (!attendanceMap[a.student_id]) attendanceMap[a.student_id] = [];
    attendanceMap[a.student_id].push(a);
  }
  for (const i of allInteractions) {
    if (!interactionMap[i.mentee_id]) interactionMap[i.mentee_id] = [];
    interactionMap[i.mentee_id].push(i.date.toISOString());
  }

  // Get all active students
  const students = await prisma.profile.findMany({
    where: { role: "mentee", is_active: true },
  });

  // Compute per-student risk
  let riskLow = 0, riskMedium = 0, riskHigh = 0, riskCritical = 0;
  const departmentStats: Record<string, { cgpaSum: number; attendSum: number; count: number; atRisk: number }> = {};

  for (const student of students) {
    const grades = gradeMap[student.id] ?? [];
    const attendance = attendanceMap[student.id] ?? [];
    const interactions = interactionMap[student.id] ?? [];

    const cgpa = grades.length > 0 ? (grades[grades.length - 1]?.cgpa ?? 0) : 0;
    const totalPresent = attendance.filter((a: any) => a.status === "Present").length;
    const attendancePct = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 100;

    const riskFactors: string[] = [];
    if (cgpa < 4.0) riskFactors.push("Critical CGPA");
    else if (cgpa < 5.5) riskFactors.push("Low CGPA");
    if (attendancePct < 60) riskFactors.push("Critical Attendance");
    else if (attendancePct < 75) riskFactors.push("Low Attendance");

    const daysSinceLast = interactions.length > 0
      ? Math.floor((Date.now() - new Date(interactions[0]).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceLast > 60) riskFactors.push("No recent contact");

    const riskLevel = riskFactors.some(f => f.startsWith("Critical")) ? "critical"
      : riskFactors.length >= 2 ? "high"
      : riskFactors.length === 1 ? "medium"
      : "low";

    if (riskLevel === "critical") riskCritical++;
    else if (riskLevel === "high") riskHigh++;
    else if (riskLevel === "medium") riskMedium++;
    else riskLow++;

    // Department stats
    const dept = student.department ?? "Unknown";
    if (!departmentStats[dept]) departmentStats[dept] = { cgpaSum: 0, attendSum: 0, count: 0, atRisk: 0 };
    departmentStats[dept].cgpaSum += cgpa;
    departmentStats[dept].attendSum += attendancePct;
    departmentStats[dept].count++;
    if (riskLevel === "high" || riskLevel === "critical") departmentStats[dept].atRisk++;
  }

  const departmentStatsArray = Object.entries(departmentStats).map(([department, stats]) => ({
    department,
    avgCgpa: stats.count > 0 ? Number((stats.cgpaSum / stats.count).toFixed(2)) : 0,
    avgAttendance: stats.count > 0 ? Math.round(stats.attendSum / stats.count) : 0,
    atRiskCount: stats.atRisk,
  }));

  // Mentor activity
  const mentors = await prisma.profile.findMany({ where: { role: "mentor", is_active: true } });
  const mentorIds = mentors.map((m: { id: string }) => m.id);

  const [allAllocs, allSessions, mentorAlerts] = await Promise.all([
    prisma.allocation.findMany({ where: { mentor_id: { in: mentorIds }, is_active: true } }),
    prisma.mentorSession.findMany({ where: { mentor_id: { in: mentorIds } } }),
    prisma.alert.findMany({ where: { mentor_id: { in: mentorIds }, status: "active" } }),
  ]);

  const allocMap: Record<string, number> = {};
  const sessionMap: Record<string, number> = {};
  const alertMap: Record<string, number> = {};
  for (const a of allAllocs) allocMap[a.mentor_id] = (allocMap[a.mentor_id] ?? 0) + 1;
  for (const s of allSessions) sessionMap[s.mentor_id] = (sessionMap[s.mentor_id] ?? 0) + 1;
  for (const a of mentorAlerts) alertMap[a.mentor_id ?? ""] = (alertMap[a.mentor_id ?? ""] ?? 0) + 1;

  const mentorActivity = mentors.map((m: any) => ({
    mentor: m,
    menteeCount: allocMap[m.id] ?? 0,
    sessionCount: sessionMap[m.id] ?? 0,
    alertCount: alertMap[m.id] ?? 0,
  }));

  return {
    totalStudents,
    totalFaculty,
    riskDistribution: { low: riskLow, medium: riskMedium, high: riskHigh, critical: riskCritical },
    departmentStats: departmentStatsArray,
    topAlerts: allAlerts,
    mentorActivity,
  };
}

// ─────────────────────────────────────────
// SCHEDULING DATA
// ─────────────────────────────────────────

export async function getSchedulingData(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });

  if (profile?.role === "mentor") {
    const [availability, sessions, allocations] = await Promise.all([
      prisma.mentorAvailability.findMany({ where: { mentor_id: userId, is_active: true }, orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }] }),
      prisma.mentorSession.findMany({ where: { mentor_id: userId }, include: { mentee: true }, orderBy: [{ date: "asc" }, { start_time: "asc" }] }),
      prisma.allocation.findMany({ where: { mentor_id: userId, is_active: true }, include: { mentee: true } }),
    ]);
    return { role: "mentor" as const, availability, sessions, mentees: allocations.map((a: { mentee: any }) => a.mentee) };
  } else {
    // Student — find their mentor and get available slots
    const allocation = await prisma.allocation.findFirst({ where: { mentee_id: userId, is_active: true }, include: { mentor: true } });
    if (!allocation) return { role: "mentee" as const, mentor: null, availability: [], sessions: [] };

    const [availability, sessions] = await Promise.all([
      prisma.mentorAvailability.findMany({ where: { mentor_id: allocation.mentor_id, is_active: true }, orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }] }),
      prisma.mentorSession.findMany({ where: { mentee_id: userId }, include: { mentor: true }, orderBy: [{ date: "asc" }, { start_time: "asc" }] }),
    ]);
    return { role: "mentee" as const, mentor: allocation.mentor, availability, sessions };
  }
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function computeSemesterGpas(grades: { semester: number; sgpa: number | null }[]) {
  const map: Record<number, number[]> = {};
  for (const g of grades) {
    if (g.sgpa != null) {
      if (!map[g.semester]) map[g.semester] = [];
      map[g.semester].push(g.sgpa);
    }
  }
  return Object.entries(map)
    .map(([semester, gpas]) => ({
      semester: Number(semester),
      gpa: Number((gpas.reduce((s: number, v: number) => s + v, 0) / gpas.length).toFixed(2)),
    }))
    .sort((a: { semester: number }, b: { semester: number }) => a.semester - b.semester);
}
