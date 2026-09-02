# Polish round 2

Completed 2 September 2026 for `storage-aware-expiry-polish-2`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Demo keeps realistic sample tickets in the first viewport. | `regression: demo shows a sample item inside the first 390px viewport`; `/tmp/storage-aware-expiry-round2-local-demo-390.png`; live `/demo` check. |
| F-1-2 | Customer-facing dates use **Planned date** and **Planned for**. | `@claim:print-label`, `@claim:editable-optional-fields`; live `/demo` and `/print/sample-soup?demo=1` checks. |
| F-1-3 | JSON backup test parses the downloaded bytes before importing them. | `@claim:json-backup`; live `/settings?demo=1` check. |
| F-1-4 | Real browser storage persistence remains a registered, reload-and-second-tab claim. | `@claim:real-persistence`; live `/` check. |
| F-1-5 | Existing-license verification remains token-only and uses fixtures in the claim test. | `@claim:license-verification`; live `/settings` check. |
| F-1-6 | Editable planned date, freezer date, and optional fields remain persisted and tested. | `@claim:editable-optional-fields`; live `/demo` check. |
| F-1-7 | The explicit product-scope statement remains registered as a claim. | `@claim:limited-scope`; live `/` check. |
| F-1-8 | Item controls retain visible result labels and item-specific accessible names. | `@claim:print-label`; Axe integration; live `/demo` check. |
| F-1-9 | Unknown routes retain the configured real 404 response and branded document. | `regression: every application route has route-specific metadata and the static 404 policy`; live `/not-a-real-page` HTTP check. |
| F-1-10 | App, legal, print, demo, and not-found views retain route-specific title and sharing metadata. | `regression: every application route has route-specific metadata and the static 404 policy`; live route checks. |
| F-1-11 | Not-found views retain the plain `Page not found` heading. | route metadata/404 regression; live `/not-a-real-page` check. |
| F-1-12 | README user copy remains plain language. | `.factory/copy-audit.md`; README check. |
| F-1-13 | The process heading remains `Use the earliest planned item first`. | `.factory/copy-audit.md`; live `/` check. |
| F-1-14 | The footer identifies Param Factory as an external site. | browser accessibility suite; live `/` check. |
| F-2-1 | Demo mode now decides isolation before any license handling, resets paid state, hides license controls, ignores demo URL license values, and never reads, writes, or removes the real license keys. Back/forward mode changes also establish demo state before data loading. | `@claim:demo-isolation` seeds both real keys, visits `/demo`, `/settings?demo=1`, and `/demo?license=demo-write-token`, verifies unchanged values and no paid UI, then verifies reset/start-real behavior; `/tmp/storage-aware-expiry-round2-local-demo-390.png`; live `/demo?license=demo-write-token` check. |

## Verification

- Fresh dependencies: `npm ci` completed with zero audit vulnerabilities.
- Every one of the 17 exact commands in `.factory/claims.json` was run separately. All passed.
- `npm test` passed 24/24 Chromium tests, including Axe integration on major routes and 390 px dark/reduced-motion demo.
- `npm run lint` and `npm run build` passed. The built JS is 33.33 KB raw / 10.61 KB gzip and CSS is 14.79 KB raw / 4.19 KB gzip.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo /tmp/storage-aware-expiry-verify-round2-final` passed with no console errors, one `h1`, a `main`, `lang=en`, labels, and image alt text.
- The catalog sentence is now verb-first and 73 characters: “Plan storage-aware dates to use pantry, fridge, and freezer items first.”

## Live evidence

- Repair commit `00c4a690d3797a816886a44668b044c25fc26c1e` deployed to scoped Static Web App `sf-storage-aware-expiry` on 2 September 2026. The deployment reached `https://storage-aware-expiry.sociobot.in` over HTTPS.
- Cold `verify-url.sh` passed at `https://storage-aware-expiry.sociobot.in/demo`; evidence is in `/tmp/storage-aware-expiry-live-verify-round2/`, including desktop and mobile screenshots.
- A separate cold 390 px Chromium context seeded both real license keys, then opened `/demo`, `/settings?demo=1`, and `/demo?license=demo-write-token`. Each retained the two exact seeded values, showed no paid status or license input, and logged no console errors. Screenshot: `/tmp/storage-aware-expiry-round2-live-demo-390.png`.
- Live 390 px Axe checks passed with zero serious/critical violations for `/`, `/demo`, `/settings`, `/privacy`, `/terms`, `/print/sample-soup?demo=1`, and `/not-a-real-page`. Each had the intended title, one matching `h1`, one `main`, matching canonical and Open Graph URLs, and no horizontal overflow.
- `https://storage-aware-expiry.sociobot.in/not-a-real-page` returned HTTP 404. The current fingerprinted JS is `index-B-Wd28mZ.js`, matching the deployed repair build.
