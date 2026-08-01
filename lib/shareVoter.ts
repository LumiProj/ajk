import type { Lang, VoterRecord } from "./types";
import { formatCnicInput, normalizeCnic } from "./search";

export function getShareUrl(voter: VoterRecord): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ajkelection2026quetta.com";
  const url = new URL(origin);
  url.searchParams.set("cnic", normalizeCnic(voter.cnic));
  return url.toString();
}

export function buildShareText(voter: VoterRecord, lang: Lang): string {
  const isUr = lang === "ur";
  const gender = isUr
    ? voter.gender === "male"
      ? "مرد"
      : "خاتون"
    : voter.gender === "male"
      ? "Male"
      : "Female";

  const lines = isUr
    ? [
        "AJK Election 2026 Quetta",
        "حتمی انتخابی فہرست ۲۰۲۶",
        "────────────────────",
        `نام: ${voter.name.ur}`,
        `ولد: ${voter.fatherName.ur}`,
        `جنس: ${gender}`,
        `شناختی کارڈ: ${voter.cnic}`,
        `عمر: ${voter.age}`,
        `پیشہ: ${voter.occupation.ur}`,
        `انتخابی علاقہ: ${voter.areaName.ur}`,
        `علاقہ نمبر: ${voter.areaNumber}`,
        `تحصیل: ${voter.tehsil.ur}`,
        `ضلع: ${voter.district.ur}`,
        `موجودہ پتہ: ${voter.address.ur}`,
        `سابقہ پتہ: ${voter.previousAddress.ur}`,
        "────────────────────",
        `تلاش لنک: ${getShareUrl(voter)}`,
      ]
    : [
        "AJK Election 2026 Quetta",
        "Final Electoral Roll 2026",
        "────────────────────",
        `Name: ${voter.name.en}`,
        `Father: ${voter.fatherName.en}`,
        `Gender: ${gender}`,
        `CNIC: ${voter.cnic}`,
        `Age: ${voter.age}`,
        `Occupation: ${voter.occupation.en}`,
        `Electoral area: ${voter.areaName.en}`,
        `Area number: ${voter.areaNumber}`,
        `Tehsil: ${voter.tehsil.en}`,
        `District: ${voter.district.en}`,
        `Address: ${voter.address.en}`,
        `Previous address: ${voter.previousAddress.en}`,
        "────────────────────",
        `Search link: ${getShareUrl(voter)}`,
      ];

  return lines.join("\n");
}

export function cnicFromSearchParams(value: string | null): string {
  if (!value) return "";
  return formatCnicInput(value);
}
