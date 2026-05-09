"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Brain,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import FileDropZone from "./FileDropZone";
import AiMappingReview from "./AiMappingReview";
import DuplicateReview from "./DuplicateReview";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  headerRowIndex: number;
}

interface ParsedFile {
  fileName: string;
  sheets: string[];
}

interface DateColumn {
  column: string;
  detectedDate: string | null;
  confidence: "high" | "medium" | "low";
  userDate?: string;
}

interface AiMapping {
  usnColumn: string;
  nameColumn: string | null;
  dateColumns: DateColumn[];
  presentValue: string;
  absentValue: string;
  detectedSubject: string;
  hasMissingDates: boolean;
  reasoning: string;
}

interface DuplicateRecord {
  student_id: string;
  studentName?: string;
  usn?: string;
  date: string;
  subject_name: string;
}

interface MissingUsn {
  usn: string;
  name?: string;
  resolvedId?: string;
  skip?: boolean;
}

type Step = "upload" | "analyzing" | "review" | "duplicates" | "processing" | "done";

// ─── Step indicator labels ────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "upload",    label: "Upload",    icon: <Upload className="w-4 h-4" /> },
  { id: "review",    label: "AI Review", icon: <Brain className="w-4 h-4" /> },
  { id: "duplicates",label: "Duplicates",icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "done",      label: "Done",      icon: <CheckCircle className="w-4 h-4" /> },
];

const STEP_INDEX: Record<Step, number> = {
  upload: 0, analyzing: 0, review: 1, duplicates: 2, processing: 2, done: 3,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface AttendanceUploadWizardProps {
  role: "admin" | "mentor";
}

export default function AttendanceUploadWizard({ role }: AttendanceUploadWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sheet / file data
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [allSheets, setAllSheets] = useState<SheetData[]>([]);

  // Per-sheet AI results
  const [mapping, setMapping] = useState<AiMapping | null>(null);
  const [missingUsns, setMissingUsns] = useState<MissingUsn[]>([]);

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [pendingMetadata, setPendingMetadata] = useState<{
    subjectName: string;
    subjectCode: string;
    semester: number | null;
    academicYear: string;
    classDays: string[];
    resolvedMapping: AiMapping;
  } | null>(null);

  // Final result
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function resetWizard() {
    setStep("upload");
    setParsedFile(null);
    setAllSheets([]);
    setCurrentSheetIndex(0);
    setMapping(null);
    setMissingUsns([]);
    setDuplicates([]);
    setTotalPending(0);
    setPendingMetadata(null);
    setResult(null);
    setError(null);
    setStatusMsg("");
  }

  // ── Step 1 → AI Analysis ──────────────────────────────────────────────────

  async function handleParsed(data: { file: ParsedFile; selectedSheets: SheetData[] }) {
    setError(null);
    setParsedFile(data.file);
    setAllSheets(data.selectedSheets);
    setCurrentSheetIndex(0);
    await analyzeSheet(data.selectedSheets, 0);
  }

  async function analyzeSheet(sheets: SheetData[], idx: number) {
    const sheet = sheets[idx];
    setStep("analyzing");
    setStatusMsg(`Analyzing "${sheet.sheetName}" with AI…`);

    try {
      const sampleRows = sheet.rows.slice(0, 12);
      const allRows = sheet.rows.slice(0, 100); // give AI more context

      const res = await fetch("/api/attendance/upload?action=analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: sheet.headers,
          sampleRows,
          allRows,
          subjectHint: sheet.sheetName,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.mapping) throw new Error(json.error ?? "AI analysis failed");

      const aiMapping: AiMapping = json.mapping;

      // Resolve USNs present in the sheet
      const usns = sheet.rows
        .map((r) => String(r[aiMapping.usnColumn] ?? "").trim())
        .filter(Boolean);

      const resolveRes = await fetch("/api/attendance/upload?action=resolve-usn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usns }),
      });
      const resolveJson = await resolveRes.json();

      const missing: MissingUsn[] = (resolveJson.missing ?? []).map((usn: string) => ({ usn }));

      setMapping(aiMapping);
      setMissingUsns(missing);
      setStep("review");
      setStatusMsg("");
    } catch (e: any) {
      setError(e.message ?? "Unexpected error during AI analysis");
      setStep("upload");
    }
  }

  // ── Step 2 → Duplicate Check ──────────────────────────────────────────────

  async function handleMappingConfirm(
    confirmedMapping: AiMapping,
    meta: { subjectName: string; subjectCode: string; semester: number | null; academicYear: string; classDays: string[] }
  ) {
    setError(null);
    setStep("processing");
    setStatusMsg("Checking for duplicate records…");

    try {
      const sheet = allSheets[currentSheetIndex];

      // Collect all resolved student IDs
      const usns = sheet.rows.map((r) => String(r[confirmedMapping.usnColumn] ?? "").trim()).filter(Boolean);
      const resolveRes = await fetch("/api/attendance/upload?action=resolve-usn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usns }),
      });
      const { resolved } = await resolveRes.json();

      const studentIds = Object.values(resolved as Record<string, { id: string }>).map((v) => v.id);
      const dates = confirmedMapping.dateColumns
        .map((dc) => dc.userDate ?? dc.detectedDate)
        .filter(Boolean) as string[];

      const total = studentIds.length * dates.length;
      setTotalPending(total);
      setPendingMetadata({ ...meta, resolvedMapping: confirmedMapping });

      const dupRes = await fetch("/api/attendance/upload?action=check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds, subjectName: meta.subjectName, dates }),
      });
      const dupJson = await dupRes.json();

      setDuplicates(dupJson.duplicates ?? []);
      setStep("duplicates");
      setStatusMsg("");
    } catch (e: any) {
      setError(e.message ?? "Error checking duplicates");
      setStep("review");
    }
  }

  // ── Step 3 → Final Insert ─────────────────────────────────────────────────

  async function handleDuplicateChoice(choice: "skip" | "overwrite") {
    if (!pendingMetadata) return;

    setStep("processing");
    setStatusMsg("Importing records into database…");
    setError(null);

    try {
      const sheet = allSheets[currentSheetIndex];
      const { resolvedMapping, subjectName, subjectCode, semester, academicYear } = pendingMetadata;

      const dateEntries = resolvedMapping.dateColumns
        .filter((dc) => dc.userDate ?? dc.detectedDate)
        .map((dc) => ({ column: dc.column, date: (dc.userDate ?? dc.detectedDate)! }));

      const res = await fetch("/api/attendance/upload?action=process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: sheet.rows,
          columnMapping: { usn: resolvedMapping.usnColumn, dates: dateEntries },
          subjectName,
          subjectCode,
          semester,
          academicYear,
          overwriteDuplicates: choice === "overwrite",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");

      setResult(json);
      setStep("done");
      setStatusMsg("");
    } catch (e: any) {
      setError(e.message ?? "Error importing records");
      setStep("duplicates");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const currentStepIdx = STEP_INDEX[step];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Bulk Attendance Upload
          </h1>
          <p className="text-sm text-text-muted mt-1">
            AI-powered column mapping · Duplicate detection · Instant import
          </p>
        </div>
        <button
          onClick={() => router.push(role === "admin" ? "/admin/dashboard" : "/mentor/attendance")}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-button text-xs font-medium transition-all
                ${i === currentStepIdx
                  ? "bg-accent text-background"
                  : i < currentStepIdx
                  ? "bg-success/10 text-success"
                  : "bg-surface text-text-muted border border-surface-border"
                }`}
            >
              {i < currentStepIdx ? <CheckCircle className="w-3.5 h-3.5" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < currentStepIdx ? "bg-success/40" : "bg-surface-border"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main card */}
      <div className="card p-6">
        {/* Global error */}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-card flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* ── Upload step ── */}
        {step === "upload" && (
          <FileDropZone onParsed={handleParsed} />
        )}

        {/* ── Analyzing spinner ── */}
        {step === "analyzing" && (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <p className="font-medium text-text-primary">{statusMsg}</p>
            <p className="text-xs text-text-muted">Gemini is reading your spreadsheet…</p>
          </div>
        )}

        {/* ── AI Mapping review ── */}
        {step === "review" && mapping && (
          <AiMappingReview
            mapping={mapping}
            missingUsns={missingUsns}
            sheetName={allSheets[currentSheetIndex]?.sheetName ?? ""}
            onConfirm={handleMappingConfirm}
          />
        )}

        {/* ── Duplicate review ── */}
        {step === "duplicates" && (
          <DuplicateReview
            duplicates={duplicates}
            totalPending={totalPending}
            onChoice={handleDuplicateChoice}
            onBack={() => setStep("review")}
          />
        )}

        {/* ── Processing spinner ── */}
        {step === "processing" && (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <p className="font-medium text-text-primary">{statusMsg}</p>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && result && (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Import Complete!</h2>

            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{result.inserted}</p>
                <p className="text-xs text-text-muted mt-1">Records inserted</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-text-muted">{result.skipped}</p>
                <p className="text-xs text-text-muted mt-1">Skipped</p>
              </div>
              {result.errors.length > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-danger">{result.errors.length}</p>
                  <p className="text-xs text-text-muted mt-1">Errors</p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <details className="text-left mt-4">
                <summary className="text-xs text-danger cursor-pointer select-none">
                  Show {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
                </summary>
                <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto text-xs text-text-muted pl-4 list-disc">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <button onClick={resetWizard} className="btn-ghost flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Upload Another
              </button>
              <button
                onClick={() => router.push(role === "admin" ? "/admin/dashboard" : "/mentor/attendance")}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
