"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target,
  Award,
  Trash2,
  ClipboardCopy,
  CheckCheck,
  FileSearch,
  GraduationCap,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  History,
  RotateCcw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const ROLE_PRESETS = [
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Data Engineer",
  "AI/ML Engineer",
  "Data Scientist",
  "DevOps Engineer",
  "Quality Assurance Engineer",
  "Cybersecurity Analyst",
  "UI/UX Designer",
  "Cloud Engineer",
  "Project Manager",
];

const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const MAX_SIZE = 5 * 1024 * 1024;
const HISTORY_KEY = "edupulse_resume_history";

const ANALYSIS_STEPS = [
  { icon: UploadCloud, label: "Uploading your resume…" },
  { icon: FileSearch, label: "Reading & extracting content…" },
  { icon: Target, label: "Analyzing against the target role…" },
  { icon: GraduationCap, label: "Scoring skills, experience & education…" },
  { icon: ShieldCheck, label: "Checking ATS compatibility…" },
  { icon: Sparkles, label: "Generating your personalized report…" },
];

const CATEGORY_LABELS: Record<string, string> = {
  skills: "Technical Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  formatting: "Formatting",
  ats: "ATS Compatibility",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function scoreMeta(score: number) {
  if (score >= 85)
    return { color: "#6FCF97", label: "Excellent match", badge: "badge-success", tag: "Excellent" };
  if (score >= 70)
    return { color: "#E8A87C", label: "Strong match", badge: "badge-accent", tag: "Strong" };
  if (score >= 50)
    return { color: "#C084FC", label: "Decent match", badge: "badge-highlight", tag: "Average" };
  return { color: "#E07070", label: "Needs work", badge: "badge-danger", tag: "Poor" };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOC";
  return "TXT";
}

function loadHistory(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 190;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const { color, label } = scoreMeta(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--glass) / 0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
          className="font-heading font-bold leading-none"
          style={{ color, fontSize: 52 }}
        >
          {score}
        </motion.div>
        <div className="text-xs font-medium text-text-muted mt-1.5 tracking-wider uppercase">out of 100</div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <span className={`badge ${scoreMeta(score).badge} text-[11px]`}>{label}</span>
      </motion.div>
    </div>
  );
}

function CategoryBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const { color } = scoreMeta(value);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-text-muted font-medium">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-surface-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function StudentResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [analyzedRole, setAnalyzedRole] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setHistory(loadHistory()), []);

  useEffect(() => {
    if (!analyzing) return;
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, ANALYSIS_STEPS.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [analyzing]);

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type) && !/\.(pdf|docx|txt|md|rtf)$/i.test(f.name)) {
      return "Unsupported file type. Please upload a PDF, DOCX, or TXT resume.";
    }
    if (f.size > MAX_SIZE) {
      return "File is larger than 5MB. Please upload a smaller file.";
    }
    if (f.size === 0) {
      return "The uploaded file is empty.";
    }
    return null;
  }, []);

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFile(f);
  };

  const effectiveRole = customRole.trim() || role;

  const handleAnalyze = async () => {
    if (!file || !effectiveRole) {
      setError(!file ? "Please upload your resume first." : "Please select or enter a target role.");
      return;
    }
    setError("");
    setCopied(false);
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("role", effectiveRole);
      if (jobDescription.trim()) fd.append("jobDescription", jobDescription.trim());

      const res = await fetch("/api/resume/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      setAnalysis(data.result);
      setFileName(file.name);
      setAnalyzedRole(effectiveRole);

      const entry = {
        id: `${Date.now()}`,
        fileName: file.name,
        role: effectiveRole,
        score: data.result.score,
        verdict: data.result.verdict,
        date: new Date().toISOString(),
        result: data.result,
      };
      const next = [entry, ...loadHistory().filter((h: any) => h.id !== entry.id)].slice(0, 6);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySummary = async () => {
    if (!analysis) return;
    const text = [
      `🎯 Resume Analysis — ${fileName}`,
      `Role: ${analyzedRole}`,
      `Score: ${analysis.score}/100 — ${analysis.verdict}`,
      ``,
      `Summary: ${analysis.summary}`,
      ``,
      `Strengths:`,
      ...(analysis.strengths || []).map((s: string) => `  ✓ ${s}`),
      ``,
      `Skills to improve:`,
      ...(analysis.skillsToImprove || []).map((s: any) => `  → ${s.skill}${s.how ? ` — ${s.how}` : ""}`),
      ``,
      `Top recommendations:`,
      ...(analysis.recommendations || []).map((r: string) => `  • ${r}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setFileName("");
    setAnalyzedRole("");
    setError("");
    setCopied(false);
    setJobDescription("");
  };

  return (
    <AppShell role="student">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
                AI Resume Analyzer
              </h1>
              <span className="badge badge-accent">
                <Sparkles className="w-3 h-3" /> Powered by Gemini
              </span>
            </div>
            <p className="text-text-muted text-sm">
              Upload your resume, pick a target role, and get an instant score + a roadmap to improve it.
            </p>
          </div>
          {history.length > 0 && !analyzing && (
            <button onClick={reset} className="btn-ghost btn-sm">
              <RotateCcw className="w-3.5 h-3.5" /> New Analysis
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Left: Input form ── */}
          <div className="lg:col-span-2 space-y-5 lg:sticky lg:top-0">
            {/* Upload card */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <UploadCloud className="w-4 h-4 text-accent" />
                <span className="font-heading font-bold text-text-primary text-sm">1 · Upload Resume</span>
              </div>

              {!file ? (
                <div
                  className={`drop-zone ${dragActive ? "drop-zone-active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  onClick={() => inputRef.current?.click()}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-text-primary font-medium">
                    Drag & drop your resume here
                  </p>
                  <p className="text-xs text-text-muted mt-1">or <span className="text-accent underline underline-offset-2">browse files</span></p>
                  <p className="text-[11px] text-text-muted/70 mt-3">PDF, DOCX, TXT · max 5MB</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-input bg-surface border border-accent/25">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent font-heading font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {fileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{file.name}</div>
                    <div className="text-xs text-text-muted">{formatBytes(file.size)}</div>
                  </div>
                  <button
                    onClick={() => { setFile(null); setError(""); }}
                    className="btn-icon"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Role card */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-accent" />
                <span className="font-heading font-bold text-text-primary text-sm">2 · Target Role</span>
              </div>
              <p className="text-xs text-text-muted mb-3">What role are you applying for?</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {ROLE_PRESETS.map((r) => {
                  const selected = role === r && !customRole;
                  return (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setCustomRole(""); setError(""); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        selected
                          ? "bg-accent text-ink border-accent shadow-glow"
                          : "bg-surface border-surface-border text-text-muted hover:border-accent/40 hover:text-text-primary"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => { setCustomRole(e.target.value); if (e.target.value) setRole(""); setError(""); }}
                  placeholder="Or type a custom role… e.g. Prompt Engineer"
                  className="input pl-9"
                />
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Optional JD card */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-4 h-4 text-accent" />
                <span className="font-heading font-bold text-text-primary text-sm">3 · Job Description <span className="text-text-muted font-normal text-xs">(optional)</span></span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste the job description to get a precise match analysis against the actual requirements…"
                className="input resize-none"
              />
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !file || !effectiveRole}
              className="btn-primary w-full py-3.5 text-base glow-accent"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Analyze My Resume</>
              )}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-input px-4 py-3"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <p className="text-[11px] text-text-muted/70 text-center">
              Your resume is analyzed securely and never stored on the server.
            </p>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-3 space-y-5">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="card p-8"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5 relative">
                      <Sparkles className="w-8 h-8 text-accent animate-pulse-soft" />
                    </div>
                    <h3 className="text-center font-heading font-bold text-text-primary text-lg mb-6">
                      Analyzing your resume
                    </h3>
                    <div className="space-y-4">
                      {ANALYSIS_STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = i < stepIndex;
                        const current = i === stepIndex;
                        return (
                          <div key={s.label} className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                done
                                  ? "bg-success/15 text-success"
                                  : current
                                    ? "bg-accent/15 text-accent"
                                    : "bg-surface-border/50 text-text-muted/40"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Icon className={`w-4 h-4 ${current ? "animate-pulse-soft" : ""}`} />
                              )}
                            </div>
                            <span
                              className={`text-sm transition-colors duration-300 ${
                                done
                                  ? "text-text-muted"
                                  : current
                                    ? "text-text-primary font-medium"
                                    : "text-text-muted/40"
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 h-1 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-700"
                        style={{ width: `${((stepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : analysis ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5"
                >
                  {/* Score summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 flex flex-col sm:flex-row items-center gap-8"
                  >
                    <ScoreRing score={analysis.score} />
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className={`badge ${scoreMeta(analysis.score).badge}`}>
                          <TrendingUp className="w-3 h-3" /> {scoreMeta(analysis.score).tag} match
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {fileName}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-text-primary text-xl mb-2">
                        {analysis.verdict}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed">{analysis.summary}</p>
                      <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                        <button onClick={handleCopySummary} className="btn-ghost btn-sm">
                          {copied ? <CheckCheck className="w-3.5 h-3.5 text-success" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                          {copied ? "Copied!" : "Copy Report"}
                        </button>
                        <button onClick={reset} className="btn-ghost btn-sm">
                          <RotateCcw className="w-3.5 h-3.5" /> Analyze Another
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Category scores */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card p-5"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-4 h-4 text-accent" />
                      <span className="font-heading font-bold text-text-primary text-sm">Skill Breakdown</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(analysis.categoryScores || {}).map(([key, value]: any, i) => (
                        <CategoryBar
                          key={key}
                          label={CATEGORY_LABELS[key] || key}
                          value={value}
                          delay={0.25 + i * 0.08}
                        />
                      ))}
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Strengths */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="card p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="font-heading font-bold text-text-primary text-sm">What&apos;s Working</span>
                      </div>
                      {analysis.strengths?.length ? (
                        <ul className="space-y-2.5">
                          {analysis.strengths.map((s: string, i: number) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + i * 0.06 }}
                              className="flex items-start gap-2.5 text-sm text-text-primary"
                            >
                              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{s}</span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-text-muted">No strengths identified.</p>
                      )}
                    </motion.div>

                    {/* Skills to improve */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="card p-5 border-l-4 border-l-accent"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-accent" />
                        <span className="font-heading font-bold text-text-primary text-sm">Skills to Improve</span>
                      </div>
                      {analysis.skillsToImprove?.length ? (
                        <div className="space-y-4">
                          {analysis.skillsToImprove.map((item: any, i: number) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + i * 0.06 }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                                <span className="text-sm font-semibold text-text-primary">{item.skill}</span>
                              </div>
                              {item.how && (
                                <p className="text-xs text-text-muted mt-1.5 pl-3.5 leading-relaxed">
                                  <span className="text-accent font-medium">How: </span>{item.how}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted">Great — no critical skill gaps found!</p>
                      )}
                    </motion.div>
                  </div>

                  {/* Recommendations */}
                  {analysis.recommendations?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="card p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-4 h-4 text-highlight" />
                        <span className="font-heading font-bold text-text-primary text-sm">Recommended Actions</span>
                      </div>
                      <ol className="space-y-2.5">
                        {analysis.recommendations.map((r: string, i: number) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="flex items-start gap-3 text-sm text-text-primary"
                          >
                            <span className="w-6 h-6 rounded-lg bg-highlight/10 text-highlight text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{r}</span>
                          </motion.li>
                        ))}
                      </ol>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Missing sections */}
                    {analysis.missingSections?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="card p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <FileSearch className="w-4 h-4 text-danger" />
                          <span className="font-heading font-bold text-text-primary text-sm">Missing / Weak Sections</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missingSections.map((s: string, i: number) => (
                            <span key={i} className="badge badge-danger">{s}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ATS tips */}
                    {analysis.atsTips?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="card p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-secondary" />
                          <span className="font-heading font-bold text-text-primary text-sm">ATS Tips</span>
                        </div>
                        <ul className="space-y-2">
                          {analysis.atsTips.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
                              <span className="text-secondary mt-0.5">▸</span>
                              <span className="leading-relaxed">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>

                  {/* Suggested roles */}
                  {analysis.suggestedRoles?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                      className="card p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-accent" />
                        <span className="font-heading font-bold text-text-primary text-sm">Roles Your Resume Also Fits</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suggestedRoles.map((r: string, i: number) => (
                          <span key={i} className="badge badge-accent">{r}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="card p-10 flex flex-col items-center justify-center text-center min-h-[420px]"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/15 to-secondary/15 border border-accent/20 flex items-center justify-center mb-5">
                    <FileSearch className="w-9 h-9 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-text-primary text-xl mb-2">
                    Get your resume scored in seconds
                  </h3>
                  <p className="text-text-muted text-sm max-w-sm leading-relaxed">
                    Upload your resume, choose the role you&apos;re applying for, and our AI will score your
                    fit out of 100, highlight your strengths, and tell you exactly which skills to
                    improve — with a personalized action plan.
                  </p>
                  <div className="flex items-center gap-2 mt-5 text-[11px] text-text-muted">
                    <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Score /100</span>
                    <span className="badge badge-accent"><Lightbulb className="w-3 h-3" /> Skill roadmap</span>
                    <span className="badge badge-highlight"><ShieldCheck className="w-3 h-3" /> ATS check</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History */}
            {!analyzing && history.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-text-muted" />
                    <span className="font-heading font-bold text-text-primary text-sm">Recent Analyses</span>
                  </div>
                  <button
                    onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
                    className="btn-icon"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() => { setAnalysis(h.result); setFileName(h.fileName); setAnalyzedRole(h.role); setCopied(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-full flex items-center gap-3 p-3 rounded-input bg-surface border border-surface-border hover:border-accent/30 transition-colors text-left group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                        style={{ background: `${scoreMeta(h.score).color}1F`, color: scoreMeta(h.score).color }}
                      >
                        {h.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                          {h.fileName}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {h.role} · {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <span className="text-xs text-text-muted flex-shrink-0">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
