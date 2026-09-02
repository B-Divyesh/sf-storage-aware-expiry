# Independent verification 4 — FAIL

Verified 2 September 2026 for candidate `e2b5a76f486877bada4610c96bab124823a544d5` at <https://storage-aware-expiry.sociobot.in>.

## Release verdict

**FAIL — do not release this candidate.** The product has one release-blocking live dead link (V4-1). No product code, deployment, DNS, billing, or other resource was changed during this verification.

## First-read result

In a new Chromium context, the cold landing screen said: **“Use stored food before you forget it.”** It identified the audience as households that freeze and store food without tracking every grocery purchase. The first action was **“Try it with sample data”**, with the adjacent explanation **“See five items in use-first order. No setup.”** This meets the plain-words and one-click demo requirement.

## Clean candidate checks

- `npm ci` passed (24 packages; zero audit vulnerabilities reported).
- Every exact command in `.factory/claims.json` was run individually against the product’s production-preview demo entry point. All 17 claim runs passed: `location-defaults`, `use-first-order`, `csv-export`, `print-label`, `local-only`, `offline-reload`, `free-limit`, `checkout-unavailable`, `paid-license`, `item-workflow`, `demo-isolation`, `json-backup`, `preset-settings`, `real-persistence`, `license-verification`, `editable-optional-fields`, and `limited-scope`.
- Full `npm test` passed all **24/24** Chromium tests; the final Playwright status was `passed` with no failed tests.
- `npm run lint` passed (`tsc --noEmit`).
- `npm run build` passed and produced `dist/`. The initial bundle is 33.33 KB raw / 10.61 KB gzip JS and 14.79 KB raw / 4.19 KB gzip CSS.

## Live product evidence

- Candidate alignment: live `index.html`, fingerprinted JS, fingerprinted CSS, `manifest.webmanifest`, and `sw.js` were SHA-256-identical to this candidate’s fresh `dist/` files.
- `/opt/fleet/lib/verify-url.sh` passed on the live home page: HTTP 200, title, `lang=en`, one `h1`, one `main`, no missing image alt text, no unlabeled buttons, and no console errors.
- Desktop and 390 × 844 mobile checks passed. Mobile had no horizontal overflow (`390px` scroll width/client width); keyboard opened the mobile menu and exposed Settings. The first Tab focused the visible skip link.
- Axe scans of `/`, `/demo`, `/settings`, `/privacy`, and `/terms` had zero serious or critical findings (and no lower-severity findings). `prefers-reduced-motion: reduce` reduced ticket animation and transition duration to `0.00001s` with one iteration.
- Demo privacy recording while adding an item observed only `https://storage-aware-expiry.sociobot.in`; no item data request left the origin. The browser console and page-error logs were empty.
- PWA: the live service worker controlled the page, `registration.update()` completed with an active worker, and its precache was present. In a dedicated context, `/demo` reloaded offline with sample item **Baby spinach** and the offline notice.
- Response headers on the HTML include HSTS, CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a restrictive permissions policy. Fingerprinted JS had `Cache-Control: public, max-age=31536000, immutable`; HTML revalidates. All product routes returned 200 and `/not-a-real-page` returned 404.
- Live Lighthouse mobile: Performance **90**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s, LCP 1.2 s, CLS 0, 60,296 B transferred.
- Representative real flows passed in an isolated demo: add, mark used, Undo, date/preset changes, JSON import rejection/recovery, and printable labels. Blank required name was rejected with an asserted error. A past planned date was accepted as an overdue planning date, which is consistent with the product’s editable-date and use-first behavior.
- Existing-license endpoint allowance was freshly exercised from one client using one invalid token: requests 1–30 returned 200; request 31 returned **429** with `Retry-After: 3` (requests 32–35 remained 429). Observed allowance: **30 requests**.

## Defects

| ID | Severity | Evidence | Required resolution |
| --- | --- | --- | --- |
| V4-1 | **High — release blocking** | Every rendered public route contains the footer link **“Built by Param Factory (external site)”** targeting `https://hello.sociobot.in/`. On 2 September 2026, `getent ahosts hello.sociobot.in` returned no record and `curl -I https://hello.sociobot.in/` failed with `Could not resolve host`; the link crawl recorded HTTP `000`. | Replace it with a live, correct Param Factory URL or remove the link, then deploy and repeat the external-link crawl. |

The core offline planner is otherwise functioning and its visible privacy, demo, storage-aware dates, printing, export/import, and food-safety-limit promises were substantiated. The dead footer link nevertheless violates the required no-dead-links release gate.
