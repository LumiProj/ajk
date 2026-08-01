# AJK Election 2026 Quetta

CNIC search for the final electoral roll (Quetta / Jammu & Mangla Dam affectees).

- **Site:** [ajkelection2026quetta.com](https://ajkelection2026quetta.com)
- **Stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Data:** JSON files in [`data/`](data/) — add a new area file and redeploy

## Local development

```bash
npm install
npm run dev
```

## Search

Enter a 13-digit CNIC (`54400-0506186-3` or digits only). Results display in Urdu first; use the EN toggle for English labels.

## Deploy

Push to GitHub → import in Vercel → attach domain `ajkelection2026quetta.com`.
