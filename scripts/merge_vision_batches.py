#!/usr/bin/env python3
"""Merge vision-extracted batch JSON into data/electoral_roll.json (unique by CNIC)."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCH_DIR = ROOT / "local" / "state" / "vision_batches"
OUT_PATH = ROOT / "data" / "electoral_roll.json"
LEGACY = ROOT / "data" / "quetta_4520025.json"

CNIC_RE = re.compile(r"(?<!\d)(\d{5})-?(\d{7})-?(\d)(?!\d)")

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


def loc(ur: str = "", en: str = "") -> dict:
    return {"ur": (ur or "").strip(), "en": (en or "").strip()}


def cnic_digits(cnic: str) -> str:
    return re.sub(r"\D", "", cnic or "")


def normalize_cnic(cnic: str) -> str | None:
    m = CNIC_RE.search((cnic or "").replace(" ", ""))
    if not m:
        d = cnic_digits(cnic)
        if len(d) == 13:
            return f"{d[:5]}-{d[5:12]}-{d[12]}"
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def quality_score(v: dict) -> int:
    score = 0
    if v.get("ocr_quality") == "manual":
        score += 100
    if v.get("ocr_quality") == "vision":
        score += 40
    name = (v.get("name") or {}).get("ur") or ""
    father = (v.get("father_name") or {}).get("ur") or ""
    addr = (v.get("address") or {}).get("ur") or ""
    score += min(len(name), 30)
    score += min(len(father), 25)
    score += min(len(addr), 40)
    if v.get("age"):
        score += 2
    return score


def seed_manual(master: dict[str, dict]) -> None:
    if not LEGACY.exists():
        return
    roll = json.loads(LEGACY.read_text(encoding="utf-8"))
    area = roll.get("electoral_area", {})
    for v in roll.get("voters", []):
        cnic = normalize_cnic(v.get("cnic", ""))
        if not cnic:
            continue
        master[cnic_digits(cnic)] = {
            **v,
            "cnic": cnic,
            "electoral_area": {
                "number": area.get("number", ""),
                "name": area.get("name", loc()),
                "mauza": area.get("mauza", loc()),
                "patwar_circle": area.get("patwar_circle", loc()),
                "tehsil": area.get("tehsil", loc()),
                "district": area.get("district", loc()),
            },
            "source_file": roll.get("source_file", ""),
            "ocr_quality": "manual",
        }


def area_from_path(path: str) -> str:
    m = re.search(r"/(\d{7})_", path.replace("\\", "/"))
    return m.group(1) if m else ""


def ingest_page(master: dict[str, dict], page: dict) -> tuple[int, int]:
    added = updated = 0
    area = page.get("electoral_area") or {}
    if not area.get("number"):
        area["number"] = area_from_path(page.get("source_image", ""))
    gender = page.get("gender") or "male"
    list_page = page.get("list_page") or ""
    source = page.get("source_image", "")
    src_pdf = ""
    am = re.search(r"/(\d{7})_", source.replace("\\", "/"))
    if am:
        src_pdf = f"Quetta ({am.group(1)}).pdf"

    for raw in page.get("voters") or []:
        cnic = normalize_cnic(raw.get("cnic", ""))
        if not cnic:
            continue
        digits = cnic_digits(cnic)
        rec = {
            "serial_number": int(raw.get("serial_number") or 0),
            "gender": gender,
            "name": loc(**(raw.get("name") or {})),
            "father_name": loc(**(raw.get("father_name") or {})),
            "cnic": cnic,
            "occupation": loc(**(raw.get("occupation") or {})),
            "age": int(raw.get("age") or 0),
            "address": loc(**(raw.get("address") or {})),
            "previous_address": loc(**(raw.get("previous_address") or {})),
            "list_page": list_page,
            "electoral_area": {
                "number": area.get("number", ""),
                "name": loc(**(area.get("name") or {})),
                "mauza": loc(**(area.get("mauza") or {})),
                "patwar_circle": loc(**(area.get("patwar_circle") or {})),
                "tehsil": loc(**(area.get("tehsil") or {"ur": "کوئٹہ سٹی", "en": "Quetta City"})),
                "district": loc(**(area.get("district") or {"ur": "کوئٹہ", "en": "Quetta"})),
            },
            "source_file": src_pdf,
            "ocr_quality": "vision",
        }
        prev = master.get(digits)
        if prev is None:
            master[digits] = rec
            added += 1
        elif quality_score(rec) > quality_score(prev):
            if prev.get("ocr_quality") == "manual" and rec.get("ocr_quality") != "manual":
                continue
            master[digits] = rec
            updated += 1
    return added, updated


def export_master(master: dict[str, dict]) -> dict:
    voters = sorted(
        master.values(),
        key=lambda v: (
            v.get("electoral_area", {}).get("number", ""),
            v.get("serial_number", 0),
            v.get("cnic", ""),
        ),
    )
    male = sum(1 for v in voters if v.get("gender") == "male")
    female = sum(1 for v in voters if v.get("gender") == "female")
    return {
        **DEFAULT_META,
        "source_file": "merged_vision_batches",
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


def main() -> int:
    outs = sorted(BATCH_DIR.glob("batch_*_out.json"))
    if not outs:
        print(f"No batch outputs in {BATCH_DIR}")
        return 1

    master: dict[str, dict] = {}
    seed_manual(master)
    total_added = total_updated = 0
    pages = voters = 0

    for path in outs:
        data = json.loads(path.read_text(encoding="utf-8"))
        for page in data.get("pages") or []:
            pages += 1
            voters += len(page.get("voters") or [])
            a, u = ingest_page(master, page)
            total_added += a
            total_updated += u
        print(f"loaded {path.name}")

    export = export_master(master)
    OUT_PATH.write_text(json.dumps(export, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"DONE pages={pages} extracted_rows={voters} unique={export['voter_summary']['total']} "
        f"added={total_added} updated={total_updated}"
    )
    print(f"Wrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
