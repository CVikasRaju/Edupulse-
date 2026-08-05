-- ==========================================
-- EduPulse: Event Management
-- ==========================================
-- Run this in Supabase SQL Editor (Dashboard →
-- SQL Editor → New Query) to enable the Event
-- Management feature for all roles.
--
-- It:
--   1. Extends CalendarEvent with richer fields
--      (description, location, capacity, created_by)
--   2. Creates EventRegistration (RSVP) table
--   3. Adds RLS policies (wide-open authenticated
--      pattern, consistent with the rest of the app)
-- ==========================================

-- ── 1. Extend CalendarEvent ─────────────────────────────
ALTER TABLE public."CalendarEvent" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE public."CalendarEvent" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE public."CalendarEvent" ADD COLUMN IF NOT EXISTS "capacity" INTEGER;
ALTER TABLE public."CalendarEvent" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE public."CalendarEvent" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- ── 2. EventRegistration (RSVP) table ───────────────────
CREATE TABLE IF NOT EXISTS public."EventRegistration" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EventRegistration_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES public."CalendarEvent"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRegistration_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES public."Profile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    -- A student can only register once per event
    CONSTRAINT "EventRegistration_event_student_unique" UNIQUE ("event_id", "student_id")
);

-- ── 3. RLS policies ─────────────────────────────────────
ALTER TABLE public."EventRegistration" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public."EventRegistration";
CREATE POLICY "Service role full access" ON public."EventRegistration"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage event registrations" ON public."EventRegistration";
CREATE POLICY "Users manage event registrations" ON public."EventRegistration"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4. DB-side id default (safety net) ──────────────────
ALTER TABLE public."EventRegistration" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE public."CalendarEvent" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- ==========================================
-- Done!
-- ==========================================
