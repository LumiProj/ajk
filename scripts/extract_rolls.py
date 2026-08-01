#!/usr/bin/env python3
"""
Incremental electoral-roll extractor for scanned Quetta PDFs.

- Reads every PDF in local/pdfs/
- OCRs pages via macOS Vision (Swift helper), caches results
- Parses CNIC / age / gender / area / best-effort Urdu fields
- Upserts into data/electoral_roll.json UNIQUE by CNIC digits
- Safe to re-run: skips unchanged PDFs; never duplicates CNICs
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "local" / "pdfs"
OCR_CACHE = ROOT / "local" / "ocr_cache"
STATE_PATH = ROOT / "local" / "state" / "extract_state.json"
OUT_PATH = ROOT / "data" / "electoral_roll.json"
SWIFT_SRC = ROOT / "scripts" / "vision_ocr.swift"
SWIFT_BIN = ROOT / "scripts" / "vision_ocr"
RENDER_ZOOM = 2.2

CNIC_RE = re.compile(r"(?<!\d)(\d{5})[-\s]?(\d{7})[-\s]?(\d)(?!\d)")
AREA_RE = re.compile(r"4520\d{3}")
AGE_RE = re.compile(r"^(1[0-9]|[2-9]\d)$")  # 10-99
PAGE_RE = re.compile(r"Page\s*(\d+)\s*/\s*(\d+)", re.I)

DEFAULT_META = {
    "document_type": "final_electoral_roll",
    "year": 2026,
    "context": {
        "ur": "جموں و متاثرین منگلا ڈیم",
        "en": "Jammu and Mangla Dam Affectees",
    },
    "authority": {
        "ur": "آزاد جموں و کشمیر الیکشن کمیشن",
        "en": "Azad Jammu and Kashmir Election Commission",
    },
    "constituency": {
        "code": "LA-34",
        "name": {"ur": "ایل اے-34، جموں-1", "en": "LA-34, Jammu-1"},
    },
    "publication_date": {"ur": "21 مئی 2026", "iso": "2026-05-21"},
}


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_cnic(text: str) -> str | None:
    m = CNIC_RE.search(text.replace(" ", ""))
    if not m:
        # also try OCR confusions
        cleaned = (
            text.replace("O", "0")
            .replace("o", "0")
            .replace("I", "1")
            .replace("l", "1")
            .replace("+", "-")
            .replace("—", "-")
        )
        digits = re.sub(r"\D", "", cleaned)
        if len(digits) == 13:
            return f"{digits[:5]}-{digits[5:12]}-{digits[12]}"
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def cnic_digits(cnic: str) -> str:
    return re.sub(r"\D", "", cnic)


def area_from_filename(name: str) -> str | None:
    m = re.search(r"\((\d{7})\)", name)
    return m.group(1) if m else None


def loc(ur: str = "", en: str = "") -> dict:
    return {"ur": ur or "", "en": en or ""}


@dataclass
class Box:
    text: str
    confidence: float
    x: float
    y: float
    w: float
    h: float

    @property
    def cx(self) -> float:
        return self.x + self.w / 2

    @property
    def cy(self) -> float:
        return self.y + self.h / 2


def render_pdf_pages(pdf_path: Path, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    paths: list[Path] = []
    mat = fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM)
    for i, page in enumerate(doc):
        out = out_dir / f"page_{i+1:03d}.png"
        if not out.exists():
            pix = page.get_pixmap(matrix=mat)
            pix.save(str(out))
        paths.append(out)
    doc.close()
    return paths


def run_vision_ocr(image_path: Path) -> list[Box]:
    cache = image_path.with_suffix(".ocr.json")
    if cache.exists():
        raw = json.loads(cache.read_text(encoding="utf-8"))
        return [Box(**b) for b in raw.get("boxes", [])]

    # Prefer compiled binary (swiftc -O -o scripts/vision_ocr scripts/vision_ocr.swift)
    cmd = (
        [str(SWIFT_BIN), str(image_path)]
        if SWIFT_BIN.exists()
        else ["swift", str(SWIFT_SRC), str(image_path)]
    )
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        print(f"  OCR fail {image_path.name}: {proc.stderr[:200]}", file=sys.stderr)
        return []
    line = proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else ""
    if not line:
        return []
    raw = json.loads(line)
    cache.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
    return [Box(**b) for b in raw.get("boxes", [])]


def detect_gender(boxes: list[Box]) -> str | None:
    blob = " ".join(b.text for b in boxes)
    if "خواتین" in blob or "خاتون" in blob or "(خ" in blob:
        return "female"
    if "مرد" in blob or "(مرد)" in blob:
        return "male"
    # OCR garbled titles
    low = blob.lower()
    if "female" in low or "women" in low:
        return "female"
    if "male" in low and "female" not in low:
        return "male"
    # Arabic-script garbles commonly seen
    if "خوات" in blob:
        return "female"
    if "مندكان (مرد)" in blob or "ومندكان (مرد)" in blob or "(مرد)" in blob:
        return "male"
    return None


def detect_list_page(boxes: list[Box]) -> str:
    for b in boxes:
        m = PAGE_RE.search(b.text)
        if m:
            return f"{m.group(1)}/{m.group(2)}"
    return ""


def cluster_rows(boxes: list[Box], y_tol: float = 0.018) -> list[list[Box]]:
    # Vision y=0 is bottom; sort top-to-bottom by descending y
    usable = [b for b in boxes if b.cy < 0.88 and b.cy > 0.12]
    usable.sort(key=lambda b: -b.cy)
    rows: list[list[Box]] = []
    for b in usable:
        if not rows or abs(rows[-1][0].cy - b.cy) > y_tol:
            rows.append([b])
        else:
            rows[-1].append(b)
    for row in rows:
        row.sort(key=lambda b: -b.cx)  # right-to-left for Urdu table
    return rows


def parse_voter_rows(boxes: list[Box], defaults: dict) -> list[dict]:
    gender = detect_gender(boxes) or defaults.get("gender") or "male"
    list_page = detect_list_page(boxes)
    voters: list[dict] = []

    # Find CNIC boxes and build a row around each
    cnic_boxes = []
    for b in boxes:
        c = normalize_cnic(b.text)
        if c:
            cnic_boxes.append((b, c))

    # Dedup cnics on same page (keep highest confidence)
    best: dict[str, Box] = {}
    for b, c in cnic_boxes:
        prev = best.get(c)
        if prev is None or b.confidence > prev.confidence:
            best[c] = b

    for cnic, cb in best.items():
        # gather boxes on same horizontal band
        band = [b for b in boxes if abs(b.cy - cb.cy) <= 0.022]
        band.sort(key=lambda b: -b.cx)

        serial = None
        age = None
        name_parts: list[str] = []
        father_parts: list[str] = []
        occ_parts: list[str] = []
        addr_parts: list[str] = []
        prev_parts: list[str] = []

        for b in band:
            t = b.text.strip()
            if normalize_cnic(t) == cnic:
                continue
            if re.fullmatch(r"\d{1,3}", t):
                n = int(t)
                # rightmost small numbers are serial; mid-left ages
                if b.cx > 0.85 and 1 <= n <= 200:
                    serial = n
                    continue
                if 0.35 <= b.cx <= 0.5 and AGE_RE.match(t):
                    age = n
                    continue
                if age is None and AGE_RE.match(t) and b.cx < 0.55:
                    age = n
                    continue
            # column by x center (RTL table)
            if b.cx >= 0.78:
                if not re.fullmatch(r"\d+", t):
                    name_parts.append(t)
            elif 0.62 <= b.cx < 0.78:
                if not re.fullmatch(r"\d+", t):
                    father_parts.append(t)
            elif 0.45 <= b.cx < 0.55:
                if not re.fullmatch(r"\d+", t) and normalize_cnic(t) is None:
                    occ_parts.append(t)
            elif 0.20 <= b.cx < 0.45:
                addr_parts.append(t)
            elif b.cx < 0.20:
                prev_parts.append(t)

        voters.append(
            {
                "serial_number": serial or 0,
                "gender": gender,
                "name": loc(" ".join(name_parts)),
                "father_name": loc(" ".join(father_parts)),
                "cnic": cnic,
                "occupation": loc(" ".join(occ_parts) or ("خانہ داری" if gender == "female" else "")),
                "age": age or 0,
                "address": loc(" ".join(addr_parts)),
                "previous_address": loc(" ".join(prev_parts)),
                "list_page": list_page,
                "electoral_area": {
                    "number": defaults["area_number"],
                    "name": defaults.get("area_name", loc()),
                    "mauza": defaults.get("area_name", loc()),
                    "patwar_circle": loc("میونسپل کارپوریشن", "Municipal Corporation"),
                    "tehsil": loc("کوئٹہ سٹی", "Quetta City"),
                    "district": loc("کوئٹہ", "Quetta"),
                },
                "source_file": defaults["source_file"],
                "ocr_quality": "auto",
            }
        )
    return voters


def parse_cover_meta(boxes: list[Box], area_number: str) -> dict:
    meta = {
        "area_number": area_number,
        "area_name": loc(),
        "male": 0,
        "female": 0,
        "total": 0,
    }
    texts = [(b.text, b) for b in boxes]
    for t, b in texts:
        if AREA_RE.fullmatch(t.strip()):
            meta["area_number"] = t.strip()
    # summary numbers near labels are brittle; leave 0 and compute later
    return meta


def quality_score(v: dict) -> int:
    score = 0
    if v.get("cnic"):
        score += 10
    if v.get("age"):
        score += 2
    name = (v.get("name") or {}).get("ur") or ""
    father = (v.get("father_name") or {}).get("ur") or ""
    addr = (v.get("address") or {}).get("ur") or ""
    score += min(len(name), 20)
    score += min(len(father), 15)
    score += min(len(addr), 25)
    if v.get("ocr_quality") == "manual":
        score += 100
    return score


def upsert_voters(master: dict[str, dict], incoming: list[dict]) -> tuple[int, int]:
    added = updated = 0
    for v in incoming:
        digits = cnic_digits(v["cnic"])
        if len(digits) != 13:
            continue
        prev = master.get(digits)
        if prev is None:
            master[digits] = v
            added += 1
        else:
            # keep richer record; never downgrade manual
            if quality_score(v) > quality_score(prev):
                # preserve manual English if present
                if prev.get("ocr_quality") == "manual" and v.get("ocr_quality") != "manual":
                    continue
                master[digits] = v
                updated += 1
    return added, updated


def seed_existing_manual(master: dict[str, dict]) -> None:
    """Keep the hand-verified quetta_4520025.json record as higher quality."""
    legacy = ROOT / "data" / "quetta_4520025.json"
    if not legacy.exists():
        return
    roll = json.loads(legacy.read_text(encoding="utf-8"))
    area = roll.get("electoral_area", {})
    for v in roll.get("voters", []):
        digits = cnic_digits(v["cnic"])
        rec = {
            **v,
            "electoral_area": {
                "number": area.get("number", "4520025"),
                "name": area.get("name", loc()),
                "mauza": area.get("mauza", loc()),
                "patwar_circle": area.get("patwar_circle", loc()),
                "tehsil": area.get("tehsil", loc()),
                "district": area.get("district", loc()),
            },
            "source_file": roll.get("source_file", ""),
            "ocr_quality": "manual",
        }
        master[digits] = rec


def export_master(master: dict[str, dict]) -> dict:
    voters = sorted(master.values(), key=lambda v: (v.get("electoral_area", {}).get("number", ""), v.get("serial_number", 0), v.get("cnic", "")))
    male = sum(1 for v in voters if v.get("gender") == "male")
    female = sum(1 for v in voters if v.get("gender") == "female")
    # Website-compatible shape: one roll file with per-voter area retained in fields
    # Flatten electoral_area into top-level-ish voter entries expected by loadVoters
    # We'll adapt loadVoters separately to this merged format.
    return {
        **DEFAULT_META,
        "source_file": "merged_local_pdfs",
        "electoral_area": {
            "number": "ALL",
            "name": {"ur": "کوئٹہ (تمام علاقے)", "en": "Quetta (all areas)"},
            "mauza": {"ur": "کوئٹہ", "en": "Quetta"},
            "patwar_circle": {"ur": "میونسپل کارپوریشن", "en": "Municipal Corporation"},
            "tehsil": {"ur": "کوئٹہ سٹی", "en": "Quetta City"},
            "district": {"ur": "کوئٹہ", "en": "Quetta"},
        },
        "voter_summary": {"male": male, "female": female, "total": len(voters)},
        "voters": voters,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def process_pdf(pdf_path: Path) -> list[dict]:
    area_number = area_from_filename(pdf_path.name) or "0000000"
    cache_dir = OCR_CACHE / cnic_digits(area_number + pdf_path.stem)[:16]
    # stable cache dir by area + name hash
    cache_dir = OCR_CACHE / f"{area_number}_{hashlib.md5(pdf_path.name.encode()).hexdigest()[:8]}"
    pages = render_pdf_pages(pdf_path, cache_dir)
    print(f"  pages: {len(pages)}")

    defaults = {
        "area_number": area_number,
        "area_name": loc(),
        "source_file": pdf_path.name,
        "gender": "male",
    }
    all_voters: list[dict] = []
    page_gender = None

    for idx, page_img in enumerate(pages):
        boxes = run_vision_ocr(page_img)
        if idx == 0:
            cover = parse_cover_meta(boxes, area_number)
            defaults["area_number"] = cover["area_number"]
            g = detect_gender(boxes)
            if g:
                page_gender = g
        g = detect_gender(boxes) or page_gender or "male"
        defaults["gender"] = g
        # skip pure cover pages with no CNIC
        page_voters = parse_voter_rows(boxes, defaults)
        print(f"  page {idx+1}: {len(boxes)} boxes -> {len(page_voters)} voters ({g})")
        all_voters.extend(page_voters)
        if page_voters:
            page_gender = g

    # unique within PDF by CNIC (keep best)
    uniq: dict[str, dict] = {}
    for v in all_voters:
        d = cnic_digits(v["cnic"])
        if d not in uniq or quality_score(v) > quality_score(uniq[d]):
            uniq[d] = v
    return list(uniq.values())


def main() -> int:
    OCR_CACHE.mkdir(parents=True, exist_ok=True)
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

    state = load_json(STATE_PATH, {"files": {}})
    out_existing = load_json(OUT_PATH, {})
    master: dict[str, dict] = {}

    # Load previous merged export
    for v in out_existing.get("voters", []):
        d = cnic_digits(v.get("cnic", ""))
        if len(d) == 13:
            master[d] = v

    seed_existing_manual(master)
    print(f"Starting with {len(master)} unique CNIC records")

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs in {PDF_DIR}")
        return 1

    total_added = total_updated = 0
    for pdf in pdfs:
        h = file_hash(pdf)
        prev = state["files"].get(pdf.name)
        if prev and prev.get("hash") == h and prev.get("ok"):
            print(f"SKIP {pdf.name} (unchanged)")
            continue

        print(f"PROCESS {pdf.name}")
        try:
            voters = process_pdf(pdf)
            added, updated = upsert_voters(master, voters)
            total_added += added
            total_updated += updated
            state["files"][pdf.name] = {
                "hash": h,
                "ok": True,
                "voters_found": len(voters),
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
            print(f"  -> found {len(voters)}, added {added}, updated {updated}")
            # checkpoint after each PDF
            save_json(STATE_PATH, state)
            save_json(OUT_PATH, export_master(master))
        except Exception as e:
            state["files"][pdf.name] = {
                "hash": h,
                "ok": False,
                "error": str(e),
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
            save_json(STATE_PATH, state)
            print(f"  ERROR: {e}", file=sys.stderr)

    export = export_master(master)
    save_json(OUT_PATH, export)
    save_json(STATE_PATH, state)
    print(
        f"DONE unique={export['voter_summary']['total']} "
        f"(male={export['voter_summary']['male']}, female={export['voter_summary']['female']}) "
        f"added={total_added} updated={total_updated}"
    )
    print(f"Wrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
