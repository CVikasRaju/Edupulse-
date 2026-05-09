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
    .filter((a) => a.status === "Verified")
    .reduce((sum, a) => sum + (a.nba_points ?? 0), 0);

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
    unreadCount: notifications.filter((n) => !n.is_read).length,
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

  const menteeIds = allocations.map((a) => a.mentee_id);

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
    mentees: allocations.map((a) => a.mentee),
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
  const menteeIds = allocations.map((a) => a.mentee_id);
  const [attendanceRecords, graceRequests] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { student_id: { in: menteeIds } }, orderBy: { date: "desc" } }),
    prisma.graceRequest.findMany({
      where: { student_id: { in: menteeIds } },
      include: { student: true },
      orderBy: { created_at: "desc" },
    }),
  ]);
  return { mentees: allocations.map((a) => a.mentee), attendanceRecords, graceRequests };
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
      gpa: Number((gpas.reduce((s, v) => s + v, 0) / gpas.length).toFixed(2)),
    }))
    .sort((a, b) => a.semester - b.semester);
}
