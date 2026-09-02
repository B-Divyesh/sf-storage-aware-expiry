# Independent verification 3 — PASS

Verified 2 September 2026 for work order `storage-aware-expiry-verify-3`.

- Candidate commit: `0bc2e8decb008a42071a5dd90b63fac9cf237a85`
- Live URL: <https://storage-aware-expiry.sociobot.in>
- Verdict: **PASS — accepted for release**

## Cold first-read

A new, cacheless desktop visit answered the three required questions in plain words on its first screen:

- What it does: **“Use stored food before you forget it.”**
- Who it is for: households that freeze and store food without tracking every grocery purchase.
- What to do first: **“Try it with sample data”**, with the adjacent promise “See five items in use-first order. No setup.”

The action opens `/demo` in one click. The demo displayed the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**.

## Required claims gate

`.factory/claims.json` exists and contains 17 claims. From this clean checkout, after `npm ci`, I ran every exact command listed in that manifest separately against the product's production-preview demo entry point. All passed. A subsequent full `npm test` run passed all 24 Chromium tests.

| Claim | Result | Observed outcome |
| --- | --- | --- |
| `location-defaults` | Pass | Fridge and freezer selections produced their different suggested dates. |
| `use-first-order` | Pass | The earliest planned sample item was first. |
| `csv-export` | Pass | The CSV included its header and five sample rows. |
| `print-label` | Pass | The active soup item rendered as a browser-print label. |
| `local-only` | Pass | The demo add flow made only a same-origin request. |
| `offline-reload` | Pass | A dedicated fresh context reloaded demo data offline. |
| `free-limit` | Pass | The free plan refused item 21. |
| `checkout-unavailable` | Pass | The unavailable notice appeared and no checkout link rendered. |
| `paid-license` | Pass | A valid cached fixture allowed 21 items and batch labels. |
| `item-workflow` | Pass | Add, edit, mark used, and undo all completed. |
| `demo-isolation` | Pass | Reset restored five samples and Start for real opened an empty real list. |
| `json-backup` | Pass | JSON download and fixture import completed. |
| `preset-settings` | Pass | A 120-day freezer preset controlled the next suggestion. |
| `real-persistence` | Pass | A real item survived reload and a second page in the same context. |
| `license-verification` | Pass | Fixture requests contained only the pasted token and valid/invalid UI was correct. |
| `editable-optional-fields` | Pass | Editable planned date and blank optional fields persisted. |
| `limited-scope` | Pass | The stated barcode/nutrition/purchase-history exclusions were visible. |

The landing page and README claims are covered by this set; no unlisted material product claim was found.

## Functional, accessibility, and responsive QA

- `npm ci` passed: 24 packages installed and zero audit vulnerabilities.
- `npm test` passed: **24/24** Chromium tests. `npm run lint` (`tsc --noEmit`) and the exact `npm run build` production build passed; `dist/` was produced.
- Live demo QA passed: blank name produced “Name and both dates are required. Fill them in and save again.”; adding **QA pearl barley**, editing quantity from one to two jars, marking used, and Undo all worked. Reset demo returned five samples; Start for real showed zero items.
- Desktop plus 390 × 844 dark/reduced-motion live QA passed: no horizontal overflow, first Tab focused the visible skip link, and its focus outline was solid. No application console or page errors occurred on the main product routes.
- Playwright AxeBuilder found zero serious or critical violations on `/`, `/demo`, `/settings`, `/privacy`, `/terms`, `/print/sample-soup?demo=1`, and the not-found route. Each had exactly one `h1` and one `main` landmark. `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, title, `lang=en`, one `h1`, main, no missing alt text, no unlabeled buttons, and no console errors.
- `npx @axe-core/cli` could not start in this container because `/usr/bin/chromedriver` is absent. The required equivalent Playwright Axe scan above ran in the installed Chromium browser and passed.
- Fresh mobile Lighthouse on `/demo`: Performance **96**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.2 s, CLS 0, and no console errors. Report: `/tmp/sae-lighthouse.json`.
- Built initial JS is 33,256 bytes (10.55 KB gzip), CSS is 14,794 bytes (4.19 KB gzip), and the desktop hero WebP is 42,068 bytes; all are below the applicable static-PWA budgets.

## Privacy, deployment, PWA, and API allowance

- A live Playwright request log through demo add/edit/use/reset recorded only `https://storage-aware-expiry.sociobot.in`; no inventory data left the origin. Cold load also used only the product origin and self-hosted assets.
- Live responses include CSP with response-header `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a restrictive permissions policy. Hashed JS/CSS have `Cache-Control: public, max-age=31536000, immutable`; HTML and `/sw.js` revalidate.
- The manifest is served as `application/manifest+json` and declares standalone display, a versioned start URL, and 192, 512, and maskable icons.
- The live service worker was active, controlled `/demo`, and `registration.update()` succeeded. After a first online visit, a 390 px fresh context went offline and reloaded `/demo` with sample data and the visible offline status.
- Candidate/deployment match: fresh `dist/index.html`, `assets/index-BrvoBEBp.js`, `assets/index-S-QUQLrG.css`, and `sw.js` each compared byte-for-byte equal to their live URLs. The deployed fingerprinted assets therefore match candidate commit `0bc2e8d`.
- The only product-scoped server call is existing-license verification. With distinct deliberately invalid tokens from one client, requests 1–30 returned HTTP 200 with the invalid verdict; request 31 returned **HTTP 429** with **`Retry-After: 3`**. Observed allowance: 30 requests per window. This static PWA otherwise has no sign-in, server persistence, backend health, or concurrency surface.

## Defects by severity

None found.

Known product limits are accurately disclosed: dates are planning reminders rather than food-safety advice; browser labels use the browser print dialog; household-license checkout is intentionally unavailable and no purchase action is advertised.
