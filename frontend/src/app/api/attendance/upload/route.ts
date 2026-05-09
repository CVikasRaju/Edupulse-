import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface RawRow {
  [key: string]: string | number | boolean | null;
}

interface AnalyzeRequest {
  headers: string[];
  sampleRows: RawRow[];
  allRows?: RawRow[]; // all rows for better USN column scoring
  subjectHint?: string;
}

interface ProcessRequest {
  rows: RawRow[];
  columnMapping: {
    usn: string;
    dates: { column: string; date: string }[];
  };
  subjectName: string;
  subjectCode?: string;
  semester?: number;
  academicYear?: string;
  markedBy?: string;
  overwriteDuplicates?: boolean;
}

// ─── Step 1: AI column analysis ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "analyze") return handleAnalyze(req);
  if (action === "check-duplicates") return handleCheckDuplicates(req);
  if (action === "process") return handleProcess(req);
  if (action === "resolve-usn") return handleResolveUsn(req);

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── AI: Analyze headers and detect column mappings ────────────────────────
async function handleAnalyze(req: NextRequest) {
  const body: AnalyzeRequest = await req.json();
  const { headers, sampleRows, allRows, subjectHint } = body;

  // Always run local detection first — used as fallback AND to enrich the AI prompt
  const localMapping = performLocalDetection(headers, allRows ?? sampleRows);

  // Collect null/missing value problems across ALL rows
  const problems = findDataProblems(headers, allRows ?? sampleRows, localMapping);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert at analyzing Indian college attendance spreadsheets.

HEADERS (${headers.length} columns): ${JSON.stringify(headers)}

SAMPLE DATA (up to 8 rows):
${JSON.stringify(sampleRows.slice(0, 8), null, 2)}

Subject hint: ${subjectHint || "none"}

LOCAL HEURISTIC GUESS (use this as a starting point, correct if wrong):
- USN column: "${localMapping.usnColumn}"
- Name column: "${localMapping.nameColumn}"
- Present marker: "${localMapping.presentValue}", Absent marker: "${localMapping.absentValue}"

RULES:
1. USN patterns at this college: 4SFYYBB### where YY=year (2-digit), BB=branch (CI/CS/RA/EC/IS), ###=3-digit number. Example: 4SF24CI041, 4SF22CS012.
2. The USN column contains these patterns — identify it even if the header says "Sl No", "Roll No", "Reg No", "Enrollment", "ID", or is blank.
3. Date columns: The column HEADER itself may be a date string ("06/12/25", "Dec 6", "06-Dec-2025"), OR it may be a session label ("Session 1", "Class 1", "1").
   - Excel serial numbers in the range 30000–60000 are dates (offset from 1899-12-30).
   - Return detectedDate as YYYY-MM-DD or null.
4. Present/Absent markers may be: P/A, 1/0, TRUE/FALSE, YES/NO, Present/Absent, ✅/❌, ✔️/✖️, 👍/👎.
5. If a date column header is itself a date (e.g. "06-12-25" = Dec 6 2025), parse it as YYYY-MM-DD.
6. hasMissingDates = true if any dateColumn has detectedDate = null.
7. Detect subject name from headers, sheet name hint, or any title-like rows above the data.

Return ONLY valid JSON — no markdown, no explanation outside JSON:
{
  "usnColumn": "exact header string",
  "nameColumn": "exact header string or null",
  "dateColumns": [
    { "column": "exact header", "detectedDate": "YYYY-MM-DD or null", "confidence": "high|medium|low" }
  ],
  "presentValue": "P",
  "absentValue": "A",
  "detectedSubject": "subject name or null",
  "hasMissingDates": false,
  "reasoning": "one sentence"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip markdown fences if present
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const mapping = JSON.parse(jsonMatch[0]);

    // Validate that usnColumn is a real header; if not, fall back to local
    if (!headers.includes(mapping.usnColumn)) {
      mapping.usnColumn = localMapping.usnColumn;
    }

    return NextResponse.json({ success: true, mapping, problems });
  } catch {
    // Full fallback to local heuristics
    return NextResponse.json({
      success: true,
      mapping: localMapping,
      problems,
      note: "AI unavailable — using local heuristic detection",
    });
  }
}

// ─── Detect data problems (null USNs, null dates, invalid values) ──────────
function findDataProblems(
  headers: string[],
  rows: RawRow[],
  mapping: ReturnType<typeof performLocalDetection>
): { type: "null_usn" | "invalid_usn" | "null_date"; rowIndex: number; column: string; currentValue: any }[] {
  const USN_REGEX = /^4sf(?:ci|cs|ra|ec|is)\d{2,3}$/i;
  const GENERIC_USN_REGEX = /\d{2}[A-Z]{2,}\d{3}/i;
  const problems: { type: "null_usn" | "invalid_usn" | "null_date"; rowIndex: number; column: string; currentValue: any }[] = [];

  rows.forEach((row: RawRow, idx: number) => {
    const usn = String(row[mapping.usnColumn] ?? "").trim();

    // Skip completely empty rows
    const nonEmpty = Object.values(row).filter((v) => v !== null && v !== "").length;
    if (nonEmpty === 0) return;

    if (!usn) {
      problems.push({ type: "null_usn", rowIndex: idx, column: mapping.usnColumn, currentValue: null });
    } else if (!USN_REGEX.test(usn) && !GENERIC_USN_REGEX.test(usn)) {
      problems.push({ type: "invalid_usn", rowIndex: idx, column: mapping.usnColumn, currentValue: usn });
    }
  });

  return problems;
}

// ─── Local heuristic detection ─────────────────────────────────────────────
function performLocalDetection(headers: string[], sampleRows: RawRow[]) {
  const normHeaders = headers.map((h) => h.trim().toLowerCase());

  // ---------- USN detection ----------
  const specificUsnRegex = /^4sf(?:ci|cs|ra|ec|is)\d{2,3}$/i;
  const genericUsnRegex = /\d{2}[A-Z]{2,}\d{3}/i;

  // First try: header keyword match
  let usnColumn: string | null = null;
  const usnHeaderIdx = normHeaders.findIndex((h: string) => /\busn\b|roll[_\s-]?no?|reg(istration)?[_\s-]?no?|enrollment|student[_-]?id/i.test(h));
  if (usnHeaderIdx !== -1) usnColumn = headers[usnHeaderIdx];

  // Second try: column with most USN-pattern values
  if (!usnColumn) {
    const usnMatchCounts: Record<string, number> = {};
    for (const row of sampleRows) {
      for (const key in row) {
        const val = String(row[key] ?? "").trim();
        if (specificUsnRegex.test(val) || genericUsnRegex.test(val)) {
          usnMatchCounts[key] = (usnMatchCounts[key] || 0) + 1;
        }
      }
    }
    const best = Object.entries(usnMatchCounts).sort((a, b) => b[1] - a[1])[0];
    if (best) usnColumn = best[0];
  }

  // Fallback
  usnColumn = usnColumn || headers[0];

  // ---------- Name detection ----------
  const nameHeaderIdx = normHeaders.findIndex((h: string) => /\bname\b|full[_-]?name|student[_-]?name/i.test(h));
  const nameColumn = nameHeaderIdx !== -1 ? headers[nameHeaderIdx] : null;

  // ---------- Date column detection ----------
  // A column is a date column if its header IS a date, OR if the column contains attendance markers (P/A/TRUE/etc.)
  const ATTENDANCE_MARKERS = new Set(["P", "A", "1", "0", "YES", "NO", "TRUE", "FALSE",
    "PRESENT", "ABSENT", "✔️", "✅", "☑️", "👍", "❌", "✖️", "👎"]);

  // Parse a date string or Excel serial
  function parseDate(raw: any): string | null {
    if (raw == null || raw === "") return null;
    const str = String(raw).trim();
    // Excel serial (numbers in attendance range)
    if (/^\d+$/.test(str)) {
      const num = Number(str);
      if (num > 30000 && num < 60000) {
        const d = new Date((num - 25569) * 86400 * 1000);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      }
    }
    // Common date formats: dd/mm/yy, dd-mm-yy, dd/mm/yyyy, yyyy-mm-dd, "6-Dec-2025", "Dec 6", etc.
    const patterns = [
      { re: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, handler: (m: RegExpMatchArray) => {
        const [, d, mo, y] = m;
        const year = y.length === 2 ? (Number(y) > 50 ? `19${y}` : `20${y}`) : y;
        return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }},
      { re: /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, handler: (m: RegExpMatchArray) => {
        const [, y, mo, d] = m;
        return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }},
    ];
    for (const { re, handler } of patterns) {
      const m = str.match(re);
      if (m) {
        try { const iso = handler(m); if (!isNaN(new Date(iso).getTime())) return iso; } catch { /* skip */ }
      }
    }
    // Try Date.parse as fallback
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && str.length > 4) return parsed.toISOString().split("T")[0];
    return null;
  }

  const dateColumns: { column: string; detectedDate: string | null; confidence: "high" | "medium" | "low" }[] = [];

  for (const col of headers) {
    if (col === usnColumn || col === nameColumn || !col.trim()) continue;

    // Check if header itself is a date
    const headerDate = parseDate(col);
    if (headerDate) {
      dateColumns.push({ column: col, detectedDate: headerDate, confidence: "high" });
      continue;
    }

    // Check if the column contains attendance markers (indicating it IS a date/session column)
    let isAttendanceCol = false;
    let sessionDate: string | null = null;
    let confidence: "high" | "medium" | "low" = "low";

    for (const row of sampleRows) {
      const raw = row[col];
      if (raw == null || raw === "") continue;
      const val = String(raw).trim().toUpperCase();
      if (ATTENDANCE_MARKERS.has(val)) {
        isAttendanceCol = true;
        // Try to derive date from the column header if it's a session label
        break;
      }
      // Try to parse the cell as an Excel serial or date string
      const d = parseDate(raw);
      if (d) { sessionDate = d; confidence = "medium"; break; }
    }

    if (isAttendanceCol || sessionDate) {
      // Try to parse the column header as a date one more time with looser matching
      const looseDateInHeader = col.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/) ||
        col.match(/\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/);
      if (looseDateInHeader) {
        const d = parseDate(looseDateInHeader[0]);
        if (d) { dateColumns.push({ column: col, detectedDate: d, confidence: "high" }); continue; }
      }
      dateColumns.push({ column: col, detectedDate: sessionDate, confidence: isAttendanceCol ? "medium" : confidence });
    }
  }

  // ---------- Present / Absent marker detection ----------
  const PRESENT_MARKERS = ["P", "1", "YES", "TRUE", "PRESENT", "PRESENTEE", "✔️", "✅", "☑️", "👍"];
  const ABSENT_MARKERS  = ["A", "0", "NO", "FALSE", "ABSENT", "ABSENTEE", "❌", "✖️", "👎"];

  const presentCounts: Record<string, number> = {};
  const absentCounts: Record<string, number> = {};

  for (const row of sampleRows) {
    for (const key in row) {
      if (key === usnColumn || key === nameColumn) continue;
      const val = String(row[key] ?? "").trim().toUpperCase();
      if (PRESENT_MARKERS.map((x: string) => x.toUpperCase()).includes(val)) presentCounts[val] = (presentCounts[val] || 0) + 1;
      if (ABSENT_MARKERS.map((x: string) => x.toUpperCase()).includes(val))  absentCounts[val]  = (absentCounts[val]  || 0) + 1;
    }
  }

  const presentValue = Object.entries(presentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "P";
  const absentValue  = Object.entries(absentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A";

  const hasMissingDates = dateColumns.every((dc) => !dc.detectedDate);

  return {
    usnColumn,
    nameColumn,
    dateColumns,
    presentValue,
    absentValue,
    detectedSubject: null as string | null,
    hasMissingDates,
    reasoning: "Local heuristic: header-keyword + value-pattern USN detection, header-date parsing for date columns, attendance-marker recognition",
  };
}

// ─── Check duplicates in database ──────────────────────────────────────────
async function handleCheckDuplicates(req: NextRequest) {
  const supabase = await createClient();
  const { studentIds, subjectName, dates }: { studentIds: string[]; subjectName: string; dates: string[] } = await req.json();

  if (!studentIds.length || !dates.length) {
    return NextResponse.json({ duplicates: [] });
  }

  const { data, error } = await supabase
    .from("AttendanceRecord")
    .select("student_id, date, subject_name, Profile(usn, full_name)")
    .in("student_id", studentIds)
    .eq("subject_name", subjectName)
    .in("date", dates);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the response for the UI
  const flattened = (data || []).map((d: any) => ({
    student_id: d.student_id,
    date: d.date,
    subject_name: d.subject_name,
    usn: d.Profile?.usn,
    studentName: d.Profile?.full_name,
  }));

  return NextResponse.json({ duplicates: flattened });
}

// ─── Resolve USNs to Profile IDs ───────────────────────────────────────────
async function handleResolveUsn(req: NextRequest) {
  const supabase = await createClient();
  const { usns }: { usns: string[] } = await req.json();

  const cleanUsns = usns.map((u) => u.trim()).filter(Boolean);
  if (!cleanUsns.length) return NextResponse.json({ resolved: {}, missing: [] });

  const { data, error } = await supabase
    .from("Profile")
    .select("id, usn, full_name")
    .in("usn", cleanUsns);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resolved: Record<string, { id: string; full_name: string }> = {};
  const missing: string[] = [];

  cleanUsns.forEach((usn) => {
    // Case-insensitive match
    const profile = data?.find((p: { usn: string | null }) => p.usn?.trim().toUpperCase() === usn.toUpperCase());
    if (profile) resolved[usn] = { id: profile.id, full_name: profile.full_name };
    else missing.push(usn);
  });

  return NextResponse.json({ resolved, missing });
}

// ─── Process and insert attendance records ─────────────────────────────────
async function handleProcess(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: ProcessRequest = await req.json();
  const { rows, columnMapping, subjectName, subjectCode, semester, academicYear, overwriteDuplicates = false } = body;

  const USN_REGEX = /^4sf(?:ci|cs|ra|ec|is)\d{2,3}$/i;
  const GENERIC_USN_REGEX = /\d{2}[A-Z]{2,}\d{3}/i;

  const records: any[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // 1. Collect all unique USNs from the file
  const allUsns = new Set<string>();
  for (const row of rows) {
    const rawUsn = row[columnMapping.usn];
    const usn = String(rawUsn ?? "").trim();
    if (usn && (USN_REGEX.test(usn) || GENERIC_USN_REGEX.test(usn))) {
      allUsns.add(usn.toUpperCase());
    }
  }

  if (allUsns.size === 0) {
    return NextResponse.json({ inserted: 0, skipped: rows.length, errors: ["No valid USNs found in file"] });
  }

  // 2. Resolve all USNs to Profile IDs in one query
  const { data: profiles, error: profileError } = await supabase
    .from("Profile")
    .select("id, usn")
    .in("usn", Array.from(allUsns));

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Map USN -> ID for quick lookup
  const usnToIdMap = new Map<string, string>();
  profiles?.forEach((p: { usn: string | null, id: string }) => {
    if (p.usn) usnToIdMap.set(p.usn.toUpperCase(), p.id);
  });

  // 3. Process rows and generate records
  for (const row of rows) {
    const rawUsn = row[columnMapping.usn];
    const usn = String(rawUsn ?? "").trim().toUpperCase();

    const profileId = usnToIdMap.get(usn);
    if (!profileId) {
      if (usn && (USN_REGEX.test(usn) || GENERIC_USN_REGEX.test(usn))) {
        errors.push(`USN not found in database: ${usn}`);
      }
      continue;
    }

    for (const { column, date } of columnMapping.dates) {
      if (!date) continue;
      const rawValue = String(row[column] ?? "").trim().toUpperCase();
      if (!rawValue || rawValue === "NULL" || rawValue === "-" || rawValue === "") continue;

      const isPresent = ["P", "1", "YES", "TRUE", "PRESENT", "✔️", "✅", "☑️", "👍"].includes(rawValue);
      const isAbsent  = ["A", "0", "NO", "FALSE", "ABSENT", "❌", "✖️", "👎"].includes(rawValue);
      if (!isPresent && !isAbsent) { skipped++; continue; }

      const status = isPresent ? "Present" : "Absent";
      let parsedDate: string;
      try {
        parsedDate = new Date(date).toISOString();
      } catch {
        errors.push(`Invalid date format: ${date}`);
        continue;
      }

      records.push({
        student_id: profileId,
        subject_name: subjectName,
        subject_code: subjectCode || null,
        date: parsedDate,
        status,
        marked_by: user.id,
        semester: semester || null,
        academic_year: academicYear || null,
      });
    }
  }

  if (!records.length) {
    return NextResponse.json({ inserted: 0, skipped, errors });
  }

  // 4. Batch Upsert (Max 1000 records at a time for safety, though Supabase handles more)
  const { error: upsertError } = await supabase
    .from("AttendanceRecord")
    // @ts-ignore – ignoreDuplicates not typed in all SDK versions
    .upsert(records, {
      onConflict: "student_id,subject_name,date",
      ignoreDuplicates: !overwriteDuplicates,
    });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({
    inserted: records.length,
    skipped,
    errors: errors.slice(0, 50) // Limit errors returned to client
  });
}
