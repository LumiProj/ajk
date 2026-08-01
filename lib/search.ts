import type { VoterRecord } from "./types";

/** Strip dashes, spaces, and non-digits for CNIC matching. */
export function normalizeCnic(input: string): string {
  return input.replace(/\D/g, "");
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

/**
 * CNIC-first search. Exact match preferred; otherwise prefix match
 * once the user has entered at least 5 digits.
 */
export function searchByCnic(
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
