"use client";

import { useState } from "react";
import { Brain, CheckCircle, AlertTriangle, Calendar, Edit2, Plus } from "lucide-react";

interface DateColumn {
  column: string;
  detectedDate: string | null;
  confidence: "high" | "medium" | "low";
  userDate?: string; // user-corrected date
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

interface MissingUsnEntry {
  usn: string;
  name?: string;
  resolvedId?: string;
  skip?: boolean;
}

interface Props {
  mapping: AiMapping;
  missingUsns: MissingUsnEntry[];
  sheetName: string;
  onConfirm: (mapping: AiMapping, metadata: {
    subjectName: string;
    subjectCode: string;
    semester: number | null;
    academicYear: string;
    classDays: string[];
  }) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-success",
  medium: "text-accent",
  low: "text-danger",
};

export default function AiMappingReview({ mapping, missingUsns, sheetName, onConfirm }: Props) {
  const [editedMapping, setEditedMapping] = useState<AiMapping>(mapping);
  const [subjectName, setSubjectName] = useState(mapping.detectedSubject || "");
  const [subjectCode, setSubjectCode] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [classDays, setClassDays] = useState<string[]>([]);
  const [missingEntries, setMissingEntries] = useState<MissingUsnEntry[]>(missingUsns);

  const toggleClassDay = (day: string) => {
    setClassDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const updateDateColumn = (index: number, date: string) => {
    setEditedMapping((prev) => ({
      ...prev,
      dateColumns: prev.dateColumns.map((d, i) => i === index ? { ...d, userDate: date, detectedDate: date } : d),
    }));
  };

  const updateMissingEntry = (usn: string, field: keyof MissingUsnEntry, value: any) => {
    setMissingEntries((prev) => prev.map((e) => e.usn === usn ? { ...e, [field]: value } : e));
  };

  const handleConfirm = () => {
    onConfirm(
      editedMapping,
      {
        subjectName,
        subjectCode,
        semester: semester ? parseInt(semester) : null,
        academicYear,
        classDays,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Reasoning */}
      <div className="p-4 bg-accent/5 border border-accent/20 rounded-card">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">AI Analysis for &ldquo;{sheetName}&rdquo;</p>
            <p className="text-xs text-text-muted">{mapping.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Subject Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Subject Name *</label>
          <input className="input" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Data Engineering and AI" />
        </div>
        <div>
          <label className="label">Subject Code</label>
          <input className="input" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="e.g. CS501" />
        </div>
        <div>
          <label className="label">Semester</label>
          <input className="input" type="number" min={1} max={8} value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 5" />
        </div>
        <div>
          <label className="label">Academic Year</label>
          <input className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2024-2025" />
        </div>
      </div>

      {/* Detected Mappings */}
      <div>
        <p className="label mb-3">Detected Column Mappings</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-surface rounded-button border border-surface-border">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-text-muted">USN Column:</span>
            <span className="text-sm font-medium text-text-primary">{mapping.usnColumn || "Not detected"}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface rounded-button border border-surface-border">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-text-muted">Attendance Values:</span>
            <span className="text-sm font-medium text-text-primary">Present = {mapping.presentValue}, Absent = {mapping.absentValue}</span>
          </div>
        </div>
      </div>

      {/* Date Columns */}
      <div>
        <p className="label mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Columns ({editedMapping.dateColumns.length} detected)
        </p>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {editedMapping.dateColumns.map((col, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-button border border-surface-border">
              <span className={`text-xs font-medium ${CONFIDENCE_COLOR[col.confidence]}`}>
                {col.confidence.toUpperCase()}
              </span>
              <span className="text-sm text-text-muted flex-1 truncate">{col.column}</span>
              {col.detectedDate ? (
                <span className="text-xs text-success font-mono">{col.detectedDate}</span>
              ) : (
                <input
                  type="date"
                  className="input text-xs py-1 w-36"
                  value={col.userDate || ""}
                  onChange={(e) => updateDateColumn(i, e.target.value)}
                  title="Set the date for this session"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Missing Dates Dialog */}
      {mapping.hasMissingDates && (
        <div className="p-4 border border-accent/30 bg-accent/5 rounded-card">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary">Some session columns have no dates. Which days does this class usually run?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleClassDay(day)}
                className={`px-3 py-1.5 rounded-button text-xs font-medium transition-all border ${
                  classDays.includes(day)
                    ? "bg-accent text-background border-accent"
                    : "border-surface-border text-text-muted hover:border-accent/30"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          {classDays.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              AI will suggest dates using: {classDays.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Missing USNs */}
      {missingEntries.length > 0 && (
        <div>
          <p className="label mb-3 flex items-center gap-2 text-danger">
            <AlertTriangle className="w-4 h-4" />
            {missingEntries.length} USN{missingEntries.length !== 1 ? "s" : ""} not found in database
          </p>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {missingEntries.map((entry) => (
              <div key={entry.usn} className="p-3 bg-surface rounded-button border border-danger/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-text-primary">{entry.usn}</span>
                    {entry.name && <span className="text-xs text-text-muted ml-2">({entry.name})</span>}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entry.skip || false}
                      onChange={(e) => updateMissingEntry(entry.usn, "skip", e.target.checked)}
                    />
                    Skip
                  </label>
                </div>
                {!entry.skip && (
                  <input
                    className="input text-xs py-1.5"
                    placeholder="Enter Profile ID to manually link, or skip"
                    value={entry.resolvedId || ""}
                    onChange={(e) => updateMissingEntry(entry.usn, "resolvedId", e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!subjectName.trim()}
        className="btn-primary w-full"
      >
        <CheckCircle className="w-4 h-4" />
        Check for Duplicates & Preview Import
      </button>
    </div>
  );
}
