import { normalizeCnic } from "./search";

/** CNICs that get a special premium result treatment. */
const PREMIUM_CNICS = new Set(["5440004160849"]);

export function isPremiumCnic(cnic: string | undefined | null): boolean {
  if (!cnic) return false;
  return PREMIUM_CNICS.has(normalizeCnic(cnic));
}
