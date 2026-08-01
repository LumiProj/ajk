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
const H = 1600;

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

  // Header band — centered flag + titles
  const headerH = 268;
  const headerMidX = cardX + cardW / 2;
  roundRect(ctx, cardX, cardY, cardW, headerH + 40, 36);
  ctx.fillStyle = green;
  ctx.fill();
  ctx.fillRect(cardX, cardY + 40, cardW, headerH);

  // Flag (centered above titles)
  const fw = 78;
  const fh = 78;
  const fy = cardY + 36;
  try {
    const flag = await loadImage("/flag-ajk.png");
    const fx = headerMidX - fw / 2;
    ctx.save();
    roundRect(ctx, fx - 8, fy - 8, fw + 16, fh + 16, 18);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.drawImage(flag, fx, fy, fw, fh);
    ctx.restore();
  } catch {
    // Flag optional
  }

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.font = isUr
    ? '500 28px "Noto Nastaliq Urdu", serif'
    : "500 24px Outfit, sans-serif";
  ctx.fillText(
    isUr ? "حتمی انتخابی فہرست ۲۰۲۶" : "Final Electoral Roll 2026",
    headerMidX,
    fy + fh + 42,
  );

  ctx.font = "700 38px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.fillText("AJK Election 2026 Quetta", headerMidX, fy + fh + 92);

  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.font = isUr
    ? '500 24px "Noto Nastaliq Urdu", serif'
    : "500 20px Outfit, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillText(
    isUr
      ? "آزاد جموں و کشمیر الیکشن کمیشن"
      : "Azad Jammu & Kashmir Election Commission",
    headerMidX,
    fy + fh + 136,
  );

  // Body
  let y = cardY + headerH + 96;
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
  roundRect(ctx, contentLeft, y, contentW, 130, 22);
  ctx.fillStyle = "rgba(0,54,15,0.05)";
  ctx.fill();
  ctx.fillStyle = greenMid;
  ctx.textBaseline = "alphabetic";
  ctx.font = isUr
    ? '500 26px "Noto Nastaliq Urdu", serif'
    : "600 22px Outfit, sans-serif";
  ctx.direction = isUr ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillText(isUr ? "شناختی کارڈ نمبر" : "CNIC", midX, y + 40);
  ctx.fillStyle = ink;
  ctx.font = "700 42px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.fillText(voter.cnic, midX, y + 98);
  y += 158;

  // Meta rows — clear gap between label and value (Nastaliq needs room)
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

  const footerSpace = 120;
  const contentMaxY = cardY + cardH - footerSpace;

  for (const row of rows) {
    if (y > contentMaxY - 80) break;

    const isAddress = row.label.includes("Address") || row.label === "پتہ";
    ctx.textBaseline = "top";
    ctx.fillStyle = muted;
    ctx.font = isUr
      ? '500 24px "Noto Nastaliq Urdu", serif'
      : "600 20px Outfit, sans-serif";
    ctx.direction = isUr ? "rtl" : "ltr";
    ctx.textAlign = isUr ? "right" : "left";
    const labelX = isUr ? contentRight : contentLeft;
    ctx.fillText(row.label, labelX, y);
    y += isUr ? 52 : 34;

    ctx.fillStyle = ink;
    const valueUrdu = isArabicScript(row.value);
    ctx.font = valueUrdu
      ? isAddress
        ? '600 28px "Noto Nastaliq Urdu", serif'
        : '600 32px "Noto Nastaliq Urdu", serif'
      : "600 28px Outfit, sans-serif";
    // Address often mixes Urdu + Latin (786-A); taller lines avoid glyph collisions
    ctx.direction = valueUrdu || isUr ? "rtl" : "ltr";
    ctx.textAlign = isUr ? "right" : "left";
    const valueX = isUr ? contentRight : contentLeft;
    const lineH = isAddress ? (valueUrdu ? 58 : 40) : valueUrdu ? 50 : 36;
    y += fillWrapped(
      ctx,
      row.value,
      valueX,
      y,
      contentW,
      lineH,
      isAddress ? 4 : 2,
      isUr ? "right" : "left",
    );
    y += isUr ? 40 : 30;
  }
  ctx.textBaseline = "alphabetic";

  // Footer — clear any content bleed, then draw LA-31 with room above
  const footerY = cardY + cardH - 64;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cardX + 1, contentMaxY - 8, cardW - 2, cardY + cardH - contentMaxY + 8);
  ctx.fillStyle = "rgba(0,54,15,0.08)";
  ctx.fillRect(cardX + 48, footerY - 28, cardW - 96, 1);
  ctx.fillStyle = muted;
  ctx.font = "700 22px Outfit, sans-serif";
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  ctx.fillText("LA-31", midX, footerY + 8);

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
