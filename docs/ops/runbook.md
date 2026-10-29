# Runbook: Island Fund (ADR 0015)

Three pieces, no server of our own:
- **The data:** the Google Sheet *Island Fund* (append-only rows).
- **The backend:** the Apps Script bound to it, deployed as a web app (`/exec` URL, two per-person keys).
- **The app:** a static PWA on GitHub Pages. It computes scores and yen in the browser from the sheet's rows.

Contract: [`docs/design/sheets-architecture.md`](../design/sheets-architecture.md).

## 1. One-time setup (the canonical order; the other docs link here)
1. **Sheet, script, keys, deploy:** [google-setup.md](google-setup.md) §1–5, ending with the `whoami` curl.
2. **Point the Pages build at it:** `gh variable set GAS_URL --body 'https://script.google.com/macros/s/…/exec'`,
   then re-run the *Deploy UI to GitHub Pages* workflow (or push). Until `GAS_URL` is set, the site shows
   「まだ設定されていません / Not set up yet」 with a link to the demo.
3. **Shortcut on each phone:** [shortcut-health-sync.md](shortcut-health-sync.md) §2–4 (health sync), §5 (gym
   Arrive/Leave), §6 (the optional 84-day baseline).
4. **Pair the phones:** on each iPhone open https://huangwaylon.github.io/fitness/ in Safari → Share →
   **Add to Home Screen** *first*, open it from the icon, and paste that person's key ([google-setup.md §7](google-setup.md#7-pairing-the-phones)).
5. **Day 8 or later:** run the `whoami` curl again ([google-setup.md §9](google-setup.md#9-does-it-need-the-shared-finances-cloud-project-or-a-published-consent-screen)).

## 2. Deploying the UI
Every push to `main` that touches `app/**` runs `.github/workflows/pages.yml`: `npm ci`, `npm run build` with
`VITE_GAS_URL=${{ vars.GAS_URL }}`, upload `app/build-pages/`. Locally: `cd app && npm run build` (output
`build-pages/`), `npx vite preview` to try it, `npm run dev` for development (without `VITE_GAS_URL` in `.env` it
runs on demo data). The site has a strict CSP (a `<meta>` tag): it can only talk to itself and the Apps Script
origins. Before a model change: `npx vitest run`, `npm run check`, `npm run bench` (a year of rows; the week-52
view should stay a few ms) and `npx knip` (`app/knip.json`).

Backend code changes (`app/gas/**`, the parser): google-setup.md §11 (`npm run gas:build`, paste, **new version on
the existing deployment**, never a new deployment).

## 3. Keys
- Rotate (lost phone, leak, any doubt): google-setup.md §10. The old key gets `unauthorized`, so that person's app
  opens the pairing screen: paste the new key there, and into their Shortcuts.
- Keys live only in Script Properties, the phones' app storage and the Shortcuts. Never in the repo or a URL that
  gets shared (the `#key=` fragment isn't sent to any server, but don't post the link).

## 4. Shortcuts
- Health sync: [shortcut-health-sync.md](shortcut-health-sync.md) (URL → `/exec`, body gets `key` + `action:"ingest"`,
  no `Authorization` header).
- Gym Arrive/Leave: same doc, §5.

## 5. Monitoring and the deployed version
Health check: the `whoami` curl (google-setup.md §5). JSON means healthy; HTML means the authorization lapsed (§9 there).

## 6. Backups
The sheet is the only copy of check-ins, answers and purse events. Google keeps version history (File → Version
history). For an off-Google copy: File → Download → `.xlsx` once a month. Health numbers can be re-sent from the
phones (shortcut-health-sync.md §6).

## 7. Official art
Official *Animal Crossing: New Horizons* art (Nookipedia) in `app/static/art/`; the decision, the public-repo
trade-off and the fallback are [ADR 0018](../decisions/0018-official-art-public-site.md). Refresh: edit `SPECS` in
`app/scripts/fetch-assets.ts`, `npm run assets:fetch` (needs `cwebp`).

## 8. Troubleshooting
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | `GAS_URL` repo variable missing; set it and re-run the workflow |
| App says it can't reach the island | `whoami` curl (google-setup.md §5). HTML instead of JSON → authorization lapsed (google-setup.md §9) |
| `{"ok":false,"error":"unauthorized"}` | Wrong or rotated key: re-paste it (app) / fix the `key` field (Shortcut) |
| `busy` | Another write held the lock for 10 s; the app retries by itself, the Shortcut runs again next time |
| `too_large` | Body over 1 MB: send the baseline in chunks of a few weeks |
| Numbers didn't move | The `uploads` tab shows each Shortcut run (status, size). Synced metrics only go up (a lower re-send is ignored); a きろく edit can lower a day in an open week |
| Changes made offline | They stay queued on the phone and are sent when it's back online (the sync pill shows it) |
