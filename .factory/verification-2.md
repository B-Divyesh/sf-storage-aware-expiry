# Independent verification — PASS

Verified 2 September 2026 for `storage-aware-expiry-verify-2`.

- Candidate: `c46398ba2580bca21a910332618b259785873517`
- Live: <https://storage-aware-expiry.sociobot.in>
- Verdict: **PASS — accepted for release**

## First-read and demo

A cold, cacheless visit clearly stated the job (“Use stored food before you forget it”), audience (households that freeze and store food), and first action. The visible **Try it with sample data** link says it opens five items in use-first order with no setup. The one-click demo showed the persistent sample-data banner, Reset demo, and Start for real.

Adding a sixth demo item, resetting, and starting for real restored five samples then an empty real inventory. The demo/add workflow made only same-origin requests.

## Claims gate

`.factory/claims.json` contains 13 claims. Every listed test was run from this clean candidate; the all-claims rerun (`npm test -- --grep '@claim:'`) recorded Playwright status `passed` with no failed tests.

| Claim | Result | Observable result |
| --- | --- | --- |
| `location-defaults` | Pass | Fridge/freezer suggestions changed by preset. |
| `use-first-order` | Pass | Plain yogurt preceded baby spinach. |
| `csv-export` | Pass | CSV had its header and five sample records. |
| `print-label` | Pass | Lentil soup rendered in print media. |
| `local-only` | Pass | Only the product origin was requested. |
| `offline-reload` | Pass | Dedicated offline reload showed sample items. |
| `free-limit` | Pass | Item 21 was refused on the free plan. |
| `checkout-unavailable` | Pass | Notice visible; no checkout link rendered. |
| `paid-license` | Pass | Cached valid fixture allowed 21 items/labels. |
| `item-workflow` | Pass | Add, edit, use, undo completed. |
| `demo-isolation` | Pass | Demo reset and Start for real were isolated. |
| `json-backup` | Pass | JSON export and fixture import completed. |
| `preset-settings` | Pass | 120-day freezer preset changed the next date. |

No material landing-page claim is unlisted: dates, sort order, local-only behavior, offline use, item limit, exports, labels, backup, demo isolation, presets, and checkout availability are covered above.

## Quality and functional QA

- `npm ci`, `npm audit`, and `npm audit --omit=dev`: passed; 24 packages; zero vulnerabilities.
- `npm test`: passed, 18/18 Chromium tests; `test-results/.last-run.json` says `passed` with no failed tests.
- `npm run lint` and `npm run build`: passed; `dist/` created.
- Output: JS 29,928 bytes / 9,838 gzip; CSS 14,390 / 4,124 gzip; hero WebP 18,968 bytes.
- Independent live workflow passed: add **QA chicken stock**, edit one to two litres, mark used, undo, reload, and verify persistence.
- Recovery passed: blank name produced the assertive required-fields message; freezer preset `0` was focused and rejected with the native min=1 message; malformed JSON gave an actionable import message; the named removal dialog focused **Keep item** and cancellation preserved the item.
- Desktop and 390 × 844 dark/reduced-motion layouts had no horizontal overflow. The full suite measured all visible targets at at least 44 px. First Tab reached the skip link.
- Live Axe scans found zero serious/critical results on `/`, `/demo`, `/settings?demo=1`, `/privacy`, `/terms`, and an unknown route. `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, title, `lang=en`, one `h1`, `main`, image alt text, labelled buttons, and no console errors.

## Privacy, PWA, deployment, and limits

- Cold load and the complete demo flow made only same-origin product requests: no analytics, third-party scripts/fonts, or inventory egress.
- Live headers include CSP with response-header `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and permissions policy.
- Fresh-build HTML, JS, CSS, and `sw.js` exactly match live by SHA-256. The live asset names are `index-CJ2CKMUl.js` and `index-D4KG0iCp.css`.
- JS/CSS are immutable for one year; HTML and `/sw.js` revalidate. The manifest has standalone display, versioned start URL, and 192/512/maskable icons.
- The live worker was active and controlling the page; `registration.update()` completed; after first visit, offline `/demo` reload showed five samples and the offline notice.
- This unsigned static PWA has no sign-in, product backend, server persistence/concurrency, or library/CLI surface.
- Existing-license verification is the only product-scoped server call. One client received 30 successful responses; request 31 returned HTTP 429 with `Retry-After: 3`. An invalid token returned `{ "valid": false, "reason": "invalid" }`.

## Defects by severity

None found. Earlier checkout, mobile-target, and asset-cache blockers are fixed. Household checkout is intentionally unavailable and accurately disclosed; no broken purchase action is advertised.
