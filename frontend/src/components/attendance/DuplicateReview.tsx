"use client";

import { AlertTriangle, SkipForward, RefreshCw } from "lucide-react";

interface DuplicateRecord {
  student_id: string;
  studentName?: string;
  usn?: string;
  date: string;
  subject_name: string;
}

interface Props {
  duplicates: DuplicateRecord[];
  totalPending: number;
  onChoice: (choice: "skip" | "overwrite") => void;
  onBack: () => void;
}

export default function DuplicateReview({ duplicates, totalPending, onChoice, onBack }: Props) {
  if (duplicates.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-success" />
        </div>
        <h3 className="font-heading font-bold text-text-primary mb-2">No Duplicates Found</h3>
        <p className="text-sm text-text-muted mb-6">All {totalPending} records are new and ready to import.</p>
        <button onClick={() => onChoice("skip")} className="btn-primary mx-auto">
          Import All Records
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-accent/5 border border-accent/30 rounded-card flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            {duplicates.length} duplicate record{duplicates.length !== 1 ? "s" : ""} detected
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            These dates already exist in the database for these students. Choose how to handle them.
          </p>
        </div>
      </div>

      {/* Duplicate table */}
      <div className="card overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>USN</th>
                <th>Student</th>
                <th>Date</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.slice(0, 50).map((d, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{d.usn || d.student_id.slice(0, 8)}</td>
                  <td>{d.studentName || "—"}</td>
                  <td className="text-xs">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="text-xs text-text-muted">{d.subject_name}</td>
                </tr>
              ))}
              {duplicates.length > 50 && (
                <tr>
                  <td colSpan={4} className="text-center text-xs text-text-muted py-2">
                    … and {duplicates.length - 50} more
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChoice("skip")}
          className="btn-ghost flex-col h-auto py-4 gap-2 text-center"
        >
          <SkipForward className="w-5 h-5 text-text-muted mx-auto" />
          <span className="text-sm font-medium">Skip Duplicates</span>
          <span className="text-xs text-text-muted">
            Import {totalPending - duplicates.length} new records only
          </span>
        </button>
        <button
          onClick={() => onChoice("overwrite")}
          className="btn-ghost flex-col h-auto py-4 gap-2 border-accent/30 hover:border-accent/50 text-center"
        >
          <RefreshCw className="w-5 h-5 text-accent mx-auto" />
          <span className="text-sm font-medium text-accent">Overwrite All</span>
          <span className="text-xs text-text-muted">
            Replace existing + add {totalPending - duplicates.length} new
          </span>
        </button>
      </div>

      <button onClick={onBack} className="text-xs text-text-muted hover:text-text-primary transition-colors w-full text-center">
        ← Go back and adjust mapping
      </button>
    </div>
  );
}
