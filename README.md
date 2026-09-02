# Storage-Aware Expiry

Plan what to use first with dates that change by storage place.

Storage-Aware Expiry is a browser app for households that keep a few easy-to-forget items in a pantry, fridge, or freezer. It is intentionally smaller than a full grocery inventory.

Try the isolated sample at `/demo`. The deployed URL is <https://storage-aware-expiry.sociobot.in/demo>.

## What it does

- Suggests an editable planned date from pantry, fridge, or freezer presets.
- Sorts active items by the earliest planned date.
- Records an optional quantity and note, plus a freezer date.
- Creates one browser-printable label per item.
- Exports all records as JSON or CSV and imports JSON backups.
- Works offline after the first completed visit.
- Keeps saved items in this browser on the current device.

Dates are planning reminders, not food-safety advice. The app does not decide whether food is safe to eat.

## Free use

The free plan supports 20 active items, editable presets, exports, and single-label printing. Household license checkout is currently unavailable. Existing license holders can check a license in Settings. New licenses cannot be bought right now.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Use <http://127.0.0.1:5173/demo> for an isolated sample.

## Test and build

```sh
npm test
npm run build
```

The browser suite starts a production preview and covers each claim in `.factory/claims.json`. The build command creates `dist/`, with `dist/index.html` at its root.

## Deploy

Deploy the contents of `dist/` as a static site. `staticwebapp.config.json` sends app routes to `index.html`, adds security headers, and serves the not-found page. The factory owns DNS and release infrastructure.

## Privacy

Saved items stay in this browser. Demo changes use separate temporary browser storage. License checks send the pasted token to Sociobot, never inventory items.

See `/privacy` and `/terms` in the app. See [.factory/demo.md](.factory/demo.md), [.factory/design.md](.factory/design.md), and [.factory/claims.json](.factory/claims.json) for verification details.

## License

MIT. See [LICENSE](LICENSE).
