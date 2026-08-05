"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/client";
import { newId } from "@/lib/id";
import Reveal from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  X,
  Save,
  Eye,
  AlertCircle,
} from "lucide-react";

const RULE_TYPES = [
  { value: "attendance_drop", label: "Attendance Drop" },
  { value: "grade_decline", label: "Grade Decline" },
  { value: "engagement_gap", label: "Engagement Gap" },
];

const METRICS = [
  { value: "attendance_pct", label: "Attendance %", types: ["attendance_drop"] },
  { value: "cgpa", label: "CGPA", types: ["grade_decline"] },
  { value: "sgpa", label: "Semester SGPA", types: ["grade_decline"] },
  { value: "consecutive_low_sgpa", label: "Consecutive Low SGPA", types: ["grade_decline"] },
  { value: "days_since_interaction", label: "Days Since Interaction", types: ["engagement_gap"] },
  { value: "attendance_drop", label: "Attendance Drop (pp)", types: ["attendance_drop"] },
];

const OPERATORS = [
  { value: "lt", label: "Less than (<)" },
  { value: "lte", label: "Less or equal (≤)" },
  { value: "gt", label: "Greater than (>)" },
  { value: "gte", label: "Greater or equal (≥)" },
  { value: "eq", label: "Equal to (=)" },
];

const SEVERITIES = [
  { value: "info", label: "Info", color: "text-secondary" },
  { value: "warning", label: "Warning", color: "text-accent" },
  { value: "critical", label: "Critical", color: "text-danger" },
];

export default function AdminAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [tab, setTab] = useState<"rules" | "alerts">("rules");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("attendance_drop");
  const [formMetric, setFormMetric] = useState("attendance_pct");
  const [formOperator, setFormOperator] = useState("lt");
  const [formThreshold, setFormThreshold] = useState("75");
  const [formConsecutive, setFormConsecutive] = useState("1");
  const [formSeverity, setFormSeverity] = useState("warning");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    const [rulesRes, alertsRes] = await Promise.all([
      supabase.from("AlertRule").select("*").order("created_at", { ascending: false }),
      supabase.from("Alert").select("*, rule:rule_id(name, type, severity), student:student_id(full_name, usn, department, year)").order("created_at", { ascending: false }).limit(100),
    ]);
    setRules(rulesRes.data ?? []);
    setActiveAlerts(alertsRes.data ?? []);
    setLoading(false);
  };

  const filteredMetrics = METRICS.filter((m) => m.types.includes(formType));

  const handleAddRule = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from("AlertRule").insert({
        id: newId(),
        name: formName,
        type: formType,
        metric: formMetric,
        operator: formOperator,
        threshold: parseFloat(formThreshold),
        consecutive: parseInt(formConsecutive),
        severity: formSeverity,
        is_active: true,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      }).select().single();

      if (!error && data) {
        setRules((prev) => [data, ...prev]);
        setShowAddForm(false);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    const supabase = createClient();
    await supabase.from("AlertRule").update({ is_active: !isActive }).eq("id", id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !isActive } : r)));
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this alert rule?")) return;
    const supabase = createClient();
    await supabase.from("AlertRule").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleResolveAlert = async (id: string) => {
    const supabase = createClient();
    await supabase.from("Alert").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDismissAlert = async (id: string) => {
    const supabase = createClient();
    await supabase.from("Alert").update({ status: "dismissed" }).eq("id", id);
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await fetch("/api/alerts/evaluate", { method: "POST" });
      await fetchData();
    } finally {
      setEvaluating(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormType("attendance_drop");
    setFormMetric("attendance_pct");
    setFormOperator("lt");
    setFormThreshold("75");
    setFormConsecutive("1");
    setFormSeverity("warning");
  };

  if (loading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin">
      <Reveal>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Alert Rules</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Configure threshold-based rules to auto-detect at-risk students
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleEvaluate} disabled={evaluating} className="btn-primary flex items-center gap-2">
            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {evaluating ? "Scanning..." : "Run Scan"}
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>
      </Reveal>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "rules", label: `Rules (${rules.length})`, icon: Bell },
          { key: "alerts", label: `Active Alerts (${activeAlerts.length})`, icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all ${
              tab === key ? "bg-accent text-ink" : "bg-surface border border-surface-border text-text-muted hover:border-accent/30"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === "rules" && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="card p-12 text-center text-text-muted">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No alert rules configured yet.</p>
              <p className="text-xs mt-1">Add rules to automatically detect at-risk students.</p>
            </div>
          ) : (
            rules.map((rule, idx) => (
              <Reveal key={rule.id} delay={Math.min(idx * 0.04, 0.3)}>
              <div
                className={`card p-4 flex items-center gap-4 ${!rule.is_active ? "opacity-50" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  rule.severity === "critical" ? "bg-danger/15 text-danger" :
                  rule.severity === "warning" ? "bg-accent/15 text-accent" :
                  "bg-secondary/15 text-secondary"
                }`}>
                  {rule.severity === "critical" ? <AlertTriangle className="w-5 h-5" /> :
                   rule.severity === "warning" ? <AlertCircle className="w-5 h-5" /> :
                   <Eye className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary text-sm">{rule.name}</span>
                    <span className={`badge text-[10px] ${
                      rule.severity === "critical" ? "badge-danger" :
                      rule.severity === "warning" ? "badge-accent" : "badge-secondary"
                    }`}>{rule.severity}</span>
                    <span className="badge text-[10px] bg-surface text-text-muted">{rule.type.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {rule.metric.replace(/_/g, " ")} {OPERATORS.find((o) => o.value === rule.operator)?.label ?? rule.operator} {rule.threshold}
                    {rule.consecutive > 1 && ` (consecutive: ${rule.consecutive})`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      rule.is_active
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-surface text-text-muted border border-surface-border"
                    }`}
                  >
                    {rule.is_active ? "Active" : "Disabled"}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="btn-icon text-text-muted hover:text-danger"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </Reveal>
            ))
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="card p-12 text-center text-text-muted">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success opacity-50" />
              <p>No active alerts. All students are on track!</p>
            </div>
          ) : (
            activeAlerts.map((alert, idx) => (
              <Reveal key={alert.id} delay={Math.min(idx * 0.04, 0.3)}>
              <div
                className={`card p-4 ${
                  alert.severity === "critical" ? "border-danger/30 bg-danger/5" :
                  alert.severity === "warning" ? "border-accent/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === "critical" ? "bg-danger/15 text-danger" :
                    alert.severity === "warning" ? "bg-accent/15 text-accent" :
                    "bg-secondary/15 text-secondary"
                  }`}>
                    {alert.severity === "critical" ? <AlertTriangle className="w-4 h-4" /> :
                     alert.severity === "warning" ? <AlertCircle className="w-4 h-4" /> :
                     <Eye className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary mb-0.5">{alert.title}</div>
                    <div className="text-xs text-text-muted mb-2">{alert.message}</div>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span>{alert.student?.full_name} · {alert.student?.usn}</span>
                      {alert.metric_value !== null && alert.threshold_value !== null && (
                        <span>Value: {typeof alert.metric_value === "number" ? alert.metric_value.toFixed(1) : alert.metric_value} / Threshold: {typeof alert.threshold_value === "number" ? alert.threshold_value.toFixed(1) : alert.threshold_value}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20"
                      title="Mark Resolved"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="btn-sm bg-surface text-text-muted border border-surface-border hover:bg-surface-border/50"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              </Reveal>
            ))
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="card w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-heading font-bold text-text-primary">Add Alert Rule</h2>
              <button onClick={() => setShowAddForm(false)} className="btn-icon">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Rule Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Low Attendance Warning"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormMetric(filteredMetrics[0]?.value ?? "attendance_pct"); }} className="input">
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Severity</label>
                  <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value)} className="input">
                    {SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Metric</label>
                <select value={formMetric} onChange={(e) => setFormMetric(e.target.value)} className="input">
                  {filteredMetrics.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Operator</label>
                  <select value={formOperator} onChange={(e) => setFormOperator(e.target.value)} className="input">
                    {OPERATORS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Threshold</label>
                  <input
                    type="number"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="input"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="label">Consecutive</label>
                  <input
                    type="number"
                    value={formConsecutive}
                    onChange={(e) => setFormConsecutive(e.target.value)}
                    className="input"
                    min="1"
                  />
                </div>
              </div>

              <div className="p-3 rounded-button bg-surface border border-surface-border text-xs text-text-muted">
                <strong>Rule preview:</strong> Alert when <span className="text-text-primary">{formMetric.replace(/_/g, " ")}</span>{" "}
                is <span className="text-text-primary">{OPERATORS.find((o) => o.value === formOperator)?.label}</span>{" "}
                <span className="text-text-primary">{formThreshold}</span>
                {parseInt(formConsecutive) > 1 && ` for ${formConsecutive} consecutive periods`}
                {" "}with <span className={`font-semibold ${SEVERITIES.find((s) => s.value === formSeverity)?.color}`}>{formSeverity}</span> severity.
              </div>
            </div>
            <div className="p-5 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleAddRule} disabled={saving || !formName} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Rule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
