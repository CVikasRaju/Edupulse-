# 🎓 EduPulse - AI-Powered Academic Management System

EduPulse is a state-of-the-art Academic and Mentorship management platform designed to streamline student-faculty interactions and automate administrative workflows using Artificial Intelligence.

---

## 🚀 Key Features

### 🤖 AI Attendance Pipeline (Gemini 1.5 Powered)
*   **Intelligent Ingestion**: Upload any Excel/CSV attendance sheet. Our AI agent automatically detects USNs, names, and date columns.
*   **Heuristic Fallback**: Robust pattern-matching engine handles irregular spreadsheet formats (headers on any row, custom markers like ✅/❌, or complex date formats).
*   **Manual Correction Wizard**: High-fidelity UI for admins/mentors to resolve unknown USNs or missing dates before they hit the database.
*   **Duplicate Detection**: Automatic conflict resolution to prevent double-marking.

### 👥 Mentorship & Tracking
*   **Interaction Logs**: Detailed tracking of mentor-mentee meetings with follow-up reminders.
*   **Achievement Gallery**: Student achievement submission with administrative verification workflows and NBA point scoring.
*   **Role-Based Access**: Specialized dashboards for Admins, Mentors, and Students.

### 📊 Academic Analytics
*   **Grade Management**: Performance tracking across semesters.
*   **Attendance Reports**: Real-time visibility into student presence and eligibility.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
*   **Backend/Database**: Supabase (PostgreSQL), Prisma ORM.
*   **AI Engine**: Google Gemini 1.5 Flash (via Generative AI SDK).
*   **Storage**: Supabase Storage for achievement documents.
*   **Auth**: Supabase Auth with custom Profile triggers.

---

## 📦 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   Supabase Account
*   Google AI Studio API Key (for Gemini)

### 2. Environment Setup
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgresql_url
GEMINI_API_KEY=your_google_ai_key
```

### 3. Installation
```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
```

---

## 🛡️ Security & Integrity
*   **RLS Policies**: Row-Level Security ensures students can only see their own data while mentors manage their specific mentees.
*   **Sanitized Uploads**: Industry-standard `.gitignore` and security auditing to ensure no secrets or debug logs reach production.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
