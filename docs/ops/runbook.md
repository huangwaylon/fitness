# Runbook: Island Fund without the Mac (ADR 0015)

Three pieces, no server of our own:
- **The data:** the Google Sheet *Island Fund* (append-only rows).
- **The backend:** the Apps Script bound to it, deployed as a web app (`/exec` URL, two per-person keys).
- **The app:** a static PWA on GitHub Pages. It computes scores and yen in the browser from the sheet's rows.

Contract: [`docs/design/sheets-architecture.md`](../design/sheets-architecture.md).

## 1. One-time setup
1. **Sheet + script + keys + deploy:** follow [google-setup.md](google-setup.md) §1–5.
2. **Point the Pages build at it:** `gh variable set GAS_URL --body 'https://script.google.com/macros/s/…/exec'`,
   then re-run the *Deploy UI to GitHub Pages* workflow (or push). Until `GAS_URL` is set, the site shows
   「まだ設定されていません / Not set up yet」 with a link to the demo.
3. **Migrate the Mac data** (§5), then **switch the Shortcuts** (§4).
4. **Pair the phones:** on each iPhone open https://huangwaylon.github.io/fitness/ in Safari → Share →
   **Add to Home Screen**, open it from the icon and paste that person's key (or open `…/fitness/#key=<key>` once).
5. **Reminders** (no web push): in Shortcuts → Automation, add *Time of Day* automations that show a notification:
   check-in at 20:00 daily, harvest on Sunday at 19:30.

## 2. Deploying the UI
Every push to `main` that touches `app/**` runs `.github/workflows/pages.yml`: `npm ci`, `npm run build` with
`VITE_GAS_URL=${{ vars.GAS_URL }}`, upload `app/build-pages/`. Locally: `cd app && npm run build` (output
`build-pages/`), `npx vite preview` to try it, `npm run dev` for development (without `VITE_GAS_URL` in `.env` it
runs on demo data). The site has a strict CSP (a `<meta>` tag): it can only talk to itself and the Apps Script
origins.

Backend code changes (`app/gas/**`, the parser): google-setup.md §11 (`npm run gas:build`, paste, **new version on
the existing deployment**, never a new deployment).

## 3. Keys
- Rotate (lost phone, leak, any doubt): google-setup.md §10. Then paste the new key into that person's app (open
  `…/#key=<new key>`) and their Shortcuts.
- Keys live only in Script Properties, the phones' app storage and the Shortcuts. Never in the repo or a URL that
  gets shared (the `#key=` fragment isn't sent to any server, but don't post the link).

## 4. Shortcuts
- Health sync: [shortcut-health-sync.md](shortcut-health-sync.md) (URL → `/exec`, body gets `key` + `action:"ingest"`,
  no `Authorization` header).
- Gym Arrive/Leave: same doc, §5.

## 5. Migrating from the Mac (once)
1. Stop the Mac server (`node build` on port 3100 behind Tailscale Funnel) so nothing arrives after the export.
2. `cd app && npm run export:sheet` (plain Node ≥ 24: `node:sqlite`, read-only) writes TSVs to `app/data/export/`.
3. Paste them into the tabs: google-setup.md §8.
4. Open the app and compare the jar and this week's scores with what the Mac showed. They should match (verified on
   a copy of the DB on 2026-10-29). Export **before the first payout (Sun 2026-11-08 19:30 JST)** if you can: the
   DB keeps only each day's latest value and its last upload time, so for weeks already paid on the Mac a late
   re-send can make the recomputed amount lower than what the Mac paid.
5. After a week of the phones working against the sheet: `tailscale funnel reset`, and delete `app/build/`,
   `app/data/` (keep a copy of `island.db` somewhere private) and `app/node_modules/` (then `npm ci`).

## 6. Backups
The sheet is the only copy of check-ins, answers and purse events. Google keeps version history (File → Version
history). For an off-Google copy: File → Download → `.xlsx` once a month. Health numbers can be re-sent from the
phones (shortcut-health-sync.md §6).

## 7. Official art
The villager, Isabelle, fruit and NookPhone images are official *Animal Crossing: New Horizons* art (Nookipedia) in
`app/static/art/`, for this private two-person app only. Refresh: edit `SPECS` in `app/scripts/fetch-assets.ts`,
`npm run assets:fetch` (needs `cwebp`). The UI falls back to our own vectors if a file is missing. **Note:** the
repo is currently public; make it private (and move the static site to a host that serves private repos) if the art
shouldn't be published.

## 8. Troubleshooting
| Symptom | Check |
|---|---|
| Site says 「まだ設定されていません」 | `GAS_URL` repo variable missing; set it and re-run the workflow |
| App says it can't reach the island | `whoami` curl (google-setup.md §5). HTML instead of JSON → authorization lapsed (google-setup.md §9) |
| `{"ok":false,"error":"unauthorized"}` | Wrong or rotated key: re-paste it (app) / fix the `key` field (Shortcut) |
| `busy` | Another write held the lock for 10 s; the app retries by itself, the Shortcut runs again next time |
| `too_large` | Body over 1 MB: send the baseline in chunks of a few weeks |
| Numbers didn't move | The `uploads` tab shows each Shortcut run (status, size). Metrics only ever go up |
| Changes made offline | They stay queued on the phone and are sent when it's back online (the sync pill shows it) |
