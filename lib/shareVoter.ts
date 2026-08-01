import type { Lang, VoterRecord } from "./types";
import {
  detectRelation,
  displayOccupation,
  pick,
  relationLabel,
  relationPerson,
} from "./display";
import { formatCnicInput, normalizeCnic } from "./search";

export function getShareUrl(voter: VoterRecord): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.ajkelection2026quetta.com";
  const url = new URL(origin);
  url.searchParams.set("cnic", normalizeCnic(voter.cnic));
  return url.toString();
}

/** Compact WhatsApp-friendly body (no URL — attach separately). */
export function buildShareBody(voter: VoterRecord, lang: Lang): string {
  const isUr = lang === "ur";
  const kind = detectRelation(voter.fatherName, voter.gender);
  const rel = relationLabel(kind, lang);
  const person = relationPerson(voter.fatherName, lang);
  const name = pick(voter.name, lang);
  const occupation = displayOccupation(voter.occupation, lang);
  const area = pick(voter.areaName, lang);
  const address = pick(voter.address, lang);

  if (isUr) {
    return [
      "*AJK Election 2026 Quetta*",
      "حتمی انتخابی فہرست",
      "",
      `*سلسلہ نمبر:* ${voter.serialNumber}`,
      `*نام:* ${name}`,
      `*${rel}:* ${person}`,
      `*CNIC:* ${voter.cnic}`,
      `*عمر / پیشہ:* ${voter.age} · ${occupation}`,
      `*علاقہ:* ${area} (${voter.areaNumber})`,
      `*پتہ:* ${address}`,
    ].join("\n");
  }

  return [
    "*AJK Election 2026 Quetta*",
    "Final Electoral Roll",
    "",
    `*Serial no.:* ${voter.serialNumber}`,
    `*Name:* ${name}`,
    `*${rel}:* ${person}`,
    `*CNIC:* ${voter.cnic}`,
    `*Age / Job:* ${voter.age} · ${occupation}`,
    `*Area:* ${area} (${voter.areaNumber})`,
    `*Address:* ${address}`,
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
