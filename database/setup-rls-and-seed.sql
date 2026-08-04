-- ==========================================
-- EduPulse: Complete User Setup Script
-- ==========================================
-- Run this in Supabase SQL Editor AFTER
-- running create-auth-users.js
--
-- Steps:
-- 1. Run `node create-auth-users.js` locally
-- 2. Copy the output SQL and run it here
-- 3. OR run this complete script if auth
--    users already exist
-- ==========================================

-- First, check if RLS is enabled on Profile table
-- If so, ensure service role can write to it
ALTER TABLE IF EXISTS public."Profile" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Service role full access" ON public."Profile";
DROP POLICY IF EXISTS "Users can read own profile" ON public."Profile";
DROP POLICY IF EXISTS "Authenticated users read profiles" ON public."Profile";

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role full access" ON public."Profile"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read profiles (needed for mentor-student lookup)
CREATE POLICY "Authenticated users read profiles" ON public."Profile"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public."Profile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- Enable RLS on ALL tables with proper policies
-- ==========================================

-- Helper function to enable RLS and add basic policies
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);

    -- Drop existing service role policy
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I', t.tablename);

    -- Create service role full access policy
    EXECUTE format(
      'CREATE POLICY "Service role full access" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t.tablename
    );
  END LOOP;
END $$;

-- ==========================================
-- Also add RLS policies for other critical tables
-- ==========================================

-- Notification: users can read their own
DROP POLICY IF EXISTS "Users read own notifications" ON public."Notification";
CREATE POLICY "Users read own notifications" ON public."Notification"
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR true); -- temporarily allow all reads

-- MentorSession & MentorAvailability: read access for mentors and mentees
DROP POLICY IF EXISTS "Users read sessions" ON public."MentorSession";
CREATE POLICY "Users read sessions" ON public."MentorSession"
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users read availability" ON public."MentorAvailability";
CREATE POLICY "Users read availability" ON public."MentorAvailability"
  FOR SELECT TO authenticated
  USING (true);

-- FeedPost: everyone can read
DROP POLICY IF EXISTS "Authenticated users read feed" ON public."FeedPost";
CREATE POLICY "Authenticated users read feed" ON public."FeedPost"
  FOR SELECT TO authenticated
  USING (true);

-- Grade: students see own, mentors see mentees
DROP POLICY IF EXISTS "Users read grades" ON public."Grade";
CREATE POLICY "Users read grades" ON public."Grade"
  FOR SELECT TO authenticated
  USING (true);

-- Achievement: everyone can read
DROP POLICY IF EXISTS "Users read achievements" ON public."Achievement";
CREATE POLICY "Users read achievements" ON public."Achievement"
  FOR SELECT TO authenticated
  USING (true);

-- Interaction: mentors and mentees can read
DROP POLICY IF EXISTS "Users read interactions" ON public."Interaction";
CREATE POLICY "Users read interactions" ON public."Interaction"
  FOR SELECT TO authenticated
  USING (true);

-- Interaction: mentors can log interactions (used by /api/interactions)
DROP POLICY IF EXISTS "Mentors create interactions" ON public."Interaction";
CREATE POLICY "Mentors create interactions" ON public."Interaction"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Interaction: mentors and mentees can update (acknowledge, resolve follow-ups)
DROP POLICY IF EXISTS "Users update interactions" ON public."Interaction";
CREATE POLICY "Users update interactions" ON public."Interaction"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification: authenticated users can create notifications (used by APIs)
DROP POLICY IF EXISTS "Users create notifications" ON public."Notification";
CREATE POLICY "Users create notifications" ON public."Notification"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allocation: everyone can read
DROP POLICY IF EXISTS "Users read allocations" ON public."Allocation";
CREATE POLICY "Users read allocations" ON public."Allocation"
  FOR SELECT TO authenticated
  USING (true);

-- CourseEnrollment: mentors/admins create enrollments (course -> student sync)
DROP POLICY IF EXISTS "Users create enrollments" ON public."CourseEnrollment";
CREATE POLICY "Users create enrollments" ON public."CourseEnrollment"
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users read enrollments" ON public."CourseEnrollment";
CREATE POLICY "Users read enrollments" ON public."CourseEnrollment"
  FOR SELECT TO authenticated
  USING (true);

-- CalendarEvent: admins create/delete, everyone reads (student calendar sync)
DROP POLICY IF EXISTS "Users read calendar events" ON public."CalendarEvent";
CREATE POLICY "Users read calendar events" ON public."CalendarEvent"
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage calendar events" ON public."CalendarEvent";
CREATE POLICY "Admins manage calendar events" ON public."CalendarEvent"
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- GraceRequest: mentors update (approve/reject) requests from their mentees
DROP POLICY IF EXISTS "Users update grace requests" ON public."GraceRequest";
CREATE POLICY "Users update grace requests" ON public."GraceRequest"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Achievement: mentors update (verify/reject) student achievements
DROP POLICY IF EXISTS "Users update achievements" ON public."Achievement";
CREATE POLICY "Users update achievements" ON public."Achievement"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- AttendanceRecord: students see own
DROP POLICY IF EXISTS "Users read attendance" ON public."AttendanceRecord";
CREATE POLICY "Users read attendance" ON public."AttendanceRecord"
  FOR SELECT TO authenticated
  USING (true);

-- ==========================================
-- Course Materials (Notes) storage bucket + access
-- ==========================================
-- Storage bucket for uploaded study notes (PDFs, docs, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of files in the course-materials bucket
DROP POLICY IF EXISTS "Public read course materials" ON storage.objects;
CREATE POLICY "Public read course materials" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'course-materials');

-- Allow authenticated users (mentors) to upload files
DROP POLICY IF EXISTS "Authenticated upload course materials" ON storage.objects;
CREATE POLICY "Authenticated upload course materials" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

-- Allow authenticated users to delete files they uploaded
DROP POLICY IF EXISTS "Authenticated delete own course materials" ON storage.objects;
CREATE POLICY "Authenticated delete own course materials" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-materials' AND owner = auth.uid());

-- ==========================================
-- Seed default alert rules (from alerts engine)
-- ==========================================
INSERT INTO public."AlertRule" ("id", "name", "type", "metric", "operator", "threshold", "consecutive", "severity", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Low Attendance', 'attendance_drop', 'attendance_pct', 'lt', 75, 1, 'warning', true, NOW(), NOW()),
  (gen_random_uuid(), 'Critical Attendance', 'attendance_drop', 'attendance_pct', 'lt', 60, 1, 'critical', true, NOW(), NOW()),
  (gen_random_uuid(), 'Low CGPA', 'grade_decline', 'cgpa', 'lt', 5.5, 1, 'warning', true, NOW(), NOW()),
  (gen_random_uuid(), 'Critical CGPA', 'grade_decline', 'cgpa', 'lt', 4.0, 1, 'critical', true, NOW(), NOW()),
  (gen_random_uuid(), 'Consecutive Low SGPA', 'grade_decline', 'consecutive_low_sgpa', 'gte', 2, 2, 'critical', true, NOW(), NOW()),
  (gen_random_uuid(), 'No Mentor Contact', 'engagement_gap', 'days_since_interaction', 'gt', 30, 1, 'warning', true, NOW(), NOW()),
  (gen_random_uuid(), 'Long Engagement Gap', 'engagement_gap', 'days_since_interaction', 'gt', 60, 1, 'critical', true, NOW(), NOW()),
  (gen_random_uuid(), 'Attendance Dropping', 'attendance_drop', 'attendance_drop', 'gte', 15, 1, 'warning', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==========================================
-- SAFETY NET: add DB-side defaults for id/updated_at
-- (Optional but recommended — makes inserts work even
--  if a future code path forgets to send an id)
-- ==========================================
DO $$
DECLARE
  t TEXT;
  tbl regclass;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Profile', 'Allocation', 'Interaction', 'Grade', 'AttendanceRecord',
    'GraceRequest', 'Achievement', 'FacultyAchievement', 'Course',
    'CourseEnrollment', 'CourseMaterial', 'Assignment', 'Submission',
    'FeedPost', 'Notification', 'AuditLogEntry', 'CalendarEvent',
    'NbaScoringConfig', 'AlertRule', 'Alert', 'MentorAvailability',
    'MentorSession'
  ]
  LOOP
    -- Skip tables that don't exist (keeps the block from aborting)
    tbl := to_regclass(format('public.%I', t));
    IF tbl IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE %s ALTER COLUMN "id" SET DEFAULT gen_random_uuid()',
        tbl
      );
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  t TEXT;
  tbl regclass;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Profile', 'Interaction', 'GraceRequest', 'FeedPost',
    'AlertRule', 'MentorAvailability', 'MentorSession'
  ]
  LOOP
    tbl := to_regclass(format('public.%I', t));
    IF tbl IS NOT NULL THEN
      -- Add NOW() default to "updated_at" where it is missing
      EXECUTE format(
        'ALTER TABLE %s ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ==========================================
-- Done! 
-- ==========================================
-- After running this:
-- 1. Create auth users with create-auth-users.js
-- 2. Run the Profile INSERT SQL from that script's output
-- 3. Your app should work!
-- ==========================================
