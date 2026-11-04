# Real Tokyo weather on the island: design (approved 2026-11-04, being built)

Status: **approved**, built in the rollout's steps 1–6 (step 7 skipped). The user's answers to §5's questions: winter
rain (Dec 11 – Feb 24) falls as snow; the event nights (August Sundays, New Year's Eve, meteor showers) and the wedding
night stay clear; central Tokyo; no rain-only rescue; the morning fog and the aurora stay as treats (on real clear
hours); no WeatherKit; Open-Meteo allowed in the sandbox (the fixtures are recorded). This file folds into design.md
(Weather) and backend.md once built. The user asked: "We are based in Tokyo, Japan. Can we get
the game weather to sync with the real weather?"

## Summary

- **Answer: yes.** The relay Worker fetches Tokyo's hourly weather on the cron it already runs every 15 minutes. It
  turns that into a compact **36-hour sky timeline** in the game's own states, keeps it in the room Durable Object, and
  hands it to every phone in one small `wx` message after the welcome and again whenever it changes.
- **Same sky on every phone.** Both phones and the guest read the sky for the current hour from that one timeline. An
  hour's entry is **locked once the hour starts**, so the sky can't flicker and a phone opening late sees the same sky.
- **Offline:** a phone uses its cached timeline. Once that runs out, it falls back to today's date-seeded weather.
- **Source:** **Open-Meteo**, using JMA's models (`models=jma_seamless`). It needs no key, gives WMO codes and an hourly
  forecast, and its free tier is far more than we need.
- **Fallbacks:** first the last good timeline (a forecast stays useful for 36 hours), then the date-seeded weather.
  Optional phase 2 adds **JMA AMeDAS** observations from the 東京 station (44132) to correct the current hour when it's
  actually raining.
- **NH-faithful states:** clear, **cloudy** (new), rain, heavy rain, snow and fog. Rainbows come from real rain
  clearing in daytime. Shooting stars need a real clear night. The aurora stays a seeded treat, but only on real clear
  winter nights. NH's promised event nights (August fireworks, New Year's Eve, meteor showers) stay clear for their hours.
- **The switch:** せってい → **てんき: ほんもの / ゲーム**, default ほんもの. It's an **island-wide** setting (a shared
  `pref`) so the two phones never disagree on the rain-only critters. The きせつ preview still overrides the look on one
  phone only.
- **Cost:** about 96 fetches a day, 0 ¥, no key, nothing about us leaves the relay except a fixed city coordinate.
- **Effort:** about 3–4 agent-days in 6 small steps that each stay green (relay test copy → production → app).

## 1. Data sources

Sources were checked on 2026-11-04 from this machine. **JMA** and **developer.apple.com** were reachable and checked
live. `api.open-meteo.com`, `open-meteo.com`, `openweathermap.org` and `www.tomorrow.io` are **blocked by the sandbox
proxy** (`CONNECT 403 Domain blocked`), so their rows come from memory and must be re-checked before building. Adding
`api.open-meteo.com` and `open-meteo.com` to `~/.claude/apple/dangerous_allowed_domains.csv` would allow it; that needs
the user's OK first. The Worker fetches from Cloudflare, which this sandbox doesn't affect.

| Source | Cost | Terms and attribution | Limits | Key | Hourly forecast | Codes | Notes |
|---|---|---|---|---|---|---|---|
| **Open-Meteo** (`/v1/forecast?models=jma_seamless`, or `/v1/jma`) | Free for non-commercial use | Data CC BY 4.0: "Weather data by Open-Meteo.com" with a link, plus the underlying source (JMA) | ~10,000 a day, 5,000 an hour, 600 a minute | None | Yes, `current=` + `hourly=` (+ `minutely_15`) | WMO 0–99, `is_day`, `precipitation`, `snowfall`, `cloud_cover`, `visibility`, `temperature_2m` | Simplest fit. No SLA. Not verified live (domain blocked). |
| **JMA forecast** `bosai/forecast/data/forecast/130000.json` | Free | **公共データ利用規約 第1.0版** (PDL 1.0, CC BY-compatible). Must say 「出典：気象庁ホームページ」, and 「…を加工して作成」 when processed. Mustn't be presented as the government's own product. | None stated | None | **No.** Three daily slots (issued 05/11/17), plus 6-hour rain chances | JMA telop codes 100–450 (118 of them; category 100 sunny, 200 cloudy, 300 rain, 400 snow) | Undocumented JSON; JMA says URLs may change without notice. Verified live. |
| **JMA AMeDAS** `bosai/amedas/data/latest_time.txt`, `map/<YYYYMMDDHHmm00>.json` or `point/44132/<YYYYMMDD_HH>.json` | Free | Same PDL 1.0 attribution | None stated | None | No (observations every 10 minutes) | No weather type at 東京 44132: only `precipitation10m/1h/3h/24h`, `temp`, `humidity`, `sun10m/1h`, `wind` (each `[value, qualityFlag]`) | Real observed rain now (e.g. 1.0 mm/10 min at 19:10 today). Same caveat about being undocumented. Verified live. |
| **OpenWeatherMap** | Current 2.5 free. One Call 3.0: 1,000 free a day, card on file | CC BY-SA 4.0 / ODbL, attribution required | 60 a minute | Yes (secret) | One Call 3.0 only (needs the card) | 2xx–8xx condition ids | Needs a card for the hourly forecast. Not verified. |
| **Apple WeatherKit REST** | Included in the Apple Developer Program ($99/yr): 500,000 calls a month | Must show the Apple Weather mark plus the legal-sources link (verified) | 500k a month | ES256 JWT from a `.p8` key (Worker secret, WebCrypto) | Yes (`forecastHourly`, `forecastNextHour`) | `conditionCode` strings (Clear, Cloudy, Drizzle, Rain, HeavyRain, Thunderstorms, Snow, HeavySnow, Blizzard, Foggy, Windy…), `daylight` | Most robust, but costs money (unless already a member), needs the most key handling, and requires branding in the UI. |
| **Tomorrow.io** | Free tier | Personal and non-commercial only, attribution expected | ~500 a day, 25 an hour | Yes (secret) | Yes | 1000 clear … 4001 rain, 5000 snow, 8000 thunder | The tightest limits. Not verified. |

**Recommendation: Open-Meteo with JMA's models as the primary source.** It needs no key and no secret, gives an hourly
forecast to cache for offline phones, uses standard WMO codes, and the data is JMA's (MSM/LFM) for Tokyo. The licence
fits a private, non-commercial app. We credit it in せってい.

- **Fallback 1: the last good timeline**, kept in the room DO and on each phone. It's valid while it still covers the
  hour, up to 36 hours.
- **Fallback 2: the date-seeded weather** we have today.
- **Optional phase 2: AMeDAS 44132**, used only to correct the current hour (it's really raining now), not as a forecast.
- **If Open-Meteo proves unreliable:** WeatherKit, behind the same `fetchTimeline()` interface. That's an open question
  about whether there's an Apple Developer membership.

The JMA forecast JSON isn't worth it as a fallback. Its daily slots are too coarse for an hourly sky, and it's as
unofficial as AMeDAS.

## 2. Architecture

```
            ┌──────────── Cloudflare (relay/, Workers Free) ─────────────────────────────┐
 cron */15 ─▶ Worker.scheduled ── RPC ──▶ IslandRoom DO  (idFromName('island'))          │
 (existing)  │  (+ exportTick as now)       weatherTick():                              │
             │                              · fetch if last good fetch ≥ 30 min old,    │
             │                                or it's past :45 (to lock the next hour)  │
             │                              · GET api.open-meteo.com … (5 s timeout)    │
             │                              · validate → map → hysteresis → lock past   │
             │                              · storage 'wx' {h0, s, fx, at, src, rev}    │
             │                              · rev changed → send `wx` to every socket   │
 phone hello ─▶ /room ─────────────────────▶ welcome … then `wx` (and a lazy refresh,    │
             │                               in waitUntil, if the stored one is stale)  │
 GET /health ─▶ {ok, v, …, wx: {at, src, age}}  (monitoring)                             │
            └───────────────────────────────────────────────────────────────────────────┘
                       │ `wx` ≤ 256 B                         │ `wx`
                 ┌─────▼──────┐                        ┌──────▼─────┐   (guest: the same)
                 │ phone A    │ localStorage island.wx │ phone B    │
                 │ weatherNow: mode = pref weatherMode │            │
                 │  real & covered → timeline[hour]    │            │
                 │  else → weather.ts seeded (today's) │            │
                 └────────────┘                        └────────────┘
```

- **Server side only.** No phone ever calls a weather API. That gives one source of truth, one cache, and works with
  the iOS PWA's background limits.
- **Where it lives.** The **room** DO's storage, next to `rec` and `held`. The room sends the welcomes and broadcasts
  changes; this is presence-grade data, not the record. The single-threaded DO does the fetch itself, so there are no
  races and one fetch at a time.
- **The cron.** The **existing `*/15 * * * *`** cron calls `ROOM.weatherTick()` next to `STORE.exportTick()`, so no new
  trigger is needed (Free accounts have only a few).
  - The test copy has `crons = []`, so it relies on the **lazy refresh at hello**, which is also production's safety
    net if a cron run is missed.
  - There's also a signed `/admin` op `wx` to put a fixture timeline in place for the smoke test.
- **Location.** One fixed point set in `wrangler.toml` `[vars]`: `WX_LAT = "35.69"`, `WX_LON = "139.75"` (central
  Tokyo by the 東京 AMeDAS station, ~1 km rounding).
  - No user location, no geolocation permission, nothing about us in the request. Open-Meteo sees only a Cloudflare IP
    asking about central Tokyo.
  - The JMA model grid is ~2–5 km, so a ward-level point wouldn't change much (see the open questions).
- **The stored value.** `wx = { h0, s, fx, at, src, rev }`, about 120 bytes:
  - `h0` is the first hour (epoch hours, UTC).
  - `s` is 36 one-letter skies: `c` clear, `o` cloudy, `r` rain, `h` heavy, `s` snow.
  - `fx` is the hours' extras (fog).
  - `at` is the fetch time, `src` is `om` (Open-Meteo), `am` (AMeDAS-corrected) or `fx` (admin fixture), and `rev`
    bumps when `s` or `fx` changes.
- **The protocol.** `wx` is a new server→phone message in `sync/live-protocol.ts`, checked by the same parser on both
  sides.
  - It's sent after the welcome, not inside it, because of the 256-byte limit.
  - Older phones drop unknown kinds and keep the seeded weather. Both phones update within a day, as with any PWA build.
- **The phones.** `weatherNow.svelte.ts` gets the timeline from the live client, persists it to `island.wx`, and adds
  one input to the pure `weatherAt` (`real?: Timeline`).
  - Rule: if the mode is real, no `?weather=` is set, the scene clock isn't moved by `?date=`, and the timeline covers
    the hour, the sky is `s[hour − h0]`. Otherwise it's today's seeded weather.
  - `yieldSky` follows the same rule, so critters follow the real sky.
- **Robustness.**
  - The fetch has a 5 s `AbortSignal.timeout`, and the response is strictly validated (array lengths, ranges, codes in
    the WMO set). Bad data never replaces good data.
  - A failure backs off (30 min, 1 h, then 2 h), logs `wx-fail <reason>`, and leaves the last good timeline in place.
  - `/health` shows its age for the runbook and the smoke test.
- **Cost.** ≤ 96 Open-Meteo calls a day (≤ 1 % of its limit). It adds ~96 Worker subrequests and ~96 DO requests a day
  (~0.1 % of 100,000), ≤ 96 storage writes (rarely more than ~30, since we only write on change), and ~100 tiny `wx`
  sends. The request-budget table in backend.md gains one row.
- **Privacy.** The only new data leaving our system is a public city coordinate. The weather is public, so the guest
  gets it too. Weather isn't written to the record or the Sheet.

## 3. Mapping real weather to the game

### States

The game today has `Sky = clear | rain | heavy | snow`, plus fog, rainbow and aurora flags. We add **`cloudy`**
(NH's 曇り). Tokyo is overcast often, and showing bright sun under a grey sky is the first thing that would feel "not
synced". In NH, cloudy behaves like fine weather for the game rules: the sunny music, no rain-only critters, and the
"any except rain" bugs stay. Only its look differs: the overcast sky at ~half strength, a light tint, and no shooting
stars.

| Open-Meteo WMO `weather_code` (+ hourly mm) | JMA telop category (phase 2 / reference) | Game sky | Notes |
|---|---|---|---|
| 0, 1 (clear, mainly clear) | 100 晴 | `clear` | |
| 2 (partly cloudy) | 101 晴時々曇 | `clear` | NH's "fine with clouds" |
| 3 (overcast) | 200 曇 | `cloudy` | NEW |
| 45, 48 (fog, rime fog) | 200 + 霧 | `cloudy` + fog | Real fog any hour; rare in Tokyo |
| 51–57 drizzle, < 0.5 mm/h | 200 曇時々雨 | `cloudy` | Too light to call rain |
| 51–57 drizzle ≥ 0.5 mm/h; 61, 63; 80, 81 | 300 雨, 302 雨時々止む… | `rain` | |
| 65; 82; 66–67 (freezing rain); any ≥ 4 mm/h | 300 大雨, 308 雨で暴風を伴う | `heavy` | |
| 95, 96, 99 (thunder) | 350 雨で雷を伴う | `heavy` | NH has no lightning, so a downpour |
| 71–77, 85, 86 (snow); or wet with `temperature_2m` ≤ 1 °C | 400 雪 | `snow` | |
| 75, 86 heavy / blizzard | 406 大雪, 407 暴風雪 | `snow` (heavier streaks: a later look) | The game has one snow sky |
| Wind | — | not modelled | Later: rain slant / faster clouds at ≥ 8 m/s |

### Hysteresis and timing (relay, `relay/src/weather.ts`, pure)

1. **Hour granularity, locked.** The relay only revises hours that haven't started.
   - Every fetch rewrites the future (the next hour from :45 on).
   - The current and past hours keep what they had when they began.
   - Result: the sky changes at most once an hour, at :00, at the same moment on both phones. The seeded weather
     already works by the hour.
2. **Dead bands per transition** (based on the previous hour's state):
   - Dry → rain needs ≥ 0.5 mm/h or a rain code. Rain stays rain down to 0.2 mm/h.
   - Rain → heavy needs ≥ 4 mm/h (or a heavy/thunder code). Heavy → rain below 2.5 mm/h.
   - Clear → cloudy needs cloud cover ≥ 85 %. Cloudy → clear below 60 %.
3. **Gap fill.** A single dry hour between two wet hours stays wet (light rain). A single cloudy hour between clear
   hours stays clear.
4. **Phase 2, AMeDAS.** The current hour may change once mid-hour, and only to wet: when 東京 44132 has ≥ 0.5 mm in two
   10-minute readings in a row (20 minutes of real rain). It goes back no sooner than the next hour.
5. **Transitions on the phone.**
   - The overcast and tint already ease over 60 s.
   - The rain or snow layer fades in and out over 60 s; today it pops in with `{#if}`, so we keep it mounted and drive
     its opacity.
   - The rain bed fades over 10 s, and the music crossfades into the weather's arrangement as it does at the hour.

### Day and night, and the special skies

- **Time of day** stays the Tokyo clock (dawn 05–07, day, dusk, night). `is_day` isn't needed.
- **Shooting stars:** nights 19:00–04:00 when the hour is `clear`. Cloudy, rain and snow block them, as in NH.
- **Rainbow:** the first `clear` hour 07:00–17:00 after ≥ 1 `rain`/`heavy` hour, once a day. It builds to its peak at
  half past, as today. It's double 1 time in 8, seeded by the date so both phones agree.
- **Aurora:** stays seeded (Dec–Feb, 1 in 10 nights, never on a shower's night), and shows only while the real hour is
  `clear`. It's NH's northern-hemisphere fantasy; Tokyo never has one.
- **Fog:** real fog (codes 45/48, or visibility < 1 km while dry). The seeded 07:00 fog applies only in ゲーム mode
  (open question: also keep it on clear, calm mornings in ほんもの mode?).
- **Event nights held fine** (applied on the phone by the existing pure date rules `alwaysFine` / `showerNight`, so
  both phones agree and the relay needn't know the game's calendar):
  - August Sundays 19:00–24:00, New Year's Eve 23:00–01:00, and meteor-shower nights 20:00–04:00 are `clear`
    whatever Tokyo is doing. Today's `alwaysFine` does the same, as NH does.
  - Daytime on those dates stays real.
  - The both-goals volley and the wedding night fire in any weather, unless the user wants the wedding held fine too.
- **Snow and the season:** the island's snowy look (roofs and cedars, Dec 11 – Feb 24) stays the calendar's. What
  falls from the sky is real: winter rain is rain. That's open question 1 for the user; the alternative is NH's "winter
  precipitation falls as snow" in that window.
- **The snowboy** (`fixedDecor.ts snowboyStage`) stays on the seeded snow days. It's decor, and real snow in Tokyo is
  ~1–5 days a year. Keeping it seeded means we don't have to keep a history of past days.

### Game rules that read the weather

| Rule (where) | Behaviour under real weather |
|---|---|
| Rain-only fish/bugs (`critters.ts weatherLets`, `yieldSky`) | Coelacanth when the real sky is `rain`/`heavy`/`snow`, the snail when it's `rain`/`heavy`. `cloudy` counts as dry. Every phone uses the same `yieldSky`, from the shared mode and timeline. |
| Fireflies, ambient rain bed, footsteps splash (`raining()`) | Follow the real sky. |
| Music arrangement (`musicWeather`) | cloudy → sunny (NH); rain/heavy → rain; snow → snow. |
| Shooting stars, Celeste (`SceneTaps`, `meteor.ts`) | Clear nights only; shower nights held fine. |
| Fireworks | Dated shows held fine; the volley in any weather. |
| Rooms and the tent | Nothing today. An optional later touch: a muffled rain bed indoors (NH). |
| Seasonal preview (きせつ) | Unchanged: overrides the look on this phone only. Yields follow the real (mode's) sky. |
| `?weather=` dev param | Still wins, for the look and the yields, as today. |

**Fairness.** By JMA normals (approximate), Tokyo has ~100+ days a year with ≥ 1 mm, on the order of 5–7 % of hours
wet, with a June–July rainy season and autumn typhoons. Dec–Jan are dry (~4–5 wet days a month). The seeded weather
gives ~61 wet days, mostly wet all day, so real rain comes **more often but in shorter spells**, and in winter less.

The rain-only species stay reachable on most weeks of the year. We propose **no "dry-spell rescue"**: that would break
the realism the user asked for, and the ゲーム switch exists. If the user wants a guarantee, the rule would be "after 21
days with no wet hour between 07:00 and 23:00, one seeded wet evening" (open question 4).

## 4. Edge cases

- **API down or bad data.**
  - The last good timeline stands; it covers up to 36 h.
  - Past that, phones use the seeded weather. The switch row shows 「ほんものの てんきが とれません（ゲームの てんき）」.
  - Retries back off as above.
- **Stale data (TTL).**
  - Valid while `now` is within `h0 … h0+36 h`, and `at` ≤ 36 h ago. Otherwise seeded.
  - A phone that was offline overnight still has a forecast for the morning.
  - The seeded fallback never mixes hour by hour with the real timeline: each hour comes from one source or the other.
- **Day rollover, 05:00 vs midnight.**
  - Real mode works per absolute hour, so it has no day boundary.
  - The seeded parts it keeps use the existing 05:00 weather day: aurora odds, double-rainbow odds, the snowboy, and
    ゲーム mode.
  - Hours from 00:00 to 04:59 belong to the previous weather day for those seeds, as today.
  - The once-a-day rainbow uses the 05:00 day.
- **Both phones in sync.**
  - There's one timeline, locked hours, and a broadcast on change.
  - When the hour turns, both phones read the next entry at :00 by their own (NTP) clocks, already cached before the
    hour.
  - Two phones disagree only if one has an older `rev` and the change is in the current hour, which only phase 2 can
    cause. That lasts until the next `wx`, seconds if both are online.
  - The worst case is a different species in one critter slot. A catch's claim is still first-wins by id, so nothing is
    lost or duplicated.
- **The guest.** Gets the same `wx` (public data), sees the same sky and critters, and can't change the mode (the pref
  isn't in `GUEST_PREF_KEYS`, and the relay refuses it).
- **Mode switch.**
  - `pref weatherMode = 'real' | 'game'`, an island-wide key (no `person`), last writer wins, members only. Default
    `real` when unset.
  - It's in the record and therefore the Sheet export, which is harmless.
- **`?date=` previews.** A moved scene clock leaves the timeline's range, so it's seeded. That's correct for previewing
  another day.
- **Dev params.** `?wx=real|game` forces the mode for this load. `?wx=<fixture>` (dev or `?demo`: `rain-pm`, `typhoon`,
  `snow`, `fog`, `clears`, `stale`) loads a canned timeline. `?weather=` still forces a sky.
- **Demo (`?demo`).** Uses a built-in fixture timeline, no network.
- **Tests (deterministic, no network).**
  - Relay: `relay/test/weather.test.ts` maps recorded Open-Meteo fixture responses (clear day, showers, rainy-season
    day, typhoon, Tokyo snow, fog morning, a malformed body, 500, timeout) to golden timelines. It covers hysteresis
    with no single-hour flicker, gap fill, locked hours never revised, backoff, `rev` only on
    change, and `wx` sent after the welcome and on change, using a fake `fetch` and a fixed clock.
  - App: `weather.test.ts` and `critterWeather.test.ts` cover a timeline in → sky / yieldSky / rainbow / stars out,
    TTL and fallback, event nights held fine, `cloudy` as dry, and the parser for `wx`.
  - e2e (logic tier): `?wx=` fixtures check `data-sky`, the fade's end state, and the switch row and attribution.
  - `npm run smoke`: `/admin wx` on the test copy, then a socket gets `wx`.
  - Recording the fixtures needs network access to `api.open-meteo.com` once, which is blocked here (see §1).
- **The せってい switch.** A new section **てんき** next to きせつ (`panel/WeatherSection.svelte`):
  - A segmented 「ほんもの / ゲーム」.
  - Below it, one line: 「いま: とうきょう くもり」, or when stale 「さいご 19:10」.
  - A small credit: 「てんき: Open-Meteo.com（気象庁のデータを加工）」 (phase 2 adds 「出典：気象庁ホームページ」).
  - On the guest's phone the control is shown read-only.
  - Default ほんもの. The きせつ preview's weather row is unchanged.

## 5. Risks and open questions for the user

**Risks**
1. Open-Meteo's free tier has no SLA, and the JMA JSON is undocumented. Mitigation: a 36 h cache, the seeded fallback,
   `/health` age, and `fetchTimeline()` swappable for WeatherKit.
2. **Less snow in winter.** Real Tokyo barely snows, so the island's winter loses most of its falling snow (~20 seeded
   snow days become ~1–5 real ones) unless we choose question 1's alternative.
3. **Up to an hour of lag** in phase 1 for a shower the forecast missed; phase 2 cuts it to ~20 min. Forecast misses
   are inherent.
4. It adds the `cloudy` state across the look, the critters, the stars and the music. It's a small change, but it
   touches several modules.
5. A new server message means old builds keep the seeded weather until they update (hours).

**Questions**
1. **Winter:** should real rain between Dec 11 and Feb 24 fall as **snow** (NH, matches the snowy ground) or stay
   **rain** (truthful)? We lean towards snow-in-season for the look, but it's your call.
2. **Event nights** (August Sundays, New Year's Eve, meteor showers): held fine (NH's promise) or real? We recommend
   held fine. And the wedding night?
3. **Location:** central Tokyo (Chiyoda, by the 東京 AMeDAS station), or your ward? It would be rounded to ~1 km and
   kept only in the relay's config, never shown.
4. **Rain-only fairness:** no rescue (recommended), or one seeded wet evening after a 3-week dry spell?
5. Should the seeded **morning fog** stay as a treat in ほんもの mode, and the **aurora** too (recommended: yes, both
   only on real clear hours)?
6. Is there an Apple Developer membership? If so, WeatherKit is the paid-grade fallback, at the cost of Apple's branding
   in せってい.
7. May we allow `api.open-meteo.com` / `open-meteo.com` in the sandbox allowlist to verify the terms and record test
   fixtures?

## 6. Rollout (small green steps, push to main each)

1. **Relay, pure:** `relay/src/weather.ts`: `fetchTimeline`, `mapHour`, hysteresis, the lock, plus its
   fixtures and tests. No wiring. (~0.5 d)
2. **Relay, room:** `weatherTick` in the DO, the cron hook, lazy refresh at hello, the `wx` message in
   `live-protocol.ts` (both parsers), `/health` `wx`, and the `/admin wx` op. Deploy to the **test copy**; the smoke test
   checks `wx`. (~0.5–1 d)
3. **Relay, production:** deploy, then watch `/health` age and the logs for a day. Phones ignore `wx` until step 4.
   (~0.1 d)
4. **App, data path:** the live client stores `wx` in `island.wx`; `weatherAt(…, real)`; `yieldSky`; TTL and fallback;
   the shared `pref weatherMode` (contract, guest refusal); dev `?wx=`; demo fixture; unit tests. Ships with the mode
   default `real`, clear/rain/heavy/snow only (cloudy reads as clear). (~0.75 d)
5. **App, `cloudy` and the transitions:** the Sky type, the look, the critters, the stars, the music, the 60 s
   rain/snow fades, real fog, and rainbow-after-rain; e2e fixtures. Then check on the iOS Simulator and the phones.
   (~0.75 d)
6. **App, せってい てんき section** and attribution, plus docs: design (Weather, Seasonal preview, Dev params), backend
   (the room, the protocol, the request budget), decisions ("Weather from Tokyo, by the hour"), and the runbook (`/health`
   wx age). (~0.5 d)
7. *(Optional, phase 2)* AMeDAS current-hour correction; a muffled rain bed in the rooms; wind. (~0.5–1 d)

**Effort:** ~3–4 agent-days for steps 1–6 (~1–1.5 days of wall time with two agents: relay and app in parallel after
step 2's protocol lands). Phase 2 adds ~1 day.
