# Electoral roll extraction

## Folder layout

```
local/pdfs/           # drop new Quetta (#######).pdf files here
local/ocr_cache/      # rendered pages + OCR JSON (gitignored)
local/state/          # extract_state.json — processed file hashes
data/electoral_roll.json   # unique voters by CNIC (used by website)
```

## Run (incremental)

```bash
cd /path/to/ajk
source .venv/bin/activate   # needs pymupdf
# optional one-time speedup:
swiftc -O -o scripts/vision_ocr scripts/vision_ocr.swift
python3 scripts/extract_rolls.py
```

Safe to re-run anytime:

1. Unchanged PDFs (same hash) are **skipped**
2. Voters are upserted **by CNIC** (13 digits)
3. Existing richer / manual records are **not downgraded**
4. Progress is checkpointed after each PDF

## Notes

- PDFs are scanned images — OCR uses macOS Vision
- CNIC, age, gender, area number extract reliably
- Urdu name/address fields are best-effort and may need later cleanup
- Output: `data/electoral_roll.json` (unique by CNIC; website prefers this file)
