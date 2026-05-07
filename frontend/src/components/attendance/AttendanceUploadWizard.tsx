"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import FileDropZone from "@/components/attendance/FileDropZone";
import AiMappingReview from "@/components/attendance/AiMappingReview";
import DuplicateReview from "@/components/attendance/DuplicateReview";
import { Loader2, CheckCircle, XCircle, Upload, ChevronRight, AlertTriangle, Edit2 } from "lucide-react";

// Types
interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
}

type WizardStep = "upload" | "analyzing" | "review" | "fix-usns" | "duplicates" | "importing" | "done";

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

interface MissingUsnEntry {
  rowIndex: number;
  usn: string;
  /** corrected USN entered by admin/mentor */
  correctedUsn?: string;
  skip?: boolean;
}

// Step indicator
const STEPS = ["Upload", "AI Review", "Fix Issues", "Duplicates", "Complete"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${i <= current ? "text-accent" : "text-text-muted"}`}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                i < current
                  ? "bg-accent border-accent text-background"
                  : i === current
                  ? "border-accent text-accent"
                  : "border-surface-border text-text-muted"
              }`}
            >
              {i < current ? <CheckCircle className="w-3 h-3" /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className={`w-3 h-3 ${i < current ? "text-accent" : "text-surface-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AttendanceUploadWizard({ role }: { role: "mentor" | "admin" }) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Data state
  const [parsedSheets, setParsedSheets] = useState<SheetData[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [aiMapping, setAiMapping] = useState<any>(null);
  const [confirmedMapping, setConfirmedMapping] = useState<any>(null);
  const [confirmedMeta, setConfirmedMeta] = useState<any>(null);
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [subjectMeta, setSubjectMeta] = useState<any>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Missing USN state (for the "fix-usns" step)
  const [missingUsnEntries, setMissingUsnEntries] = useState<MissingUsnEntry[]>([]);

  const handleFileParsed = async ({ selectedSheets }: { file: any; selectedSheets: SheetData[] }) => {
    setParsedSheets(selectedSheets);
    setCurrentSheetIndex(0);
    await analyzeSheet(selectedSheets[0]);
  };

  const analyzeSheet = async (sheet: SheetData) => {
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/attendance/upload?action=analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: sheet.headers,
          sampleRows: sheet.rows.slice(0, 8),
          allRows: sheet.rows, // send all rows for better heuristic scoring
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "AI analysis failed");
      setAiMapping(data.mapping);
      setStep("review");
      setCurrentStepIndex(1);
    } catch (e: any) {
      setError(e.message);
      setStep("upload");
    }
  };

  /** Called by AiMappingReview when the user confirms mapping + subject metadata */
  const handleMappingConfirmed = async (mapping: any, meta: any) => {
    setConfirmedMapping(mapping);
    setConfirmedMeta(meta);
    setSubjectMeta(meta);
    const sheet = parsedSheets[currentSheetIndex];
    setStep("analyzing");

    try {
      // Extract unique non-empty USNs from all rows
      const usns: string[] = Array.from(
        new Set(
          sheet.rows
            .map((r) => String(r[mapping.usnColumn] ?? "").trim())
            .filter(Boolean)
        )
      );

      const resolveRes = await fetch("/api/attendance/upload?action=resolve-usn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usns }),
      });
      const { resolved, missing } = await resolveRes.json();

      if (missing && missing.length > 0) {
        // Surface missing USNs for manual correction
        const entries: MissingUsnEntry[] = missing.map((usn: string) => {
          // Find the row index in the sheet
          const rowIndex = sheet.rows.findIndex(
            (r) => String(r[mapping.usnColumn] ?? "").trim().toUpperCase() === usn.toUpperCase()
          );
          return { rowIndex, usn, correctedUsn: "", skip: false };
        });
        setMissingUsnEntries(entries);
        setStep("fix-usns");
        setCurrentStepIndex(2);
        return;
      }

      // No missing USNs — go straight to building records
      await buildRecordsAndContinue(sheet, mapping, meta, resolved);
    } catch (e: any) {
      setError(e.message);
      setStep("review");
    }
  };

  /** After the user has corrected missing USNs, re-resolve and continue */
  const handleMissingUsnFixed = async () => {
    const sheet = parsedSheets[currentSheetIndex];
    setStep("analyzing");
    setError(null);

    try {
      // Re-resolve corrected USNs
      const correctedUsns = missingUsnEntries
        .filter((e) => !e.skip && e.correctedUsn?.trim())
        .map((e) => e.correctedUsn!.trim());

      let extraResolved: Record<string, { id: string; full_name: string }> = {};
      if (correctedUsns.length) {
        const res = await fetch("/api/attendance/upload?action=resolve-usn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usns: correctedUsns }),
        });
        const { resolved } = await res.json();
        // Map corrected USN back to the original USN in the sheet
        missingUsnEntries.forEach((e) => {
          if (!e.skip && e.correctedUsn?.trim() && resolved[e.correctedUsn.trim()]) {
            extraResolved[e.usn] = resolved[e.correctedUsn.trim()];
          }
        });
      }

      // Re-resolve all USNs including corrections
      const usns: string[] = Array.from(
        new Set(
          sheet.rows.map((r) => String(r[confirmedMapping.usnColumn] ?? "").trim()).filter(Boolean)
        )
      );
      const resolveRes = await fetch("/api/attendance/upload?action=resolve-usn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usns }),
      });
      const { resolved: baseResolved } = await resolveRes.json();
      const resolved = { ...baseResolved, ...extraResolved };

      await buildRecordsAndContinue(sheet, confirmedMapping, confirmedMeta, resolved);
    } catch (e: any) {
      setError(e.message);
      setStep("fix-usns");
    }
  };

  const buildRecordsAndContinue = async (
    sheet: SheetData,
    mapping: any,
    meta: any,
    resolved: Record<string, { id: string; full_name: string }>
  ) => {
    const records: any[] = [];

    for (const row of sheet.rows) {
      const usn = String(row[mapping.usnColumn] ?? "").trim();
      if (!usn) continue;
      const profile = resolved[usn] ?? resolved[usn.toUpperCase()];
      if (!profile) continue;

      for (const dc of mapping.dateColumns) {
        const date = dc.userDate || dc.detectedDate;
        if (!date) continue;
        const rawVal = String(row[dc.column] ?? "").trim().toUpperCase();
        if (!rawVal || rawVal === "-" || rawVal === "NULL") continue;
        const isPresent = ["P", "1", "YES", "TRUE", "PRESENT", "✔️", "✅", "☑️", "👍"].includes(rawVal);
        const isAbsent = ["A", "0", "NO", "FALSE", "ABSENT", "❌", "✖️", "👎"].includes(rawVal);
        if (!isPresent && !isAbsent) continue;
        const status = isPresent ? "Present" : "Absent";
        records.push({ student_id: profile.id, date, status, usn, studentName: profile.full_name });
      }
    }

    setPendingRecords(records);

    const studentIds = Array.from(new Set(records.map((r) => r.student_id)));
    const dates = Array.from(new Set(records.map((r) => r.date)));

    const dupRes = await fetch("/api/attendance/upload?action=check-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds, subjectName: meta.subjectName, dates }),
    });
    const { duplicates: dups } = await dupRes.json();

    const enriched = dups.map((d: any) => {
      const match = records.find((r) => r.student_id === d.student_id);
      return { ...d, usn: match?.usn, studentName: match?.studentName };
    });

    setDuplicates(enriched);
    setStep("duplicates");
    setCurrentStepIndex(3);
  };

  const handleDuplicateChoice = async (choice: "skip" | "overwrite") => {
    setStep("importing");
    setError(null);
    const sheet = parsedSheets[currentSheetIndex];
    try {
      const res = await fetch("/api/attendance/upload?action=process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: sheet.rows,
          columnMapping: {
            usn: confirmedMapping.usnColumn,
            dates: confirmedMapping.dateColumns
              .filter((d: any) => d.detectedDate || d.userDate)
              .map((d: any) => ({ column: d.column, date: d.userDate || d.detectedDate })),
          },
          subjectName: subjectMeta.subjectName,
          subjectCode: subjectMeta.subjectCode,
          semester: subjectMeta.semester,
          academicYear: subjectMeta.academicYear,
          overwriteDuplicates: choice === "overwrite",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("done");
      setCurrentStepIndex(4);
    } catch (e: any) {
      setError(e.message);
      setStep("duplicates");
    }
  };

  const resetWizard = () => {
    setStep("upload");
    setCurrentStepIndex(0);
    setResult(null);
    setAiMapping(null);
    setConfirmedMapping(null);
    setConfirmedMeta(null);
    setSubjectMeta(null);
    setParsedSheets([]);
    setMissingUsnEntries([]);
    setError(null);
  };

  return (
    <AppShell role={role}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-text-primary tracking-tight">
              Attendance Upload ({role === "admin" ? "Admin" : "Mentor"})
            </h1>
          </div>
          <p className="text-text-muted text-base">
            {role === "admin"
              ? "Admin tool: Upload and map attendance records for any subject or department."
              : "Upload your Excel attendance sheet. Our AI agent will automatically detect students, dates, and subjects for you."}
          </p>
        </div>

        <StepBar current={currentStepIndex} />

        <div className="card p-6">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-button flex items-start gap-3">
              <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {step === "upload" && <FileDropZone onParsed={handleFileParsed} />}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <div className="text-center">
                <p className="font-medium text-text-primary">AI is analysing your sheet…</p>
                <p className="text-sm text-text-muted mt-1">Detecting column mappings and date patterns</p>
              </div>
            </div>
          )}

          {step === "review" && aiMapping && (
            <AiMappingReview
              mapping={aiMapping}
              missingUsns={[]}
              sheetName={parsedSheets[currentSheetIndex]?.sheetName || "Sheet"}
              onConfirm={(mapping, meta) => handleMappingConfirmed(mapping, meta)}
            />
          )}

          {/* ── Manual USN Correction Step ───────────────────────────── */}
          {step === "fix-usns" && (
            <div className="space-y-6">
              <div className="p-4 bg-warning/5 border border-warning/30 rounded-card flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    {missingUsnEntries.length} USN{missingUsnEntries.length !== 1 ? "s" : ""} not found in the database
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Please correct or skip each USN before importing.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {missingUsnEntries.map((entry, idx) => (
                  <div
                    key={entry.usn}
                    className={`p-4 rounded-card border ${
                      entry.skip
                        ? "border-surface-border bg-surface opacity-60"
                        : "border-danger/30 bg-danger/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Edit2 className="w-3.5 h-3.5 text-danger" />
                        <span className="text-sm font-mono font-medium text-text-primary">
                          {entry.usn}
                        </span>
                        <span className="text-xs text-text-muted">(Row {entry.rowIndex + 2})</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entry.skip || false}
                          onChange={(e) => {
                            setMissingUsnEntries((prev) =>
                              prev.map((en, i) =>
                                i === idx ? { ...en, skip: e.target.checked } : en
                              )
                            );
                          }}
                          className="w-3.5 h-3.5"
                        />
                        Skip this row
                      </label>
                    </div>
                    {!entry.skip && (
                      <input
                        className="input text-sm py-1.5"
                        placeholder="Enter correct USN (e.g. 4SF24CI041)"
                        value={entry.correctedUsn || ""}
                        onChange={(e) => {
                          setMissingUsnEntries((prev) =>
                            prev.map((en, i) =>
                              i === idx ? { ...en, correctedUsn: e.target.value } : en
                            )
                          );
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("review");
                    setCurrentStepIndex(1);
                  }}
                  className="btn-ghost"
                >
                  Back
                </button>
                <button
                  onClick={handleMissingUsnFixed}
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Continue with {missingUsnEntries.filter((e) => !e.skip).length} Corrected USNs
                </button>
              </div>
            </div>
          )}

          {step === "duplicates" && (
            <DuplicateReview
              duplicates={duplicates}
              totalPending={pendingRecords.length}
              onChoice={handleDuplicateChoice}
              onBack={() => {
                setStep("review");
                setCurrentStepIndex(1);
              }}
            />
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <div className="text-center">
                <p className="font-medium text-text-primary">Importing records…</p>
                <p className="text-sm text-text-muted mt-1">Writing to database, please wait</p>
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-heading font-bold text-text-primary text-xl mb-2">Import Complete!</h3>
              <p className="text-xs text-text-muted mb-6">
                Sheet {currentSheetIndex + 1} of {parsedSheets.length}: <strong>{parsedSheets[currentSheetIndex]?.sheetName}</strong>
              </p>

              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="p-4 bg-surface rounded-card border border-surface-border">
                  <p className="text-2xl font-bold text-success">{result.inserted}</p>
                  <p className="text-xs text-text-muted mt-1">Inserted</p>
                </div>
                <div className="p-4 bg-surface rounded-card border border-surface-border">
                  <p className="text-2xl font-bold text-accent">{result.skipped}</p>
                  <p className="text-xs text-text-muted mt-1">Skipped</p>
                </div>
                <div className="p-4 bg-surface rounded-card border border-surface-border">
                  <p className="text-2xl font-bold text-danger">{result.errors.length}</p>
                  <p className="text-xs text-text-muted mt-1">Errors</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="text-left p-4 bg-danger/5 rounded-button border border-danger/20 mb-6 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-danger mb-2">Errors:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-text-muted">{e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={resetWizard} className="btn-ghost">
                  <Upload className="w-4 h-4" /> Upload Another
                </button>
                {currentSheetIndex < parsedSheets.length - 1 ? (
                  <button
                    onClick={() => {
                      const nextIdx = currentSheetIndex + 1;
                      setCurrentSheetIndex(nextIdx);
                      setStep("upload");
                      setCurrentStepIndex(0);
                      setResult(null);
                      setAiMapping(null);
                      setConfirmedMapping(null);
                      setConfirmedMeta(null);
                      setSubjectMeta(null);
                      setMissingUsnEntries([]);
                      analyzeSheet(parsedSheets[nextIdx]);
                    }}
                    className="btn-primary"
                  >
                    Process Next Sheet →
                  </button>
                ) : (
                  <a
                    href={role === "admin" ? "/admin/attendance" : "/mentor/attendance"}
                    className="btn-primary"
                  >
                    View Attendance
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
