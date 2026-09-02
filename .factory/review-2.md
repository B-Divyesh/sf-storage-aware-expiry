# Adversarial first-read review 2 — Storage-Aware Expiry

Reviewed 2 September 2026 for work order `storage-aware-expiry-review-2`.

- Candidate: `3a45145cbcb185b82076531792941fe9d670a6fc`
- Live site: <https://storage-aware-expiry.sociobot.in>
- Contexts: fresh Chromium at 390 × 844 and 1440 × 900
- Verdict: **FAIL**

## Finding

### Blocking

#### F-2-1 — Demo mode reads and writes the real license namespace

- Exact location: [src/main.ts](../src/main.ts), `checkLicenseFromUrl()` at lines 151–165 runs before demo data is loaded. It calls `localStorage.setItem(LICENSE_KEY, token)` for any `license` URL parameter and reads `LICENSE_CACHE_KEY` to set `paid`.
- Exact public promise: the persistent banner says **“Demo — sample data, nothing is saved”**. The demo documentation says **“Demo mode never opens saved-item storage.”** The required sandbox rule is stronger: real data must never be read or written while the demo banner is shown.
- Reproduction on the live site: in a fresh context seeded with a valid real `sb_license_verdict:storage-aware-expiry`, opening `/demo`, then `/settings?demo=1`, displays **“Your existing household license is active on this browser.”** Opening `/demo?license=demo-write-token` creates the real `sb_license:storage-aware-expiry` local-storage value `demo-write-token`.
- Why this fails: the demo is not isolated from real browser state. It exposes a real entitlement to the sample session and can persist a license token to real storage while telling the visitor that nothing is saved. This is a direct regression of the demo-sandbox boundary, even though sample inventory itself remains separate.
- Concrete fix: decide demo mode before `checkLicenseFromUrl()`. In demo mode, do not read, write, or remove either real license key; set `paid` to false; ignore a `license` parameter (or redirect to the real Settings route after explicit confirmation). Add a `@claim:demo-isolation` regression that seeds both real license keys, visits `/demo` and `/settings?demo=1`, asserts no paid UI and unchanged local storage, then visits `/demo?license=…` and asserts no real key was written. Keep the current inventory reset/start-real assertions.

## Cold first-screen result

This part passes at both viewports before scrolling.

- What it does: **“Use stored food before you forget it.”**
- Who it is for: **“For households that freeze and store food without tracking every grocery purchase.”**
- What to click first: **“Try it with sample data”**; adjacent copy says **“See five items in use-first order. No setup.”**

The mobile first screen also shows the three plain facts: **“Data stays on this device,” “Works offline after one visit,”** and **“Free for 20 active items.”**

## Copy audit

Counts use a hyphenated word, number, path, and URL as one word. No landing or README sentence exceeds 22 words. No banned marketing adjective, unexplained product jargon, inconsistent date term, mood heading, or non-result primary action was found. `planned date`, `storage place`, `item`, `use-first list`, and `demo` are used consistently.

### Landing page

| Copy | Words |
| --- | ---: |
| Skip to main content | 4 |
| Storage-Aware Expiry | 2 |
| Demo | 1 |
| Use-first list | 2 |
| Settings | 1 |
| Privacy | 1 |
| A small household date planner | 5 |
| Use stored food before you forget it | 7 |
| For households that freeze and store food without tracking every grocery purchase. | 12 |
| Try it with sample data | 5 |
| See five items in use-first order. | 6 |
| No setup. | 2 |
| Add your first item | 4 |
| Data stays on this device | 5 |
| Works offline after one visit | 5 |
| Free for 20 active items | 5 |
| Your local inventory | 3 |
| Add only what is easy to forget | 7 |
| Choose where it lives. | 4 |
| The date preset changes with the storage place. | 8 |
| Use-first list | 2 |
| 00 ACTIVE | 2 |
| Item name | 2 |
| Quantity (optional) | 2 |
| Storage place | 2 |
| Pantry / Fridge / Freezer | 3 |
| Frozen on | 2 |
| Planned date | 2 |
| Note (optional) | 2 |
| Container, meal, or reminder | 4 |
| The freezer preset suggests a date. | 6 |
| You can change this date. | 5 |
| Add item to the list | 5 |
| All / Pantry / Fridge / Freezer | 4 |
| 0 shown | 2 |
| Your use-first list is empty | 5 |
| Add one stored item. | 4 |
| Its planned date will appear here in use-first order. | 9 |
| Date presets | 2 |
| New dates start from these settings. | 6 |
| Every date stays editable. | 4 |
| Pantry 30d / Fridge 5d / Freezer 90d | 6 |
| Change date presets | 3 |
| Household record | 2 |
| 0 items marked used on this device. | 7 |
| Plan dates for quality and rotation. | 6 |
| Check official guidance when safety is uncertain. | 7 |
| How it works | 3 |
| Add a stored item | 4 |
| Name the item and choose pantry, fridge, or freezer. | 9 |
| Quantity is optional. | 3 |
| Review the planned date | 4 |
| The storage preset suggests a date. | 6 |
| Change it whenever your own guidance differs. | 7 |
| Use the earliest planned item first | 6 |
| The earliest planned date stays first. | 6 |
| Mark the item used when it leaves storage. | 8 |
| What this tool handles | 4 |
| Included tools | 2 |
| Optional quantities and notes | 4 |
| Storage-specific date presets | 3 |
| JSON and CSV export | 4 |
| Browser-printed freezer labels | 3 |
| What it does not decide | 5 |
| This tool does not say whether food is safe. | 9 |
| It does not scan barcodes, track nutrition, or follow every purchase. | 11 |
| Free plan | 2 |
| Use the free planner for up to 20 items | 9 |
| Date presets, exports, and single labels are free. | 8 |
| Household license checkout is currently unavailable. | 6 |
| Read terms | 2 |
| Free — 20 active items | 4 |
| Plan pantry, fridge, and freezer dates. | 6 |
| Dates are reminders, not food-safety advice. | 6 |
| Original generated artwork is disclosed in the design notes. | 9 |
| Terms | 1 |
| Built by Param Factory (external site) | 5 |

### README

| Copy | Words |
| --- | ---: |
| Storage-Aware Expiry | 2 |
| Plan what to use first with dates that change by storage place. | 12 |
| Storage-Aware Expiry is a browser app for households that keep a few easy-to-forget items in a pantry, fridge, or freezer. | 20 |
| It is intentionally smaller than a full grocery inventory. | 9 |
| Try the isolated sample at `/demo`. | 6 |
| The deployed URL is `https://storage-aware-expiry.sociobot.in/demo`. | 5 |
| What it does | 3 |
| Suggests an editable planned date from pantry, fridge, or freezer presets. | 11 |
| Sorts active items by the earliest planned date. | 8 |
| Records an optional quantity and note, plus a freezer date. | 10 |
| Creates one browser-printable label per item. | 6 |
| Exports all records as JSON or CSV and imports JSON backups. | 11 |
| Works offline after the first completed visit. | 7 |
| Keeps saved items in this browser on the current device. | 10 |
| Dates are planning reminders, not food-safety advice. | 7 |
| The app does not decide whether food is safe to eat. | 11 |
| Free use | 2 |
| The free plan supports 20 active items, editable presets, exports, and single-label printing. | 13 |
| Household license checkout is currently unavailable. | 6 |
| Existing license holders can check a license in Settings. | 9 |
| New licenses cannot be bought right now. | 8 |
| Run locally | 2 |
| Requires Node.js 20 or newer. | 5 |
| Test and build | 3 |
| The browser suite starts a production preview and covers each claim in `.factory/claims.json`. | 13 |
| The build command creates `dist/`, with `dist/index.html` at its root. | 10 |
| Deploy | 1 |
| Deploy the contents of `dist/` as a static site. | 9 |
| `staticwebapp.config.json` sends app routes to `index.html`, adds security headers, and serves the not-found page. | 14 |
| The factory owns DNS and release infrastructure. | 7 |
| Privacy | 1 |
| Saved items stay in this browser. | 6 |
| Demo changes use separate temporary browser storage. | 7 |
| License checks send the pasted token to Sociobot, never inventory items. | 11 |
| See `/privacy` and `/terms` in the app. | 7 |
| See `.factory/demo.md`, `.factory/design.md`, and `.factory/claims.json` for verification details. | 8 |
| License | 1 |
| MIT. | 1 |
| See `LICENSE`. | 2 |

The only copy finding is F-2-1: the demo banner's “nothing is saved” promise is false for the demonstrated `license` query route.

## Demo, privacy, and claims

- One click on **Try it with sample data** opened `/demo`.
- The first 390 px screen showed a real sample ticket: its top was y=741.5, with **Plain yogurt**, storage/date facts, and planned date visible before y=844. Desktop showed the ticket at y=672.9.
- The persistent banner, **Reset demo**, and **Start for real** were present. Sample inventory reset and real inventory separation are covered by the existing claim test.
- The complete normal demo flow at both viewports requested only `https://storage-aware-expiry.sociobot.in`; no third-party font, analytics, or script request was observed. This does not cure F-2-1's separate real-local-storage access.
- `.factory/claims.json` has 17 entries. Each exact listed command was invoked from a fresh clone after `npm ci`; the aggregate claim rerun passed all 17 tagged tests. `npm run build` passed and produced `dist/`.
- There are no unlisted material product claims on the live landing page or README. The listed tests cover storage-aware dates, ordering, exports, printable labels, local-only inventory, offline reload, free limit, checkout availability, licensed features, item flow, demo inventory isolation, backups, presets, persistence, license verification, editable fields, and stated scope.

## Earlier-review verification

Every `review-1.md` finding was checked on live product and code rather than accepting a status label.

| Earlier id | Result and evidence |
| --- | --- |
| F-1-1 | Fixed. A sample ticket intersects the initial 390 px and desktop demo viewport. |
| F-1-2 | Fixed. Form, tickets, labels, README, and print views use **Planned date/Planned for**. |
| F-1-3 | Fixed. `@claim:json-backup` parses the downloaded bytes, checks five items/presets, then imports it. |
| F-1-4 | Fixed. `@claim:real-persistence` reloads and checks a second page in the same context. |
| F-1-5 | Fixed. `@claim:license-verification` intercepts the product endpoint and checks token-only valid/invalid flows. |
| F-1-6 | Fixed. `@claim:editable-optional-fields` verifies manual planned date, freezer date, and blank optional fields after reload. |
| F-1-7 | Fixed. `limited-scope` is registered and tests the visible scope statement. |
| F-1-8 | Fixed. Visible actions are **Mark used**, **Edit item**, and **Print label** with item-specific accessible names. |
| F-1-9 | Fixed. An unknown live route returns HTTP 404 and uses the branded document. |
| F-1-10 | Fixed. Rendered direct routes set route-specific title, description, canonical, and Open Graph URL. |
| F-1-11 | Fixed. The live and static not-found `h1` is **Page not found**. |
| F-1-12 | Fixed. README user copy now avoids the cited platform and payment jargon. |
| F-1-13 | Fixed. The process heading is **Use the earliest planned item first**. |
| F-1-14 | Fixed. Footer text identifies **Built by Param Factory (external site)**. |

## Structure and missed leverage

Direct `/`, `/demo`, `/settings`, `/privacy`, `/terms`, and print routes rendered one `h1`, one `main`, proper route titles, descriptions, and canonical URLs. `/not-a-real-page` returned HTTP 404 with a designed return path. Same-origin navigation links crawled to 200 responses. The header/footer are consistent, include Privacy and Terms, and the 1950s household-instrument visual system matches `.factory/design.md` rather than a generic SaaS template.

The brief already includes the expected useful additions: browser-print labels plus JSON/CSV export/import. An AI feature is not implied by this local household date planner and would be decorative; no AI feature is required.

## What would make this perfect

Make the demo storage boundary absolute, including real license state and query-token handling, prove that boundary in the claim suite, and then rerun this entire cold review. No other finding was identified in this pass.
