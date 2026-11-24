# Decisions

The decisions in force, one line each with its why; the rule's detail lives in the linked doc and the code wins over
both. A change to one of these is a conscious decision: edit the line, don't let it drift.

## Data and backend
- <a id="the-record-on-the-relay"></a>**The record on the relay.** The data of record is SQLite in the `IslandStore`
  Durable Object ([backend](backend.md#the-record), backups [runbook §6](ops/runbook.md#6-backups)). Why: fast, ~1 % of
  the Free plan, one copy of health data to guard.
- **Logging.** Logs live in their own object (`IslandLog`), capped, allow-listed, never a record value
  ([observability](ops/observability.md)). Why: a restore never rolls back logs; a runaway log never blocks writes.
- **Per-person keys.** `KEY_A`, `KEY_B`, `KEY_C` (guest) are Worker secrets sent in a `text/plain` POST body, never the
  URL. Why: no accounts, no CORS preflight.
- **Append-only, computed on read.** Raw rows stamped with the server's `at`; ベル, locks and the wallet are computed by
  the app. Why: no scheduler, the rules in one place.
- **Local-first sync.** Paint from the snapshot, poll for newer rows, queue optimistic taps until acked
  ([backend](backend.md#write-queue)). Why: a tap never waits for the network.
- **The record serves only what the app reads.** Only known metric/event types and persons in and out. Why: no code
  for rows the app doesn't produce.
- **Live relay on Cloudflare.** While visible, a WebSocket to the island room relays small intents, never positions; the
  room is not the record, so an outage loses liveness, never data ([backend](backend.md#live-relay)). Why: Free plan,
  hibernation, ~20 ms from Tokyo.
- <a id="relay-versions-side-by-side"></a>**Relay versions side by side.** The relay speaks every version in `LIVE_VS`
  (others closed 4004); ship relay first, then the app; drop an old version once `npm run logs -- report` shows no
  phone on it. Why: phones update at different times.
- **The relay ships first.** A new event type, pref key or field deploys the relay before the app (the record refuses
  what it doesn't know). Never `wrangler delete` the relay: it is the record.
- **Push through the relay.** A record change makes the room tell open phones to fetch now; polling stays
  ([backend](backend.md#push)). Why: a partner's steps show within a second.
- **Weather only on the relay.** No phone calls a weather API; weather is never written to the record.
- **Shortcut health sync.** One built-in Shortcut per iPhone posts daily totals ([shortcut](ops/shortcut-health-sync.md));
  latest wins; health rows are never compacted or pruned. Why: no third-party app; Health is the truth.
- **No manual health input.** Every からだ value comes from Apple Health; the meal log and the tree popup's HIIT / Core
  checks are the only typed entries. Why: no daily chores, no second source.
- **What the log never uses:** Logpush (paid), Analytics Engine, the record's SQLite, invocation logs (IPs).
- <a id="no-notifications"></a>**No notifications, three exceptions.** The island, the game and health never push. Web
  Push only for 保養所 holds (opt-in per phone, members; its/README.md "Push"), やること reminders (opt-in per item and
  phone; [todo](todo.md)), and a local notification during a hike ([hiking](hiking.md#in-hike-map)). Why: a hold lapses
  in 30 min; everything else needs no alert.
- **To-do lists: one op per thing.** A `todo` event holds a list's or item's whole state, latest per id wins; everyone
  (guest too) edits everything ([todo](todo.md)). Why: the simplest offline-safe model, as the packing list.
- **Registered hikes.** `hike` (whole state, latest wins) and `hike_trk` (the simplified track, sent once, 60 KB cap)
  are separate; a YAMAP link is read by the relay (`POST /hiking`) which writes nothing. Why: a rename never resends a
  track; the record stays the one writer path.
- <a id="the-bots-state-in-the-nightly-backup"></a>**The bots' state in the nightly backup.** The relay's 03:00 run
  fetches its-bot `/its/status` and gym-bot `/gym/state` over service bindings and uploads them encrypted beside the
  record's dump; a bot's failure is its own field on `cron.backup`, never the record's `ok`. Why: one job, key and
  release to watch.
- **The gym bot** is its own Worker (`gym/`) on the relay's account; ボット → ジム reads its public status and, with a
  member key, `/gym/config` and `/gym/act`. Why: no machine to keep alive; its deploys never touch the relay.
- **The ITS booker** is the `its-bot` Worker plus a GitHub Actions runner with headed Chrome; each run dispatches the
  next and the Worker's watchdog restarts a missing one (its/README.md "Watchdog"). Why: Turnstile needs real Chrome;
  GitHub drops scheduled ticks.
- **ITS booker rules:** never two runners (one lease, `concurrency: its-runner`, `ITS_RUNNER_ENABLED`); scans at
  most every 15 s (the site bans by rate); only Chrome submits an application; auto-confirm off by default and only
  for stays 11+ days away (free cancellation ends D-10).
- **Gym bot default:** 12:00–13:00 on the next 4 weekdays (the gym allows 3 reservations at a time).
- **A bot's contract change ships the Worker first, then the app** (as the relay).
- **No Mac recurring jobs.** Every schedule is a Cloudflare cron, a DO alarm or an Actions workflow
  ([runbook §0](ops/runbook.md#0-scheduled-work)). Why: no machine to keep awake.

## Players and privacy
- **No privacy rules between us.** Everything is visible to all three, except the members' bodies to the guest.
- <a id="the-guest"></a>**The guest.** A third person uses the same app as a member (wedding, trips, goals of its own,
  共有リンク, places' notes, speaking) but never sees the members' からだ figures, enforced by the record
  (`contract/guest.ts`); its ベル wallet earns none ([backend](backend.md#the-guest)). Why: one app; a UI-only rule
  would leak via the cache.
- **Goals are each person's own;** another's are read-only and the record refuses them.
- **Profile.** Sex and birth date are locked prefs on the record; BMI uses the Asian cut-offs (23 / 25); resting energy
  is one figure (`model/profile.ts bmrOn`: InBody's lean mass if recent, else Mifflin–St Jeor). Profile values never
  appear in this public repo.
- **Player avatars.** A and B are NH human players by default; いつもの (the default look) is code, never a row; an
  unknown part reads as いつもの's ([players](players.md)). Why: no inventory to sync; old phones never break.
- **すがた: one dresser, saved on leaving.** Six tabs; `villager` and `look` are sent once on leaving, with 元に戻す and
  a 4 s 取り消す. Why: one commit model on one screen.
- **The menu: edited in place by a long press.** `pref menuOrder` / `pref menuHidden` follow the person; ids are the
  append-only `MENU_IDS`; ベル can move but not hide; 設定 stays last ([design](design.md#island)). Why: a tap stays
  instant; the way back is never hidden.
- **No text selection** except fields and `.selectable` copy (trip lines, the wedding note, phrase cards). Why: a long
  press is a game gesture.

## Health and meals
- <a id="health-trends"></a>**Health trends.** 健康 shows plain numbers computed on read, no smoothing except the pace
  card and the 体重 trend line ([design](design.md#kenkou)). Why: numbers anyone can check.
- <a id="weight-pace-a-forecast-on-request"></a>**Weight pace: a forecast on request.** The verdict comes from
  weigh-ins alone (Theil–Sen over 28 days, shown once it holds two days), never a day's number or a calorie verdict;
  the start is `pref goalWeightFrom`; members only, no ベル (`model/pace.ts`, [design](design.md#pace)). Why: a trend
  you can trust motivates; daily noise punishes.
- <a id="no-watch-days"></a>**No-watch days.** Move, Exercise and Stand all 0 or absent is "no data" outside the ベル
  (`model/health.ts activityOn`); rows are never rewritten. Why: the Shortcut sends 0 for a day without samples.
- **筋肉量 and 骨格筋量 estimated** as fat-free mass × a ratio (0.94; SMM 0.57 men / 0.54 women), replaced by a person's
  own InBody sheets when on the record (`contract/bodyEst.ts`, `record.ts inbody`); labelled 「除脂肪体重から推定」.
  Why: Health carries lean mass but not InBody's impedance figures.
- <a id="goal-directions"></a>**Goal directions.** One registry (`contract/goals.ts` GOALS) holds each chart's goal and
  direction; Exercise / Stand goals are chart lines only, the ベル keep 60 / 120. Why: a lower weight is never rewarded.
- <a id="low-kcal-goals-warn-allow"></a>**Low kcal goals: warn, allow.** Under resting energy or 1,500 / 1,200 kcal a
  goal gets a note and still saves. Why: a supervised plan must be possible.
- **Meal log.** ごはん entries snapshot the food per 100 g, are edited only by their logger, seen by all, never earn
  ベル ([design](design.md#gohan), the `food` op). Why: a history that never rewrites itself.
- <a id="recalculation-future-automatic-past-by-hand"></a>**Recalculation: future automatic, past by hand.** A いつもの
  takes its foods' newer values from today (within ±30 % kcal / ±1 g salt); a logged entry changes only by an explicit
  tap (with 取り消す). Why: what comes next is right; what was eaten stays as logged.
- **Shared recipes and custom foods.** マイレシピ / マイ食品 are everyone's to edit, latest `at` wins; only the creator
  deletes. Why: one household kitchen book.
- **Portion steps.** −/＋ by halves; counted portions whole after ×2. Why: how people estimate by eye.
- <a id="fibre-no-alcohol"></a>**Fibre, no alcohol.** 食物繊維 (`fi`) kept only when the source says; alcohol is not
  tracked (old `al` rows ignored). Why: unknown never reads as zero.
- <a id="kalori-as-a-lazy-dataset"></a>**Kalori as a lazy dataset.** kalori.jp's chain menus ship as
  `static/food/kalori.json`, public, lazy like the products, values per serving, estimates labelled
  ([food-data](food-data.md#kalori)). Why: one way in for every dataset; publishing was the owner's call.
- <a id="kaloris-raw-data-in-releases-the-scraper-in-food-data"></a>**Kalori's raw data in releases, the scraper in
  food-data.** `kalori-scrape.yml` writes a dated release that `fetch.py`'s `KALORI_TAG` pins; a refresh within its
  bands merges and deploys itself, anything else is a held PR; status on the orphan `kalori-status` branch. Why: no
  70 MB churn in git; no review for a normal week.

## Economy
- **Bells are play money.** Small whole numbers, no yen, no transfers.
- **A stamp card.** A ベル per daily goal met per Tokyo day, がんばり 1.5×, ふたりでぜんぶ when both meet all four
  ([design](design.md#goals)). Why: numbers a child can add.
- **Four automatic fruits.** Move, Exercise, Stand, Steps; a goal change applies from the Tokyo day it is set. Why: the
  past never re-prices.
- **Economy start** is the first week with an activity row. **Harvest and lock:** recap Sunday 19:30, earnings lock the
  following Wednesday 04:00, spends never ([design](design.md#harvest-and-lock)).
- **A wallet each, two rewards** at halved prices; either person erases any buy; a buy may name its day.
- **Weight never earns.** Why: paying for kilograms rewards crash diets.
- <a id="the-shops-かいがら"></a>**The shop's かいがら.** Its own per-person currency, never ベル: NH prices ÷ 20 both
  ways, catches and beach finds sell ×10, goal fruit 60 / gold 150 to the tree's owner (`contract/pocket.ts
  GOAL_GOODS`). The relay's stored ledger is the truth ([backend](backend.md#the-wallet)); a correction is a
  `shop_adjust` row from the admin (`record.ts adjust`), never an edit. Why: one number, unmoved by code changes.

## App and hosting
- **PWA on Cloudflare Pages**, static SPA, strict CSP, deployed by CI after the gate
  ([runbook §1](ops/runbook.md#1-deploy-the-ui)). Why: the key is in localStorage, so the origin is ours alone.
- **Test mode, not a demo.** `?demo` works only in the dev server and tests; a Worker is faked by the spec's route mock,
  never in the app ([testing](ops/testing.md#test-mode)). Why: e2e tests the build that ships.
- **Offline shell.** The service worker precaches the build and opens this version's shell; a new deploy is taken at
  the next hide ([backend](backend.md#service-worker)). Why: fast, offline launches.
- **The font:** Zen Maru Gothic 500/700 as our own three subsets a weight (`scripts/font-subsets.ts`); rare kanji fall
  back to the system font. Why: six stable files instead of 160 slices.
- **Japanese first.** English per person (`pref locale`), each catalog lazy.
- **Copy: spaced kana in the world, kanji in the sheets.** The island and HUD speak NH's spaced kana; sheets, dialogs,
  forms and the menu pills use kanji, one spelling per term ([design](design.md#copy)).
- **Light chrome only.** Menus and sheets have no dark theme; the 3D world keeps its day and night.
- **Always animated.** No reduced-motion variants. Why: one code path.
- **No launch snapshot;** startup is cut with async shaders and fewer materials instead
  ([perf](ops/perf.md)).
- **The island is arranged only in /editor** (terraforming on a desktop; a phone places pieces); the game draws at most 30 fps (12 when idle). Why: fewer controls, a
  cooler phone.

## The island world
- <a id="the-island-in-3d-threejs-only"></a>**The island in 3D: three.js only.** `components/world3d/`, NH's models on
  the editable layout; no DOM of its own (taps by projected tap areas, `world3d/pick3d.ts`); no 2D fallback. Why: one
  depth order; iPhone Safari always has WebGL.
- **Free scrolling.** Only the finger moves the camera (scroll, pinch); no snap or automatic moves, the board's focus
  excepted. Why: a camera that moves itself fights the finger.
- **Lights in depth.** Time of day and wet darkening are the 3D lights' own (`world3d/lights.ts`); lamps are emissive,
  the few point lights go to lamps near the view's centre with hysteresis. Why: lights never pop.
- **The layout is data on NH's tile grid** (`layout/`, the default plus the record's `decor` ops); the ground is baked
  on the phone ([island layout](island-layout.md#the-layout-is-data)). Why: a customisable island via one record path.
- **Decor is a last-writer-wins map:** one op per item with its whole state; removal beats all, then latest `at`, then
  G > B > A (`contract/decor.ts`). Why: any arrival order converges.
- **Buildings are doors;** a tap on empty ground walks, a tap on an interactable acts in place; doors, the board and
  seats walk up first ([design](design.md#walking)).
- **Ambient life from the clock:** a function of the Tokyo date, the 10 s slot and the shared world
  ([backend](backend.md#ambient-life)). Why: same life on every phone with no messages.
- **A shared world:** what comes is seeded; what we do is a small intent the room keeps for the day and replays, first
  wins ([backend](backend.md#shared-world)).
- **One island, each villager its phone's;** a walk crosses as the very walk.
- <a id="a-villager-stays-where-it-was-left"></a>**A villager stays where it was left;** inside a room gone quiet it
  exits at the door; in the shop, museum or a room it is absent from others' islands.
- <a id="sleep-by-presence"></a>**Sleep by presence:** awake while its person's app is open, asleep where it stands
  otherwise ([design](design.md#sleep)).
- **A phrase is presence:** `say` shown 4 s, kept nowhere, `cleanSay` ≤ 20 code points.
- <a id="a-high-five-goes-over-the-relay-only"></a>**A high-five goes over the relay only,** held a day for an absent
  partner; no record row.
- **The island's look is shared:** `pref seasonLook` and `pref weatherMode`, last setter wins; never the clock.
- **Weather from Tokyo:** the relay's cron keeps a 48 h NH-sky timeline from Open-Meteo (JMA); winter rain is snow;
  event nights stay fine ([backend](backend.md#the-real-weather)).
- **Player speed:** run 300, action walk 360 (`world/speed.ts`).
- **Special characters:** one a day in the visitor slot, roles from per-character data
  ([design](design.md#visitors-roles)).
- **K.K.** is a fixed layout piece: Saturday show, requests by day.

## Rooms
- **Rooms are three.js** (`components/tent/`), NH furniture converted by `scripts/room-models.ts`, which may ship.
- **A room is `decor` ops with a room scope** (`contract/tent.ts`, ≤ 120 pieces); a held piece crosses as `drag`
  presence, the drop is the op. A home's look is its owner's, its room anyone's (`scopeMayWrite`).
- **A room's size never drops a piece;** a size that would is refused ([design](design.md#the-tent)).
- **A whole-room change is one `group`,** all or none; saved arrangements are `room_save` events.
- **The museum draws one room at a time** ([design](design.md#the-museum)).
- **The tent's edit mode holds one thing at a time;** surfaces follow NH's `surface` flag.
- **The first person's lens:** pinch 50°–130°, per phone ([design](design.md#first-person)).

## Content, art and sound
- **Scenery is cosmetic and local;** only finds, tallies and the island day are written. Nothing on the island pays ベル.
- **Shaking a tree:** a third tap within 1.2 s ([design](design.md#shaking-a-tree)).
- **Farming:** NH 2.0 vegetables, a field each, ripe the next Tokyo day, 3 if watered else 1
  ([farming](farming.md)); only a field's owner plants and harvests, anyone waters; every action is a plot's tap. The
  cadence (`FARM.regrowDays`, `FARM.cap`) is the lever, never a price. No fruit trees: tree fruit means fitness.
- **Mushrooms are cosmetic:** no ずかん page; sold as goods.
- **NH's calendar and critters:** one rule per dated event in `world/events.ts` ([design](design.md#critters)).
- **Birthdays** are in `PEOPLE` (`config/rules.ts`); the wedding date is the 結婚式 board's (`time/holidays.ts`).
- <a id="official-nh-art"></a>**Official NH art** is fetched or converted into `app/static/`, never hot-linked;
  `<OfficialArt>` falls back to our drawings. Personal use.
- **Sound off by default,** per device; music fetched on demand, never precached; ambience synthesised
  ([design](design.md#event-music)).
- **Microphone** only on a tap (speech test, すごろく speaking); the relay keeps neither audio nor text.
- <a id="compass"></a>**Compass** only inside a tap on a trail map; the heading never leaves the phone and never turns
  the map ([hiking](hiking.md#in-hike-map)).

## English and food data
- **English Study never judges:** no red, ×, sound, score or percentage; nothing locked; casual register (〜よう,
  〜だよ), never です/ます ([english](english.md)).
- **No audio or YouTube dialogue/captions ship;** clips embed from YouTube, our own transcripts ship.
- **すごろく** has no ranking or winner (one team total), never "incorrect", no Web Push invitations; speaking stays off
  (`SPEAK=false`) until the speech test passes on both phones (median ≤ ~2 s, match ≥ 0.9; [speech-test](speech-test.md)).
- **Food descriptions:** two independent sources per fact, no health claims, no Wikipedia text shipped; a correction
  only on solid evidence, else null the field or drop the row ([food-data](food-data.md)).
- **Kalori pictures are hotlinked** from assets.kalori.jp, never copied.

## Trips and offline
- <a id="the-trip-map"></a>**The trip map:** MapLibre on OpenFreeMap tiles in our NookPhone style; geolocation only on
  the locate button ([travel](travel.md)). Why: open maps, no keys.
- **Offline:** what a phone has shown stays, bounded; areas saved ahead by hand, 150 MB total.
- **Sharing:** expiring links (`/s#<token>`, 1 week to 1 year, never unlimited), revocable, visits counted without
  IP/UA/cookies; a fixed safe subset, private values redacted on the relay; anyone manages any link
  ([travel](travel.md)).
- **Hike mode navigates only:** nothing recorded; position and heading never leave the phone.
- **Reference trails from OSM only,** never YAMAP's layer or others' activities; registered hikes stay on the record,
  never in the repo; YAMAP identity (ids, links, party) is never in the repo ([hiking](hiking.md)).
- **Wedding board:** anyone edits, guest too; no keyless share link, no ベル tie-in.
- **やること** reorders by 上へ / 下へ, not drag (no fight with the sheet's scroll); reminders never on by default.
