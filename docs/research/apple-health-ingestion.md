# Research: Getting Apple Health / Apple Watch data off the phones automatically

Owner: Software Engineer · Status: research complete (design phase) · Date: 2026-10-28
Companion memo: `docs/team/software-engineer.md`

**Goal:** steps, exercise minutes, workouts, sleep, stand hours (and any logged nutrition or water) arrive on our server for both partners with **zero ongoing manual work** and **no manual import/export**.

Legend: **[V]** = verified against the cited source during this research. **[U]** = unverified (general knowledge, or the source was blocked or didn't render). Treat [U] items as hypotheses to test in week 1.

---

## 0. The constraints iOS imposes on every option

These apply whatever tool we choose. They are the main reason "fully automatic" really means "automatic, with a lag of minutes to hours."

| Constraint | Detail | Source |
|---|---|---|
| **Health data is encrypted while the phone is locked** | "the device encrypts the HealthKit store when the user locks the device. As a result, your app may not be able to read data from the store when it runs in the background." Writes are cached until unlock. | [V] [Apple: Protecting user privacy](https://developer.apple.com/documentation/healthkit/protecting-user-privacy) |
| **Watch → iPhone sync** | Watch data only reaches the iPhone's HealthKit store when the phone syncs with the watch. This usually takes seconds to minutes when they are near each other. | [U] general knowledge |
| **Background delivery is throttled** | "The system wakes your app at most once per time period defined by the specified frequency. Some sample types have a maximum frequency of hourly … on iOS, stepCount samples have an hourly maximum frequency." | [V] [Apple: enableBackgroundDelivery](https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:)) |
| **Background delivery entitlement** | iOS 15+ requires `com.apple.developer.healthkit.background-delivery`; without it the call fails with `errorAuthorizationDenied`. | [V] same page |
| **Completion handler discipline** | If the app doesn't call the observer's completion handler, HealthKit backs off. "If your app fails to respond three times, HealthKit assumes your app can't receive data and stops sending background updates." | [V] same page |
| **watchOS budget** | 4 background updates per hour, shared with refresh tasks, and only if the app has a complication on the active watch face. | [V] same page |
| **Generic background execution** | iOS decides when background work runs, based on battery, Low Power Mode, Background App Refresh and usage patterns. Tasks get roughly 30 s and limited memory. | [V] [HAE REST API docs](https://help.healthyapps.dev/en/health-auto-export/automations/rest-api) |

**Practical consequence:** the phone must be unlocked at some point after the activity for any tool to read and upload it. People unlock their phones dozens of times a day, so data usually lands within about an hour. The app design must still treat "today" as **provisional** and settle each day **later** (see the rules engine in the memo).

---

## 1. Option A: Health Auto Export (HAE) + REST API automation

App by HealthyApps. Website: https://www.healthyapps.dev/ · Help Center: https://help.healthyapps.dev/

### What it does
- Exports 150+ Health metrics, plus workouts, sleep phases, State of Mind, medications, ECG and more. Formats: JSON, CSV, GPX. [V] (healthyapps.dev home page)
- **Automations** push to REST API, MQTT, Home Assistant, Dropbox, Google Drive, iCloud Drive, email and calendar. There's also a built-in TCP server and Mac sync. [V]

### REST API automation details [V] ([Sync to REST API](https://help.healthyapps.dev/en/health-auto-export/automations/rest-api))
| Aspect | Detail |
|---|---|
| Method | `HTTP POST` to your URL (http or https) |
| Auth | Custom headers, e.g. `Authorization: Bearer …` or `X-API-Key` |
| Auto headers | `Content-Type`, `automation-name`, `automation-id`, `automation-aggregation`, `automation-period`, `session-id` |
| Body | JSON (nested) or CSV (multipart, always aggregated). **Export Version 2** is recommended (adds workout ids and metadata). |
| Batching | JSON only. Splits large exports across multiple requests. |
| Date range | Default (previous full day + today so far), Since Last Sync, Today, Yesterday, Previous 7 Days |
| Cadence | "Select a number and interval". The exact options aren't listed in the docs. |
| Data types | Health Metrics (selectable, with preferred source), Workouts, Symptoms, ECG, HR notifications, State of Mind, Cycle Tracking, Medications |
| Aggregation | "Summarize Data" for metrics (e.g. a daily total per metric) |
| Payload size | Docs warn payloads "can reach several hundred megabytes" with fine-grained settings. Keep it aggregated. |
| Observability | Per-automation Activity Log in the app (successes, HTTP errors, timeouts) |

### Reliability (the honest part) [V] ([FAQ](https://help.healthyapps.dev/en/health-auto-export/faq), REST API page)
- "Health Auto Export cannot sync at a guaranteed time or fixed interval." "Exact times (e.g. midnight) are not guaranteed."
- "Automations will only run during periods when your device is unlocked." If the phone locks mid-export: "Health data could not be fully read … Nothing was uploaded." So **failure is all-or-nothing, not partial**, which keeps the server simple.
- Runs depend on Background App Refresh. They are hurt by Low Power Mode, long inactivity, and big configurations.
- Things that help: adding the **HAE Automations widget** to the Home Screen, charging, and keeping configurations small.

### Payload format [V] ([Health Metrics](https://help.healthyapps.dev/en/health-auto-export/export-format/health-metrics), [Workouts](https://help.healthyapps.dev/en/health-auto-export/export-format/workouts))
```json
{
  "metrics": [
    { "name": "step_count", "units": "count",
      "data": [ { "qty": 8500, "date": "2024-02-06 14:30:00 -0800" } ] },
    { "name": "sleep_analysis", "units": "hr",
      "data": [ { "date": "2024-02-06", "totalSleep": 7.5, "deep": 1.5, "rem": 2.0, "core": 3.5,
                  "sleepStart": "2024-02-05 23:00:00 -0800", "sleepEnd": "2024-02-06 06:30:00 -0800" } ] }
  ],
  "workouts": [
    { "id": "550e8400-…", "name": "Running", "start": "2024-02-06 07:00:00 -0800",
      "end": "2024-02-06 07:30:00 -0800", "duration": 1800,
      "activeEnergyBurned": { "qty": 350, "units": "kcal" }, "distance": { "qty": 3.5, "units": "mi" } }
  ]
}
```
- Timestamps are `yyyy-MM-dd HH:mm:ss Z` and include the UTC offset. That's good, because we can derive the **local day** correctly when travelling.
- Heart rate uses `Min/Avg/Max`. Blood pressure uses `systolic/diastolic`. `source` is optional.
- V2 workouts have a stable `id`, which is our natural upsert key.
- **[U] Top-level wrapper:** community projects suggest the body is wrapped as `{"data": {"metrics": [...], "workouts": [...]}}`, but the help pages only show the inner arrays. **Action:** capture one real payload in week 1 and write the parser against it, accepting both shapes.
- **[U] Exact metric keys** (e.g. `apple_exercise_time`, `apple_stand_hour`, `active_energy`, `dietary_water`). The [supported data page](https://help.healthyapps.dev/en/health-auto-export/getting-started/supported-data) lists display names only (Apple Exercise Time, Apple Stand Hour, Dietary Water, Dietary Energy, Protein, Fiber, etc.). Confirm against a real payload.

### Cost [V] ([FAQ](https://help.healthyapps.dev/en/health-auto-export/faq))
| Tier | Price |
|---|---|
| Free | Stats dashboard + widgets |
| Basic | $2.99 one-time |
| Premium | $0.99/mo, $5.99/yr, or **$24.99 lifetime** |

"Purchases include Family Sharing", so **one lifetime purchase covers both partners** if they're in the same Family Sharing group. REST API export needs Premium (stated by [irvinlim/apple-health-ingester](https://github.com/irvinlim/apple-health-ingester) and [Lybron/health-auto-export](https://github.com/Lybron/health-auto-export) [V]; the HAE REST page itself doesn't say).

### Verdict
Best effort-to-value ratio by far. It's a one-time setup of about 10 minutes per phone, costs $25 total, and needs no Apple developer account. The risks are a third-party dependency, closed source, and iOS scheduling. The server must tolerate duplicates and late data, which it needs to do anyway.

---

## 2. Option B: iOS Shortcuts personal automation → POST to server

- Shortcuts has Health actions ("Find Health Samples", "Log Health Sample") [U: the Apple Support page we fetched didn't list them, but they exist in the Shortcuts app].
- **Time of Day** automations can run without confirmation. Apple: "Some personal automations can run without asking you for confirmation when they're triggered." [V] ([Apple Support: personal automation](https://support.apple.com/guide/shortcuts/create-a-new-personal-automation-apdfbdbd7123/ios))
- **The blocker:** HealthyApps' own guide for Shortcut-scheduled exports says "Your device must be unlocked when the shortcut runs at the scheduled time in order to access health data", and recommends **Run After Confirmation** because it errors when locked. [V] ([HAE: schedule automations using Shortcuts](https://help.healthyapps.dev/en/health-auto-export/automations/schedule-automations-using-shortcuts)). A 9 pm automation might hit an unlocked phone, but a 3 am one never will.
- Hand-building aggregation (sum steps per day, sleep stages, workouts) in Shortcuts is fragile and painful to maintain. You also can't diff or version-control it well.

| Pros | Cons |
|---|---|
| Free, no third-party app | Fails when locked, with no retry |
| Fully under our control | Clunky to build and maintain; aggregation is hard |
| Good for **tiny writes** (e.g. "I ate a healthy dinner" → POST) | Unreliable as the *primary* reader of Health data |

**Verdict:** don't use it as the primary ingestion path. Use Shortcuts for **one-tap check-ins** (Action Button, Back Tap, widget, Siri) and maybe as a time-of-day "nudge" that runs while the phone is likely unlocked (e.g. a "Leave work" or "Arrive home" trigger).

---

## 3. Option C: Custom native SwiftUI app (HealthKit observer + background delivery)

### Mechanism [V] (Apple docs above + [HKAnchoredObjectQuery](https://developer.apple.com/documentation/healthkit/hkanchoredobjectquery))
1. Request read authorization for: steps, exercise time, stand hours, active energy, workouts, sleep analysis, dietary water/energy.
2. Register an `HKObserverQuery` per type in `application(_:didFinishLaunchingWithOptions:)` and call `enableBackgroundDelivery(for:frequency:.hourly)`. Most types are capped at hourly anyway.
3. In the handler, run an `HKAnchoredObjectQuery` from the persisted anchor. It returns **new samples and deleted objects**, which gives us proper incremental sync including deletions. POST them, persist the new anchor, and **always call the completion handler**.
4. If the device is locked (`isProtectedDataAvailable == false`), defer until `protectedDataDidBecomeAvailable`. [U on the exact API naming]
5. Better: post **daily aggregates** using `HKStatisticsCollectionQuery`. This deduplicates watch and phone steps the way the Health app does, so raw samples would double-count. [U, based on general HealthKit knowledge]

### Distribution options
| Route | Cost | Ongoing work | Notes |
|---|---|---|---|
| Free Apple Account (Personal Team) | $0 | **Rebuild + reinstall every 7 days** | "Provisioning profiles … will expire 7 days from issuance. You'll need to rebuild and reinstall your app" [V] ([Compare memberships](https://developer.apple.com/support/compare-memberships/)). Max 3 apps per device. **Fails our zero-manual-work requirement.** Whether the HealthKit and background-delivery entitlements are available to Personal Teams is **[U]**: the capability table didn't render. |
| Apple Developer Program + direct (ad hoc) install | $99/yr | Re-sign yearly | Register both iPhones (UDIDs). Install from Xcode or an ad hoc build. Profiles last about a year. [U on exact duration] |
| Apple Developer Program + **TestFlight (internal testers)** | $99/yr | **Upload a new build at least every 90 days** | "You can test a build for up to 90 days" [V] ([TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)). Up to 100 internal testers; internal testing doesn't need App Review [V] ([TestFlight](https://developer.apple.com/testflight/)). Both partners need App Store Connect roles. Automate uploads with Xcode Cloud or fastlane in CI, with a calendar reminder. |

### Verdict
Best long-term control and reliability, and the only route to widgets, Watch complications and Live Activities. Costs $99/yr plus real Swift work and a 90-day rebuild chore (automatable). Recommended for **v1**, after the MVP proves the game loop is worth it. Not the MVP.

---

## 4. Option D: Other tools and open-source servers

| Project | What it is | Use for us |
|---|---|---|
| [HealthyApps/health-auto-export-server](https://github.com/HealthyApps/health-auto-export-server) [V] | Official Node/TS server: POST `/api/data` → MongoDB → Grafana. `api-key` header auth. Docker Compose. About 200 stars, 12 commits, no releases. | Reference for the payload. Too heavy for us (Mongo + Grafana), and it isn't a game. |
| [irvinlim/apple-health-ingester](https://github.com/irvinlim/apple-health-ingester) [V] | Go HTTP server. HAE → local JSON files or InfluxDB. Bearer token, `?target=NAME` per person. MIT. Still updated. | Good reference for **per-person targets** and metric naming. We'll write our own small ingest endpoint into SQLite. |
| [HealthyApps/health-auto-export-mcp-server](https://github.com/HealthyApps/health-auto-export-mcp-server) [V listed] | MCP server over HAE data | Not needed |
| [nixfred/apple-health-dashboard](https://github.com/nixfred/apple-health-dashboard) [V listed] | Self-hosted dashboard for HAE data | Inspiration only |
| [Lybron/health-auto-export](https://github.com/Lybron/health-auto-export) [V] | Old docs for HAE's API export; the format docs moved to the Help Center | Historical |
| HAE "Connect to Server" / TCP server, Home Assistant, MQTT [V listed] | Alternative transports | Not needed |
| Apple Health XML export | Manual export | **Violates requirements.** Rejected. |
| Third-party aggregators (Terra, Vital, etc.) [U] | Paid SaaS that still need an iOS app on the phone | Send health data to a third party. Rejected under charter criterion 5. |

---

## 5. Network path from phone to server (affects ingestion reliability)

HAE posts from the phone **in the background, from anywhere** (work, gym, travel). Options:

| Path | How | Reliability for background POSTs | Exposure |
|---|---|---|---|
| **Tailscale (private tailnet) + Serve** | Server at `https://island.<tailnet>.ts.net` with an auto-provisioned TLS cert [V] ([Tailscale Serve](https://tailscale.com/kb/1312/serve)). Free Personal plan: up to 6 users, unlimited devices [V] ([pricing](https://tailscale.com/pricing)). | Works only if the phone's tunnel is up. **VPN On Demand** with an "Always" rule keeps it connected across Wi-Fi and cellular [V] ([Tailscale iOS VPN On Demand](https://tailscale.com/kb/1291/ios-vpn-on-demand)). Battery impact [U]. | None to the internet. Best privacy. |
| **Tailscale Funnel** (ingest path only) | Public HTTPS via Tailscale's relay. "use Tailscale Funnel" to share publicly [V] | Works without the VPN up | Public endpoint; must have a strong bearer token + rate limit |
| Cloudflare Tunnel / Caddy on a VPS | Public HTTPS with auth | Works everywhere | Public. Cloudflare terminates TLS, so it sees the health JSON. |

**Recommendation:** Tailscale + Serve for everything, with VPN On Demand set to Always on both iPhones. If the HAE Activity Log shows failed runs because the tunnel was down, expose **only `/ingest/*`** via Funnel (bearer token per device, request-size cap, rate limit). Failed runs aren't lost: the default date range re-sends "previous day + today" and the server upserts.

---

## 6. Week-1 validation checklist (resolve the [U] items)
1. Buy HAE Premium Lifetime once and confirm Family Sharing unlocks it on the second phone.
2. Point one automation at a request-bin endpoint on the tailnet and save a real JSON payload to `fixtures/`. Confirm the top-level wrapper and metric keys.
3. Run both phones for 3 days. Log the arrival time of each POST and compute the lag from activity end to server arrival. **Target:** 95% of days fully present by 10:00 the next morning.
4. Turn on Low Power Mode for one day and see what happens.
5. Check whether HealthKit plus background delivery can be signed with a free Personal Team. This only matters if we ever want to avoid the $99.
