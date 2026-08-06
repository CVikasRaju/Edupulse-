# EduPulse Setup Guide

Complete guide to setting up, seeding, and running **EduPulse** locally and deploying it to production (Vercel).

> 📖 For a feature overview, see the [README](README.md).

---

## Prerequisites

- **Node.js** v18+ (recommended: 20)
- **npm** v9+ (or pnpm / yarn)
- **Supabase Account** — [supabase.com](https://supabase.com) (free tier is enough)
- **Google AI Studio Account** — [aistudio.google.com](https://aistudio.google.com) (for the Gemini API key)

---

## 1. Environment Variables

Create a `.env.local` file inside the `frontend/` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database connection (used by Prisma tooling only)
DATABASE_URL="postgresql://postgres.your-project:your-db-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project:your-db-password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Google Gemini AI (attendance upload + resume analyzer)
GEMINI_API_KEY="your-gemini-api-key"
```

**Where to get each key:**

| Variable | Location |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → **API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → **API** → `anon` / `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → **API** → `service_role` ⚠️ keep secret, server-only |
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Project Settings → **Database** → Connection string (Transaction & Session pooler) |
| `GEMINI_API_KEY` | Google AI Studio → [API Keys](https://aistudio.google.com/apikey) |

> ⚠️ `.env.local` is gitignored. Never commit it — the `service_role` key bypasses RLS and must never be exposed to the client.

---

## 2. Install Dependencies

```bash
cd frontend
npm install
```

---

## 3. Create the Database

Open your **Supabase Dashboard → SQL Editor → New Query** and run the files **in this order**:

| Step | File | What it does |
|------|------|--------------|
| 1️⃣ | [`backend/database/schema.sql`](backend/database/schema.sql) | Creates all 22 core tables (Profiles, Grades, Courses, Alerts, Scheduling, …) |
| 2️⃣ | [`database/event-management.sql`](database/event-management.sql) | Extends `CalendarEvent` (description, location, capacity, created_by) and creates the `EventRegistration` RSVP table |
| 3️⃣ | [`backend/database/seed.sql`](backend/database/seed.sql) | Seeds sanitized demo profiles (admin / mentor / student) |
| 4️⃣ | [`database/setup-rls-and-seed.sql`](database/setup-rls-and-seed.sql) | Enables RLS policies, creates the `course-materials` storage bucket, and seeds default alert rules |

> Alternatively, `frontend/supabase_schema.sql` contains a single combined schema dump — useful as a reference or for a fresh project without the incremental files.

---

## 4. Create User Accounts

Every account needs **two things**: a Supabase **Auth user** (the login) and a matching **Profile** row (the app data).

### Method A: Through the app (Recommended)

1. Log in as an administrator.
2. Go to **Admin → Users → Add User**.
3. Fill in the form (role, name, email, password, department, year, section, USN / employee ID).
4. Save — the app creates the **auth login and the Profile row automatically**.

> This is the same path used to create the demo accounts below, and it stays in sync with the database.

### Method B: Manually via the Supabase Dashboard

1. Supabase → **Authentication → Users → Add User** → enter email + password → tick **Auto Confirm Email**.
2. Note the generated **Auth user UUID**.
3. Run the following SQL, replacing `AUTH_USER_ID_HERE`:

```sql
-- Admin
INSERT INTO public."Profile" (id, role, full_name, email, department, designation, employee_id, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'admin', 'Demo Admin', 'admin@demo', 'Administration', 'Principal', 'SAH-ADM-001', true, true, NOW(), NOW());

-- Faculty / Mentor
INSERT INTO public."Profile" (id, role, full_name, email, department, designation, employee_id, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'mentor', 'Demo Mentor', 'teacher@demo', 'Computer Science', 'Associate Professor', 'SAH-CS-042', true, true, NOW(), NOW());

-- Student
INSERT INTO public."Profile" (id, role, full_name, email, department, year, section, usn, is_profile_complete, is_active, created_at, updated_at)
VALUES ('AUTH_USER_ID_HERE', 'mentee', 'Demo Student', 'student@demo', 'Computer Science', 3, 'A', '4SH21CS001', true, true, NOW(), NOW());
```

---

## 5. Demo Credentials

Placeholder credentials are for documentation only — create your own accounts through **Admin → Users → Add User** (this creates the auth login and Profile row automatically):

| Role | Email | Password |
|------|-------|----------|
| 🛡️ **Administrator** | `admin@demo` | `admin001` |
| 👨‍🏫 **Faculty / Mentor** | `teacher@demo` | `teacher001` |
| 🎓 **Student** | `student@demo` | `student001` |

> The login screen enforces **role-matched sign-in** — selecting the *Student* tab only accepts a student account, and vice versa.

---

## 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start the production server |
| `npx tsc --noEmit` | Type-check the whole project |

---

## 7. Deploy to Vercel

### Option A: Vercel CLI

```bash
cd frontend
npx vercel --prod
```

### Option B: GitHub + Vercel (auto-deploy)

1. Push the repository to GitHub.
2. In Vercel → **New Project** → import the repo.
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js |
| **Build Command** | `prisma generate && next build` |
| **Install Command** | `npm install` |

4. Add all environment variables from [Section 1](#1-environment-variables) in **Settings → Environment Variables**.
5. Deploy. Every push to `main` triggers a new build.

---

## 8. Verify the Deployment

1. Open `https://your-app.vercel.app/login` — the login page should load.
2. Sign in with the admin credentials.
3. You should be redirected to `/admin/dashboard`.
4. Quick smoke test: create a user in **Admin → Users**, add a course in **Admin → Courses**, and confirm a student can see it under **Student → Courses**.

---

## 🛠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| `404` on a route after deploy | Ensure **Root Directory** is `frontend` and the build command is `prisma generate && next build`; redeploy |
| Attendance upload fails | Confirm the `course-materials` bucket exists (run `database/setup-rls-and-seed.sql`) and `GEMINI_API_KEY` is set |
| `models/gemini-... is not found` | Update the model name in the code to a currently supported Gemini model (see Google AI docs) |
| Login fails after creating a user | Make sure a matching `Profile` row exists for the auth user (Methods A or B above) |
| Admin "Add User" returns 401 | `SUPABASE_SERVICE_ROLE_KEY` must be set on the server (Vercel env vars) |
