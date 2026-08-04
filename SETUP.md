# EduPulse Setup Guide

Complete guide to setting up, seeding, and running EduPulse locally and in production.

---

## Prerequisites

- **Node.js**: v18+ 
- **npm**: v9+
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Google AI Studio Account**: [aistudio.google.com](https://aistudio.google.com) (for Gemini API key)

---

## 1. Environment Variables Setup

Create a `.env.local` file inside the `frontend/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database Connection (Supabase Postgres)
DATABASE_URL="postgresql://postgres.your-project:your-db-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project:your-db-password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Google Gemini AI
GEMINI_API_KEY="your-google-gemini-key"
```

> **Where to get these keys:**
> - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase → Settings → API
> - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Settings → API → `service_role` (keep secret!)
> - `DATABASE_URL` & `DIRECT_URL`: Supabase → Settings → Database → Connection string (Transaction pooler & Session)
> - `GEMINI_API_KEY`: Google AI Studio → API Keys

---

## 2. Database Schema Setup

Run the SQL files in **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

1. **Schema**: Copy and paste `backend/database/supabase_schema.sql` → Run
2. **Seed Data**: Copy and paste `backend/database/seed.sql` → Run
3. **RLS & Fixes**: Copy and paste `backend/database/complete_fix.sql` → Run

---

## 3. Creating Auth Users

### Method A: Using script (Recommended)

Run the user creation script from the `frontend/` folder:

```bash
cd frontend
node create-auth-users.js
```

This creates 3 demo roles for testing:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@sahyadri.edu.in` | `<your-admin-password>` |
| **Teacher/Mentor** | `teacher@sahyadri.edu.in` | `<your-mentor-password>` |
| **Student** | `student@sahyadri.edu.in` | `<your-student-password>` |

After running, copy the SQL output and run it in **Supabase SQL Editor** to create Profile rows.

### Method B: Manual via Supabase Dashboard

1. Go to Supabase → **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. Check **Auto Confirm Email**
5. Repeat for each user

Then run this SQL to create their profiles:

```sql
-- Admin
INSERT INTO public."Profile" (id, role, full_name, email, department, designation, employee_id, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'admin', 'Demo Admin', 'admin@sahyadri.edu.in', 'Administration', 'Principal', 'SAH-ADM-001', true, true, NOW(), NOW());

-- Teacher/Mentor
INSERT INTO public."Profile" (id, role, full_name, email, department, designation, employee_id, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'mentor', 'Demo Mentor', 'teacher@sahyadri.edu.in', 'Computer Science', 'Associate Professor', 'SAH-CS-042', true, true, NOW(), NOW());

-- Student
INSERT INTO public."Profile" (id, role, full_name, email, department, year, section, usn, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'mentee', 'Demo Student', 'student@sahyadri.edu.in', 'Computer Science', 3, 'A', '4SH21CS001', true, true, NOW(), NOW());
```

> Replace `AUTH_USER_ID_HERE` with the actual Supabase Auth user UUID (visible in Authentication → Users).

---

## 4. Deploy to Vercel

```bash
cd frontend
git add .
git commit -m "Deploy EduPulse"
git push origin main
```

Vercel will automatically build and deploy. Make sure:
- ✅ Root Directory is set to `frontend`
- ✅ All environment variables are set
- ✅ Build command is `prisma generate && next build`

---

## 5. Verify Deployment

After deployment, check:
1. `https://your-app.vercel.app/login` — Login page loads
2. Login with your created admin email / password
3. You should be redirected to `/admin/dashboard`
