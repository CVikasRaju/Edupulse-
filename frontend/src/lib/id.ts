// ══════════════════════════════════════════
// EduPulse — ID generation helper
//
// The SQL schema uses `"id" TEXT NOT NULL` with NO
// database-side default (the old Prisma client used
// to generate UUIDs itself). Every insert through the
// Supabase client MUST provide an explicit id, so all
// create paths use this helper.
// ══════════════════════════════════════════

export function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for very old environments
  return `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
