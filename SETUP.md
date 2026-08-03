# 🚀 EduPulse Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for deployment)

---

## 1. Environment Variables

### Local Development

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL="postgresql://postgres.your-project:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
GEMINI_API_KEY=your-google-gemini-key
```

### Vercel Deployment

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (keep secret!) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string → URI (port 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string → URI (port 5432) |
| `GEMINI_API_KEY` | Google AI Studio → API Keys |

> ⚠️ **Critical**: Set all variables for **Production**, **Preview**, AND **Development** environments.

### Vercel Project Settings

**Root Directory**: `frontend`

> This is the #1 cause of 404 errors on Vercel! Your Next.js app lives in the `frontend/` folder, so Vercel must know to build from there.

How to set it:
1. Go to Vercel → Your Project → **Settings**
2. Scroll to **General** → **Root Directory**
3. Set it to: `frontend`
4. Click **Save**

---

## 2. Database Setup

### Step 1: Run Prisma Migration

```bash
cd frontend
npx prisma migrate dev --name initial-setup
```

Or for production:
```bash
npx prisma migrate deploy
```

### Step 2: Set Up RLS Policies

Run the SQL in `database/setup-rls-and-seed.sql` in Supabase SQL Editor:

1. Go to Supabase Dashboard → **SQL Editor**
2. Create New Query
3. Paste the contents of `database/setup-rls-and-seed.sql`
4. Click **Run**

### Step 3: Seed Data (Optional)

Run the seed SQL in Supabase SQL Editor:
1. Paste contents of `backend/database/seed.sql`
2. Click **Run**

---

## 3. Creating Users

### Method A: Automated Script (Recommended)

```bash
cd frontend
node create-auth-users.js
```

This creates 3 users:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@sahyadri.edu.in` | `REDACTED` |
| **Teacher/Mentor** | `teacher@sahyadri.edu.in` | `REDACTED` |
| **Student** | `student@sahyadri.edu.in` | `REDACTED` |

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

### Method C: Link Existing Profiles

If Profile rows already exist (from seed data), link them to auth users:

```sql
-- First create auth users via dashboard or script, then:
UPDATE public."Profile" SET id = 'AUTH_USER_ID' WHERE email = 'admin@sahyadri.edu.in';
UPDATE public."Profile" SET id = 'AUTH_USER_ID' WHERE email = 'teacher@sahyadri.edu.in';
UPDATE public."Profile" SET id = 'AUTH_USER_ID' WHERE email = 'student@sahyadri.edu.in';
```

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
- ✅ Build command is `prisma generate && next build` (default from package.json)

---

## 5. Verify Deployment

After deployment, check:
1. `https://edupulse-gray.vercel.app/login` — Login page loads
2. Login with `admin@sahyadri.edu.in` / `REDACTED`
3. You should be redirected to `/admin/dashboard`

---

## Troubleshooting

### 404 on All Pages
- **Root Directory**: Ensure Vercel project root is set to `frontend`
- **Build Logs**: Check Vercel → Deployments → Latest → Build Logs for errors

### "Profile not found" Error
- The auth user ID doesn't match any Profile row
- Run the Profile INSERT SQL from the user creation step

### Login Redirects Back to Login
- RLS policies may be blocking Profile reads
- Run `database/setup-rls-and-seed.sql` in Supabase SQL Editor

### Build Fails on Vercel
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set (needed for `prisma generate`)
- Ensure `DATABASE_URL` and `DIRECT_URL` are set

---

## Project Structure

```
edupulse/
├── frontend/              ← Vercel Root Directory
│   ├── prisma/           ← Database schema
│   ├── src/
│   │   ├── app/          ← Pages (Next.js App Router)
│   │   │   ├── admin/    ← Admin dashboard & features
│   │   │   ├── mentor/   ← Mentor dashboard & features
│   │   │   ├── student/  ← Student dashboard & features
│   │   │   └── login/    ← Login page
│   │   ├── components/   ← Reusable UI components
│   │   ├── lib/          ← Server actions, alerts engine
│   │   └── hooks/        ← Custom React hooks
│   ├── create-auth-users.js  ← Run this to create users!
│   └── vercel.json       ← Deployment config
├── backend/
│   └── database/         ← SQL schemas & seeds
└── database/
    └── setup-rls-and-seed.sql  ← Run this in Supabase!
```
