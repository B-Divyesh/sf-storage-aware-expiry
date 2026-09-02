# Demo sandbox

- URL: `https://storage-aware-expiry.sociobot.in/demo` (local: `http://127.0.0.1:4173/demo`)
- Sample: five realistic items across pantry, fridge, and freezer. Their dates are relative to the current day.
- Reset: choose **Reset demo** in the persistent banner.
- Leave: choose **Start for real**. No sample item is copied.
- Storage namespace: demo changes use the separate session-only key `demo:storage-aware-expiry:v1`. Saved items use a separate browser database. Demo mode never opens saved-item storage.
- Offline check: visit the demo once, wait for the service worker, disconnect, and reload `/demo`.
