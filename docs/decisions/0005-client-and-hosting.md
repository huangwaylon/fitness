# 0005 — Client delivery and hosting
**Status:** Accepted (round 1)

**Decision.**
- **Server:** SvelteKit (adapter-node) + SQLite (WAL) + Drizzle in Docker on an always-on home machine (Mac mini or Raspberry Pi 5; a $5 VPS is the fallback). Backups via Litestream to encrypted object storage, plus a monthly restore drill.
- **Network:** Tailscale only (free Personal plan, Serve for HTTPS on `*.ts.net`), with VPN On Demand on both iPhones. Nothing is exposed to the public internet.
- **Client, MVP:** an installable PWA on the iPhone home screen, mobile-first (safe areas, bottom tab bar, 44 pt targets). Web push for the evening check-in, the Sunday ceremony and Transfer Day. It requests persistent storage on first launch, though the server is the source of truth anyway.
- **Client, MVP+:** an optional Scriptable home/lock-screen widget reading `/api/widget`.
- **Client, v1:** a native SwiftUI companion (see 0001) for HealthKit sync, widgets with interactive check-in buttons, and a Watch complication. The PWA remains the main UI.
- **Rejected:** Capacitor/Expo wrappers (widgets and background HealthKit still need Swift); fully native from day one (slower to first value); Shortcuts-only ingestion (fails on a locked device).
