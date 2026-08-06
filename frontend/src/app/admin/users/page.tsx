"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import Reveal from "@/components/ui/Reveal";
import TiltCard from "@/components/ui/TiltCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Mail,
  User,
  Shield,
  GraduationCap,
  X,
  Loader2,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const ROLES = [
  { value: "mentee", label: "Student" },
  { value: "mentor", label: "Faculty" },
  { value: "admin", label: "Administrator" },
];

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  role: "mentee",
  department: "",
  year: "",
  section: "",
  usn: "",
  employee_id: "",
  designation: "",
  phone: "",
  address: "",
  linkedin_url: "",
  github_url: "",
  year_of_joining: "",
};

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null); // profile row being edited, null = create
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageMsg, setPageMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!pageMsg) return;
    const t = setTimeout(() => setPageMsg(null), 5000);
    return () => clearTimeout(t);
  }, [pageMsg]);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("Profile")
      .select("*")
      .order("role", { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setModalMsg(null);
    setModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      full_name: u.full_name ?? "",
      email: u.email ?? "",
      password: "",
      role: u.role,
      department: u.department ?? "",
      year: u.year ? String(u.year) : "",
      section: u.section ?? "",
      usn: u.usn ?? "",
      employee_id: u.employee_id ?? "",
      designation: u.designation ?? "",
      phone: u.phone ?? "",
      address: u.address ?? "",
      linkedin_url: u.linkedin_url ?? "",
      github_url: u.github_url ?? "",
      year_of_joining: u.year_of_joining ? String(u.year_of_joining) : "",
    });
    setModalMsg(null);
    setModalOpen(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setModalMsg(null);
    try {
      if (editing) {
        const payload: any = {
          id: editing.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          role: form.role,
          department: form.department.trim() || null,
          year: form.year ? Number(form.year) : null,
          section: form.section.trim() || null,
          usn: form.role === "mentee" ? (form.usn.trim() || null) : null,
          employee_id: form.role === "mentee" ? null : (form.employee_id.trim() || null),
          designation: form.designation.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          github_url: form.github_url.trim() || null,
          year_of_joining: form.year_of_joining ? Number(form.year_of_joining) : null,
        };
        if (form.password) payload.password = form.password;
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setModalMsg({ ok: false, text: data.error || "Failed to update user." });
          setBusy(false);
          return;
        }
        setModalMsg({ ok: true, text: form.password ? "User updated & password reset." : "User updated." });
      } else {
        if (!form.password) {
          setModalMsg({ ok: false, text: "A password is required for new users." });
          setBusy(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            department: form.department.trim() || null,
            year: form.year ? Number(form.year) : null,
            section: form.section.trim() || null,
            usn: form.role === "mentee" ? (form.usn.trim() || null) : null,
            employee_id: form.role === "mentee" ? null : (form.employee_id.trim() || null),
            designation: form.designation.trim() || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            linkedin_url: form.linkedin_url.trim() || null,
            github_url: form.github_url.trim() || null,
            year_of_joining: form.year_of_joining ? Number(form.year_of_joining) : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setModalMsg({ ok: false, text: data.error || "Failed to create user." });
          setBusy(false);
          return;
        }
        setModalMsg({ ok: true, text: "User created — they can log in now." });
      }

      await fetchUsers();
      setTimeout(() => setModalOpen(false), 900);
    } catch (err: any) {
      setModalMsg({ ok: false, text: err.message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u: any) => {
    const label = `${u.full_name}${u.role === "mentee" && u.usn ? ` (${u.usn})` : ""}`;
    if (!confirm(`Delete ${label}? This removes their account, login and all related records.`)) return;
    setDeletingId(u.id);
    setPageMsg(null);
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setPageMsg({ ok: false, text: data.error || "Failed to delete user." });
      } else {
        setPageMsg({ ok: true, text: `${u.full_name} deleted.` });
        await fetchUsers();
      }
    } catch (err: any) {
      setPageMsg({ ok: false, text: err.message || "Failed to delete user." });
    }
    setDeletingId(null);
  };

  const toggleActive = async (u: any) => {
    const supabase = createClient();
    const next = !u.is_active;
    const { error } = await supabase
      .from("Profile")
      .update({ is_active: next, updated_at: new Date().toISOString() })
      .eq("id", u.id);
    if (error) {
      setPageMsg({ ok: false, text: `Failed to update status: ${error.message}` });
    } else {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: next } : x)));
      setPageMsg({ ok: true, text: `${u.full_name} ${next ? "activated" : "deactivated"}.` });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.usn && u.usn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  const counts = {
    students: users.filter((u) => u.role === "mentee").length,
    faculty: users.filter((u) => u.role === "mentor").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const statCards = [
    { label: "Students", value: counts.students, icon: GraduationCap, color: "bg-secondary/10 text-secondary" },
    { label: "Faculty", value: counts.faculty, icon: BookOpen, color: "bg-accent/10 text-accent" },
    { label: "Admins", value: counts.admins, icon: Shield, color: "bg-danger/10 text-danger" },
    { label: "Total Users", value: users.length, icon: Users, color: "bg-highlight/10 text-highlight" },
  ];

  return (
    <AppShell role="admin">
      <Reveal>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">User Management</h1>
            <p className="text-text-muted text-sm mt-0.5">
              Add, edit or remove students, faculty and administrators
            </p>
          </div>
          <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add User
          </motion.button>
        </div>
      </Reveal>

      {pageMsg && (
        <div
          className={`mb-4 flex items-start gap-2 text-sm rounded-input px-4 py-3 border ${
            pageMsg.ok
              ? "bg-success/10 text-success border-success/20"
              : "bg-danger/10 text-danger border-danger/20"
          }`}
        >
          {pageMsg.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="break-all">{pageMsg.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, idx) => (
          <Reveal key={s.label} delay={idx * 0.06} className="h-full">
            <TiltCard intensity={5} className="h-full">
              <div className="card p-4 flex items-center gap-3 h-full">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-text-primary leading-tight">
                    <AnimatedCounter value={s.value} />
                  </div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email or USN..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-44 bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="mentor">Mentors</option>
            <option value="mentee">Students</option>
          </select>
          <span className="text-xs text-text-muted">{filteredUsers.length} shown</span>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>ID / USN</th>
                  <th>Department</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                          {u.full_name?.[0] ?? "?"}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{u.full_name}</div>
                          <div className="text-xs text-text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === "admin"
                            ? "badge-danger"
                            : u.role === "mentor"
                            ? "badge-accent"
                            : "badge-secondary"
                        }`}
                      >
                        {u.role === "mentee" ? "Student" : u.role === "mentor" ? "Faculty" : "Admin"}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-text-muted">
                      {u.role === "mentee" ? u.usn || "—" : u.employee_id || "—"}
                    </td>
                    <td className="text-sm">{u.department || "—"}</td>
                    <td className="text-xs text-text-muted">
                      {u.year ? `Year ${u.year}` : ""}
                      {u.section ? ` · Sec ${u.section}` : ""}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? "Click to deactivate" : "Click to activate"}
                        className={`badge cursor-pointer transition-colors ${
                          u.is_active ? "badge-success hover:bg-danger/10 hover:text-danger" : "badge-danger hover:bg-success/10 hover:text-success"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="btn-icon text-text-muted hover:text-accent" title="Edit user">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          className="btn-icon text-text-muted hover:text-danger"
                          title="Delete user"
                        >
                          {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* ── Add / Edit User Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-surface z-10">
                <h2 className="font-heading font-bold text-text-primary">
                  {editing ? "Edit User" : "Add New User"}
                </h2>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setModalOpen(false)} className="btn-icon">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={form.role}
                      onChange={set("role")}
                      className="input bg-surface border-surface-border text-text-primary px-3 rounded-input outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Full Name</label>
                    <input required value={form.full_name} onChange={set("full_name")} className="input" placeholder="Full name" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</label>
                    <input type="email" required value={form.email} onChange={set("email")} className="input" placeholder="user@sahyadri.edu.in" />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> {editing ? "Reset Password (optional)" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={set("password")}
                        required={!editing}
                        minLength={6}
                        className="input pr-10"
                        placeholder={editing ? "Leave blank to keep" : "Min 6 characters"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        aria-label="Toggle password visibility"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Department</label>
                    <input value={form.department} onChange={set("department")} className="input" placeholder="Computer Science" />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input type="number" min={1} max={8} value={form.year} onChange={set("year")} className="input" placeholder="3" />
                  </div>
                  <div>
                    <label className="label">Section</label>
                    <input value={form.section} onChange={set("section")} className="input" placeholder="A" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">{form.role === "mentee" ? "USN" : "Employee ID"}</label>
                    <input
                      value={form.role === "mentee" ? form.usn : form.employee_id}
                      onChange={set(form.role === "mentee" ? "usn" : "employee_id")}
                      className="input"
                      placeholder={form.role === "mentee" ? "4SH21CS001" : "SAH-CS-001"}
                    />
                  </div>
                  <div>
                    <label className="label">Designation</label>
                    <input value={form.designation} onChange={set("designation")} className="input" placeholder="e.g. HOD, Associate Professor" />
                  </div>
                </div>

                {/* Contact & Profile details */}
                <div className="pt-2 border-t border-surface-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Contact & Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="+91 00000 00000" />
                    </div>
                    <div>
                      <label className="label">Year of Joining</label>
                      <input type="number" min={2000} max={2100} value={form.year_of_joining} onChange={set("year_of_joining")} className="input" placeholder="2024" />
                    </div>
                    <div>
                      <label className="label">LinkedIn URL</label>
                      <input type="url" value={form.linkedin_url} onChange={set("linkedin_url")} className="input" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                      <label className="label">GitHub URL</label>
                      <input type="url" value={form.github_url} onChange={set("github_url")} className="input" placeholder="https://github.com/..." />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label">Address</label>
                    <textarea value={form.address} onChange={set("address")} rows={2} className="input resize-y" placeholder="Full address" />
                  </div>
                </div>

                {modalMsg && (
                  <div
                    className={`flex items-start gap-2 text-sm rounded-input px-4 py-3 border ${
                      modalMsg.ok
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-danger/10 text-danger border-danger/20"
                    }`}
                  >
                    {modalMsg.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <span className="break-all">{modalMsg.text}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={busy} className="btn-primary">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    {busy ? "Saving..." : editing ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
