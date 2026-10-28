# 0012 — Health data via iOS Shortcuts; Health Auto Export dropped
**Status:** Accepted (user input, 2026-10-28). Supersedes 0001 (HAE for the MVP).

**User input:** "I don't need HAE, drop that approach." No third-party app on the phones, nothing manual.

## Decision
- Each iPhone runs a built-in Shortcut (`docs/ops/shortcut-health-sync.md`) that reads steps, exercise minutes and workouts with **Find Health Samples** and POSTs them to `/ingest/shortcut/:person` with the phone's Shortcuts bearer token (the same token as the gym Arrive/Leave Shortcuts).
- **Server:** accepts raw sample lists or day totals. Steps are totalled per source and the larger one is taken, because Watch + iPhone samples overlap. Day values only ever rise. Japanese workout names are normalised. Workouts are keyed by type + start minute, so re-sends land on the same row.
- **Triggers:** Health data is unreadable while the phone is locked, so a trigger must fire while the phone is in use. Primary: an **App** automation on several everyday apps (Run Immediately), throttled to hourly inside the Shortcut. Timed triggers are extra chances only; whether a locked-phone run fails quietly is tested in Phase 0.
- **Removed:** `/ingest/hae`, the `hae` device kind and the HAE docs. The research note stays as history.
- **Later:** a native companion app (HealthKit background delivery, $99/yr) is still the upgrade path if Shortcuts proves unreliable.

## Consequences
¥0 and no third party. We now own the Shortcut recipe, and its exact iOS 27 action names and behaviours are [U] until Phase 0. Data lands when the phone is used, which is usually within the hour.
