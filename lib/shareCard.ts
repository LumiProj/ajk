import type { Lang, VoterRecord } from "./types";
import {
  detectRelation,
  displayOccupation,
  isArabicScript,
  pick,
  relationLabel,
  relationPerson,
} from "./display";
import { normalizeCnic } from "./search";

const W = 1080;
const H = 1350;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const clean = (text || "").trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth || words.join(" ") !== lines.join(" ")) {
      let trimmed = last;
      while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = `${trimmed}…`;
    }
  }
  return lines;
}

function fillWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign,
) {
  ctx.textAlign = align;
  const lines = wrapLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });
  return lines.length * lineHeight;
}

async function ensureFonts() {
  if (typeof document === "undefined") return;
  try {
    await Promise.all([
      document.fonts.load('600 64px "Noto Nastaliq Urdu"'),
      document.fonts.load('500 36px "Noto Nastaliq Urdu"'),
      document.fonts.load("600 40px Outfit"),
      document.fonts.load("500 28px Outfit"),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to system fonts if load fails.
  }
}

export async function renderShareCardPng(
  voter: VoterRecord,
  lang: Lang,
): Promise<Blob> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  const isUr = lang === "ur";
  const green = "#00360f";
  const greenMid = "#22502e";
  const saffron = "#ea9400";
  const ink = "#0a1a10";
  const muted = "#5c6b62";
  const cream = "#f7faf6";
  const paper = "#eef3ef";

  // Background atmosphere
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#fbfcf9");
  bg.addColorStop(0.55, cream);
  bg.addColorStop(1, paper);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft saffron glow
  const glow = ctx.createRadialGradient(W * 0.85, 0, 40, W * 0.85, 80, 420);
  glow.addColorStop(0, "rgba(234,148,0,0.22)");
  glow.addColorStop(1, "rgba(234,148,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Card panel
  const cardX = 56;
  const cardY = 56;
  const cardW = W - 112;
  const cardH = H - 112;
  ctx.save();
  ctx.shadowColor = "rgba(0,54,15,0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // Header band
  const headerH = 210;
  roundRect(ctx, cardX, cardY, cardW, headerH + 40, 36);
  ctx.fillStyle = green;
  ctx.fill();
  ctx.fillRect(cardX, cardY + 40, cardW, headerH);

  // Saffron top ribbon
  ctx.fillStyle = saffron;
  ctx.fillRect(cardX, cardY, cardW, 14);

  // Flag
  try {
    const flag = await loadImage("/flag-ajk.png");
    const fw = 92;
    const fh = 92;
    const fx = isUr ? cardX + cardW - 48 - fw : cardX + 48;
    const fy = cardY + 48;
    ctx.save();
    roundRect(ctx, fx - 6, fy - 6, fw + 12, fh + 12, 18);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.drawImage(flag, fx, fy, fw, fh);
    ctx.restore();
  } catch {
    // Flag optional
  }

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.direction = isUr ? "rtl" : "ltr";
  const headX = isUr ? cardX + cardW - 48 : cardX + 48;
  const headAlign: CanvasTextAlign = isUr ? "right" : "left";

  ctx.font = isUr
    ? '500 30px "Noto Nastaliq Urdu", serif'
    : "500 26px Outfit, sans-serif";
  ctx.textAlign = headAlign;
  ctx.fillText(
    isUr ? "حتمی انتخابی فہرست ۲۰۲۶" : "Final Electoral Roll 2026",
    headX,
    cardY + 78,
  );

  const headerMidX = cardX + cardW / 2;
  ctx.font = "700 40px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  ctx.fillText("AJK Election 2026 Quetta", headerMidX, cardY + 138);

  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.font = isUr
    ? '500 26px "Noto Nastaliq Urdu", serif'
    : "500 22px Outfit, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.textAlign = "center";
  ctx.fillText(
    isUr
      ? "آزاد جموں و کشمیر الیکشن کمیشن"
      : "Azad Jammu & Kashmir Election Commission",
    headerMidX,
    cardY + 188,
  );

  // Body
  let y = cardY + headerH + 56;
  const contentPad = 56;
  const contentLeft = cardX + contentPad;
  const contentRight = cardX + cardW - contentPad;
  const contentW = contentRight - contentLeft;
  const midX = headerMidX;

  // Serial pill — keep clear of Nastaliq name flourishes below
  const serialH = 56;
  const serialLabel = isUr
    ? `سلسلہ نمبر ${voter.serialNumber}`
    : `SERIAL NO. ${voter.serialNumber}`;
  ctx.font = isUr
    ? '600 26px "Noto Nastaliq Urdu", serif'
    : "700 24px Outfit, sans-serif";
  const serialW = Math.min(contentW, ctx.measureText(serialLabel).width + 56);
  const serialX = midX - serialW / 2;
  roundRect(ctx, serialX, y, serialW, serialH, 28);
  ctx.fillStyle = "rgba(234,148,0,0.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(234,148,0,0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#8a5a00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.fillText(serialLabel, midX, y + serialH / 2 + (isUr ? 2 : 0));
  // Extra gap: Nastaliq ascenders extend well above the baseline
  y += serialH + (isUr ? 72 : 48);

  // Name (top baseline so layout spacing is predictable)
  const name = pick(voter.name, lang);
  const nameUrdu = isArabicScript(name);
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  ctx.font = nameUrdu
    ? '700 58px "Noto Nastaliq Urdu", serif'
    : "700 52px Outfit, sans-serif";
  ctx.direction = nameUrdu ? "rtl" : "ltr";
  ctx.textAlign = "center";
  const nameLineH = nameUrdu ? 86 : 60;
  y += fillWrapped(ctx, name, midX, y, contentW, nameLineH, 2, "center");
  y += nameUrdu ? 28 : 20;

  // Relation
  const kind = detectRelation(voter.fatherName, voter.gender);
  const rel = relationLabel(kind, lang);
  const person = relationPerson(voter.fatherName, lang);
  const relLine = `${rel} ${person}`.trim();
  ctx.fillStyle = muted;
  ctx.textBaseline = "top";
  ctx.font = isArabicScript(relLine)
    ? '500 32px "Noto Nastaliq Urdu", serif'
    : "500 26px Outfit, sans-serif";
  ctx.direction = isArabicScript(relLine) ? "rtl" : "ltr";
  y += fillWrapped(ctx, relLine, midX, y, contentW, 44, 2, "center");
  y += 40;
  ctx.textBaseline = "alphabetic";

  // Divider
  ctx.strokeStyle = "rgba(0,54,15,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentLeft + 40, y);
  ctx.lineTo(contentRight - 40, y);
  ctx.stroke();
  y += 40;

  // CNIC block
  roundRect(ctx, contentLeft, y, contentW, 118, 22);
  ctx.fillStyle = "rgba(0,54,15,0.05)";
  ctx.fill();
  ctx.fillStyle = greenMid;
  ctx.font = isUr
    ? '500 26px "Noto Nastaliq Urdu", serif'
    : "600 22px Outfit, sans-serif";
  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillText(isUr ? "شناختی کارڈ نمبر" : "CNIC", midX, y + 38);
  ctx.fillStyle = ink;
  ctx.font = "700 42px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.fillText(voter.cnic, midX, y + 88);
  y += 146;

  // Meta rows
  const occupation = displayOccupation(voter.occupation, lang);
  const areaName = pick(voter.areaName, lang);
  const areaLine = areaName
    ? `${areaName} · ${voter.areaNumber}`
    : voter.areaNumber;
  const address = pick(voter.address, lang);

  const rows: Array<{ label: string; value: string }> = [
    { label: isUr ? "پیشہ" : "Occupation", value: occupation },
    { label: isUr ? "علاقہ" : "Area", value: areaLine },
    { label: isUr ? "پتہ" : "Address", value: address },
  ].filter((r) => r.value);

  for (const row of rows) {
    ctx.fillStyle = muted;
    ctx.font = isUr
      ? '500 24px "Noto Nastaliq Urdu", serif'
      : "600 20px Outfit, sans-serif";
    ctx.direction = isUr ? "rtl" : "ltr";
    ctx.textAlign = isUr ? "right" : "left";
    const labelX = isUr ? contentRight : contentLeft;
    ctx.fillText(row.label, labelX, y);
    y += 34;

    ctx.fillStyle = ink;
    const valueUrdu = isArabicScript(row.value);
    ctx.font = valueUrdu
      ? '600 32px "Noto Nastaliq Urdu", serif'
      : "600 28px Outfit, sans-serif";
    ctx.direction = valueUrdu || isUr ? "rtl" : "ltr";
    ctx.textAlign = isUr ? "right" : "left";
    const valueX = isUr ? contentRight : contentLeft;
    y += fillWrapped(
      ctx,
      row.value,
      valueX,
      y,
      contentW,
      valueUrdu ? 44 : 36,
      row.label.includes("Address") || row.label === "پتہ" ? 3 : 2,
      isUr ? "right" : "left",
    );
    y += 28;
  }

  // Footer
  const footerY = cardY + cardH - 70;
  ctx.fillStyle = "rgba(0,54,15,0.08)";
  ctx.fillRect(cardX, footerY - 24, cardW, 1);
  ctx.fillStyle = muted;
  ctx.font = isUr
    ? '500 22px "Noto Nastaliq Urdu", serif'
    : "500 18px Outfit, sans-serif";
  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.font = "700 22px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.fillText("LA-31", midX, footerY + 10);

  // Green side accent
  ctx.fillStyle = saffron;
  ctx.fillRect(cardX, cardY + headerH + 20, 8, 160);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png",
      0.95,
    );
  });
}

export function shareCardFilename(voter: VoterRecord): string {
  return `ajk-voter-${normalizeCnic(voter.cnic) || "card"}.png`;
}

export async function shareOrDownloadCard(
  voter: VoterRecord,
  lang: Lang,
  title: string,
): Promise<"shared" | "downloaded"> {
  const blob = await renderShareCardPng(voter, lang);
  const file = new File([blob], shareCardFilename(voter), { type: "image/png" });

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.canShare?.({ files: [file] })) {
    await nav.share({ title, files: [file] });
    return "shared";
  }

  // Desktop / unsupported: download the card image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
