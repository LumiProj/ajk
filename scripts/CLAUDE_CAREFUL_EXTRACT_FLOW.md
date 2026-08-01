# Claude careful extract / verify flow

Copy everything below the line into Claude Code (project root: this repo).

---

## Mission

You are correcting AJK Quetta electoral-roll data from scanned PDFs with **maximum care**.

Goal: make Urdu names / father names / addresses match the PDF **exactly**, especially lookalike letters:

- ف vs ش vs س vs ص vs ث
- ع vs غ
- ہ vs ة vs ه
- ی vs ے

Do **not** invent text. If a cell is unreadable, leave it unchanged or set `""` and note it.

---

## Hard safety rules (never break)

1. **Unique key = 13-digit CNIC.** Never create duplicate CNICs.
2. **Never overwrite** a voter with `"ocr_quality": "manual"` unless the human explicitly asks to replace that CNIC.
3. Only edit:
   - `data/electoral_roll.json`
   - optional: `local/state/vision_batches/*_out.json` (so future merges keep fixes)
   - optional: `local/state/` notes / progress files
4. Do **not** delete PDFs, OCR cache, or rewrite the whole site.
5. Do **not** run a bulk local OCR (Apple Vision / EasyOCR) pass that replaces the roll.
6. Do **not** commit `.env`, API keys, or `local/` binaries.
7. After edits, keep JSON valid. Preserve existing fields you are not correcting.
8. Prefer **small, verified patches** over regenerating all 173 records at once.
9. Commit/push **only if the user asks**.

---

## Project facts

- PDFs: `local/pdfs/Quetta (#######).pdf`
- Cached page images: `local/ocr_cache/<area>_<hash>/page_XXX.png`
- Live merged data: `data/electoral_roll.json`
- Manual seed (protected): `data/quetta_4520025.json` (Waleed Yousaf)
- Merge helper: `scripts/merge_vision_batches.py` (CNIC upsert + manual wins)
- Website loads `data/electoral_roll.json` first via `lib/loadVoters.ts`

Table columns on list pages (RTL):  
serial | name | father/husband | CNIC | occupation | age | address | previous

---

## Recommended workflow (full care)

### Phase A — Inventory (read-only)

1. Confirm repo root and that `data/electoral_roll.json` exists.
2. Count voters and unique CNICs (must match; no dupes).
3. List PDFs in `local/pdfs/` and voter pages in `local/ocr_cache/**/page_*.png` that contain CNICs.
4. Report counts to the user before changing anything.

### Phase B — Choose scope

Process in **one of these scopes** (ask user if unclear):

- **Single CNIC** (fastest, safest)
- **One PDF / area number** (e.g. `4520192`)
- **All areas**, but still **one page at a time**, never blind bulk overwrite

### Phase C — Careful page method (the important part)

For each voter list page image:

1. **Read the full page image** once for layout + area header (area number, area name, gender list مرد/خواتین, page n/m).
2. For **each row**:
   - Locate the CNIC (digits are reliable).
   - **Crop** (or visually zoom) the **name cell only** and re-read it alone.
   - Crop/re-read **father/husband cell** alone.
   - Read age, occupation, address, previous from that same row only — do not pull text from the row above/below.
3. Write a provisional record:

```json
{
  "cnic": "XXXXX-XXXXXXX-X",
  "serial_number": 0,
  "gender": "male",
  "name": { "ur": "...", "en": "" },
  "father_name": { "ur": "...", "en": "" },
  "occupation": { "ur": "...", "en": "" },
  "age": 0,
  "address": { "ur": "...", "en": "" },
  "previous_address": { "ur": "...", "en": "" },
  "list_page": "1/4",
  "electoral_area": {
    "number": "4520192",
    "name": { "ur": "...", "en": "" },
    "mauza": { "ur": "...", "en": "" },
    "patwar_circle": { "ur": "...", "en": "" },
    "tehsil": { "ur": "کوئٹہ سٹی", "en": "Quetta City" },
    "district": { "ur": "کوئٹہ", "en": "Quetta" }
  },
  "source_file": "Quetta (4520192).pdf",
  "ocr_quality": "vision_verified"
}
```

4. **Self-check before saving each row:**
   - Does CNIC on the page match exactly?
   - Does name still look wrong if ف/ش/س are swapped? Re-check the name crop.
   - Did father field accidentally include the previous row’s name?
   - For women, father field may start with `زوجہ` or `دختر` — keep that meaning; UI handles labels.

### Phase D — Safe upsert into `electoral_roll.json`

For each verified voter:

1. Find existing record by 13-digit CNIC.
2. If missing → add.
3. If present and `ocr_quality == "manual"` → **skip** (keep manual).
4. If present otherwise → update only fields you verified; set `ocr_quality` to `"vision_verified"`.
5. Never remove unrelated voters.

Optional: keep a changelog at `local/state/careful_fixes.jsonl` with one JSON object per line:

```json
{"cnic":"...","from_name_ur":"...","to_name_ur":"...","source_image":"...","at":"ISO-8601"}
```

### Phase E — Verify

After a batch:

1. Re-check 3–5 corrected CNICs against their PDF crops.
2. Confirm unique CNIC count unchanged or only increased (no dupes).
3. Confirm Waleed Yousaf `54400-0506186-3` still manual/correct.
4. Summarize: pages done, rows fixed, rows skipped (manual), uncertain rows.

### Phase F — Deploy (only if user asks)

```bash
git add data/electoral_roll.json
git commit -m "Verify Urdu fields from PDF cell crops for area ######."
git push origin HEAD
```

---

## If user gives a single bad CNIC URL

Example: `https://www.ajkelection2026quetta.com/?cnic=5440004878491`

1. Normalize to `54400-0487849-1`.
2. Look up record → read `source_file` + area.
3. Open that PDF page image from `local/ocr_cache/`.
4. Crop name cell → correct Urdu exactly.
5. Patch JSON → mark `ocr_quality: "manual"` for that CNIC (human-confirmed).
6. Push only if asked.

---

## What “full care” means in practice

- **One row at a time** for name/father.
- **Second look** at the name crop for every row (this is how فہیم vs شمیم is caught).
- **No page-level guess** for names when the page is dense.
- Stop and ask the user if more than ~10% of a page is unreadable.

---

## Start command for Claude

Begin now with Phase A (read-only inventory). Then ask me whether to run:

1. one CNIC,
2. one area PDF, or
3. all pages with cell-level verify.

Do not modify files until I choose a scope.
