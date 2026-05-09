import Link from "next/link";
import {
  BookOpen,
  Users,
  Shield,
  Brain,
  BarChart3,
  Bell,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  Award,
  Calendar,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "EduPulse — AI-Powered Academic Excellence Platform",
  description:
    "EduPulse empowers students, mentors, and administrators with AI-driven attendance, grade tracking, mentorship, and achievement management.",
};

const features = [
  {
    icon: Brain,
    title: "AI Attendance Upload",
    desc: "Upload any spreadsheet format — our Gemini AI maps columns, detects dates, and imports attendance in seconds.",
    color: "accent",
  },
  {
    icon: BarChart3,
    title: "Academic Analytics",
    desc: "Real-time CGPA trends, subject-wise attendance summaries, and semester GPA progression at a glance.",
    color: "secondary",
  },
  {
    icon: Users,
    title: "Mentorship System",
    desc: "Structured mentor-mentee allocations with interaction logs, grace request workflows, and progress tracking.",
    color: "highlight",
  },
  {
    icon: Award,
    title: "Achievement Tracking",
    desc: "Log co-curricular and extra-curricular achievements with NBA points. Verified by faculty, visible to all.",
    color: "accent",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Instant alerts for grade updates, attendance warnings, approval statuses, and campus announcements.",
    color: "secondary",
  },
  {
    icon: Calendar,
    title: "Grace Request System",
    desc: "Students submit medical or duty leave grace requests online. Mentors review and approve with full audit trail.",
    color: "highlight",
  },
];

const roles = [
  {
    icon: BookOpen,
    label: "Student",
    desc: "Track your CGPA, attendance, achievements, and stay connected with your mentor.",
    href: "/login",
    colorClass: "text-accent",
    bgClass: "bg-accent-light border-accent/20 hover:shadow-glow",
  },
  {
    icon: Users,
    label: "Faculty / Mentor",
    desc: "Manage your mentees, upload attendance sheets, review grade data, and approve requests.",
    href: "/login",
    colorClass: "text-secondary",
    bgClass: "bg-secondary-light border-secondary/20 hover:shadow-[0_0_20px_rgba(124,158,135,0.2)]",
  },
  {
    icon: Shield,
    label: "Administrator",
    desc: "Full platform control — users, allocations, achievements, audit logs, and reports.",
    href: "/login",
    colorClass: "text-highlight",
    bgClass: "bg-highlight-light border-highlight/20 hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]",
  },
];

const stats = [
  { value: "99%", label: "Attendance Accuracy", icon: CheckCircle },
  { value: "3×", label: "Faster Uploads", icon: TrendingUp },
  { value: "∞", label: "Spreadsheet Formats", icon: Brain },
  { value: "24/7", label: "Always Available", icon: Bell },
];

const featureColorMap: Record<string, string> = {
  accent: "text-accent bg-accent-light border-accent/20",
  secondary: "text-secondary bg-secondary-light border-secondary/20",
  highlight: "text-highlight bg-highlight-light border-highlight/20",
};
const featureIconColorMap: Record<string, string> = {
  accent: "text-accent",
  secondary: "text-secondary",
  highlight: "text-highlight",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-text-primary font-body overflow-x-hidden">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <GraduationCap size={18} className="text-background" />
            </div>
            <span className="text-lg font-bold font-heading text-text-primary tracking-tight">
              EduPulse
            </span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all duration-200 shadow-glow"
          >
            Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-highlight/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent-light text-accent text-xs font-semibold mb-6 tracking-wide uppercase">
            <Brain size={12} />
            Powered by Google Gemini AI
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Academic Excellence,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-hover to-highlight">
              Reimagined
            </span>
          </h1>

          <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            EduPulse brings students, mentors, and administrators together on one
            intelligent platform — with AI-powered attendance, real-time analytics,
            and seamless mentorship workflows.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-button bg-accent text-background font-bold text-base hover:bg-accent-hover transition-all duration-200 shadow-glow hover:scale-[1.02]"
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-button border border-surface-border bg-surface/50 text-text-primary font-semibold text-base hover:border-accent/40 hover:bg-surface transition-all duration-200"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-card border border-surface-border bg-surface/60 backdrop-blur-sm text-center"
            >
              <stat.icon size={18} className="text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold font-heading text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Everything you need,{" "}
              <span className="text-accent">nothing you don&apos;t</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Built specifically for Indian engineering colleges, EduPulse handles
              the full academic lifecycle from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-card border border-surface-border bg-surface hover:border-accent/30 hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${featureColorMap[f.color]}`}>
                  <f.icon size={20} className={featureIconColorMap[f.color]} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                  {f.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-surface/30 border-y border-surface-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              One platform,{" "}
              <span className="text-accent">three roles</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Whether you&apos;re a student, mentor, or admin — EduPulse has a
              tailored experience built just for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Link
                key={role.label}
                href={role.href}
                className={`group p-8 rounded-card border hover:scale-[1.02] transition-all duration-300 flex flex-col ${role.bgClass}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-surface-border">
                  <role.icon size={26} className={role.colorClass} />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">{role.label}</h3>
                <p className="text-text-muted text-sm leading-relaxed flex-1">{role.desc}</p>
                <div className={`flex items-center gap-2 mt-6 text-sm font-semibold ${role.colorClass}`}>
                  Sign in as {role.label}{" "}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to transform your{" "}
            <span className="text-accent">academic journey?</span>
          </h2>
          <p className="text-text-muted mb-10">
            Join students and faculty already using EduPulse to streamline academics,
            mentorship, and institutional management.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-button bg-accent text-background font-bold text-base hover:bg-accent-hover transition-all duration-200 shadow-glow hover:scale-[1.03]"
          >
            Launch EduPulse <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border py-8 px-6 text-center text-text-muted text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <GraduationCap size={12} className="text-background" />
          </div>
          <span className="font-heading font-semibold text-text-primary">EduPulse</span>
        </div>
        <p>Built for academic excellence. Powered by AI. &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
