# Independent verification — FAIL

Verified 2 September 2026 for work order `storage-aware-expiry-verify-1`.

- Candidate: `2f8cf16cc45194bd1ec3bd5976790753d81d396e`
- Live URL: <https://storage-aware-expiry.sociobot.in>
- Artifact: offline PWA
- Verdict: **FAIL — do not release this candidate**

## Release-blocking finding

### P1 — The advertised purchase cannot start

The pricing panel advertises a ₹399 one-time household license and links **Buy a household license** to:

`https://api.sociobot.in/api/v1/products/storage-aware-expiry/checkout`

A fresh `GET` on 2 September 2026 returned HTTP 404 and:

```json
{"error":"enabled factory product","status":404}
```

This confirms the builder handoff's deployment prerequisite was not completed. A visitor cannot buy the paid feature advertised on the live product. Register and enable this exact product in the Sociobot billing engine, then verify a real checkout redirect and return-license flow before release.

## Other findings

### P2 — Mobile touch targets are below the required 44 px minimum

At a 390 × 844 viewport, many interactive targets are 40 px high: **Menu**, **Reset demo**, **Start for real**, all storage filters, and every item **Mark used**, **Edit**, and **Print** action. The wordmark link is 30 px high and **Change date presets** is 16 px high. This violates the attached accessibility and design baseline even though axe does not flag target size.

### P2 — Static application assets are not long-lived or immutable

The live HTML, `/assets/app.js`, `/assets/app.css`, and `/sw.js` all return `cache-control: public, must-revalidate, max-age=30`. Application filenames are deliberately un-hashed (`app.js`, `app.css`). The PWA service worker caches the shell, but the deployment does not meet the required long-lived immutable caching policy for versioned application assets.

## Required claims gate

`.factory/claims.json` exists. Every listed command was run independently from the clean candidate before other QA. All 12 passed:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `location-defaults` | Pass | Fridge and freezer selections produced different preset dates. |
| `use-first-order` | Pass | Plain yogurt preceded baby spinach by planned date. |
| `csv-export` | Pass | Download contained its header and five sample rows. |
| `print-label` | Pass | Lentil soup rendered in the print-media label. |
| `local-only` | Pass | Demo add flow made same-origin requests only. |
| `offline-reload` | Pass | Dedicated context reloaded `/demo` offline with sample data. |
| `free-limit` | Pass | The 21st active item was refused. |
| `paid-license` | Pass | Cached valid fixture allowed 21 items and 21 batch labels. This does not cover the broken live checkout. |
| `item-workflow` | Pass | Add, edit, mark used, and undo succeeded. |
| `demo-isolation` | Pass | Reset restored five samples; starting for real showed an empty list. |
| `json-backup` | Pass | JSON export and fixture import succeeded. |
| `preset-settings` | Pass | A 120-day freezer preset changed the next suggestion. |

The clean aggregate `npm test` run also passed all 15 tests in 43.6 seconds.

## First-read test

Pass on desktop and 390 px mobile. The cold first screen says what it does: plan stored-food dates and use food before it is forgotten. It names the audience: households that freeze and store food without tracking every purchase. The first action is the visible **Try it with sample data** link, with the explanation “See five items in use-first order. No setup.” One click opens five realistic items and a persistent demo banner.

## Build and static quality gates

- `npm ci`: pass; 24 packages installed, zero audit findings.
- `npm test`: pass; 15/15.
- Type check: pass through `tsc --noEmit` in the build command.
- Lint: not available; no lint script exists.
- `npm run build`: pass; `dist/` produced.
- Output: JS 30.80 KB raw / 10.13 KB gzip; CSS 14.34 KB raw / 4.11 KB gzip; mobile hero 18.97 KB. All size budgets pass.
- `npm audit` and `npm audit --omit=dev`: zero vulnerabilities.
- Live Lighthouse mobile: Performance 95, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.3 s, TBT 260 ms, CLS 0.

## Independent functional QA

- Normal case: added **Leftover dal**, changed quantity, moved it from fridge to freezer, saved it, marked it used, and restored it with Undo.
- Date behavior: on 2 September 2026, fridge suggested 7 September and freezer suggested 1 December.
- Persistence: a completed real-data save survived reload and appeared in a second tab in the same browser profile.
- Invalid data: a zero-day preset was rejected and focused; malformed JSON produced a clear recovery message; missing item name/dates produced an assertive error; correcting the fields then saved successfully.
- Destructive flow: remove opened a named native modal, focused **Keep item**, and cancel closed it without deleting.
- Routing: direct routes, browser back, and focus movement to the destination `h1` worked.
- Routes/assets: `/`, `/demo`, `/settings`, `/privacy`, `/terms`, manifest, robots, sitemap, offline page, 404 page, icons, and social image all returned 200.

## Accessibility, responsive behavior, and errors

- Desktop and 390 px layouts had no horizontal overflow.
- Fresh light and dark contexts had zero serious/critical axe findings across `/`, `/demo`, `/settings`, `/privacy`, `/terms`, and an unknown route.
- One `h1`, a `main` landmark, `lang=en`, titled pages, labeled buttons, alt text, and a first-tab skip link were present.
- Keyboard-only navigation opened the mobile menu and added an item with Tab and Enter. Focus uses a visible 3 px brass outline with 3 px offset.
- The remove dialog exposes its name and initially focuses the safe action.
- Reduced motion reduced the ticket animation to `0.00001s`; no layout overflow occurred.
- No console or uncaught page errors occurred in desktop or mobile flows.
- Touch target sizing fails as described above.

## Privacy, headers, identity, PWA, and API limits

- The complete demo workflow requested only `https://storage-aware-expiry.sociobot.in`; no analytics, third-party fonts, or third-party scripts were observed.
- Real inventory uses IndexedDB; demo state uses the separate session key documented in `.factory/demo.md`.
- Main response headers include CSP, HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and a restrictive permissions policy. CSP allows only self plus the documented Sociobot API connection.
- Live `index.html`, `assets/app.js`, `assets/app.css`, and `sw.js` exactly match the local production build by SHA-256. This establishes that the tested deployment matches the candidate.
- Manifest fields and 192, 512, and maskable 512 icons are present. The live service worker controlled the page, was `activated`, completed `registration.update()`, and reloaded the demo offline with sample data and the offline status message.
- Billing verification returned the documented invalid verdict for a fake token. In a deliberate single-client burst, 30 requests were accepted and request 31 returned HTTP 429 with `Retry-After: 3`.
- Authentication, backend persistence/concurrency, and package-consumer tests are not applicable to this unsigned static PWA.

## Release decision

The core local-first planner is useful and well tested, but the candidate is not releasable while its live paid purchase action returns 404. Fix the checkout registration, bring mobile targets to at least 44 × 44 CSS px, and ship cacheable fingerprinted assets; then rerun this verification.
