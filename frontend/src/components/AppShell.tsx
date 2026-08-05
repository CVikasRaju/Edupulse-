"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  CalendarDays,
  CalendarCheck,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ClipboardList,
  UserCheck,
  BarChart3,
  FileText,
  FileSearch,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import AuroraBackground from "@/components/ui/AuroraBackground";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Academics", href: "/student/academics", icon: BookOpen },
  { label: "Courses", href: "/student/courses", icon: ClipboardList },
  { label: "Achievements", href: "/student/achievements", icon: Trophy },
  { label: "Resume AI", href: "/student/resume", icon: FileSearch },
  { label: "Mentorship", href: "/student/mentorship", icon: Users },
  { label: "Events", href: "/student/events", icon: CalendarCheck },
  { label: "Schedule", href: "/student/schedule", icon: CalendarDays },
  { label: "Feed", href: "/student/feed", icon: Bell },
  { label: "Calendar", href: "/student/calendar", icon: CalendarDays },
  { label: "Settings", href: "/student/settings", icon: Settings },
];

const mentorNav: NavItem[] = [
  { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
  { label: "Performance", href: "/mentor/performance", icon: BarChart3 },
  { label: "My Mentees", href: "/mentor/mentees", icon: Users },
  { label: "Events", href: "/mentor/events", icon: CalendarCheck },
  { label: "Schedule", href: "/mentor/schedule", icon: CalendarDays },
  { label: "Courses", href: "/mentor/courses", icon: BookOpen },
  { label: "Attendance", href: "/mentor/attendance", icon: UserCheck },
  { label: "Achievements", href: "/mentor/achievements", icon: Trophy },
  { label: "Reports", href: "/mentor/reports", icon: BarChart3 },
  { label: "Settings", href: "/mentor/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Performance", href: "/admin/performance", icon: BarChart3 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Alert Rules", href: "/admin/alerts", icon: Bell },
  { label: "Courses", href: "/admin/courses", icon: ClipboardList },
  { label: "Allocations", href: "/admin/allocations", icon: UserCheck },
  { label: "Events", href: "/admin/events", icon: CalendarCheck },
  { label: "Achievements", href: "/admin/achievements", icon: Trophy },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Feed", href: "/admin/feed", icon: Bell },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AppShellProps {
  role: "student" | "mentor" | "admin";
  children: React.ReactNode;
}

const roleAccent: Record<string, string> = {
  student: "#E8A87C",
  mentor: "#7C9E87",
  admin: "#C084FC",
};

export default function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, loading: profileLoading } = useUser();

  const accent = roleAccent[role] ?? "#E8A87C";
  const userName = profile?.full_name ?? "Loading...";
  const userEmail = profile?.email ?? "";
  const userInitials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "..";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const nav = role === "student" ? studentNav : role === "mentor" ? mentorNav : adminNav;
  const roleLabel = role === "student" ? "Student" : role === "mentor" ? "Faculty" : "Admin";
  const roleColor = role === "student" ? "text-accent" : role === "mentor" ? "text-secondary" : "text-highlight";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const mainRef = useRef<HTMLElement>(null);

  // Reset scroll position on route change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  const SidebarContent = ({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-glass/[0.06] ${collapsed ? "justify-center" : ""}`}>
        <motion.div
          whileHover={{ scale: 1.06, rotate: 3 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-surface rounded-xl p-1 border border-glass/10 shadow-[0_0_20px_rgba(232,168,124,0.12)]"
        >
          <Image src="/sahyadri-logo.png" alt="Sahyadri" width={64} height={64} className="max-w-full max-h-full object-contain" />
        </motion.div>
        {!collapsed && (
          <div>
            <div className="font-heading font-bold text-text-primary text-sm leading-tight">
              <span className="text-gradient">Edu</span>Pulse
            </div>
            <div className="text-[10px] font-medium text-text-muted leading-tight mt-0.5">Sahyadri College</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link group ${active ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-0 mx-2" : ""}`}
              title={collapsed ? label : undefined}
            >
              {active && (
                <motion.span
                  layoutId={`nav-pill-${role}-${variant}`}
                  className="absolute inset-0 rounded-button"
                  style={{
                    background: `linear-gradient(120deg, ${accent}22, ${accent}0d)`,
                    border: `1px solid ${accent}33`,
                    boxShadow: `0 0 18px ${accent}22`,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`w-4 h-4 flex-shrink-0 relative transition-transform duration-200 group-hover:scale-110 ${active ? "" : ""}`}
                style={active ? { color: accent } : undefined}
              />
              {!collapsed && (
                <span className="relative">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-glass/[0.06] p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-button px-2 py-2 hover:bg-glass/[0.04] transition-colors">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${accent}20`, color: accent, boxShadow: `0 0 12px ${accent}22` }}
            >
              {userInitials}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text-primary truncate">{userName}</div>
              <div className="text-xs text-text-muted truncate">{userEmail}</div>
            </div>
            <ThemeToggle className="w-8 h-8 p-0" />
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSignOut}
              className="btn-icon"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <ThemeToggle className="w-9 h-9 p-0" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSignOut}
              className="btn-icon w-full justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Ambient aurora behind everything */}
      <AuroraBackground subtle />

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col bg-surface/70 backdrop-blur-2xl border-r border-glass/[0.06] flex-shrink-0 relative z-10 transition-all duration-300"
        style={{ width: collapsed ? 64 : 260 }}
      >
        <SidebarContent variant="desktop" />
        {/* Collapse toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-glass/10 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-200 z-20 shadow-lg"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </motion.button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 h-full w-64 bg-surface/95 backdrop-blur-2xl border-r border-glass/10 z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent variant="mobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-[1]">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-glass/[0.06] bg-surface/80 backdrop-blur-xl flex-shrink-0">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(true)} className="btn-icon">
            <Menu className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2 flex-1">
            <GraduationCap className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-sm">
              <span className="text-gradient">Edu</span>Pulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="w-8 h-8 p-0" />
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${accent}20`, color: accent }}>
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content with route transition */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.99, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
