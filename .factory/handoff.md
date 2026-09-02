# Storage-Aware Expiry repair handoff

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
