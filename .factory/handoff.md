# Storage-Aware Expiry v1 handoff

Completed 2 September 2026 for work order `storage-aware-expiry-build-1`.

## What was built

- A responsive offline PWA for pantry, fridge, and freezer date planning.
- Local IndexedDB storage for real inventory and a separate session namespace for demo data.
- A use-first queue sorted by each item's chosen date.
- Add, edit, storage-move, mark-used, undo, filter, and confirmed-remove paths.
- Editable date presets for pantry, fridge, and freezer. A storage move resets the storage date and recalculates the suggestion.
- JSON backup import/export and CSV export.
- One-item browser print labels and licensed batch label sheets.
- A one-time ₹399 household tier through the Sociobot checkout and license verification contract.
- Restore-purchase, once-daily verification cache, optimistic offline access, and graceful verification errors.
- A direct `/demo` sandbox with five dated sample items, reset, and start-for-real controls.
- `/privacy`, `/terms`, `/settings`, `/print/:id`, `/print-all`, offline fallback, and styled 404 experiences.
- PWA manifest, install icons, versioned service-worker shell, update prompt, offline status, SEO metadata, sitemap, robots file, and deployment security headers.
- Original generated mid-century storage-panel artwork, responsive WebP assets, and provenance.

## How to run

```sh
npm install
npm run dev
```

Use `http://127.0.0.1:5173/demo` for the isolated sample.

## How it was verified

```sh
npm run build
npm test
npm audit --omit=dev
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/evidence
```

- Build: passed; `dist/index.html` is at the deploy root.
- Browser suite: 15 passed in 26.9 seconds on Chromium 145.
- Claims: all 12 entries in `.factory/claims.json` have one tagged browser test.
- Offline: passed in its own browser context after a first visit.
- Accessibility: no serious or critical axe findings in light mode across five routes or in dark mode at 390 × 844.
- Console: no errors on demo load.
- URL verifier: HTTP 200, `lang=en`, one `h1`, one `main`, zero missing alt attributes, zero unlabeled buttons; measured load 575 ms.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP 1.6 s, CLS 0, total blocking time 0 ms.
- Initial application assets: JavaScript 30.80 KB raw / 10.13 KB gzip; CSS 14.34 KB raw / 4.11 KB gzip; mobile hero WebP 19 KB.
- Dependency audit: zero production vulnerabilities and zero total npm audit findings.
- Evidence: `.factory/evidence/verify.json`, desktop/mobile screenshots, and `.factory/evidence/lighthouse.json`.

## Known gaps and release notes

- The factory must register `storage-aware-expiry` with the Sociobot billing service before checkout can complete in production.
- V1 relies on the browser print dialog. It does not include printer drivers or fixed label-paper templates.
- There is no sync, account, barcode lookup, notification scheduling, or food-safety advice. These are intentional scope limits.
- Clearing site data removes inventory unless the user first exports a JSON backup.

## Suggested next steps

1. Register the production product, ₹399 price, and return URL with the factory billing workflow.
2. Deploy `dist/` and run the same claim suite against the production hostname.
3. Test a few common label-sheet layouts before adding printer-specific templates.
