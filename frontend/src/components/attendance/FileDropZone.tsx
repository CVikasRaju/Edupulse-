"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface ParsedFile {
  fileName: string;
  sheets: string[];
  workbook: XLSX.WorkBook;
}

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  headerRowIndex: number;
}

interface Props {
  onParsed: (data: { file: ParsedFile; selectedSheets: SheetData[] }) => void;
}

/**
 * Finds the most likely header row index in a raw 2D array.
 * Looks for the row with the most non-empty string cells that look like labels
 * (not dates or numbers). Searches the first 10 rows.
 */
function detectHeaderRow(raw: any[][]): number {
  const USN_REGEX = /^4sf(?:ci|cs|ra|ec|is)\d{2,3}$/i;
  const GENERIC_USN_REGEX = /\d{2}[A-Z]{2,}\d{3}/i;
  // Patterns that strongly indicate a header keyword
  const HEADER_KEYWORDS = /usn|roll|name|sl\.?\s*no|sno|date|present|absent|status|subject|student|branch|section/i;

  let bestRow = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i] || [];
    let score = 0;
    let usnLike = 0;

    for (const cell of row) {
      if (cell == null || cell === "") continue;
      const str = String(cell).trim();
      if (HEADER_KEYWORDS.test(str)) score += 3;
      else if (typeof cell === "string" && isNaN(Number(str))) score += 1;
      // Penalize rows that look like data (USN values, TRUE/FALSE, numbers)
      if (USN_REGEX.test(str) || GENERIC_USN_REGEX.test(str)) usnLike++;
      if (str === "TRUE" || str === "FALSE" || str === "P" || str === "A") score -= 2;
    }
    // If majority of cells are USN-like, it's probably a data row
    const nonEmpty = row.filter((c: any) => c != null && c !== "").length;
    if (nonEmpty > 0 && usnLike / nonEmpty > 0.5) score -= 10;

    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

export default function FileDropZone({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false, raw: true });
        const result: ParsedFile = {
          fileName: file.name,
          sheets: wb.SheetNames,
          workbook: wb,
        };
        setParsed(result);
        setSelectedSheets([wb.SheetNames[0]]);
      } catch {
        setError("Could not read this file. Please use a valid .xlsx or .xls, or .csv file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const toggleSheet = (name: string) => {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleConfirm = () => {
    if (!parsed || selectedSheets.length === 0) return;

    const sheetData: SheetData[] = selectedSheets.map((name) => {
      const ws = parsed.workbook.Sheets[name];

      // Read as raw 2D array (no header inference) so we can pick the right row
      const raw = XLSX.utils.sheet_to_json<any[]>(ws, {
        header: 1,
        defval: null,
        raw: true, // keep numbers/booleans as-is
      }) as any[][];

      const headerRowIdx = detectHeaderRow(raw);
      const headerRow = raw[headerRowIdx] || [];
      const headers = headerRow.map((h: any) => String(h ?? "").trim());

      // Build rows from headerRowIdx+1 onwards
      const rows = raw
        .slice(headerRowIdx + 1)
        .map((row) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] ?? null;
          });
          return obj;
        })
        .filter((r) => Object.values(r).some((v) => v !== null && v !== ""));

      return { sheetName: name, headers, rows, headerRowIndex: headerRowIdx };
    });

    onParsed({ file: parsed, selectedSheets: sheetData });
  };

  if (parsed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-surface rounded-card border border-surface-border">
          <FileSpreadsheet className="w-8 h-8 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary truncate">{parsed.fileName}</p>
            <p className="text-xs text-text-muted">
              {parsed.sheets.length} sheet{parsed.sheets.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            onClick={() => {
              setParsed(null);
              setSelectedSheets([]);
            }}
            className="btn-icon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="label mb-3">Select sheets to import</p>
          <div className="space-y-2">
            {parsed.sheets.map((name) => (
              <label
                key={name}
                className="flex items-center gap-3 p-3 rounded-button border border-surface-border hover:border-accent/30 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedSheets.includes(name)}
                  onChange={() => toggleSheet(name)}
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm text-text-primary">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedSheets.length === 0}
          className="btn-primary w-full"
        >
          <CheckCircle className="w-4 h-4" />
          Analyse {selectedSheets.length} Sheet{selectedSheets.length !== 1 ? "s" : ""} with AI
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className={`drop-zone flex flex-col items-center gap-4 ${dragging ? "drop-zone-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-accent" />
        </div>
        <div>
          <p className="font-medium text-text-primary">Drop your attendance sheet here</p>
          <p className="text-sm text-text-muted mt-1">Supports .xlsx, .xls, .csv</p>
        </div>
        <span className="btn-ghost text-sm">Browse Files</span>
      </label>
      {error && <p className="text-danger text-sm mt-3">{error}</p>}
    </div>
  );
}
