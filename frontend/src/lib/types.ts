// ══════════════════════════════════════════
// EduPulse — Core Type Definitions
// ══════════════════════════════════════════

export type UserRole = "admin" | "mentor" | "mentee";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url?: string;
  department?: string;
  year?: number;
  section?: string;
  usn?: string;
  employee_id?: string;
  designation?: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  github_url?: string;
  year_of_joining?: number;
  is_profile_complete: boolean;
  is_active: boolean;
  theme_preference?: "system" | "light" | "dark";
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  mentor_id: string;
  mentee_id: string;
  allocated_at: string;
  is_active: boolean;
  mentor?: Profile;
  mentee?: Profile;
}

export type InteractionType = "Academic" | "Career" | "Personal" | "General";
export type InteractionMode = "In-Person" | "Online";

export interface Interaction {
  id: string;
  mentor_id: string;
  mentee_id: string;
  date: string;
  duration_minutes?: number;
  type?: InteractionType;
  topics?: string;
  remarks?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  next_interaction_date?: string;
  mode?: InteractionMode;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  is_follow_up_resolved: boolean;
  created_at: string;
  updated_at: string;
  mentor?: Profile;
  mentee?: Profile;
}

export interface Grade {
  id: string;
  student_id: string;
  semester: number;
  subject_name: string;
  subject_code?: string;
  internal_marks?: number;
  external_marks?: number;
  total_marks?: number;
  grade_letter?: string;
  credits?: number;
  grade_points?: number;
  sgpa?: number;
  cgpa?: number;
  backlogs: number;
  academic_year?: string;
  created_at: string;
}

export type AttendanceStatus = "Present" | "Absent" | "Late";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject_name: string;
  subject_code?: string;
  date: string;
  status: AttendanceStatus;
  marked_by?: string;
  semester?: number;
  academic_year?: string;
  created_at: string;
}

export type GraceRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Forwarded";

export interface GraceRequest {
  id: string;
  student_id: string;
  reason: string;
  reason_type: "Medical" | "Event" | "Other";
  document_url?: string;
  status: GraceRequestStatus;
  mentor_remarks?: string;
  admin_remarks?: string;
  reviewed_by?: string;
  date_from?: string;
  date_to?: string;
  subject_name?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
}

export type AchievementCategory =
  | "Hackathon"
  | "Internship"
  | "Certification"
  | "Paper Publication"
  | "Patent"
  | "Workshop"
  | "Conference"
  | "Sports"
  | "NSS/NCC"
  | "Other";

export type AchievementLevel =
  | "International"
  | "National"
  | "State"
  | "College";

export type AchievementStatus = "Pending" | "Verified" | "Rejected";

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  category: AchievementCategory;
  issuing_body?: string;
  date?: string;
  level?: AchievementLevel;
  description?: string;
  file_url?: string;
  nba_points: number;
  status: AchievementStatus;
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  student?: Profile;
}

export interface FacultyAchievement {
  id: string;
  faculty_id: string;
  title: string;
  type: string;
  date?: string;
  issuing_body?: string;
  level?: string;
  description?: string;
  file_url?: string;
  created_at: string;
}

export interface Course {
  id: string;
  faculty_id: string;
  name: string;
  code?: string;
  semester?: number;
  department?: string;
  academic_year?: string;
  created_at: string;
  faculty?: Profile;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  status: "Active" | "Dropped" | "Completed";
  student?: Profile;
  course?: Course;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  deadline: string;
  max_marks?: number;
  file_url?: string;
  created_by?: string;
  created_at: string;
  course?: Course;
}

export type SubmissionStatus = "Submitted" | "Graded" | "Late";

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  submitted_at: string;
  marks?: number;
  remarks?: string;
  graded_by?: string;
  graded_at?: string;
  status: SubmissionStatus;
  assignment?: Assignment;
  student?: Profile;
}

export type FeedType =
  | "Announcement"
  | "Placement"
  | "Event"
  | "Hackathon"
  | "Club"
  | "Other";

export interface FeedPost {
  id: string;
  title: string;
  content?: string;
  type?: FeedType;
  target_department?: string;
  target_year?: number;
  posted_by?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export type NotificationCategory =
  | "Academic"
  | "Mentorship"
  | "Achievement"
  | "System";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  category?: NotificationCategory;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  user?: Profile;
}

export type EventType =
  | "Exam"
  | "Holiday"
  | "Event"
  | "Submission"
  | "Workshop"
  | "Hackathon"
  | "Seminar"
  | "Club"
  | "Other";

export interface CalendarEvent {
  id: string;
  title: string;
  type?: EventType;
  date: string;
  end_date?: string;
  department?: string;
  academic_year?: string;
  description?: string;
  location?: string;
  capacity?: number;
  created_by?: string;
  is_active?: boolean;
  created_at: string;
}

export type EventRegistrationStatus = "registered" | "attended" | "cancelled";

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  status: EventRegistrationStatus;
  registered_at: string;
  student?: Profile;
  event?: CalendarEvent;
}

export interface NbaScoringConfig {
  id: string;
  category: string;
  level: string;
  points: number;
  created_at: string;
}

// ── Dashboard Types ──
export interface ScheduleItem {
  id: string;
  time: string;
  endTime: string;
  subject: string;
  room: string;
  faculty: string;
  isCurrent?: boolean;
}

export interface AcademicHealth {
  cgpa: number;
  attendance: number;
  semesterGpas: { semester: number; gpa: number }[];
  healthStatus: "good" | "warning" | "danger";
}

export interface PendingAction {
  id: string;
  type: string;
  title: string;
  dueDate?: string;
  priority: "high" | "medium" | "low";
}

// ══════════════════════════════════════════
// Alert & Threshold System
// ══════════════════════════════════════════

export type AlertRuleType = "attendance_drop" | "grade_decline" | "engagement_gap";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

export interface AlertRule {
  id: string;
  name: string;
  type: AlertRuleType;
  metric: string;
  operator: string;
  threshold: number;
  consecutive: number;
  severity: AlertSeverity;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  student_id: string;
  mentor_id?: string;
  title: string;
  message?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric_value?: number;
  threshold_value?: number;
  context?: Record<string, unknown>;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  rule?: AlertRule;
  student?: Profile;
  triggeredBy?: Profile;
}

// ══════════════════════════════════════════
// Scheduling System
// ══════════════════════════════════════════

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type SessionType = "1-on-1" | "group" | "emergency";

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mentor?: Profile;
}

export interface MentorSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  availability_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: SessionStatus;
  type: SessionType;
  topic?: string;
  notes?: string;
  meeting_link?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  mentor?: Profile;
  mentee?: Profile;
  availability?: MentorAvailability;
}

// ══════════════════════════════════════════
// Performance Matrix
// ══════════════════════════════════════════

export interface MenteePerformance {
  student: Profile;
  cgpa: number;
  attendancePct: number;
  sgpaTrend: { semester: number; gpa: number }[];
  attendanceTrend: { month: string; percentage: number }[];
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  lastInteraction?: string;
  daysSinceInteraction: number;
  nbaScore: number;
  activeAlerts: number;
  totalSessions: number;
}

export interface FacultyDashboardData {
  mentees: MenteePerformance[];
  riskCounts: { low: number; medium: number; high: number; critical: number };
  totalAlerts: number;
  upcomingSessions: MentorSession[];
  recentAlerts: Alert[];
}

export interface AdminDashboardData {
  // 全校 overview
  totalStudents: number;
  totalFaculty: number;
  riskDistribution: { low: number; medium: number; high: number; critical: number };
  departmentStats: { department: string; avgCgpa: number; avgAttendance: number; atRiskCount: number }[];
  topAlerts: Alert[];
  mentorActivity: { mentor: Profile; menteeCount: number; sessionCount: number; alertCount: number }[];
}
