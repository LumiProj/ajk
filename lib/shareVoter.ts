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

/** Compact WhatsApp-friendly body (no URL — attach separately). */
export function buildShareBody(voter: VoterRecord, lang: Lang): string {
  const isUr = lang === "ur";

  if (isUr) {
    return [
      "*AJK Election 2026 Quetta*",
      "حتمی انتخابی فہرست",
      "",
      `*نام:* ${voter.name.ur}`,
      `*ولد:* ${voter.fatherName.ur}`,
      `*CNIC:* ${voter.cnic}`,
      `*عمر / پیشہ:* ${voter.age} · ${voter.occupation.ur}`,
      `*علاقہ:* ${voter.areaName.ur} (${voter.areaNumber})`,
      `*پتہ:* ${voter.address.ur}`,
    ].join("\n");
  }

  return [
    "*AJK Election 2026 Quetta*",
    "Final Electoral Roll",
    "",
    `*Name:* ${voter.name.en}`,
    `*Father:* ${voter.fatherName.en}`,
    `*CNIC:* ${voter.cnic}`,
    `*Age / Job:* ${voter.age} · ${voter.occupation.en}`,
    `*Area:* ${voter.areaName.en} (${voter.areaNumber})`,
    `*Address:* ${voter.address.en}`,
  ].join("\n");
}

/** Full message with a single link at the end. */
export function buildShareMessage(voter: VoterRecord, lang: Lang): string {
  const isUr = lang === "ur";
  const linkLabel = isUr ? "لنک" : "Link";
  return `${buildShareBody(voter, lang)}\n\n${linkLabel}:\n${getShareUrl(voter)}`;
}

/** @deprecated use buildShareMessage */
export function buildShareText(voter: VoterRecord, lang: Lang): string {
  return buildShareMessage(voter, lang);
}

export function cnicFromSearchParams(value: string | null): string {
  if (!value) return "";
  return formatCnicInput(value);
}
