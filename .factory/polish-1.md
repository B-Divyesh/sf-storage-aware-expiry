# Polish round 1

Candidate `fe57bc15aa6dbee4a0e876e0bf166658c0834823` was repaired in commit `b2f08ee6b5913e6ac692b3687ced731daee54e0e`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Demo now opens with the use-first sample list above the add form; its tickets show location, planned date, and all three actions. | `regression: demo shows a sample item inside the first 390px viewport`; `/tmp/storage-aware-expiry-demo-390.png`, `/tmp/storage-aware-expiry-demo-1440.png` |
| F-1-2 | Replaced every customer-facing “Use by” date label with “Planned date” or “Planned for”. | `@claim:print-label`; `@claim:editable-optional-fields` |
| F-1-3 | JSON backup test reads the actual download, parses version, presets, and all five items, then imports that payload. | `@claim:json-backup` |
| F-1-4 | Registered persistence as a claim and added reload plus second-tab IndexedDB coverage. | `@claim:real-persistence` |
| F-1-5 | Settings now accepts an existing token and verifies it with Sociobot; the fixture test asserts destination, token-only query, and valid/invalid UI. | `@claim:license-verification` |
| F-1-6 | Registered manual planned-date and optional-field behavior; test reloads an item with blank quantity/note and a freezer date. | `@claim:editable-optional-fields` |
| F-1-7 | Registered the visible no-barcode/no-nutrition/no-purchase-history scope statement. | `@claim:limited-scope` |
| F-1-8 | Renamed visible actions to Edit item and Print label, and added item-specific accessible names. | `@claim:print-label`; 390 px Axe integration |
| F-1-9 | Kept Static Web Apps’ 404 response override and rebuilt `/404.html` with shared header/footer, route metadata, favicon, and a regression for the policy. | `regression: every application route has route-specific metadata and the static 404 policy` |
| F-1-10 | Route render updates title, description, canonical, Open Graph, and Twitter title/description/URL for app, legal, print, demo, and not-found routes. | `regression: every application route has route-specific metadata and the static 404 policy` |
| F-1-11 | Replaced the metaphor heading with “Page not found” in SPA and static 404 views. | route metadata/404 regression |
| F-1-12 | Rewrote README user copy in plain words; implementation details remain only where deployers need them. | `.factory/copy-audit.md` |
| F-1-13 | Renamed the ambiguous process heading to “Use the earliest planned item first”. | `.factory/copy-audit.md` |
| F-1-14 | Identified the footer destination as “Built by Param Factory (external site)”. | full browser suite accessibility checks |

## Verification

- Clean clone: `npm ci`, followed by every command in `.factory/claims.json`, all passed individually (17 claims).
- Product suite: `npm test` passed 24/24 Chromium checks.
- Quality: `npm run lint` and `npm run build` passed. Build output has 33.26 KB raw / 10.55 KB gzip JS and 14.79 KB raw / 4.19 KB gzip CSS.
- Local URL check: `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/storage-aware-expiry-verify` passed with no console errors, one h1, `lang=en`, `main`, and complete image/button labelling.
- Axe is executed in the Playwright integration on all main routes and the 390 px dark/reduced-motion demo: no serious or critical findings. The standalone `@axe-core/cli` could not start because its bundled ChromeDriver supports Chrome 152 while the supplied Playwright Chromium is 145.
- Final live verification is recorded in the handoff after deployment.
