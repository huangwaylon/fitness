# 0001 — Health data ingestion: Health Auto Export now, native companion later
**Status:** Accepted (round 1)

**Context.** The PWA can't read HealthKit. The requirement is zero manual import/export.
Shortcuts automations fail while the phone is locked. Free Apple provisioning expires every 7 days.

**Decision.**
- **MVP:** Health Auto Export (Premium Lifetime, ~$24.99, shareable via Family Sharing) runs a REST automation to `/ingest/hae` on our server over Tailscale. Each run re-sends "yesterday + today", and the server upserts by (person, day, metric).
- **v1:** a SwiftUI companion app (HealthKit anchored queries + background delivery) via the $99/yr Developer Program and TestFlight, with CI re-uploading builds before the 90-day expiry. It replaces HAE and adds widgets and a Watch complication.
- **Metrics exported:** steps, exercise minutes, workouts (type, start/end, avg HR), sleep analysis, stand hours, water, plus resting HR, HRV, VO2 max and workout HR for the recovery hints. Those are never paid.
- **Baseline:** at onboarding each partner runs **one HAE Manual Export** (last ~12 weeks, JSON, aggregated metrics + workouts) to `/ingest/hae`. REST automations only offer up to "Previous 7 Days", so the first automation run cannot do this. It takes about 1 minute, once, per phone, and it is the only setup-time exception to "no manual export". Verified in the Phase 0 spike.

**Consequences.** Data lags minutes to hours, so days stay provisional until D+2 (see 0003). There's a third-party dependency until v1. Raw payloads are retained so everything can be recomputed.
