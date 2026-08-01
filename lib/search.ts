import type { VoterRecord } from "./types";

/** Strip dashes, spaces, and non-digits for CNIC matching. */
export function normalizeCnic(input: string): string {
  return input.replace(/\D/g, "");
}

/** True when the query is digits / CNIC-shaped (not a name). */
export function isCnicQuery(query: string): boolean {
  const compact = query.replace(/[\s-]/g, "");
  return compact.length > 0 && /^\d+$/.test(compact);
}

/** Format digits as #####-#######-# when length is 13. */
export function formatCnicInput(raw: string): string {
  const digits = normalizeCnic(raw).slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function normalizeNameQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function matchesName(voter: VoterRecord, needle: string): boolean {
  const fields = [
    voter.name.ur,
    voter.name.en,
    voter.fatherName.ur,
    voter.fatherName.en,
  ];
  return fields.some((field) =>
    field.toLowerCase().replace(/\s+/g, " ").includes(needle),
  );
}

/**
 * Search by CNIC (digits) or by name / father's name (Urdu or English).
 */
export function searchVoters(
  voters: VoterRecord[],
  query: string,
): VoterRecord[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (isCnicQuery(trimmed)) {
    const digits = normalizeCnic(trimmed);
    const exact = voters.filter((v) => v.cnicDigits === digits);
    if (exact.length > 0) return exact;
    if (digits.length < 5) return [];
    return voters.filter((v) => v.cnicDigits.startsWith(digits));
  }

  const needle = normalizeNameQuery(trimmed);
  if (needle.length < 2) return [];

  return voters.filter((v) => matchesName(v, needle));
}

/** Keep old name as alias for any remaining imports. */
export const searchByCnic = searchVoters;

export function isActiveSearch(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (isCnicQuery(trimmed)) return normalizeCnic(trimmed).length >= 5;
  return normalizeNameQuery(trimmed).length >= 2;
}
