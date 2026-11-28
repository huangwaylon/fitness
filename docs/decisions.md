# Decisions

The decisions in force, one line each with its why; detail lives in the linked doc and the code wins over both.
Changing one is a conscious decision: edit the line, don't let it drift.

## Data and backend
- <a id="the-record-on-the-relay"></a>**The record on the relay:** SQLite in the `IslandStore` DO
  ([backend](backend.md#the-record), backups [runbook §6](ops/runbook.md#6-backups)). Why: fast, ~1 % of the Free plan.
- **Logging** in its own capped, allow-listed `IslandLog`, never a record value ([observability](ops/observability.md)).
  Why: a restore never rolls back logs; a runaway log never blocks writes. Never Logpush, Analytics Engine, invocation logs.
- **Per-person keys** `KEY_A`, `KEY_B`, `KEY_C` (guest), Worker secrets in a `text/plain` POST body. Why: no accounts,
  no CORS preflight.
- **Append-only, computed on read:** raw rows with the server's `at`; ベル, locks, wallet computed by the app. Why: no
  scheduler, rules in one place.
- **Local-first sync:** paint from the snapshot, poll, queue optimistic taps until acked ([backend](backend.md#write-queue)).
  Why: a tap never waits for the network.
- **The record takes only what the app reads:** known types and persons only. Why: no code for unproduced rows.
- **Live room on Cloudflare:** a WebSocket relays small intents, never positions; not the record, so an outage loses
  liveness, never data ([backend](backend.md#live-relay)). Why: Free plan, hibernation, ~20 ms from Tokyo.
- <a id="relay-versions-side-by-side"></a>**Relay versions side by side:** every version in `LIVE_VS` (others closed
  4004); drop one once `npm run logs -- report` shows no phone on it. Why: phones update at different times.
- **The relay ships first** (from CI, after the test copy's smoke): a new type, pref or field before the app needing
  it; never `wrangler delete` it. A bot's contract change likewise ships its Worker first.
- **Push through the relay:** a record change tells open phones to fetch; polling stays ([backend](backend.md#push)).
  Why: a partner's steps in a second.
- **Weather only on the relay,** never in the record.
- **Budget guards:** past 60 % of the day's DO rows read or 80 % written (account-wide), optional work is refused, never
  a phone's write ([observability](ops/observability.md)). Why: one runaway scan once stopped every object for hours.
- **Shortcut health sync:** one built-in Shortcut per iPhone posts daily totals; latest wins; health rows never
  compacted or pruned ([shortcut](ops/shortcut-health-sync.md)). Why: no third-party app; Health is the truth.
- **No manual health input:** every からだ value from Apple Health; meals and the tree popup's HIIT / Core checks are the
  only typed entries. Why: no chores, one source.
- <a id="no-notifications"></a>**No notifications, three exceptions:** Web Push only for 保養所 holds (its/README.md
  "Push"), やること reminders (opt-in per item, [todo](todo.md)) and a local notification in a hike
  ([hiking](hiking.md#in-hike-map)). Why: only those lapse.
- **To-do: one shared list, one op per item,** whole state, latest wins, anyone edits ([todo](todo.md)). Why: simplest
  offline-safe model.
- **Registered hikes:** `hike` (whole state) and `hike_trk` (track once, 60 KB cap) apart; the relay reads a YAMAP link
  and writes nothing. Why: a rename never resends a track.
- <a id="the-bots-state-in-the-nightly-backup"></a>**The bots' state in the nightly backup:** the 03:00 run fetches
  its-bot and gym-bot state over service bindings, encrypted beside the dump; a bot's failure never fails the record's.
  Why: one job and key to watch.
- **The gym bot** is its own Worker (`gym/`); ボット → ジム reads its status, members edit via `/gym/config`, `/gym/act`.
  Default 12:00–13:00 on the next 4 weekdays (the gym allows 3 bookings). Why: no machine; never touches the relay.
- **The ITS booker:** `its-bot` Worker + an Actions runner with headed Chrome, each run dispatching the next, a watchdog
  restarting it. Never two runners; scans ≥ 15 s apart; only Chrome applies; auto-confirm off, only 11+ days out
  (its/README.md). Why: Turnstile needs Chrome; the site bans by rate.
- **No Mac recurring jobs:** Cloudflare crons, DO alarms, Actions only ([runbook §0](ops/runbook.md#0-scheduled-work)).

## Players and privacy
- **No privacy between us,** except the members' bodies and finances to the guest.
- **The shared money on the record:** `fin_*` events, members only at two layers (the Worker's gate, the record's
  rule), soft delete by `del` kept for good, an append-only `fin_log`, a nightly `fincheck`
  ([finance](finance.md)). Why: one store, backed up nightly; the guest never sees it even via the cache.
- <a id="the-guest"></a>**The guest:** the same app as a member, its villager and own wallet too, but never the
  members' からだ figures, enforced by the record (`contract/guest.ts`, [backend](backend.md#the-guest)); its wallet
  earns nothing without Health data. Why: a UI-only rule would leak via the cache.
- **Goals are each person's own;** the record refuses another's.
- **Profile:** sex and birth date locked prefs on the record, never in this repo; Asian BMI cut-offs (23 / 25); one
  resting-energy figure (`model/profile.ts bmrOn`).
- **Player avatars:** A and B NH human players; いつもの is code, never a row; unknown parts read as いつもの's
  ([players](players.md)). Why: no inventory to sync.
- **すがた: one dresser, saved on leaving,** with 元に戻す and a 4 s 取り消す. Why: one commit model.
- **The menu: one fixed grid for everyone** ([design](design.md#island)); old `menuOrder` / `menuHidden` prefs taken,
  never read. Why: a fixed place is learned once.
- **No text selection** except fields and `.selectable`. Why: a long press is a game gesture.

## Health and meals
- <a id="health-trends"></a>**Health trends:** plain numbers on read; smoothing only in the pace card and the 体重
  trend ([design](design.md#kenkou)). Why: anyone can check them.
- <a id="weight-pace-a-forecast-on-request"></a>**Weight pace: a forecast on request:** Theil–Sen over 28 days of
  weigh-ins, never a day's number or calorie verdict; from `pref goalWeightFrom`; members only, no ベル (`model/pace.ts`).
  Why: daily noise punishes.
- <a id="no-watch-days"></a>**No-watch days:** Move, Exercise, Stand all 0 or absent = no data (`activityOn`); a day's
  Move counts for TDEE only with ≥ 60 min Stand (`dayMove`). Why: the Shortcut sends 0 without samples.
- **筋肉量 and 骨格筋量 estimated** from fat-free mass (× 0.94; SMM 0.57 / 0.54), replaced by own InBody sheets
  (`contract/bodyEst.ts`), labelled 「除脂肪体重から推定」. Why: Health lacks impedance figures.
- <a id="goal-directions"></a>**Goal directions:** one registry (`contract/goals.ts` GOALS); Exercise / Stand goals are
  chart lines only, ベル keep 60 / 120. Why: a lower weight is never rewarded.
- <a id="low-kcal-goals-warn-allow"></a>**Low kcal goals: warn, allow** (under resting energy or 1,500 / 1,200 kcal).
  Why: supervised plans exist.
- **Meal log:** entries snapshot the food per 100 g, edited only by their logger, seen by all, no ベル
  ([design](design.md#gohan)). Why: history never rewrites itself.
- <a id="recalculation-future-automatic-past-by-hand"></a>**Recalculation: future automatic, past by hand:** a いつもの
  takes newer values (±30 % kcal / ±1 g salt); a logged entry only by a tap. Why: what was eaten stays.
- **Shared recipes and custom foods,** anyone edits, latest wins, the creator deletes. Why: one kitchen book.
- **Portion steps** by halves. Why: how people estimate.
- <a id="fibre-no-alcohol"></a>**Fibre, no alcohol:** `fi` only when the source says; alcohol untracked. Why: unknown is
  never zero.
- <a id="kalori-as-a-lazy-dataset"></a>**Kalori as a lazy dataset:** chain menus in `static/food/kalori.json`, per
  serving, from a weekly release pinned by `KALORI_TAG`, self-merging within bands, else a held PR
  ([food-data](food-data.md#kalori)). Why: one way in; no 70 MB git churn. Pictures hotlinked, never copied.

## Economy
- **Bells are play money:** small whole numbers, no yen, no transfers.
- **A stamp card:** a ベル per daily goal per Tokyo day, がんばり 1.5×, ふたりでぜんぶ when both meet all four
  ([design](design.md#goals)). Why: a child can add them.
- **Four automatic fruits** (Move, Exercise, Stand, Steps); a goal change applies from its day. Why: the past never re-prices.
- **Economy start** at the first activity week; **harvest** Sunday 19:30, **lock** Wednesday 04:00, spends never
  ([design](design.md#harvest-and-lock)).
- **A wallet each, two rewards** at halved prices; anyone erases a buy; a buy may name its day.
- **Weight never earns.** Why: rewards crash diets.
- <a id="the-shops-かいがら"></a>**The shop's かいがら:** per-person, never ベル: NH ÷ 20 both ways, catches and beach finds
  sell ×10, goal fruit 60 / gold 150 (`contract/pocket.ts GOAL_GOODS`); the relay's stored ledger is the truth, fixed
  only by `shop_adjust` rows ([backend](backend.md#the-wallet)). Why: one number, unmoved by code changes.

## App and hosting
- **PWA on Cloudflare Pages,** static SPA, strict CSP, deployed by CI after the gate ([runbook §1](ops/runbook.md#1-deploy-the-ui)).
  Why: the key in localStorage needs an origin of our own.
- **Test mode, not a demo:** `?demo` only in dev and tests; Workers faked by route mocks ([testing](ops/testing.md#test-mode)).
  Why: e2e tests the shipped build.
- **Offline shell; updates at safe moments:** precached build; a new deploy at launch or after 5 min away, before the
  first touch ([backend](backend.md#service-worker)); ≤ 1 deploy per 20 min (`Urgent:` skips). Why: never a reload in use.
- **The font:** Zen Maru Gothic 500/700 as our own subsets (`scripts/font-subsets.ts`). Why: six files, not 160.
- **Japanese first;** English per person (`pref locale`), lazy.
- **Copy: spaced kana in the world, kanji in the sheets,** one spelling per term ([design](design.md#copy)).
- **Light chrome only;** the 3D world keeps day and night. **Always animated,** no reduced-motion variants.
- **No launch snapshot;** async shaders and fewer materials instead ([perf](ops/perf.md)).
- **The island is arranged only in /editor** (desktop or iPhone); the game draws ≤ 30 fps, 12 idle. Why: fewer
  controls, a cooler phone.

## The island world
- <a id="the-island-in-3d-threejs-only"></a>**The island in 3D: three.js only** (`components/world3d/`), taps by
  projected areas (`world3d/pick3d.ts`), no 2D fallback. Why: one depth order; Safari always has WebGL.
- **Free scrolling:** only the finger moves the camera; no snap or auto moves (the board's focus aside).
- **Lights in depth:** time of day and wetness in the 3D lights (`world3d/lights.ts`); point lights to lamps near the
  centre with hysteresis. Why: lights never pop.
- **The layout is data on NH's tile grid** (`layout/` + `decor` ops; [island layout](island-layout.md#the-layout-is-data)).
- **Decor is a last-writer-wins map:** removal beats all, then latest `at`, then G > B > A (`contract/decor.ts`). Why:
  any order converges.
- **Buildings are doors;** empty ground walks, interactables act in place; doors, board, seats walk up first
  ([design](design.md#walking)).
- **Ambient life from the clock** (Tokyo date, 10 s slot; [backend](backend.md#ambient-life)); **a shared world:**
  seeded arrivals, our intents kept by the room for the day, first wins ([backend](backend.md#shared-world)).
- **One island, each villager its phone's;** a walk crosses as the walk.
- <a id="a-villager-stays-where-it-was-left"></a>**A villager stays where it was left;** in a quiet room it exits at
  the door; in the shop, museum or a room it is absent elsewhere.
- <a id="sleep-by-presence"></a>**Sleep by presence:** awake while its app is open ([design](design.md#sleep)).
- **A phrase is presence:** `say` 4 s, kept nowhere, ≤ 20 code points.
- <a id="a-high-five-goes-over-the-relay-only"></a>**A high-five goes over the relay only,** held a day; no row.
- **The island's look is shared:** `pref seasonLook`, `pref weatherMode`, last setter wins.
- **Weather from Tokyo:** a 48 h timeline from Open-Meteo (JMA); winter rain is snow; event nights fine
  ([backend](backend.md#the-real-weather)).
- **Player speed:** run 300, action walk 360 (`world/speed.ts`).
- **One visitor at a time** (K.K. aside), the special characters in the weekday rotation; "guest" means only the third
  player ([design](design.md#visitors)). **K.K.** is fixed: Saturday show, requests by day.

## Rooms
- **Rooms are three.js** (`components/tent/`), NH furniture via `scripts/room-models.ts`.
- **A room is scoped `decor` ops** (`contract/tent.ts`, ≤ 120); a held piece is `drag` presence, the drop the op; a
  home's look is its owner's, its room anyone's (`scopeMayWrite`).
- **A size never drops a piece** ([design](design.md#the-tent)); **a whole-room change is one `group`**; saved
  arrangements are `room_save` events.
- **The museum draws one room at a time** ([design](design.md#the-museum)); **edit mode holds one thing;** surfaces per
  NH's flag; **first-person lens** 50°–130° per phone ([design](design.md#first-person)).

## Content, art and sound
- **Scenery is cosmetic and local;** only finds, tallies and the island day are written; nothing on the island pays ベル.
- **Shaking a tree:** a third tap within 1.2 s ([design](design.md#shaking-a-tree)).
- **Farming:** NH 2.0 vegetables on shared fields, ripe 6 h after planting or harvest, 3 if watered else 1; anyone acts
  on any plot by a tap ([farming](farming.md)). `FARM.growMs` is the lever, never a price. No fruit trees: tree fruit is fitness.
- **Mushrooms are cosmetic:** no ずかん page; sold as goods.
- **NH's calendar:** one rule per event in `world/events.ts` ([design](design.md#critters)); birthdays in `PEOPLE`
  (`config/rules.ts`), the wedding date from 結婚式 (`time/holidays.ts`).
- <a id="official-nh-art"></a>**Official NH art** fetched or converted into `app/static/`, never hot-linked;
  `<OfficialArt>` falls back. Personal use.
- **Sound off by default,** per device; music on demand, never precached ([design](design.md#event-music)).
- **Microphone** only on a tap; the relay keeps no audio or text.
- <a id="compass"></a>**Compass** only on a tap in a trail map; never leaves the phone, never turns the map
  ([hiking](hiking.md#in-hike-map)).

## English and food data
- **English Study never judges:** no red, ×, score; nothing locked; casual register, never です/ます ([english](english.md)).
- **No audio or YouTube captions ship;** clips embed, our own transcripts ship.
- **すごろく:** no winner, never "incorrect", no push invitations; speaking off (`SPEAK=false`) until the speech test
  passes on both phones ([speech-test](speech-test.md)).
- **Food descriptions:** two sources per fact, no health claims, no Wikipedia text; correct only on solid evidence
  ([food-data](food-data.md)).

## Trips and offline
- <a id="the-trip-map"></a>**The trip map:** MapLibre on OpenFreeMap in our style; geolocation only on the locate
  button ([travel](travel.md)). Why: open maps, no keys.
- **Offline:** what a phone showed stays, bounded; areas saved by hand, 150 MB total.
- **Sharing:** expiring links (`/s#<token>`, 1 week to 1 year), revocable, visits counted without IP/UA/cookies, private
  values redacted on the relay; anyone manages any link ([travel](travel.md)).
- **Hike mode navigates only;** position never leaves the phone. **Reference trails from OSM only;** registered hikes
  and YAMAP identity never in the repo ([hiking](hiking.md)).
- **Wedding board:** anyone edits; no share link, no ベル.
- **やること** reorders by 上へ / 下へ (no fight with scroll); reminders never on by default.
