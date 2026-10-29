# 0005 — Client delivery and hosting
**Status:** Accepted (round 1). Network section superseded by 0010; hosting superseded by [0015](0015-google-sheet-backend.md) (Google Sheet + Apps Script, UI on GitHub Pages, no Mac); web push and notifications dropped by [0016](0016-no-privacy-no-alerts.md).

**Decision.**
- **Server:** SvelteKit (adapter-node) + SQLite (WAL) + Drizzle in Docker on an always-on home machine (Mac mini or Raspberry Pi 5; a $5 VPS is the fallback). Backups via Litestream to encrypted object storage, plus a monthly restore drill.
- **Network:** Tailscale only (free Personal plan, Serve for HTTPS on `*.ts.net`), with VPN On Demand on both iPhones. Nothing is exposed to the public internet.
- **Client, MVP:** an installable PWA on the iPhone home screen, mobile-first (safe areas, bottom tab bar, 44 pt targets). Web push for the evening check-in, the Sunday ceremony and Transfer Day. It requests persistent storage on first launch, though the server is the source of truth anyway.
- **Client, MVP+:** an optional Scriptable home/lock-screen widget reading `/api/widget`.
- **Client, v1:** a native SwiftUI companion (see 0001) for HealthKit sync, widgets with interactive check-in buttons, and a Watch complication. The PWA remains the main UI.
- **Rejected:** Capacitor/Expo wrappers (widgets and background HealthKit still need Swift); fully native from day one (slower to first value); Shortcuts-only ingestion (fails on a locked device).

## Round 2 amendments
- Off-site backups are **client-side encrypted** (restic, or Litestream with age encryption; check version support). Health data otherwise lives only on the home server.
- The Phase 0 spike measures VPN On Demand reliability for background HAE posts. If it's poor, expose only `/ingest` via Tailscale Funnel with a per-device token.
