<div align="center">

# 🎓 EduPulse

### The AI-Powered Academic Excellence Platform

**A unified proactive college portal that centralizes student performance, automates 1-on-1 mentorship scheduling, flags at-risk students with threshold-based alerts, and connects students, faculty, and administrators — all in one place.**

![Next.js 14](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

**[Live Demo](https://edupulse-gray.vercel.app)** · **[Getting Started](#-getting-started)** · **[Report a Bug](https://github.com/CVikasRaju/Edupulse-/issues)**

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [👥 Roles & Access](#-roles--access)
- [🤖 AI-Powered Features](#-ai-powered-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [👤 Demo Credentials](#-demo-credentials)
- [🗄️ Database Schema](#️-database-schema)
- [🔧 API Routes](#-api-routes)
- [📈 Performance & UX](#-performance--ux)
- [🔒 Security](#-security)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## ✨ Features

### 🎯 Three Pillars

<table>
<tr>
<td width="33%" align="center">

#### 📊 Unified Performance Dashboards
CGPA trends, subject-wise attendance, risk levels and engagement — every metric a student, teacher, or administrator needs, in one place.

</td>
<td width="33%" align="center">

#### 📅 Automated Mentorship Scheduling
Mentors publish weekly availability → students self-book 1-on-1 slots → conflict-free sessions with notifications at every step.

</td>
<td width="33%" align="center">

#### 🚨 Threshold-Based Alert Engine
Dropping attendance, consecutive low grades, engagement gaps — automatically detected and escalated as Warning → Critical alerts.

</td>
</tr>
</table>

### 🎓 A Full College Portal, Not Just a Dashboard

| Area | What EduPulse gives you |
|------|------------------------|
| **Courses & Notes** | Faculty create courses and upload notes; **students automatically see every course taught to their class** (by department & year), with notes from the exact teacher who teaches them |
| **Events Management** | Faculty & administrators create/edit/delete campus events (workshops, hackathons, seminars, exams); students discover, register, and cancel in one click with live seat capacity |
| **AI Resume Analyzer** | Students upload their resume + target role → Gemini scores it out of 100, highlights strengths, and lists the exact skills to improve |
| **Achievements & Points** | Students log achievements → faculty verify/reject → verified points tracked (administrator-configurable NBA scoring) |
| **User Management** | Administrators can **add, edit, or delete any student/faculty/admin account** — real auth logins included — with instant activate/deactivate |
| **Password Management** | Every role can securely change their own password from Settings |
| **Campus Feed & Calendar** | Announcements targeted by department/year, plus a shared academic calendar |
| **Reports & Audit** | Platform-wide analytics, department & class-wise performance, and a full audit trail of system activity |
| **Theme System** | Dark aurora, light glass, or "follow system" — synced across devices to each user's profile |

---

## 👥 Roles & Access

| Role | Capabilities |
|------|-------------|
| **🎓 Student** | Dashboard (CGPA, attendance, health status), academics, courses + faculty notes, achievements, events registration, mentorship scheduling, resume analyzer, campus feed, calendar, profile & password settings |
| **👨‍🏫 Faculty / Mentor** | Dashboard, **performance tracking of every student they teach + their mentees**, mentee management with interaction logs, course & notes management, AI attendance upload, achievement verification, events management, scheduling & availability, reports, settings |
| **🛡️ Administrator** | Platform dashboard, **full user management (add/edit/delete)**, courses, mentor–mentee allocations, AI attendance upload, achievements oversight, events, feed, **department & class-wise performance analytics**, alert rule configuration, reports, audit log, settings |

---

## 🤖 AI-Powered Features

### 📄 AI Resume Analyzer
1. Student uploads a resume (PDF/DOCX) and enters the role they're applying for.
2. **Gemini AI** extracts and evaluates the resume against the target role.
3. Output: a **score out of 100**, strengths, role-fit verdict, and a prioritized list of missing skills with suggestions.

### 📊 AI Attendance Upload
Upload a messy real-world spreadsheet (.xlsx / .csv) from past months:

- **Gemini AI detects the column mapping** — handles pivoted layouts where dates are column headers, Google Sheets `TRUE/FALSE` checkboxes, `DD/M/YY` date formats, and metadata columns (SL No, email, n8n links) that should be ignored.
- A **review step** lets you confirm or override the mapping before anything is written.
- Records are **batch-upserted** with duplicate detection and per-row diagnostics for unmatched students.

### 🚨 Alert Engine
Rules are evaluated on demand ("Run Risk Scan") and continuously flag at-risk students:

| Rule Type | Metric | Default Threshold | Severity |
|-----------|--------|-------------------|----------|
| Low Attendance | `attendance_pct` | < 75% | ⚠️ Warning |
| Critical Attendance | `attendance_pct` | < 60% | 🔴 Critical |
| Low CGPA | `cgpa` | < 5.5 | ⚠️ Warning |
| Critical CGPA | `cgpa` | < 4.0 | 🔴 Critical |
| Consecutive Low SGPA | `consecutive_low_sgpa` | ≥ 2 semesters | 🔴 Critical |
| No Mentor Contact | `days_since_interaction` | > 30 days | ⚠️ Warning |
| Long Engagement Gap | `days_since_interaction` | > 60 days | 🔴 Critical |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | Framework & UI |
| **Styling** | Tailwind CSS 3.4 + custom design tokens | "Warm Slate" design system (dark aurora / light glass) |
| **Animations** | Framer Motion | Page transitions, reveals, micro-interactions |
| **Icons** | Lucide React | Iconography |
| **Data** | Recharts | Charts & trends |
| **Backend** | Next.js API Routes (Route Handlers) | Server-side logic |
| **Database** | PostgreSQL (Supabase) | Persistent storage |
| **Schema tooling** | Prisma 5 (`schema.prisma` is the source of truth) | Type-safe schema definition |
| **Data access** | Supabase JS (`@supabase/supabase-js`) | All runtime queries |
| **Auth** | Supabase Auth (email/password) | Authentication & sessions |
| **Storage** | Supabase Storage (`course-materials` bucket) | Faculty notes/files |
| **AI** | Google Gemini (`@google/generative-ai`) | Attendance mapping & resume analysis |
| **Spreadsheets** | xlsx (SheetJS) | Excel/CSV parsing |
| **Docs parsing** | mammoth | DOCX → text for resume analysis |
| **Hosting** | Vercel | Deployment |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         EDUPULSE — REQUEST FLOW                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│   │ STUDENT  │   │  MENTOR  │   │  ADMIN   │                       │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘                       │
│        └───────┬──────┴──────┬───────┘                             │
│                ▼             ▼                                     │
│   ┌─────────────────────────────────────────────┐                  │
│   │           NEXT.JS 14 APP ROUTER              │                  │
│   │  middleware.ts (auth guard + role redirect)  │                  │
│   │  ┌──────────────┐  ┌──────────────────────┐  │                  │
│   │  │ Client pages  │  │ API Route Handlers   │  │                  │
│   │  │ (use client)  │  │ (server-side)        │  │                  │
│   │  └──────┬───────┘  └──────────┬───────────┘  │                  │
│   └─────────┼─────────────────────┼───────────────┘                  │
│             ▼                     ▼                                 │
│   ┌─────────────────────────────────────────────────────┐           │
│   │              SUPABASE (single backend)               │           │
│   │  ┌───────────┐  ┌───────────┐  ┌──────────────────┐  │           │
│   │  │  Auth     │  │ Postgres  │  │  Storage         │  │           │
│   │  │ (JWT/RLS) │  │  (22+     │  │  (course notes)  │  │           │
│   │  │           │  │  tables)  │  │                  │  │           │
│   │  └───────────┘  └───────────┘  └──────────────────┘  │           │
│   └─────────────────────────┬───────────────────────────┘           │
│                             ▼                                      │
│   ┌──────────────────────────────────────────────────┐              │
│   │          GOOGLE GEMINI (AI services)             │              │
│   │  Attendance column mapping · Resume analysis     │              │
│   └──────────────────────────────────────────────────┘              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

> **Data access model:** All runtime data flows through the **Supabase JS client** (browser + server + middleware clients). **Prisma is used for schema definition and generation only** — the live database is managed via the Supabase SQL Editor / dashboard.

---

## 📁 Project Structure

```
edupulse/
├── frontend/                        # Next.js application (root of the app)
│   ├── prisma/
│   │   └── schema.prisma            # Database schema — source of truth (22 models)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Premium landing page
│   │   │   ├── layout.tsx           # Root layout (fonts, providers)
│   │   │   ├── login/               # Role-aware authentication
│   │   │   ├── auth/callback/       # Supabase auth callback
│   │   │   ├── student/             # Student portal
│   │   │   │   ├── dashboard/ academics/ courses/ achievements/
│   │   │   │   ├── mentorship/ schedule/ events/ resume/ feed/ calendar/ settings/
│   │   │   ├── mentor/              # Faculty portal
│   │   │   │   ├── dashboard/ performance/ mentees/ courses/ attendance/
│   │   │   │   ├── schedule/ events/ achievements/ reports/ settings/
│   │   │   ├── admin/               # Admin portal
│   │   │   │   ├── dashboard/ performance/ users/ courses/ allocations/
│   │   │   │   ├── events/ feed/ achievements/ audit/ alerts/ reports/ settings/
│   │   │   └── api/                 # Route Handlers (see API Routes section)
│   │   ├── components/              # AppShell, attendance wizard, events, settings, ui/
│   │   ├── hooks/                   # useUser
│   │   ├── lib/                     # supabase clients, types, events helpers, id gen
│   │   ├── utils/supabase/          # client / server / middleware clients
│   │   └── middleware.ts            # Auth + role-based route protection
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/
│   └── database/
│       ├── schema.sql               # Full SQL schema (for the SQL Editor)
│       └── seed.sql                 # Demo seed data
├── database/
│   └── setup-rls-and-seed.sql       # RLS policies + storage bucket + seed rules
└── docs/                            # Program documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20)
- **npm** (or pnpm / yarn)
- A **Supabase** project (free tier is enough)
- A **Google Gemini API key** (for AI attendance upload & resume analyzer)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/CVikasRaju/Edupulse-.git
cd Edupulse/frontend
npm install
```

### 2️⃣ Configure Environment Variables

Create `frontend/.env.local` and fill in your values (see the [Environment Variables](#-environment-variables) table):

```bash
# Copy the block from the section below, paste it into .env.local,
# and replace every value with your own project's credentials.
```

### 3️⃣ Create the Database

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → New query.
2. Run **`backend/database/schema.sql`** to create all tables.
3. Run **`database/setup-rls-and-seed.sql`** to enable RLS policies, create the `course-materials` storage bucket, and seed the alert rules.

> All tables use `TEXT` UUID primary keys with `gen_random_uuid()` defaults, so inserts work from the app without manual IDs.

### 4️⃣ Create User Accounts

Two options:

- **Recommended — through the app:** log in as an administrator and use **Admin → Users → Add User** (creates the real Supabase auth login automatically).
- **Via Supabase dashboard:** Authentication → Users → Add user, then insert the matching `Profile` row (the admin panel does this for you, so the first option is easier).

### 5️⃣ Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 6️⃣ Build for Production

```bash
npm run build   # runs prisma generate, then next build
npm start
```

---

## 🔑 Environment Variables

All variables live in **`frontend/.env.local`** (gitignored — never commit it).

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Service-role key — used by the admin user-management API. **Never expose this to the client.** |
| `DATABASE_URL` | Server-only | Postgres connection string (used by Prisma tooling only) |
| `DIRECT_URL` | Server-only | Direct (session-mode) Postgres connection string |
| `GEMINI_API_KEY` | Server-only | Google Gemini API key (attendance AI + resume analyzer) |

```env
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres.YOUR-PROJECT:YOUR-DB-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR-PROJECT:YOUR-DB-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
GEMINI_API_KEY="your-gemini-api-key"
```

> ⚠️ **Service-role key warning:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is only read server-side inside `/api/admin/users`. Rotate it immediately if it is ever committed to a public repository.

---

## 👤 Demo Credentials

> Placeholder credentials shown below are for documentation only — create your own accounts with **Admin → Users → Add User** (this creates the real Supabase auth login and profile in one step).

| Role | Email | Password |
|------|-------|----------|
| 🛡️ **Administrator** | `admin@demo` | `admin001` |
| 👨‍🏫 **Faculty / Mentor** | `teacher@demo` | `teacher001` |
| 🎓 **Student** | `student@demo` | `student001` |

The login screen enforces **role-matched sign-in** — selecting the *Student* tab only accepts a student account, and vice versa — so a wrong-tab attempt is rejected as invalid credentials.

---

## 🗄️ Database Schema

EduPulse models a complete campus ecosystem across **22 tables** (defined in `frontend/prisma/schema.prisma`):

```
Profile ──┬── Allocation (mentor ⟷ mentee)
          ├── Interaction (mentorship logs)
          ├── Grade / AttendanceRecord / GraceRequest
          ├── Achievement / FacultyAchievement
          ├── Course ── CourseEnrollment ── CourseMaterial / Assignment ── Submission
          ├── Notification / FeedPost / AuditLogEntry
          ├── CalendarEvent ── EventRegistration
          ├── AlertRule ── Alert            (threshold engine)
          ├── MentorAvailability ── MentorSession  (scheduling)
          └── NbaScoringConfig
```

### Key tables

| Table | Purpose |
|-------|---------|
| `Profile` | Every user — role (`admin` / `mentor` / `mentee`), department, year, section, USN, employee ID, designation, theme preference |
| `Course` + `CourseEnrollment` | Courses taught by faculty; students see **every course taught to their class** (department + semester) plus explicit enrollments |
| `CalendarEvent` + `EventRegistration` | Campus events with capacity, registrations and creator tracking |
| `AlertRule` + `Alert` | Configurable risk thresholds and generated alerts |
| `MentorAvailability` + `MentorSession` | Weekly slots and booked 1-on-1 sessions |
| `AuditLogEntry` | Full activity trail for administrators |

---

## 🔧 API Routes

### AI & Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/attendance/upload` | AI-powered attendance spreadsheet import |
| `POST` | `/api/resume/analyze` | Gemini resume analysis (score + skill gaps) |

### Courses & Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/course-materials` | Notes for the caller (mentor: taught courses · student: enrolled + class courses) |
| `POST` | `/api/course-materials` | Upload a note (faculty only, course ownership verified) |
| `DELETE` | `/api/course-materials?id=` | Delete a note (owner only) |

### Mentorship Scheduling
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` / `POST` / `DELETE` | `/api/scheduling/availability` | Mentor weekly availability |
| `GET` / `POST` / `PATCH` | `/api/scheduling/sessions` | Book, list and update sessions |
| `POST` | `/api/session-requests` | Request a session |
| `POST` | `/api/interactions` | Log a mentor–mentee interaction |

### Alerts & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` / `POST` | `/api/alerts/evaluate` | Run the risk scan / read rules & alerts |
| `POST` | `/api/admin/users` | Create a user (auth login + profile) — admin only |
| `PATCH` | `/api/admin/users` | Update a user (role, email, password reset…) — admin only |
| `DELETE` | `/api/admin/users?id=` | Delete a user with related-record cleanup — admin only |

---

## 📈 Performance & UX

- **Parallel data fetching** — dashboards load every query in parallel with `Promise.all`.
- **Animated by default** — staggered `Reveal` on-scroll entrances, `TiltCard` hover cards, `AnimatedCounter` stats, crossfading route transitions, and `HoverCard` previews for student/mentee names.
- **Responsive** — desktop sidebar, collapsible nav, and a mobile bottom nav.
- **Dual themes** — dark aurora / light glass / follow-system, synced to the user's profile across devices.
- **Empty states & toasts** — every list has a thoughtful empty state; every action gives feedback.

---

## 🔒 Security

- **Row Level Security** is enabled on all tables with service-role full access (server-only) and per-table policies for authenticated users (`database/setup-rls-and-seed.sql`).
- **Server-only secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) never reach the client — the admin user API and AI routes run server-side.
- **Sensitive files are gitignored** — `.env*`, `push-env.ps1`, auth-creation scripts, and the raw student spreadsheet are excluded from the repository.
- **Role enforcement** at both the UI (login tab matching) and middleware (route guards) layers.
- **Admin-only mutations** — creating/deleting auth users is restricted to `role = 'admin'` and verified server-side.

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository.
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`.
3. **Commit** your changes with a clear message.
4. **Push** and **open a Pull Request**.

**Guidelines**
- Follow existing conventions and the component patterns (`Reveal`, `card`, `btn-*`, `badge-*`).
- TypeScript everywhere — run `npx tsc --noEmit` and `npm run build` before pushing.
- Never commit `.env*` files or real credentials.
- Update this README if you change setup steps or add routes.

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for the **Sahyadri College of Engineering & Management**, Mangalore.
- Powered by **Google Gemini AI** for intelligent attendance processing and resume analysis.
- Backed by **Supabase** (Postgres + Auth + Storage + RLS).
- UI crafted with **Framer Motion**, **Lucide**, and the "Warm Slate" design system.

---

<div align="center">

**Built with ❤️ for Academic Excellence**

⭐ Star this repo if you find it useful!

</div>
