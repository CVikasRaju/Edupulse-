<div align="center">

# 🎓 EduPulse

### AI-Powered Academic Excellence Platform

**A unified proactive platform that centralizes student performance, automates mentorship scheduling, and flags at-risk students through intelligent threshold-based alerts.**

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

**Live Demo** · **[Documentation](#-getting-started)** · **[Report Bug](https://github.com/your-username/edupulse/issues)**

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [📊 Database Schema](#-database-schema)
- [🎯 Feature Deep Dive](#-feature-deep-dive)
- [📱 Screenshots](#-screenshots)
- [🔧 API Routes](#-api-routes)
- [📈 Performance](#-performance)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## ✨ Features

### 🎯 Three Pillars of EduPulse

<table>
<tr>
<td width="33%" align="center">

#### 📊 Unified Performance Dashboard
Centralized faculty-facing view showing all mentees' academic trajectories at a glance

</td>
<td width="33%" align="center">

#### 📅 Automated Scheduling
Mentors set availability → Students book sessions → No more logistic friction

</td>
<td width="33%" align="center">

#### 🚨 Threshold-Based Alerts
Auto-detect dropping attendance, consecutive low grades, and engagement gaps

</td>
</tr>
</table>

### 👥 Role-Based Experiences

| Role | Capabilities |
|------|-------------|
| **🎓 Student** | CGPA tracking, attendance monitoring, achievement logging, session booking, mentorship history |
| **👨‍🏫 Faculty / Mentor** | Performance matrix, availability management, session scheduling, achievement verification, risk scanning |
| **🛡️ Administrator** | 全校 analytics, alert rule configuration, department breakdown, mentor activity monitoring, audit logs |

### 🤖 AI-Powered Features

- **智能 Attendance Upload** — Upload any spreadsheet format → Gemini AI maps columns, detects dates, imports in seconds
- **Threshold Alert Engine** — Configurable rules for attendance drops, grade declines, and engagement gaps
- **Risk Detection** — Automatic at-risk student flagging with severity levels (Info → Warning → Critical)

### 📈 Analytics & Reporting

- Real-time CGPA trends with semester-wise progression charts
- Subject-wise attendance summaries with visual bars
- Department-level performance breakdown
- NBA accreditation points tracking
- Mentor activity and engagement metrics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EDUPULSE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   STUDENT    │    │    MENTOR    │    │    ADMIN     │      │
│  │   Dashboard  │    │   Dashboard  │    │   Dashboard  │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│  ┌──────▼───────────────────▼───────────────────▼───────┐      │
│  │                  NEXT.JS APP ROUTER                   │      │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │      │
│  │  │ Client  │ │   API    │ │  Server  │ │Middleware│  │      │
│  │  │Components│ │  Routes  │ │ Actions  │ │  Auth   │  │      │
│  │  └─────────┘ └──────────┘ └──────────┘ └─────────┘  │      │
│  └───────────────────────┬───────────────────────────────┘      │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────┐      │
│  │                    SERVICES LAYER                      │      │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │      │
│  │  │   Alert    │ │ Scheduling │ │   Attendance AI    │ │      │
│  │  │   Engine   │ │   Engine   │ │   (Gemini)        │ │      │
│  │  └────────────┘ └────────────┘ └────────────────────┘ │      │
│  └───────────────────────┬───────────────────────────────┘      │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────┐      │
│  │                    DATA LAYER                          │      │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │      │
│  │  │   Prisma   │ │  Supabase  │ │   PostgreSQL       │ │      │
│  │  │   ORM      │ │   Auth     │ │   Database         │ │      │
│  │  └────────────┘ └────────────┘ └────────────────────┘ │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | App framework & UI |
| **Styling** | Tailwind CSS 3.4 | Design system & components |
| **Icons** | Lucide React | Consistent iconography |
| **Charts** | Recharts | Data visualization |
| **Animations** | Framer Motion | Smooth transitions |
| **Backend** | Next.js API Routes, Server Actions | API & data fetching |
| **Database** | PostgreSQL (Supabase) | Persistent storage |
| **ORM** | Prisma 5 | Type-safe database access |
| **Auth** | Supabase Auth | User authentication |
| **AI** | Google Gemini | Attendance sheet parsing |
| **Spreadsheet** | xlsx (SheetJS) | Excel/CSV processing |
| **Hosting** | Vercel | Deployment & serverless |

---

## 📁 Project Structure

```
edupulse/
├── frontend/                          # Next.js application
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema (19 models)
│   │   └── prisma.config.ts           # Prisma configuration
│   ├── src/
│   │   ├── app/
│   │   │   ├── (root)/
│   │   │   │   ├── layout.tsx         # Root layout with fonts
│   │   │   │   ├── page.tsx           # Landing page
│   │   │   │   └── login/             # Authentication
│   │   │   ├── student/               # Student portal
│   │   │   │   ├── dashboard/         # Student dashboard
│   │   │   │   ├── academics/         # Grades & attendance
│   │   │   │   ├── courses/           # Course materials
│   │   │   │   ├── achievements/      # Achievement tracking
│   │   │   │   ├── mentorship/        # Mentor interactions
│   │   │   │   ├── schedule/          # 🆕 Session booking
│   │   │   │   ├── feed/              # Campus announcements
│   │   │   │   ├── calendar/          # Academic calendar
│   │   │   │   └── settings/          # Profile settings
│   │   │   ├── mentor/                # Faculty portal
│   │   │   │   ├── dashboard/         # Mentor overview
│   │   │   │   ├── performance/       # 🆕 Performance matrix
│   │   │   │   ├── mentees/           # Mentee management
│   │   │   │   ├── schedule/          # 🆕 Availability mgmt
│   │   │   │   ├── courses/           # Course management
│   │   │   │   ├── attendance/        # Attendance upload
│   │   │   │   ├── achievements/      # Achievement verification
│   │   │   │   └── reports/           # Analytics & reports
│   │   │   ├── admin/                 # Admin portal
│   │   │   │   ├── dashboard/         # System overview
│   │   │   │   ├── performance/       # 🆕 全校 analytics
│   │   │   │   ├── alerts/            # 🆕 Alert rule mgmt
│   │   │   │   ├── users/             # User management
│   │   │   │   ├── allocations/       # Mentor-mentee pairing
│   │   │   │   ├── courses/           # Course administration
│   │   │   │   ├── achievements/      # Achievement approvals
│   │   │   │   ├── feed/              # Announcement mgmt
│   │   │   │   ├── reports/           # Platform reports
│   │   │   │   ├── audit/             # Audit trail
│   │   │   │   └── settings/          # System settings
│   │   │   └── api/
│   │   │       ├── alerts/            # 🆕 Alert evaluation
│   │   │       └── scheduling/        # 🆕 Session & availability
│   │   ├── components/
│   │   │   ├── AppShell.tsx           # Layout shell
│   │   │   └── attendance/            # AI attendance wizard
│   │   ├── lib/
│   │   │   ├── prisma.ts              # Prisma client
│   │   │   ├── actions.ts             # Server actions
│   │   │   ├── alerts.ts              # 🆕 Alert engine
│   │   │   ├── types.ts               # TypeScript types
│   │   │   ├── export.ts              # Data export utils
│   │   │   └── supabase/              # Supabase client/server
│   │   ├── hooks/
│   │   │   └── useUser.ts             # User hook
│   │   ├── utils/
│   │   │   └── supabase/              # Supabase utilities
│   │   └── middleware.ts              # Auth middleware
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/
│   └── database/
│       ├── schema.sql                 # SQL schema
│       └── seed.sql                   # Seed data
└── docs/
    └── Data Engineering and AI - Actual Program.xlsx
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20)
- **pnpm** or **npm** or **yarn**
- **Supabase** account (free tier works)
- **Google Gemini** API key (for AI attendance)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/edupulse.git
cd edupulse/frontend
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3️⃣ Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in your environment variables (see [Environment Variables](#-environment-variables)).

### 4️⃣ Set Up the Database

#### Option A: Supabase SQL Editor (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Paste the contents of `backend/database/schema.sql`
4. Click **Run**

#### Option B: Prisma Migrate

```bash
npx prisma migrate dev --name init
npx prisma db push
```

### 5️⃣ Seed Demo Data (Optional)

```bash
node create-auth-users.js
```

### 6️⃣ Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# ══════════════════════════════════════════
# DATABASE
# ══════════════════════════════════════════
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# ══════════════════════════════════════════
# SUPABASE
# ══════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# ══════════════════════════════════════════
# AI (Google Gemini)
# ══════════════════════════════════════════
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 📊 Database Schema

EduPulse uses **19 interconnected data models**:

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE MODELS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ Profile  │────▶│  Allocation  │◀────│   Profile    │   │
│  │ (User)   │     │ (Mentor-Mentee)│   │  (Mentee)    │   │
│  └────┬─────┘     └──────────────┘     └──────────────┘   │
│       │                                                     │
│       ├────▶ Interaction (Sessions & Logs)                  │
│       ├────▶ Grade (Academic Performance)                   │
│       ├────▶ AttendanceRecord (Daily Tracking)              │
│       ├────▶ Achievement (NBA Points)                       │
│       ├────▶ GraceRequest (Leave Management)                │
│       ├────▶ Notification (Alerts & Updates)                │
│       ├────▶ AuditLogEntry (Activity Tracking)              │
│       │                                                     │
│       └── NEW MODELS ──┐                                    │
│                        ▼                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  AlertRule   │  │    Alert     │  │ MentorAvailability│  │
│  │ (Thresholds) │─▶│ (Generated)  │  │ (Weekly Slots)    │  │
│  └──────────────┘  └──────────────┘  └────────┬─────────┘  │
│                                               │             │
│                                        ┌──────▼──────────┐  │
│                                        │  MentorSession  │  │
│                                        │ (Booked Meetings)│  │
│                                        └─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Deep Dive

### 🚨 Threshold-Based Alert System

The alert engine continuously monitors student metrics and generates proactive alerts:

| Rule Type | Metric | Default Threshold | Severity |
|-----------|--------|-------------------|----------|
| Attendance Drop | `attendance_pct` | < 75% | ⚠️ Warning |
| Critical Attendance | `attendance_pct` | < 60% | 🔴 Critical |
| Low CGPA | `cgpa` | < 5.5 | ⚠️ Warning |
| Critical CGPA | `cgpa` | < 4.0 | 🔴 Critical |
| Consecutive Low SGPA | `consecutive_low_sgpa` | ≥ 2 semesters | 🔴 Critical |
| No Mentor Contact | `days_since_interaction` | > 30 days | ⚠️ Warning |
| Long Engagement Gap | `days_since_interaction` | > 60 days | 🔴 Critical |
| Attendance Dropping | `attendance_drop` | ≥ 15 percentage points | ⚠️ Warning |

### 📅 Scheduling System

```mermaid
graph LR
    A[Mentor Sets Availability] --> B[Student Views Slots]
    B --> C[Student Books Session]
    C --> D[Conflict Detection]
    D --> E[Notifications Sent]
    E --> F[Session Completed]
    F --> G[Interaction Logged]
```

- **Availability Management**: Mentors define recurring weekly time windows
- **Smart Booking**: Students pick from available slots with date selection
- **Conflict Detection**: Prevents double-booking automatically
- **Session Lifecycle**: Scheduled → Completed/Cancelled/No-Show

### 📊 Performance Matrix

The mentor performance dashboard computes per-mentee:

- **CGPA** with semester-wise trend visualization
- **Attendance %** with monthly trend analysis
- **Risk Level**: Low → Medium → High → Critical
- **Risk Factors**: Specific reasons for each risk classification
- **Engagement Score**: Days since last interaction
- **NBA Points**: Verified achievement score

---

## 📱 Screenshots

> *Screenshots will be added after deployment. The UI features:*

- 🌙 Dark theme with warm slate aesthetic
- 📐 Responsive bento grid layouts
- 📈 Interactive semester GPA bar charts
- 🎨 Color-coded risk indicators (green → red)
- ✨ Smooth transitions and hover states

---

## 🔧 API Routes

### Alert System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/alerts/evaluate` | Trigger risk evaluation for all students |
| `GET` | `/api/alerts/evaluate` | Fetch alert rules and active alerts |

### Scheduling
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scheduling/availability` | Get mentor availability slots |
| `POST` | `/api/scheduling/availability` | Create availability slot |
| `DELETE` | `/api/scheduling/availability?id=` | Remove availability slot |
| `GET` | `/api/scheduling/sessions` | Get sessions (filtered by role) |
| `POST` | `/api/scheduling/sessions` | Book a new session |
| `PATCH` | `/api/scheduling/sessions` | Update session status |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/attendance/upload` | AI-powered attendance import |

---

## 📈 Performance

- **Parallel Data Fetching**: All dashboard data loads in parallel via `Promise.all`
- **Server-Side Rendering**: Next.js App Router for optimal initial load
- **Optimistic UI**: Client-side state updates for instant feedback
- **Debounced Search**: Efficient filtering without excessive re-renders
- **Lazy Loading**: Charts and modals load on demand

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Use TypeScript for all new files
- Add meaningful commit messages
- Test your changes with `npm run lint` and `npm run build`
- Update documentation if needed

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for **Sahyadri College of Engineering & Management**, Mangalore
- Powered by **Google Gemini AI** for intelligent attendance processing
- UI inspired by modern dashboard design principles
- Icons by **Lucide**

---

<div align="center">

**Built with ❤️ for Academic Excellence**

⭐ Star this repo if you find it useful!

</div>
