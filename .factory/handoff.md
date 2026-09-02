# Storage-Aware Expiry polish 1 handoff

Completed 2 September 2026 for work order `storage-aware-expiry-polish-1`.

## Delivered

- Repaired every finding in `review-1.md`; the detailed finding-to-evidence map is in [polish-1.md](polish-1.md).
- Demo starts at `/demo` and `?demo=1`, stays in its own browser-storage namespace, has a persistent reset/start-real banner, and now leads with the sample use-first tickets.
- Standardized all customer language on **planned date**. Item action labels are explicit and item-specific for assistive technology.
- Added route-specific SEO/social metadata and complete branded 404 markup. Static Web Apps retains the 404 response override.
- Added four missing claims: real persistence, existing-license verification, editable/optional fields, and limited scope. JSON-export testing now validates downloaded bytes before importing them.

## How to run and verify

```sh
npm ci
npm test
npm run build
```

Open `http://127.0.0.1:5173/demo` for the isolated sample. The production build is `dist/` with `index.html` at its root.

## Exact evidence

- Repair commit: `b2f08ee6b5913e6ac692b3687ced731daee54e0e`.
- Clean clone `/tmp/storage-aware-expiry-clean`: `npm ci` passed; all 17 `claims.json` commands passed independently.
- Main suite: `npm test` passed **24/24** Chromium tests.
- `npm run lint` passed. `npm run build` passed and created `dist/`; JS is 33.26 KB raw / 10.55 KB gzip, CSS is 14.79 KB raw / 4.19 KB gzip.
- Local `verify-url.sh` passed at `/tmp/storage-aware-expiry-verify`; its result reports HTTP 200, title, lang, one h1, main, no missing alt text, no unlabeled buttons, and no console errors.
- Local demo screenshots: `/tmp/storage-aware-expiry-demo-390.png` and `/tmp/storage-aware-expiry-demo-1440.png`.
- Playwright Axe checks on home, demo, settings, privacy, and terms plus the 390 px dark/reduced-motion demo found no serious or critical findings.

## Known limits

- Household-license checkout remains intentionally unavailable. Existing license holders can check a token in Settings.
- Dates remain planning reminders, not food-safety advice. Label printing uses the browser’s print dialog.

## Deployment and live evidence

- Pushed commits `b2f08ee6b5913e6ac692b3687ced731daee54e0e`, `6604b438774d685f7dc45274a70f726e5e7d6bce`, and `0df62c13672f628443c1416cc5d5cff2a3b36f75` to `main`.
- Deployed `dist/` with the scoped Static Web App `sf-storage-aware-expiry` to production. No other resource was read or changed.
- Cold live home check passed: `https://storage-aware-expiry.sociobot.in/` returned 200 and `verify-url.sh` reported title, `lang=en`, exactly one h1, main, complete image/button labels, and no console errors.
- Cold live demo check passed at 390 × 844: title `Demo — Storage-Aware Expiry`; its first sample ticket started at y=735.8 (inside the initial viewport); zero console errors and zero serious/critical Axe findings. Screenshot: `/tmp/storage-aware-expiry-live-demo-390.png`.
- Live routing check passed: `/demo` returned 200; `/not-a-real-page` returned a true **404** with the branded Page not found document and route-specific metadata.
- Final cold-browser finding smoke passed for `?demo=1`, `/settings?demo=1`, `/privacy?demo=1`, `/terms?demo=1`, and `/print/sample-soup?demo=1`: banner controls, planned-date language, explicit item actions, external footer text, headings, and console were all checked.

---

# Earlier review handoff

Completed 2 September 2026 for work order `storage-aware-expiry-review-1`.

## Review result

- Verdict: **FAIL** with 14 findings in [review-1.md](review-1.md).
- Blocking issue: `/demo` loads five realistic samples, but every item ticket is below the initial 390 × 844 and 1440 × 900 viewports. The first screen shows an empty entry form instead of the product in use.
- Other material issues: inconsistent “Use by”/“planned date” terminology, incomplete JSON-export coverage, unlisted persistence/license/field claims, soft-404 behavior, stale route sharing metadata, and plain-language defects.
- No product code, deployment, infrastructure, DNS, billing resource, or external product resource was modified.

## Verification performed

- Opened the live site cold in fresh Chromium contexts at 390 × 844 and 1440 × 900.
- Exercised the live demo with a pre-existing real-data sentinel. Demo reset restored five samples; Start for real preserved the sentinel and copied no sample data.
- Confirmed the live demo reloads offline and all recorded demo requests are same-origin.
- Ran all 13 claim commands separately from a clean clone at `fe57bc1`; every command exited successfully. The `json-backup` assertion remains incomplete as documented in F-1-3.
- Ran the complete clean suite: `npm test` passed 18/18.
- Ran `npm run build`: passed; `dist/` was created; JavaScript is 29.93 KB raw and 9.88 KB gzip.
- Ran live Axe checks on home, demo, settings, privacy, terms, and not-found routes at 390 px with dark color scheme and reduced motion: zero violations.
- Ran `/opt/fleet/lib/verify-url.sh` against the live home page: passed.
- Confirmed no live console errors, horizontal overflow, or visible targets below 44 × 44.
- Rechecked prior checkout, touch-target, and asset-cache findings; all three remain fixed.

## Evidence and next step

The complete first-read notes, copy counts, claim matrix, exact findings, and fixes are in [review-1.md](review-1.md). The next worker should resolve all findings, especially moving real sample tickets into the initial demo viewport, and then rerun the review from a fresh context.

---

# Earlier repair handoff

Completed 2 September 2026 for work order `storage-aware-expiry-repair-1`.

## Repair summary

- Reproduced the reported checkout condition from the verifier evidence: the advertised checkout endpoint returned 404. This repair does not access or change shared billing production resources.
- Removed the broken **Buy a household license** path and all price/purchase promises. The product now plainly says that household-license checkout is unavailable; the free 20-item planner, exports, presets, labels, demo, and offline behavior remain available.
- Kept existing cached-license behavior for users who already have one, without advertising a purchase path.
- Raised all visible link and button targets to at least 44 × 44 CSS px, including the mobile menu, demo controls, filters, item actions, wordmark, and date-preset link.
- Restored Vite fingerprinted JavaScript and CSS filenames. The generated service worker derives its precache list and cache version from those hashed build assets.
- Added Static Web Apps cache policy: `/assets/*` is one-year immutable; HTML and `/sw.js` remain revalidated so releases and service-worker updates are discovered.
- Added regression coverage for unavailable checkout copy/no checkout link, every visible 390 px target, hashed build assets, service-worker references, and immutable-cache configuration.

## How to run

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/demo` for the isolated sample. Build deployable output with `npm run build`; it creates `dist/` with `index.html` at its root and generates `dist/sw.js` from the build asset names.

## Verification evidence

- `npm ci`: passed, 24 packages installed, zero audit findings.
- All 13 claim commands listed in `.factory/claims.json` were exercised individually, including `@claim:checkout-unavailable`.
- `npm test`: passed, 18/18 Chromium checks. This includes desktop, 390 px mobile, keyboard skip-link coverage, dark/reduced-motion accessibility smoke coverage, and explicit offline reload in its own browser context.
- Axe integration found no serious or critical violations on `/`, `/demo`, `/settings`, `/privacy`, and `/terms`; the 390 px target regression measured every visible interactive element.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed. Current output is 29.93 KB JS (9.88 KB gzip) and 14.39 KB CSS (4.11 KB gzip), well below the static-product budgets.
- `npm audit` and `npm audit --omit=dev`: zero vulnerabilities.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/storage-aware-expiry-verify`: passed: HTTP 200, correct title/lang, one `h1`, main landmark, no missing image alt text, no unlabeled buttons, and no console errors.
- The local build check confirms that `index.html` and `sw.js` reference `assets/index-<hash>.js` and `assets/index-<hash>.css`; `staticwebapp.config.json` applies immutable caching to asset URLs and a revalidating policy to `/sw.js`.
- Live mobile Lighthouse: Performance 97, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s and CLS 0. The report was written to `/tmp/storage-aware-expiry-lighthouse.json`.

## Known limits

- Household-license checkout intentionally remains unavailable until the factory registers and enables this product. The UI makes no claim that purchase works.
- Dates are planning reminders, not food-safety advice. Browser printing remains dependent on the user’s print dialog.

## Next steps

## Deployment and live evidence

- Repair commit `74b102767c6d3f4a943b0c02b3fc072aa2505d63` was deployed to the scoped Static Web App `sf-storage-aware-expiry` on 2 September 2026.
- Live URL: `https://storage-aware-expiry.sociobot.in/` returned HTTP 200. The product URL verifier reported no console errors, `lang=en`, one `h1`, a main landmark, no missing image alt text, and no unlabeled buttons.
- Live HTML references `assets/index-CJ2CKMUl.js` and `assets/index-D4KG0iCp.css`. The JavaScript response returned `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` returned `Cache-Control: public, max-age=0, must-revalidate`.
- A live 390 × 844 Chromium smoke test found the unavailable-checkout message, zero checkout links, zero targets below 44 px, and no console/page errors.

## Future work

If a household license is later registered, reintroduce checkout only after an end-to-end hosted checkout and return-license test passes.

## Independent verification 2 — PASS

Verified 2 September 2026 for `storage-aware-expiry-verify-2`.

- Candidate: `c46398ba2580bca21a910332618b259785873517`
- Live URL: <https://storage-aware-expiry.sociobot.in>
- Verdict: **PASS — accepted for release**

### Evidence

- Clean install, all 13 required claims, full 18-test Chromium suite, type check, and production build passed.
- Cold first-read and the one-click isolated demo passed. Reset demo and Start for real keep sample and real data separate.
- Independent live flows passed: add, edit, mark used, undo, reload persistence, invalid name/preset/import recovery, and delete-cancel recovery.
- Live desktop and 390 px mobile checks passed: keyboard skip link, reduced motion, no console/page errors, no horizontal overflow, 44 px interactive targets, and zero serious/critical Axe findings.
- The live PWA worker controls the page, update check completed, and the demo reloaded offline with sample data. Fingerprinted assets are immutable; HTML and service worker revalidate.
- Privacy recording saw only same-origin requests. Live headers include CSP, HSTS, nosniff, referrer policy, and permissions policy.
- Fresh-build HTML, JS, CSS, and service worker exactly match the live deployment by SHA-256.
- Existing-license verification permits 30 requests from one client and returns HTTP 429 with `Retry-After: 3` at request 31.

### Defects and known limits

No defects were found in this candidate. Household-license checkout remains intentionally unavailable and accurately disclosed; no purchase action is shown. Dates are planning reminders, not food-safety advice, and browser label printing depends on the browser print dialog.

Full evidence: [.factory/verification-2.md](verification-2.md).

---

# Independent verification 3 — PASS

Verified 2 September 2026 for `storage-aware-expiry-verify-3`.

- Candidate: `0bc2e8decb008a42071a5dd90b63fac9cf237a85`
- Live URL: <https://storage-aware-expiry.sociobot.in>
- Verdict: **PASS — accepted for release**

## What was independently verified

- Clean `npm ci`; all 17 exact `.factory/claims.json` commands; full `npm test` (24/24); `npm run lint`; and the exact production `npm run build` all passed.
- Cold first-read passed: the live first screen says what the planner does, identifies households that store/freeze food, and offers one-click **Try it with sample data** with its result stated beside it.
- Live normal, invalid, recovery, demo-isolation, keyboard, desktop, 390 px mobile, dark/reduced-motion, response-header, request-log, and offline-PWA checks passed.
- Live Playwright Axe scans found zero serious/critical issues across all public product routes; the URL verifier passed. Fresh mobile Lighthouse scored 96 performance / 100 accessibility / 100 best practices / 100 SEO.
- Candidate `dist` HTML, fingerprinted JS/CSS, and service worker match the deployed files byte-for-byte. Assets are one-year immutable; HTML and the worker revalidate.
- Privacy demo flow made only same-origin product requests. Existing-license verification is rate limited: 30 invalid requests returned 200; request 31 returned 429 with `Retry-After: 3`.

## Known limits and next steps

No release-blocking defects were found. Household license checkout remains intentionally unavailable and the product accurately says so; do not add a purchase link until the factory registers it and an end-to-end checkout/return-license verification passes. Dates remain planning reminders, not food-safety advice, and labels use the browser print dialog.

Full evidence: [.factory/verification-3.md](verification-3.md).

---

# Adversarial review 2 handoff

Completed 2 September 2026 for work order `storage-aware-expiry-review-2`.

## Result

- Wrote [review-2.md](review-2.md); verdict: **FAIL** with one blocking finding, `F-2-1`.
- No product code, deployment, DNS, billing, or infrastructure was changed.
- The demo inventory namespace is separate, but demo mode reads real cached license state and `/demo?license=…` writes the real license local-storage key. This contradicts the visible “nothing is saved” banner and the required isolated-demo boundary.

## Verification run

- Cold live Chromium checks at 390 × 844 and 1440 × 900: first screen clearly stated job, audience, and first action; demo showed a sample ticket in the initial viewport, banner, Reset, and Start for real.
- Fresh clone at `/tmp/sae-review-clean.FSVHUa`: `npm ci`, every claims-manifest command, aggregate `npm test -- --grep '@claim:'` (17/17 passed), and `npm run build` (passed; `dist/` produced).
- Live direct routes and same-origin link crawl passed; `/not-a-real-page` returned 404. The request log for the normal demo flow contained only the product origin, with no console errors.
- Confirmed every `review-1.md` finding is genuinely fixed; see the evidence table in `review-2.md`.

## Required next step

In demo mode, never read/write/remove `sb_license:storage-aware-expiry` or its cached verdict; ignore or explicitly leave demo before accepting `license` query parameters. Add a regression to `@claim:demo-isolation` for seeded real license state and `/demo?license=…`, then redo the adversarial review.

---

# Polish round 2 repair

Completed 2 September 2026 for `storage-aware-expiry-polish-2`.

## What changed

- Demo mode establishes its isolated state before any license code runs. It neither reads nor changes `sb_license:storage-aware-expiry` or `sb_license_verdict:storage-aware-expiry`; a `license` parameter on a demo URL is ignored.
- Demo Settings no longer renders household-license controls, and demo always renders as unpaid even when real browser keys contain a valid cached verdict.
- `@claim:demo-isolation` now seeds both real license keys and covers `/demo`, `/settings?demo=1`, and `/demo?license=demo-write-token`, before also checking reset and Start for real.
- Updated the demo documentation, README privacy wording, claims manifest, catalog description, and footer build marker to reflect the release.

## Local evidence

- `npm ci` completed with zero audit vulnerabilities.
- All 17 exact claim commands in `.factory/claims.json` passed separately. The aggregate browser suite passed **24/24**.
- `npm run lint` and `npm run build` passed; `dist/` contains the PWA output. Built JS is 33.33 KB raw / 10.61 KB gzip; CSS is 14.79 KB raw / 4.19 KB gzip.
- Playwright Axe integration reports zero serious or critical findings. `/opt/fleet/lib/verify-url.sh` passed against `/demo` with no console errors and correct title, language, main landmark, heading, labels, and alt text.
- Local demo evidence: `/tmp/storage-aware-expiry-round2-local-demo-390.png`.

## Remaining scope

No known product defects remain. Household license checkout remains intentionally unavailable and is accurately disclosed. Dates remain planning reminders, not food-safety advice; labels use the browser print dialog.

See [.factory/polish-2.md](polish-2.md) for the finding-by-finding mapping. Deployment commit and cold live evidence are added after deployment.
