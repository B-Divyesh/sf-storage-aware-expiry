# Adversarial first-read review 1 — Storage-Aware Expiry

Reviewed 2 September 2026 for work order `storage-aware-expiry-review-1`.

- Candidate: `fe57bc15aa6dbee4a0e876e0bf166658c0834823`
- Live site: <https://storage-aware-expiry.sociobot.in>
- Viewports: 390 × 844 and 1440 × 900, fresh Chromium contexts
- Verdict: **FAIL**

The product is understandable on first load and its core workflows work. It does not pass this review because the one-click demo hides every sample item below the first viewport, one listed claim is not fully tested, several live/README claims are not registered, and copy and route defects remain.

## Findings

### Blocking

#### F-1-1 — The demo does not show sample data in its first screen

- Exact location: `/demo`, immediately after choosing **Try it with sample data**, at both 390 × 844 and 1440 × 900.
- Exact text visible: “Sample household · five items”, “Use what needs attention first”, “Try the full list. Your changes stay inside this temporary demo.”, and “05 ACTIVE”. The rest of the viewport is an empty add-item form.
- Evidence: at 390 px, the five sample tickets begin at vertical positions 1,419 px, 1,638 px, 1,858 px, 2,078 px, and 2,297 px. None intersects the 844 px viewport. The desktop capture also shows no sample ticket in the first 900 px.
- Why this fails: the required first screen after the one-click action must already show the product being used with realistic data. A count of five is not sample data; the visitor cannot see an item, planned date, storage place, or available action without a long scroll.
- Concrete fix: on `/demo`, place a compact use-first preview above the add form. Show at least the first three named samples with storage place, planned date, and **Mark used**, **Edit item**, and **Print label** actions in the initial viewport. Keep the full add form below that preview. Add a 390 × 844 assertion that at least one `.item-ticket` intersects the initial viewport.

### Major

#### F-1-2 — “Use by” conflicts with the product’s non-safety “planned date” language

- Exact location: landing form label and every item/print label: “Use by”. Elsewhere the product says “planned date” and “Dates are reminders, not food-safety advice.”
- Why this matters: “use by” commonly reads as a food-safety deadline. The app expressly does not determine safety, and two terms are used for the same date.
- Concrete fix: use **Planned date** as the field label and **Planned for [date]** on tickets and print labels. Use that term in the README, demo, settings, and claims.

#### F-1-3 — The JSON export claim test does not inspect the exported backup

- Exact location: `.factory/claims.json`, `json-backup`; `tests/app.spec.ts`, `@claim:json-backup`.
- Exact claim: “Exports and imports JSON backups.”
- Why this fails: the test confirms a download starts, but never reads its bytes. It then imports a separately constructed fixture. An empty or corrupt export would still pass, leaving half of the listed claim untested.
- Concrete fix: read the downloaded JSON, parse it, and assert version 1, all five sample items, and the three presets. Then import that downloaded payload in a fresh demo state and assert the restored records and presets.

#### F-1-4 — Real-inventory persistence is an unlisted, untested claim

- Exact quotes: README, “Keeps inventory data in IndexedDB on the current device.” and “Real inventory uses the IndexedDB database `storage-aware-expiry-real-v1`.”
- Why this fails: `local-only` records network requests in demo mode; `item-workflow` does not reload. No claim entry proves that a real item survives reload in IndexedDB.
- Concrete fix: add a `real-persistence` claim and a fresh-context test that adds a real item, reloads, opens a second page in the same context, and confirms the item remains. If the implementation detail is not useful to readers, rewrite the copy as “Saved items stay in this browser” while retaining the persistence test.

#### F-1-5 — Existing-license behavior and token egress are unlisted claims

- Exact quote: README, “Existing licenses can still be checked through the Sociobot billing API; there is no embedded payment provider or product ID.”
- Exact quote: README, “License tokens use their own `sb_license:storage-aware-expiry` key and are sent only to the Sociobot verification endpoint.”
- Why this fails: `paid-license` injects a cached verdict and never exercises verification. `checkout-unavailable` only checks copy and absent checkout links. No listed claim proves the request destination, response handling, or “only” privacy assertion.
- Concrete fix: replace the jargon with “Existing license holders can check a license in Settings. New licenses cannot be bought right now.” Add a `license-verification` claim whose test intercepts the product-specific verification endpoint, asserts that only the license token is sent there, returns valid and invalid fixtures, and checks the resulting UI. Keep live spend and secrets out of the test.

#### F-1-6 — Editable-date and optional-field claims are not fully represented by a claim test

- Exact quotes: landing, “Every date stays editable.”; “Quantity is optional.”; README, “Suggests an editable planned date…” and “Records an optional quantity, frozen-on date, and note.”
- Why this fails: `location-defaults` only observes automatic date suggestions. `item-workflow` edits quantity and changes storage place, but does not save a manually chosen planned date or add an item with blank optional fields. Frozen-on and note behavior are also not asserted.
- Concrete fix: add a claim for editable/optional fields. Test a blank quantity and note, a manually overridden planned date, a frozen-on date, reload, and the rendered values. Alternatively, narrow the copy to the behavior already covered.

### Minor

#### F-1-7 — A landing-page scope claim is not listed in `claims.json`

- Exact quote: “It does not scan barcodes, track nutrition, or follow every purchase.”
- Why this fails: this is a scope promise a visitor can rely on, but no claim entry names it.
- Concrete fix: add a `limited-scope` claim with a static UI/source assertion, or remove the sentence and keep only the safety limitation.

#### F-1-8 — Repeated item actions do not name their result or item

- Exact location: demo item rows, repeated buttons/links “Edit” and “Print”.
- Why this matters: the labels do not say **Edit item** or **Print label**, and a screen-reader links list contains five indistinguishable “Print” links.
- Concrete fix: use visible labels **Edit item** and **Print label**, with accessible names such as “Edit Baby spinach” and “Print label for Baby spinach”.

#### F-1-9 — Unknown URLs are soft 404s, and the static 404 document is incomplete

- Exact location: `https://storage-aware-expiry.sociobot.in/not-a-real-page` returns HTTP 200 while rendering the not-found view. `/404.html` also returns 200 and has no shared header/footer, description, canonical, Open Graph metadata, or favicon.
- Why this matters: crawlers and clients cannot distinguish a missing route, and the configured fallback document does not meet the site skeleton if it is served.
- Concrete fix: configure the host to return status 404 with the designed 404 document. Give that document the same wordmark/header/footer, favicon, route-appropriate description, and canonical policy. Add an HTTP-status regression test.

#### F-1-10 — Non-home routes publish home-page sharing metadata

- Exact location: `/demo`, `/settings`, `/privacy`, `/terms`, `/print/sample-soup?demo=1`, and the SPA not-found view.
- Exact values: `og:title` remains “Storage-Aware Expiry — Plan what to use first” and `og:url` remains the home URL. The description also remains the home inventory pitch on legal and not-found routes.
- Why this matters: copied deep links describe and canonicalize themselves in the DOM, but social previews describe a different page.
- Concrete fix: update description, Open Graph title/description/URL, and Twitter title/description on each route alongside `document.title` and canonical. Add route-metadata tests.

#### F-1-11 — The 404 heading is a metaphor

- Exact quote: “This shelf is empty” on both the SPA not-found view and `/404.html`.
- Why this fails: out of context, the heading does not say that the page is missing. It violates the plain-words rule for headings.
- Concrete fix: use **Page not found** as the `h1`. Keep “Your stored items are unchanged” as supporting text.

#### F-1-12 — README copy uses unexplained implementation jargon

- Exact quotes: “local-first PWA”, “IndexedDB”, “Sociobot billing API”, “embedded payment provider or product ID”, and “SPA fallback”.
- Why this matters: the README addresses users as well as deployers, but these phrases require product or web-platform context.
- Concrete rewrites:
  - “Storage-Aware Expiry is a browser app for households that keep a few easy-to-forget items in a pantry, fridge, or freezer.”
  - “Saved items stay in this browser using IndexedDB.”
  - “Existing license holders can check a license in Settings. New licenses cannot be bought right now.”
  - “The deployment file sends app routes to `index.html`, adds security headers, and serves the not-found page.”

#### F-1-13 — One process heading depends on surrounding layout

- Exact quote: “Use from the top”.
- Why this fails: heard alone in a heading list, “the top” has no named object or ordering rule.
- Concrete fix: use **Use the earliest planned item first**.

#### F-1-14 — The external footer link is not identified in visible or accessible text

- Exact location: footer link “Built by Param Factory” to `https://hello.sociobot.in/`.
- Why this fails: `rel="external"` does not tell a visitor or screen reader that the link leaves this product.
- Concrete fix: use “Built by Param Factory (external site)” or add equivalent visually hidden accessible text. The external destination was not fetched because the work order forbids connecting to resources outside this product’s scope.

## Cold first-screen result

Before scrolling, the answer was:

- What it does: orders stored food by a storage-aware planned date so a household knows what to use first.
- For whom: households that keep selected food in a pantry, fridge, or freezer without maintaining a full grocery inventory.
- First click: **Try it with sample data**.

This part passes. The exact supporting copy is “Use stored food before you forget it”, “For households that freeze and store food without tracking every grocery purchase”, and “See five items in use-first order. No setup.” The headline has seven words, the audience sentence has twelve, the primary action is visible, and three plain facts appear in the initial mobile viewport.

The hero artwork is not broken. The earliest cold screenshots caught its reserved frame before asynchronous decoding, but a network-idle check confirmed `naturalWidth` 390 on mobile and 662 on desktop, with no failed request or console error.

## Copy audit

Counts treat a hyphenated expression, path, URL, number, or version as one word. No landing or README sentence exceeds 22 words. No banned marketing adjective appears. The flagged jargon, term inconsistency, vague heading, metaphor heading, and action labels are findings F-1-2 and F-1-8 through F-1-14.

### Landing page copy

| Location/type | Exact copy | Words |
| --- | --- | ---: |
| Skip link | Skip to main content | 4 |
| Wordmark | Storage-Aware Expiry | 2 |
| Navigation | Demo | 1 |
| Navigation | Use-first list | 2 |
| Navigation | Settings | 1 |
| Navigation | Privacy | 1 |
| Descriptor | A small household date planner | 5 |
| H1 | Use stored food before you forget it | 7 |
| Sentence | For households that freeze and store food without tracking every grocery purchase. | 12 |
| Primary action | Try it with sample data | 5 |
| Sentence | See five items in use-first order. | 6 |
| Sentence | No setup. | 2 |
| Secondary action | Add your first item | 4 |
| Fact | Data stays on this device | 5 |
| Fact | Works offline after one visit | 5 |
| Fact | Free for 20 active items | 5 |
| Section label | Your local inventory | 3 |
| H2 | Add only what is easy to forget | 7 |
| Sentence | Choose where it lives. | 4 |
| Sentence | The date preset changes with the storage place. | 8 |
| H2 | Use-first list | 2 |
| Count | 00 ACTIVE | 2 |
| Field label | Item name | 2 |
| Field label | Quantity (optional) | 2 |
| Field label | Storage place | 2 |
| Options | Pantry / Fridge / Freezer | 3 |
| Field label | Frozen on | 2 |
| Field label | Use by | 2 |
| Field label | Note (optional) | 2 |
| Placeholder | Container, meal, or reminder | 4 |
| Sentence | The freezer preset suggests 1 December 2026. | 7 |
| Sentence | You can change this date. | 5 |
| Action | Add item to the list | 5 |
| Filters | All / Pantry / Fridge / Freezer | 4 |
| Count | 0 shown | 2 |
| H3 | Your use-first list is empty | 5 |
| Sentence | Add one stored item. | 4 |
| Sentence | Its planned date will appear here in use-first order. | 9 |
| Action | Add your first item | 4 |
| H2 | Date presets | 2 |
| Sentence | New dates start from these settings. | 6 |
| Sentence | Every date stays editable. | 4 |
| Readings | Pantry 30d / Fridge 5d / Freezer 90d | 6 |
| Link | Change date presets | 3 |
| H2 | Household record | 2 |
| Sentence | 0 items marked used on this device. | 7 |
| Sentence | Plan dates for quality and rotation. | 6 |
| Sentence | Check official guidance when safety is uncertain. | 7 |
| H2 | How it works | 3 |
| H3 | Add a stored item | 4 |
| Sentence | Name the item and choose pantry, fridge, or freezer. | 9 |
| Sentence | Quantity is optional. | 3 |
| H3 | Review the planned date | 4 |
| Sentence | The storage preset suggests a date. | 6 |
| Sentence | Change it whenever your own guidance differs. | 7 |
| H3 | Use from the top | 4 |
| Sentence | The earliest planned date stays first. | 6 |
| Sentence | Mark the item used when it leaves storage. | 8 |
| H2 | What this tool handles | 4 |
| H3 | Included tools | 2 |
| Capability | Optional quantities and notes | 4 |
| Capability | Storage-specific date presets | 3 |
| Capability | JSON and CSV export | 4 |
| Capability | Browser-printed freezer labels | 3 |
| H3 | What it does not decide | 5 |
| Sentence | This tool does not say whether food is safe. | 9 |
| Sentence | It does not scan barcodes, track nutrition, or follow every purchase. | 11 |
| Section label | Free plan | 2 |
| H2 | Use the free planner for up to 20 items | 9 |
| Sentence | Date presets, exports, and single labels are free. | 8 |
| Sentence | Household license checkout is currently unavailable. | 6 |
| Link | Read terms | 2 |
| Price | Free — 20 active items | 4 |
| Footer wordmark | Storage-Aware Expiry | 2 |
| Sentence | Plan pantry, fridge, and freezer dates. | 7 |
| Sentence | Dates are reminders, not food-safety advice. | 6 |
| Sentence | Original generated artwork is disclosed in the design notes. | 9 |
| Footer links | Privacy / Terms / Built by Param Factory | 6 |
| Build ID | v1.0.0 | 1 |
| Image alt | A pantry jar, fridge tin, and freezer box sit above three brass date dials. | 14 |

### README copy

| Line/type | Exact copy | Words |
| --- | --- | ---: |
| 1 H1 | Storage-Aware Expiry | 2 |
| 3 sentence | Plan what to use first with dates that change by storage place. | 12 |
| 5 sentence | Storage-Aware Expiry is a local-first PWA for households that keep a few easy-to-forget items in a pantry, fridge, or freezer. | 20 |
| 5 sentence | It is intentionally smaller than a full grocery inventory. | 9 |
| 7 sentence | Try the isolated sample at `/demo`. | 6 |
| 7 sentence | The deployed URL is `https://storage-aware-expiry.sociobot.in/demo`. | 5 |
| 9 H2 | What it does | 3 |
| 11 bullet | Suggests an editable planned date from pantry, fridge, or freezer presets. | 11 |
| 12 bullet | Sorts active items by the earliest planned date. | 8 |
| 13 bullet | Records an optional quantity, frozen-on date, and note. | 8 |
| 14 bullet | Creates one browser-printable label per item. | 6 |
| 15 bullet | Exports all records as JSON or CSV and imports JSON backups. | 11 |
| 16 bullet | Works offline after the first completed visit. | 7 |
| 17 bullet | Keeps inventory data in IndexedDB on the current device. | 9 |
| 19 sentence | Dates are planning reminders, not food-safety advice. | 7 |
| 19 sentence | The app does not decide whether food is safe to eat. | 11 |
| 21 H2 | Free use | 2 |
| 23 sentence | The free plan supports 20 active items, editable presets, exports, and single-label printing. | 13 |
| 23 sentence | Household license checkout is currently unavailable. | 6 |
| 23 sentence | Existing licenses can still be checked through the Sociobot billing API; there is no embedded payment provider or product ID. | 19 |
| 25 H2 | Run locally | 2 |
| 27 sentence | Requires Node.js 20 or newer. | 5 |
| 34 sentence | Open `http://127.0.0.1:5173`. | 2 |
| 34 sentence | Use `http://127.0.0.1:5173/demo` for an isolated sample. | 6 |
| 36 H2 | Test and build | 3 |
| 43 sentence | The browser suite starts a production preview and covers each claim in `.factory/claims.json`. | 13 |
| 43 sentence | The build command creates `dist/`, with `dist/index.html` at its root. | 10 |
| 45 H2 | Deploy | 1 |
| 47 sentence | Deploy the contents of `dist/` as a static site. | 9 |
| 47 sentence | `staticwebapp.config.json` supplies SPA fallback, security headers, and a styled 404 page. | 11 |
| 47 sentence | The factory owns DNS and release infrastructure. | 7 |
| 49 H2 | Privacy | 1 |
| 51 sentence | Real inventory uses the IndexedDB database `storage-aware-expiry-real-v1`. | 7 |
| 51 sentence | Demo changes use the separate session key `demo:storage-aware-expiry:v1`. | 7 |
| 51 sentence | License tokens use their own `sb_license:storage-aware-expiry` key and are sent only to the Sociobot verification endpoint. | 15 |
| 53 sentence | See `/privacy` and `/terms` in the app. | 7 |
| 53 sentence | See `.factory/demo.md`, `.factory/design.md`, and `.factory/claims.json` for verification details. | 8 |
| 55 H2 | License | 1 |
| 57 sentence | MIT. | 1 |
| 57 sentence | See `LICENSE`. | 2 |

## Demo and sandbox verification

- One click from the landing page opens `/demo` with the persistent banner, **Reset demo**, and **Start for real**.
- Five realistic samples exist: Plain yogurt, Baby spinach, Lentil soup, Summer berries, and Brown rice.
- Adding `DEMO TEMP` produced six tickets; **Reset demo** restored five and removed it.
- A real-data sentinel created before the demo remained after **Start for real**; no sample entered real data.
- The demo used only `demo:storage-aware-expiry:v1` in session storage. The real test used `storage-aware-expiry-real-v1` in IndexedDB.
- The complete observed live flow requested only `https://storage-aware-expiry.sociobot.in`.
- After service-worker activation, a fresh demo context reloaded offline with all five items and the notice “Offline — saved items and date tools still work.”
- Finding F-1-1 remains blocking because the samples are not initially visible.

## Claims verification

Each command below ran separately in a clean local clone at commit `fe57bc1`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `location-defaults` | Pass | Fridge and freezer produced different promised dates. |
| `use-first-order` | Pass | Plain yogurt preceded Baby spinach. |
| `csv-export` | Pass | The CSV contained a header and five sample rows. |
| `print-label` | Pass | Lentil soup appeared in print media with a planned-date label. |
| `local-only` | Pass | The tested demo add flow made same-origin requests only. |
| `offline-reload` | Pass | A dedicated context reloaded the five-item demo offline. |
| `free-limit` | Pass | The twenty-first real active item was refused. |
| `checkout-unavailable` | Pass | Unavailable copy appeared and no checkout link rendered. |
| `paid-license` | Pass | A cached valid fixture allowed 21 items and batch labels. |
| `item-workflow` | Pass | Add, edit, mark used, and undo worked. |
| `demo-isolation` | Pass | Reset restored five samples and real mode stayed separate. |
| `json-backup` | Pass command; incomplete assertion | The test starts a JSON download but does not inspect it; see F-1-3. |
| `preset-settings` | Pass | A 120-day freezer preset changed the next suggestion. |

All listed commands exit successfully, but F-1-3 leaves one listed claim partly untested. F-1-4 through F-1-7 identify claim-like copy that has no adequate claims entry.

## Earlier findings checked from scratch

No earlier `.factory/review-*.md` or `.factory/polish-*.md` file exists. The prior handoff and verification history contain three release findings:

| Earlier finding | Live/code result |
| --- | --- |
| Advertised ₹399 checkout returned 404 | Fixed. The live page says checkout is unavailable and renders no checkout/buy link. The regression claim passes. |
| Mobile targets below 44 px | Fixed. Live 390 px checks found no visible target below 44 × 44 on `/`, `/demo`, settings, privacy, terms, or the not-found view. |
| Unhashed assets without immutable caching | Fixed. Live HTML uses `index-CJ2CKMUl.js` and `index-D4KG0iCp.css`; the JS returns `max-age=31536000, immutable`; HTML and `sw.js` revalidate. |

None of those three earlier defects regressed.

## Structure, accessibility, and quality gates

- Route titles follow the required pattern and stay below 60 characters. Every tested SPA route has one `h1`, one `main`, a consistent header/footer, canonical URL, favicon, and no console error.
- Direct routes and print deep links load. In-app navigation and browser Back move focus to the destination `h1`.
- Every crawled same-origin link and asset returned 200. The unknown route’s 200 is itself F-1-9. The external Param Factory link was not fetched because it is outside this work order’s permitted resource scope.
- Live Axe scans reported zero violations at 390 px in dark/reduced-motion mode on home, demo, settings, privacy, terms, and the not-found view. No horizontal overflow or undersized target was found.
- `/opt/fleet/lib/verify-url.sh` passed live: title, `lang=en`, one `h1`, `main`, alt text, button labels, and console checks.
- `npm test`: 18/18 passed. `npm run build`: passed and created `dist/`. JavaScript is 29.93 KB raw and 9.88 KB gzip.
- The mid-century appliance-panel identity is distinct, matches `.factory/design.md`, uses original documented artwork, and is not a generic SaaS layout.
- Findings F-1-9 through F-1-11 remain route/metadata defects despite the passing checks above.

## Missed leverage

No additional AI feature is justified. The job is deterministic date planning, and model output would weaken trust around food dates. JSON/CSV export, JSON import, printable labels, and offline use already cover the obvious portability needs. Automatic cloud sync would conflict with the explicit local-only scope unless offered later as a clearly optional, separately consented feature.

## What would make this perfect

Resolve every finding above, then repeat the cold mobile review. The decisive changes are: show realistic item tickets in the first demo viewport; use one non-safety date term; complete and register every claim test; return a real 404; publish route-specific metadata; replace metaphor/jargon and ambiguous actions with plain labels. A rerun should have zero findings and no partly tested claim.
