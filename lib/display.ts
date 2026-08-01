import type { Lang, LocalizedString } from "./types";

export function pick(value: LocalizedString, lang: Lang) {
  const preferred = lang === "ur" ? value.ur : value.en;
  const fallback = lang === "ur" ? value.en : value.ur;
  return (preferred || fallback || "").trim();
}

const REL_PREFIX =
  /^(زوجہ|ولد|بنت|دختر|والدہ|شوہر|w\/o|s\/o|d\/o)\s+/i;

export type RelationKind = "wife" | "daughter" | "son";

export function detectRelation(
  fatherName: LocalizedString,
  gender: "male" | "female",
): RelationKind {
  const text = `${fatherName.ur || ""} ${fatherName.en || ""}`.trim();
  if (/^(زوجہ|w\/o)\b/i.test(text)) return "wife";
  if (/^(دختر|بنت|d\/o)\b/i.test(text)) return "daughter";
  if (/^(ولد|s\/o)\b/i.test(text)) return "son";
  return gender === "female" ? "wife" : "son";
}

export function relationLabel(kind: RelationKind, lang: Lang) {
  if (lang === "ur") {
    if (kind === "wife") return "زوجہ";
    if (kind === "daughter") return "دختر";
    return "ولد";
  }
  if (kind === "wife") return "w/o";
  if (kind === "daughter") return "d/o";
  return "s/o";
}

export function relationPerson(fatherName: LocalizedString, lang: Lang) {
  return pick(fatherName, lang).replace(REL_PREFIX, "").trim();
}

const OCCUPATION_EN: Record<string, string> = {
  "خانہ داری": "Housewife",
  کاروبار: "Business",
  تجارت: "Trade",
  نوکری: "Job",
  "طالب علم": "Student",
  "طلبہ علم": "Student",
  ملازمت: "Employment",
  ریٹائرڈ: "Retired",
};

export function displayOccupation(value: LocalizedString, lang: Lang) {
  if (lang === "en") {
    if (value.en?.trim()) return value.en.trim();
    const ur = value.ur?.trim() || "";
    return OCCUPATION_EN[ur] || ur;
  }
  return pick(value, lang);
}

export function isArabicScript(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}
