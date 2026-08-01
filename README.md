# AJK Election 2026 Quetta

CNIC search for the final electoral roll (Quetta / Jammu & Mangla Dam affectees).

- **Site:** [ajkelection2026quetta.com](https://ajkelection2026quetta.com)
- **Stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Palette:** AJK flag — green `#00360f`, saffron `#ea9400`, white

## Data (website)

Only JSON is used by the site. Put extracted rolls in [`data/`](data/) and redeploy.

```
data/
  quetta_4520025.json   ← committed, served by the app
```

## Local extraction (not deployed)

Source PDFs and OCR previews stay in `local/` (gitignored):

```
local/
  pdfs/          ← drop area PDFs here
  preview/       ← page renders / OCR work
```

Extract → write JSON into `data/` → commit JSON only.

## Local development

```bash
npm install
npm run dev
```

Search example: `54400-0506186-3`

## Deploy

Push to GitHub → import in Vercel → attach domain `ajkelection2026quetta.com`.
