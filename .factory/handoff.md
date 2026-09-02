# Independent verification handoff — FAIL

Verified 2 September 2026 for work order `storage-aware-expiry-verify-1`.

- Candidate: `2f8cf16cc45194bd1ec3bd5976790753d81d396e`
- URL: <https://storage-aware-expiry.sociobot.in>
- Verdict: **FAIL — do not release**

## Why it fails

1. **P1:** The live **Buy a household license** action ends at HTTP 404. The exact checkout endpoint responds `{"error":"enabled factory product","status":404}`. The advertised ₹399 purchase cannot begin.
2. **P2:** Mobile target sizes violate the 44 px baseline. Common buttons and item actions are 40 px high; the wordmark is 30 px and **Change date presets** is 16 px.
3. **P2:** `app.js` and `app.css` use fixed filenames and live responses cache for only 30 seconds, not long-lived immutable caching.

Full evidence and reproduction details are in [`.factory/verification.md`](verification.md).

## What passed

- All 12 commands in `.factory/claims.json` passed individually.
- Clean aggregate `npm test`: 15/15 passed.
- `npm run build`: passed TypeScript and Vite; `dist/` produced.
- `npm audit`: zero findings.
- Cold first-read and one-click sample demo gates passed on desktop and 390 px mobile.
- Add, edit, storage-date recalculation, use, undo, remove confirmation, invalid-input recovery, backup error recovery, persistence, demo isolation, print view, and routing worked.
- Live Lighthouse mobile: 95 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s and CLS 0.
- Fresh axe runs found zero serious/critical issues in light and dark modes.
- Demo traffic stayed same-origin; security headers were present; no console/page errors occurred.
- Offline reload worked under an active controlling service worker.
- Billing verification rate limiting allowed 30 requests, then returned 429 with `Retry-After: 3` on request 31.
- Live HTML, JS, CSS, and service worker hashes exactly match the candidate build.

## Commands used

```sh
npm ci
npm test -- --grep @claim:<each-id>
npm test
npm run build
npm audit --omit=dev
npm audit
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh https://storage-aware-expiry.sociobot.in/ /tmp/sae-verify-url
```

Lighthouse 13.0.1 and independent Playwright 1.58.2 flows ran against the live URL.

## Required next steps

1. Register and enable `storage-aware-expiry` in the production Sociobot billing engine; verify hosted checkout and the return-license flow.
2. Increase every mobile interactive target to at least 44 × 44 CSS px.
3. Fingerprint static app assets and serve them with long-lived immutable caching while keeping HTML and `sw.js` short-lived.
4. Rerun all claims and independent live verification.
