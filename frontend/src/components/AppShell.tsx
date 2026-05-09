"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  CalendarDays,
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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";

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
  { label: "Mentorship", href: "/student/mentorship", icon: Users },
  { label: "Feed", href: "/student/feed", icon: Bell },
  { label: "Calendar", href: "/student/calendar", icon: CalendarDays },
  { label: "Settings", href: "/student/settings", icon: Settings },
];

const mentorNav: NavItem[] = [
  { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
  { label: "My Mentees", href: "/mentor/mentees", icon: Users },
  { label: "Courses", href: "/mentor/courses", icon: BookOpen },
  { label: "Attendance", href: "/mentor/attendance", icon: UserCheck },
  { label: "Achievements", href: "/mentor/achievements", icon: Trophy },
  { label: "Reports", href: "/mentor/reports", icon: BarChart3 },
  { label: "Settings", href: "/mentor/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: ClipboardList },
  { label: "Allocations", href: "/admin/allocations", icon: UserCheck },
  { label: "Achievements", href: "/admin/achievements", icon: Trophy },
  { label: "Feed", href: "/admin/feed", icon: Bell },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AppShellProps {
  role: "student" | "mentor" | "admin";
  children: React.ReactNode;
}

export default function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, loading: profileLoading } = useUser();

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-surface-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-surface rounded p-1 border border-surface-border shadow-sm">
          <Image src="/sahyadri-logo.png" alt="Sahyadri" width={64} height={64} className="max-w-full max-h-full object-contain" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-heading font-bold text-text-primary text-sm leading-tight">EduPulse</div>
            <div className={`text-[10px] font-medium text-text-muted leading-tight mt-0.5`}>Sahyadri College</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${active ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-0 mx-2" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-surface-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text-primary truncate">{userName}</div>
              <div className="text-xs text-text-muted truncate">{userEmail}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-icon"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="btn-icon w-full justify-center"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col bg-surface border-r border-surface-border flex-shrink-0 relative transition-all duration-300"
        style={{ width: collapsed ? 64 : 260 }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-200 z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-surface-border z-50 lg:hidden animate-slide-in-right" style={{ animationName: "slide-in-left" }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="btn-icon">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <GraduationCap className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-sm">EduPulse</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            {userInitials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
