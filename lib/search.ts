import type { VoterRecord } from "./types";

/** Strip dashes, spaces, and non-digits for CNIC matching. */
export function normalizeCnic(input: string): string {
  return input.replace(/\D/g, "");
}

/** True when the query contains only CNIC digits (and optional dashes/spaces). */
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

/** Search voters by CNIC only. */
export function searchVoters(
  voters: VoterRecord[],
  query: string,
): VoterRecord[] {
  const digits = normalizeCnic(query);
  if (!digits) return [];

  const exact = voters.filter((v) => v.cnicDigits === digits);
  if (exact.length > 0) return exact;

  if (digits.length < 5) return [];
  return voters.filter((v) => v.cnicDigits.startsWith(digits));
}

export const searchByCnic = searchVoters;

export function isActiveSearch(query: string): boolean {
  return normalizeCnic(query).length >= 5;
}
