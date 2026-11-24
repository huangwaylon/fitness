# Decisions

The decisions in force, each with its reason; the rule itself lives where it is linked (the numbers:
`app/src/lib/config/rules.ts`, `contract/`). If this file and the code disagree, the code wins.

## Data and backend

### The record on the relay
The data of record is SQLite in a Durable Object on the relay (`IslandStore`, [backend](backend.md#the-record);
backups: [runbook §6](ops/runbook.md#6-backups)). Why: ~0.1 s a request at ~1 % of the Free plan, and one copy of the
health data is one fewer to guard.

### Logging and observability
Logs live in their own Durable Object (`IslandLog`), capped, allow-listed, never a record's value
([observability](ops/observability.md)). Why: a restore must not roll back the logs, a runaway log must never stop the
record's writes, and a trail needs no private data.

### The gym bot
A LINE bot for a gym's free slots runs as its own Worker (`gym/`, [its README](../gym/README.md)) on the relay's
account; ボット → ジム reads its public `/status` and, with a member key, `/gym/config` and `/gym/act`. Why: no machine
or tunnel to keep alive, its deploys never touch the relay's, and a status of totals and codes needs no keys.

### The ITS booker
The 保養所 booker is the `its-bot` Worker (settings, record, verdict) plus a runner on GitHub Actions that checks out
main each run ([its/README.md](../its/README.md)). Why: no Mac to keep awake, the site's Turnstile needs a real headed
Chrome (a hosted runner has one, a Worker can't), and both fit the Free plans. Each run dispatches the next, and the
Worker's watchdog restarts a missing or hung one (its/README.md "Watchdog"). Why: GitHub drops most scheduled ticks.

### The bots' state in the nightly backup
The relay's 03:00 run, once the record's dump is up, reads its-bot's `/its/status` and gym-bot's `/gym/state` through
service bindings and uploads them encrypted beside it (`its-`/`gym-YYYY-MM-DD.json.age`, 90 of each;
[runbook §6](ops/runbook.md#6-backups)). Why: one job, one key and one release to watch; a binding is no public
request, and its-bot already takes the relay's KEY_A (gym-bot's GYM_TOKEN is the only new copy). A bot's failure is
its own field on `cron.backup`, never the record's `ok`, and isn't retried before the next run.

### Per-person keys
`KEY_A`, `KEY_B` (and the guest's `KEY_C`) are Worker secrets; a key identifies its person and travels in a `text/plain`
POST body, never the URL. Why: no accounts for three people, and no CORS preflight.

### Append-only, computed on read
The record holds raw rows stamped with the server's `at`; the app computes ベル, locks and the wallet on read. Why: no
ledger, no scheduler, the rules in one place.

### Local-first sync
The app paints from its snapshot, polls for newer rows and queues optimistic taps until acked
([backend](backend.md#client-sync)). Why: a tap never waits for the network, and an unchanged phone fetches nothing.

### The record serves only what the app reads
`snapshot` sends, and the record accepts, only known metric and event types and persons. Why: the app never needs code
for rows it doesn't produce.

### Live relay on Cloudflare
While the app is visible, a WebSocket to the island room (`relay/`, [backend](backend.md#live-relay)) relays small
intents, never positions; the record is its own object, so a room outage loses liveness, never data. Why: the Free plan,
hibernation makes idle sockets free, and the edge is ~20 ms from Tokyo.

### Relay versions side by side
The relay speaks every version in `LIVE_VS`; any other is closed 4004. A change ships relay first, then the app; the old
version goes once the log shows every phone on the new one (the phones' `ws.close` `v`: `npm run logs -- report`'s
*Live protocol*). Why: the phones update at different times.

### Push through the relay
When the record changes the room tells the open phones to fetch now ([backend](backend.md#push)); polling stays. Why: a
partner's steps and buys show within a second, and a current phone skips its fetch.

### Shortcut health sync
Each iPhone runs one built-in Shortcut posting daily totals when an everyday app opens
([shortcut](ops/shortcut-health-sync.md)); latest wins; health rows are never compacted or pruned. Why: no third-party
app, nothing manual; Health is the truth, up or down.

### No manual input
The app never enters health data and asks nothing day to day; the meal log is the one exception. No からだ value is typed
in. Why: the daily loop
needs no taps, and a second source would conflict with Health.
HIIT and Core (the tree popup's daily checks) are manual, a tap like 顔, never read from Health's workouts.

### No notifications
No notification of any kind (no Web Push, no service worker `push`); in-app banners and the relay's record-change notice
stay. Why: unused, and the one piece of iOS-only, hard-to-test machinery. One exception, 保養所: ITS holds and
confirmations, opt-in per phone in ボット → 保養所, members only, from the its-bot Worker
(its/README.md "Push"). Why: a hold lapses in 30 min and the site's mail was the only alert; the game, the island and
health stay push-free. A second, やること's reminders: opt-in per item, never on by default (a
due alone schedules nothing), opt-in per phone, the guest too; sent by the record's object with its-bot's VAPID pair
(one subscription per phone), re-read at the minute rather than cancelled, no quiet hours ([todo.md](todo.md#reminders)).

### To-do lists: one op per thing, anyone's
やること ([todo.md](todo.md)) is one `todo` event a list or item, its whole state, the latest winning per id (as the
packing list), not a per-field merge or a log of edits; everyone, the guest too, edits every list; reorder by 上へ /
下へ; deletes act at once with 取り消す, a list's asked first. Why: two or three people on a short list rarely edit one
item at once, and the simplest model that syncs offline is the one the packing list already proves.

### Registered hikes: a hike op and its track apart
トレイル's own hikes are `hike` (one op a hike, its whole state, the latest winning, as やること) and `hike_trk` (its
simplified track, sent once, its own 60 KB cap), not one event: an edit of a name never resends a track, and the model
keeps the tracks raw, parsed only when one is shown. A YAMAP link is read on the relay (`POST /hiking`: YAMAP sends no
CORS), which writes nothing; the phone previews and saves through the queue. Why: the record stays the one writer path,
and a track is the only large thing.

## Players and privacy

### No privacy rules
Everything is visible to all three of us. Why: two people, one game. The guest's one exception is the members' bodies.

### The guest
A third person plays the members' app as a guest ([design](design.md#the-guest), [backend](backend.md#the-guest)):
everything a member sees and does (the user, 2026-11-24: the wedding board, the trips' notes and lists, the goals, 共有リンク,
the places' notes, the speaking step), but never the members' からだ figures, enforced by the record
(`contract/guest.ts`); its ベル wallet earns none, having no Health data (the user: a player spends only its own ベル); everyone's profile reaches all three phones (`profileSeen`). Why: one
app for all three, the body private; a rule only the UI kept would leak via the cache.

### Profile
Sex and birth date are prefs on the record, sent to all three phones (`contract/guest.ts profileSeen`; 設定 shows the
same card everywhere), locked (the record refuses changes); BMI's category uses the Asian cut-offs (JASSO, 23 / 25) for
everyone, and a suggested goal never overrides a set one. The resting energy is one figure (`model/profile.ts bmrOn`):
InBody's from a 除脂肪体重 of the last 60 days (the 基礎代謝量 card's latest dot),
else Mifflin–St Jeor; so an unset kcal goal may move one step when a lean reading arrives. Why: right for East Asian
bodies; the defaults agree with the card's recent reading.

### Player avatars
A and B are NH human players by default (a villager is an option), all clothing free; the default look, いつもの, is code,
never a row, and an unknown part reads as いつもの's ([backend](backend.md#the-look), [design](design.md#players)). Why: no
inventory to sync, a retune reaches everyone, and a newer app's part never breaks an older phone.

### すがた: one dresser, kept on leaving
One stage, six tabs (コーデ · 顔 · 髪 · 服 · 小物 · 住民; [players](players.md)); the villager pick joins the draft like a
garment, and `villager` and `look` are sent once on leaving (no 決定; 元に戻す and a 4 s 取り消す cover regret). Why: one
commit model on one screen, as NH's wardrobe.

### The menu: edited in place, by a long press
`pref menuOrder` and `pref menuHidden` on the record ([design](design.md#island)), so they follow a person across
phones; the guest has its own. Two keys, not one: an older app reads `menuOrder` as a list. Null = the default, so a
new pill lands in its default place, shown; the record takes known ids only (append-only `MENU_IDS`), a phone drops
the ones it lacks. Edit mode is in the menu (held 500 ms, iOS's home screen: jiggle, ⊖ / ⊕, drag in the same
gesture), not a 設定 page: a tap stays instant (the hold only arms a timer) and a held pill never opens. A tap on a
pill toggles it (a 44px target, where a corner badge alone would be 22px). ベル moves (its id `bells`, first by
default, so an order saved before it moved gets it first) but can't be hidden: it's the wallet, the coins land on it,
it opens ごほうび. 設定 stays last and can't be hidden: the way back. 設定 keeps a row into edit mode (found there, and a
keyboard's way in); no one-time hint (the island stays quiet).

### No text selection
Nothing in the app is text to select, so the default is none (and no iOS callout): a long press on a pill or the
island was selecting words. Fields keep theirs; `.selectable` only where a person may copy or look a word up (a trip's
lines and figures, the wedding note, an English phrase card). No `selectstart` handler: it would break fields.

## Health and meals

### Health trends (健康)
The dumbbell's popup shows the Health data over time, one person at a time, computed on read, plain numbers with no
smoothing, except the pace card and the 体重 card's trend line ([design](design.md#kenkou)). Why: exact numbers anyone
can check against the bars.

### Weight pace: a forecast on request
<a id="weight-pace-a-forecast-on-request"></a>Motivation to lose weight, "am I on track",
from weeks, never a day. 体's first card ([design](design.md#pace), `model/pace.ts`): the verdict from the weigh-ins
alone (a Theil–Sen line over 28 days, pairs under 7 days apart left out: a salty dinner's spike barely moves it, and
0.1 kg rounding can't snap it to 0), on the rate as printed (−0.2 is 順調), shown once it holds two days in a row (the
latest such of the last 8 days, with that day's numbers: a one-day blip never shows), worded
without blame (横ばい and 離れ say weight wobbles); 速め past 1 % of the weight a week, not in the first 21 days (water
goes first). The ETA (順調, 速め, from 21 days of weigh-ins) aims at the goal band's edge, where キープ starts, at the
rate as printed, and moves only by 14 days or more; the projection (順調, 速め) runs min(28 days, half the data's span),
on 1か月 and 3か月. The calculation from meals and Move stays in the ⓘ (Watch burn is ±20–30 %, logs miss things), over
days with 朝昼夜 all logged (two meals overstated a deficit for someone who doesn't log breakfast), shown alone
only until there are 8 weigh-ins over 14 days; TEF stays out, as it offsets the Watch's Move overcount. 体重's line is a local linear fit, not an EWMA: an EWMA lagged ~0.6 kg above a
steady loss ("heavier than you are"). The start is a record fact (`pref goalWeightFrom`, its own slot), since the
record keeps only a goal's latest row: written once with the first goal weight (an older goal's backfilled from its
row's day), kept on edits, cleared with the goal. Members only (the guest has no 体 rows), no ベル, no push. Why: a trend you can trust
motivates; a daily number or a calorie verdict punishes water and forgotten snacks.

### No-watch days
<a id="no-watch-days"></a>A day with Move, Exercise and Stand all 0 or absent is no data for those three outside the
ベル (`model/health.ts activityOn`); rows are never rewritten. Why: the Shortcut sends 0 for a day without samples,
which dragged TDEEs and averages down; for the ベル a 0 and a missing value earn alike.

### 筋肉量 and 骨格筋量 estimated
Health carries InBody's weight, body fat, BMI and lean mass (its fat-free mass, FFM) but not 筋肉量 (soft lean mass =
FFM − bone mineral) or 骨格筋量 (SMM), which InBody measures by impedance we never get. Both are estimated daily as
FFM × a ratio (`contract/bodyEst.ts`): 筋肉量 0.94 (bone mineral ≈ 6 % of FFM: Wang et al. 1992, Am J Clin Nutr 56:19);
骨格筋量 0.57 men, 0.54 women (InBody's SMM is DXA-calibrated, Kim et al. 2002, Am J Clin Nutr 76:378; MRI norms:
Janssen et al. 2000, J Appl Physiol 89:81). A person's InBody sheets on the record (`inbody`, the admin's from the Mac:
`record.ts inbody`, never a phone's) replace the ratio with their own; every dot is the estimate. The
equations that need resistance (Janssen, Kim, Lee) can't run. Accuracy: against one member's two-week InBody chart,
calibrated within 0.25 kg, the default ratio within 0.35 kg; across people the default ratio's spread is roughly
±0.02–0.03 (≈ ±1 kg of 骨格筋量). Labelled 「除脂肪体重から推定」; members only; trends, never ベル. Why: no typing,
and the trend follows Health's lean mass, which is what InBody's own two move with.

### Goal directions
One registry (`contract/goals.ts` GOALS) holds every chart's goal and its direction (at least, at most, or near a
value); Exercise and Stand goals are 健康's lines only, the ベル keep 60 / 120. Why: a chip that says which way reads at
a glance, and a lower weight is never rewarded.

### Low kcal goals: warn, allow
<a id="low-kcal-goals-warn-allow"></a>A kcal goal under resting energy or the safe floor (1,500 kcal a man, 1,200 a woman
or unknown) gets an inline note and still saves. Why: a goal is the person's call; a hard floor would refuse a supervised
plan.

### Meal log
ごはん is typed in by the person ([design](design.md#gohan), the `food` op: [backend](backend.md#events)): a per-100 g
snapshot of the food, edited only by its logger, seen by everyone, never earning ベル (`deps.test.ts`); a repeat's or a
change's past never changes. Why: a calorie tracker whose history never rewrites itself.

### Recalculation: future automatic, past by hand
A recipe takes its ingredients as they are at use; a いつもの its foods' newer
values from today by itself, on its owner's phone, once its foods are in, said once on its row: only values known newer
than its snapshot (the catalogue's `at` in index.json, a custom food's or recipe's edit; the snapshot's time in the
repeat's id, the update's id the same on each phone), none past ±30 % kcal or ±1 g salt (those, and any of unknown
time, keep the link). A logged entry changes only by a tap: the day's one 「この日の記録を最新の値にする（n件）」, or
以前の記録にも反映する on a マイ食品's or recipe's save, both with 取り消す. Why: what comes next should be right without
asking; what was eaten stays as logged unless its owner says so; an older phone never takes newer values back.

### Shared recipes and custom foods
マイレシピ and マイ食品 are everyone's to edit (both members and the guest, as all three may make them; 2026-11-20),
the latest `at` winning whoever sent it, so two phones editing offline end on the same one; the record keeps an edit
under its creator's name (the slot's row person), so only the creator deletes it and an older app reads others' edits
as its creator's. An edit never changes a logged meal (snapshots); 以前の記録にも反映する re-snapshots the editor's own
entries only; いつもの updates stay on the repeat owner's phone. Why: one household's shared kitchen book, where a
fix by either should stick, and a delete (final) stays with whoever made it.

### Portion steps
−/＋ start at ×0.5: by halves to ×20, a counted portion (個 · 枚 · 本 …, a piece food's 1人前) by halves to ×2 and
whole ones after; 作る量 stays whole. Why: half an apple or 1½ slices is what people eat and estimate by eye; finer
than ½ is the grams field's job, and a counted ×1 → ×5 is five taps, not eight.

### Fibre, no alcohol
食物繊維 is an optional snapshot key (`fi`), kept only when the source says; its default goal from the 食事摂取基準
2025. Alcohol is not tracked (nobody here drinks): an older row's `al` or `alcoholGoal` is read and ignored. Why:
unknown never reads as zero; no field for what nobody logs.

### Kalori as a lazy dataset
kalori.jp's chain and konbini menus ship as `kalori.json` in `static/food/`, a lazy secondary dataset like the products:
in git and on Pages, the guest's and the demo's search alike; values per serving, estimates labelled and never ✓n
([food-data](food-data.md#kalori)). Why: chain meals are what we eat out, and the owner chose (the call recorded in
the commit) to publish kalori.jp's data in this public repo, knowingly superseding the rule that its terms (第8条) kept
it out, behind a members-only relay route (Workers KV, a key, its own cache and upload script); one way in for every
dataset beats that route for one of them.

### Kalori's raw data in releases, the scraper in food-data
`kalori_scrape.py` lives in `food-data/scripts/` and runs in `kalori-scrape.yml`; its output is a dated release
(`kalori-data.tar.gz`), which `fetch.py`'s `KALORI_TAG` pins ([food-data](food-data.md#kalori)). Why: ~70 MB of shards
rewritten each refresh would bloat every clone, in a branch or a repo of its own; a pinned, checksummed release is an
immutable input for each shipped `kalori.json`, and the merged pin is the accepted baseline (a rejected release is
never seeded or diffed from); and the weekly refresh lands in this repo's main, so one repo beats two.

### Kalori's automatic merge
A refresh within its bands merges itself and deploys; anything else is held as a PR ([food-data](food-data.md#kalori)).
Why: the owner chose no review for a normal week; the trusted gates and the revert make a bad week one held PR. It
pushes with the workflow token and dispatches the deploy, not a PAT: no secret to rotate (its runs fire no
`workflow_run`: the deploy check polls). Status is `status.json` on an orphan `kalori-status` branch: the app reads it
from raw GitHub (no relay route), main's history untouched. Alerts are only that file's (a dot on メニュー): no email.

## Economy

### Bells are play money
Small whole numbers, not tied to yen; no transfers. Why: prices the couple chooses, no real money at stake.

### A stamp card
Per person per Tokyo day, a ベル per daily goal met, がんばり at 1.5×, ふたりでぜんぶ when both meet all four
([design](design.md#goals)), recomputed from the rows. Why: numbers a child can add up, and the bonus makes it a team
effort.

### Four automatic fruits
🍐 Move, 🍑 Exercise, 🍒 Stand, 🍎 Steps ([design](design.md#goals)); the Move and steps goals apply from the Tokyo day
they are set. Why: the Watch measures them with no effort, and the past must not re-price.

### Economy start
The first week with an activity row, stamped by its lock ([design](design.md#the-first-week)). Why: no start date in
code, and old days can't earn.

### Harvest and week lock
Sunday 19:30 the recap opens (ceremony only); the Wednesday 04:00 after, the week's earnings lock, spends never
([design](design.md#harvest-and-lock)). Why: a grace period for late syncs, then the past stays put.

### A wallet each, two rewards
Each person earns into and buys from their own wallet, two treats at halved prices ([design](design.md#rewards));
either person erases any buy, and a buy may name its day. Why: each spends their own, an old buy keeps its price, and a
treat logged late is judged by that day's wallet.

### Weight never earns
Shown only, with an optional goal. Why: paying for kilograms rewards crash diets and punishes muscle.

### The shop's かいがら
The shop ([design](design.md#the-shop)), a 3D room, has its own per-person currency, かいがら, never ベル: NH's prices
÷ 20 both ways (a piece NH never sells: 4 × its sell price), every piece buyable; every catch and beach find (shell,
fossil, fragment) sells for 10 × that, the goods as is; the pocket is derived from the day tallies, the stock from the
date. Why: NH's prices, nothing stored for the stock, and no request per catch.
Except the goal trees' fruit: 60 a met goal's, 150 the gold one of a day with all four met, the tree's owner's alone
(`contract/pocket.ts GOAL_GOODS`), so fitness is ~10–12 % of a typical day's かいがら; goods of their own. The plain
fruit picked up before counts as its goal's (`pocketKey`: one row, 60): the rows stay as kept, past sales keep their
かいがら, and an old build's sale of it at 5 is still taken.
A correction is a row, never an edit: history stays as kept and one `shop_adjust` adds the difference, so the change
shows in the record as a correction and deleting the row undoes it. Only the admin adds one (`record.ts adjust`); no
phone can.
The stored balance is the truth: the relay's running ledger keeps each person's かいがら ([backend](backend.md#the-wallet)),
moved only by each new row's own step and never folded again, and the phones show it (plus their own unsent ops). A
rule or price change never reprices the past; a give-back after a sale floors at 0, never a negative balance. If the
stored number and the rows disagree, the daily check says so and the admin settles it with one correction row, so the
rows always explain the number. Why: one number everyone sees, unmoved by code changes, and every change on record.

## App and hosting

### PWA on Cloudflare Pages
A static SvelteKit SPA on Pages, deployed from CI after the gate, with a strict CSP
([runbook §1](ops/runbook.md#1-deploy-the-ui)); without a key it shows only pairing. Why: the pairing key is
in localStorage, so the origin must be ours alone.

### Test mode, not a demo
`?demo` is a test harness, on only in the dev server and a test's browser ([testing](ops/testing.md#test-mode)); a
feature's Worker is faked by its spec's route mock, never in the app. Why: no one uses a demo, the e2e must test the
very build that ships, and in-app fakes are code only tests read.

### Offline shell
The service worker precaches the build (not audio or art beyond the defaults) and always opens this version's cached
shell; a deploy installs meanwhile and is taken at the next hide. It keeps the newest older shell and the open pages'
for stale pages' chunks ([backend](backend.md#service-worker)). Why: the app opens fast and offline; a newer build's
page booted under the older worker fetched every new chunk past its cache, 48 % of launches ~650 ms
slower, and each cached entry slows a cold worker's first cache read (the launch review 11-21).

### The app's font: three files a weight
Zen Maru Gothic 500 and 700 as our own subsets (`scripts/font-subsets.ts`): kana and everything else but kanji, the
2,136 常用 kanji, and the app's other kanji with the food data's common ones. A rare kanji a user types (a food's name,
a note) is drawn in the system's rounded font. Why: @fontsource's 160 unicode-range slices were 30 KB of the 55 KB
render-blocking CSS and ~120 entries in each phone's caches (a cold worker's first read walks them all); six stable
files (1.27 MB precached once) cover 99.9 % of the food data's kanji and every character the app's own copy shows.

### Japanese first
Japanese by default, English per person (`pref locale`), each catalog loaded when first needed. Why: both live in Japan,
and the first load stays small.

### Copy: spaced kana in the world, kanji in the sheets
The island world and its HUD keep spaced kana; every sheet, panel, dialog and form, and the leaf menu's pills, use
natural Japanese with kanji, one spelling a term ([design](design.md#copy)). Why: the world's voice is NH's kana; adults
read kanji faster.

### Always animated
No reduced-motion variants. Why: one code path.

### 設定 trimmed; the island arranged in /editor only
The main island is edited only from /editor (the tent's もようがえ stays the room's); the game draws at most 30 frames a
second. Why: fewer controls, one place to arrange the island, a cooler phone.

## The island world

### The island in 3D: three.js only
The island is drawn in three.js (`components/world3d/`): NH's models on the editable layout, the ground built on the
phone ([island layout](island-layout.md)). It has no DOM of its own: taps go by each thing's tap area projected
(`world3d/pick3d.ts`, one canvas router in SceneTaps); over the canvas only overlays (balloons, popups, captions), and
a tap on one is its own. Without WebGL the island shows a line and the rest of the app works; no 2D fallback. Why: one
depth order, no hidden DOM to keep in step (R4 removed ~500 hidden nodes and their CSS), and iPhone 15 / 16 Safari always
have WebGL.

### Free scrolling
Only the finger moves the camera: one finger scrolls, two pinch the zoom; no snap, no sections, no automatic camera move
(the board's focus is the one exception). Why: a camera that moves by itself fights the finger.

### Lights in depth
The time of day and a wet day's darkening are the 3D lights' own (`world3d/lights.ts`), so a light sorts in depth
and stays untinted; nothing tints the canvas from outside. Every lamp is emissive with a halo; the few real point lights go to the lamps nearest the view's centre with
hysteresis and fade. Why: lights that pop or glow through trees read as bugs.

### The island's layout is data on NH's tile grid
The outdoors (terrain per tile with cliff tiers, objects, three homes) is `layout/` data: a default plus the record's
`decor` ops ([island layout](island-layout.md#the-layout-is-data)); nav, heights and validation derive from it. Why: a
fully customisable island through one record path.

### The ground is built on the phone
The ground's geometry and look are baked on the phone from the layout, again only where a change lands
([island layout](island-layout.md#the-3d-ground)). Why: an editable layout can't ship pre-baked textures.

### Decor is a last-writer-wins map, the record keeps each item's latest op
Each change of a decoration is one op with the item's whole state or its removal, merged by id (a removal beats
everything, else the latest `at`, then G over B over A: `contract/decor.ts`). Why: commutative and idempotent, so any
arrival order reaches the same layout with no leader, and rows stay as few as the items.

### A room's size never moves or drops a piece
A home's room is 4 × 4, 6 × 6, 8 × 8 (NH's), 10 × 10 or 8 × 16, against one front wall, centred, the 8 × 8's tiles
0–7 kept; a size leaving a piece outside is refused
([The tent](design.md#the-tent)). Why: nothing is lost, old phones and rows keep working.

### Buildings are doors
The tent, the homes, the museum and the shop open their own screens; a tap on the door walks up, then in. Why: NH's
buildings, and reasons to visit the back of the island.

### Only a tap on empty ground walks my villager
A tap on an interactable acts in place (my villager turns to it); a tap on bare ground runs it there; a door, the board
and a seat walk up first ([design](design.md#walking)). Why: every tap keeps its meaning and nothing waits for a walk.

### A tap on a seat sits on it
Seats, the hammock and the beach chair are walked up to and sat or lain on, one villager a seat (a bench two); nothing
new crosses the relay. Why: one behaviour indoors and out.

### Ambient life from the clock
What the island does on its own is a function of the Tokyo date, the 10-second slot and the shared world, on the relay's
clock ([backend](backend.md#ambient-life)). Why: every phone shows the same life with no messages and nothing stored.

### A shared world: the seed for what comes, the relay for what we do
What comes by itself is a function of the date, slot and place; what a person does is a small intent the room keeps for
the Tokyo day and replays in order, so first wins ([backend](backend.md#shared-world)). Why: only outcomes cross, far
below the Free plan's limits.

### One island, each villager its own phone's
Every phone shows the same island, A's home on the left, B's on the right; a person's phone owns their villager, and each
walk crosses as the very walk, replayed from the same start at the same time ([design](design.md#shared-world)). Why:
replaying only a tap's target let the phones drift.

### A villager stays where it was left
A villager stays where its last walk ended, however long its phone is gone; gone quiet inside a room, it comes out at
the door; in the shop, the museum or a room, I'm nowhere on the others' islands ([backend](backend.md#shared-world)).
Why: a villager walking itself home read as someone else moving it.

### Sleep by presence
A villager is awake while its person's app is open and asleep where it stands while it's closed, at any hour, by the
relay's presence and clock ([design](design.md#sleep)). Why: one rule anyone can read off the island, agreed without a
message.

### A villager's phrase is presence
The say button sends `say {text, sc}`, shown over the speaker for 4 s to the phones in the same place, kept nowhere,
cleaned by `cleanSay` on both sides (≤ 20 code points) and drawn as text. Why: a phrase is a moment, not a record.

### A high-five goes over the relay only
A tap on the partner sends `highfive {at}`, relayed live or held for an absent partner's next welcome (a day at most); no
record row. Why: instant, and a row per tap bought nothing.

### A catch is its plate
A catch or a find is its plate in the bottom stack, the icon popping from where it happened; nothing over the head. Why:
the stack already says what and by whom.

### Speech balloons stand by their speaker
Every balloon stands by its speaker, at most 40 px off, never over the HUD. Why: the reader must see who speaks.

### Special characters: one guest a day, one framework
NH's special characters come one a day through the visitors' slot, each with a role (shop, gift, fortune, fish, cheer,
chat) that one framework plays from per-character data ([design](design.md#visitors-roles)). Why: all of NH's cast
without a screen or a sync path each.

### Visitors are the director's fourth actor
The visitor moves through the villagers' director, idle life and walk graph. Why: one animation system, paused under a
sheet like the rest.

### K.K. lives on the island
K.K. sits on his stool, a fixed piece of the layout (moved in the editor, never deleted): his show on Saturday nights,
songs on request by day, dozing after midnight ([design](design.md#kk-on-his-stool)). Why: a resident, not scenery.

### The balloon flies in the world
The balloon present is a 3D model over the island; popped, its landing spot is chosen first (open ground at the front of
the view, `world/presentLanding.ts`) and sent with the `put`. Why: a present must land where it can be seen and tapped.

### The island's look is shared
設定's 季節 (`pref seasonLook`) and 天気 (`pref weatherMode`) are one each for the island, the last anyone set; the look
forces what the scene shows, never the clock (`ui-state/preview.ts`). Why: one island, one look, without filing real
catches under another day.

### Weather from Tokyo, by the hour
The relay fetches Open-Meteo's JMA forecast on its cron and keeps a 48-hour timeline of NH's skies that phones cache
([backend](backend.md#the-real-weather)); winter rain falls as snow; fireworks, meteor and wedding nights stay fine. Why:
one fetch for every phone, hours locked once begun so phones agree.

### Rain and snow in the world
Rain and snow are instanced, one draw call each, moved in the vertex shader. Why: depth, at no CPU per particle.

### A player walks half as fast again
A player's villager runs at 300 u/s and walks to an action at 360 (`world/speed.ts`); strolls, visitors and critters
keep their pace. Why: crossing the long island took too long.

## Rooms

### The tent's inside is three.js, its models NH's own, converted
Rooms are true 3D (`components/tent/`), their own chunk, drawn on demand with the island's renderer lifecycle
(`world3d/stage.ts`); NH's furniture, rugs and surfaces converted by `scripts/room-models.ts` may ship
([design](design.md#the-tent)). Why: a room to furnish and walk in, costing the island nothing.

### The tent's room is decor ops with a room scope; a drag is presence
A room's layout, wallpaper and floor are `decor` ops scoped `t` / `u` / `v` (`contract/tent.ts`, at most 120 pieces a
room); a held piece's spot crosses as `drag` (presence), the drop is the op. Why: one record path for every room, and the
partner sees it arranged live.

### Every home is a room; a home's look is its owner's, its room anyone's
Each home is the tent's room system with its own scope; its look its owner's alone, its room arranged by any of the
three with the editor's pieces (placing spends nothing, putting away returns nothing); its door is its anchor. The
record and the room enforce it (`scopeMayWrite`, `scopeMaySend`). Why: decorating each other's homes is the fun, and with
nothing consumed there's no inventory to hand back.

### A room's whole change is one group; undo puts back new pieces
The clear, a saved arrangement called up and their undo are one `group` of decor ops the record keeps all or none, sent
to the other phones by the record's push, not the room's intents; an undo of a removal is a new piece where the old one
stood; saved arrangements are their own event (`room_save`; [backend](backend.md#events)). Why: atomic, no protocol
change (intents are 256 bytes, 20 a second), a removal is final in the decor merge, and older apps skip an unknown event.

### The museum draws one room at a time
Only the room I'm in is drawn; a doorway dips to the next and the camera snaps to its frame ([design](design.md#the-museum)).
Why: NH's museum is a room at a time, and one keeps a phone room's draw calls and memory.

### The tent's surfaces are NH's flag
Which pieces hold things is the ACNH spreadsheet's `surface` flag; where things stand is found from the converted model
and kept in items.json. Why: faithful to NH, nothing added by hand.

### The tent's edit mode holds one thing at a time
Holding a piece, a tap on another doesn't take it; a long press does. Why: it was too easy to pick up the wrong thing,
and NH holds one item until it's put down.

### The tent's tray is NH's kinds, searched, sorted and filtered
Tabs by kind (家具, 小物, 壁掛け…; finds and buys a filter, not tabs), smart ★ / 新着 / 最近 first and fixed while open;
🔍 spans every kind; ★ is a synced pref; filters last until the app is closed, the tab and sort longer; no virtual list
(`content-visibility`). Why: owned pieces grew past a few hundred; NH sorts by kind; a filter that outlives a launch
hides pieces without saying why; a thousand icons scroll at 30 fps without one.

### The tent's camera is the player's, its walls cut away
A drag turns the camera round the room, a pinch zooms, 🏠 eases it back; walls between the camera and the room are cut
away. Why: a freer NH room camera.

### The first person's lens: a pinch
At my villager's eyes a pinch widens the view to 130° or narrows it to 50° (from 70°), kept on this phone; no button
([design](design.md#first-person)). Why: 70° shows too little of a room; a pinch is the phone's own zoom; past 130°
a tall phone's top and bottom stretch (across it's 104°; a landscape canvas capped at 120° across). Wider: more draw calls
(100°: +15 %), the frame's cost unchanged.

### For a picture: the chrome hidden, カメラめせん
A tap anywhere brings the chrome back, and it never outlives the visit (nobody stuck); カメラめせん is per phone,
never synced, never in first person. Why: room screenshots.

## Content, art and sound

### Scenery is cosmetic and local
Nothing on the island pays or costs ベル; flourishes are per phone, seeded from the date; only finds, tallies and the
island day are written. Why: the economy stays computed from the goals.

### Fruit on the tree, wild flowers on the lawn
Each goal's fruit colours in with progress, falls when met and is picked up for the day; the flowers are scenery. Why:
NH's harvest feel, with the goals in one place.

### Shaking a tree
The third tap within 1.2 s shakes; a single tap opens a goal tree's popup and rustles any other
([design](design.md#shaking-a-tree)). Why: how people shake trees in NH, never ベル.

### Farming: NH 2.0's vegetables on a field each
Starts at the shop, a field each placed in the editor, NH's ÷ 20 prices, 40 plants each, ripe the next Tokyo day and
again the day after a harvest, 3 if watered the day before, else 1 ([farming.md](farming.md)). Why: NH's farming with
a daily harvest (NH's 3 days felt slow; ~3× the income accepted); the cadence is the lever,
never a price.

### Mushrooms are cosmetic
November's mushrooms have no ずかん page; they go into the pocket to sell (`goods`). Why: NH's mushrooms are crafting
materials with no catalogue page.

### NH's calendar and critters
Each dated NH event is one rule in `world/events.ts`, its host in the visitor slot; NH's bugs, fish and sea creatures
where NH keeps them, and balloon presents at NH's odds ([design](design.md#critters)). Why: NH's world with no new
screens and nothing to sync.

### Birthdays and the wedding from the code
Birthdays sit in `PEOPLE` (`config/rules.ts`); the wedding date is the 結婚式 board's `date` (`time/holidays.ts
weddingDate`). Why: one date, changed once, both phones agreeing.

### Group stretching on an Exercise day
The tape deck comes out on a day either of us met 🍑 Exercise; a tap makes everyone stretch once a day. Why: NH's most
fitness-like ritual, tied to the exercise goal.

### Official NH art
Official renders and NH's models are fetched or converted by hand into `app/static/`, never hot-linked; `<OfficialArt>`
falls back to our own drawings. Personal use only. Why: the real look, and the app keeps working if the art goes.

### Sound off by default
Music, effects and volume are per device and off until turned on; music is fetched on demand, never precached. Why: an
app opened on a train must never surprise anyone.

### Event music and procedural ambience
NH's event tracks replace the hour's on their days; surf, wind, rain, birds and insects are synthesised
([design](design.md#event-music)). Why: the island sounds like the game, with no megabytes under the music.

## ききみみ

Replaced by English Study ([english.md](english.md)). Its `listen` rows were deleted after a verified dump; its code,
live intents and `mic.*` events are gone. `listenOf` still parses every shape ever written (a restore re-reads them).

## Microphone

`microphone=(self)`, for the speech test and すごろく's speaking step ([speech-test](speech-test.md),
[sugoroku](sugoroku.md#speaking)): the mic is asked for only on a tap; the relay's `/stt` keeps neither the audio nor
its text. Why: speaking practice without recordings anywhere.

## Compass

`accelerometer=(self)`, `gyroscope=(self)`, `magnetometer=(self)`, for a trail map's heading cone ([hiking](hiking.md#in-hike-map)):
the compass is asked for only inside a tap (the location button into 追従, 歩きはじめる; iOS's `requestPermission`, once a
session); the heading points the location dot's cone on the phone and is never sent or kept. It never turns the map
(the map turns only by two fingers). Why: which way you face on
the trail without any motion data leaving the phone.

## Trips and offline

### The trip map
MapLibre GL JS on OpenFreeMap's public vector tiles in a NookPhone style of our own ([travel](travel.md#maps)); the CSP
gains only `https://tiles.openfreemap.org` in `connect-src`; geolocation only when the locate button is tapped, never
leaving the phone. Why: real open maps with no keys or ops.

### Offline
What a phone has shown stays available offline, bounded ([backend](backend.md#service-worker)); a trip or trail area
can be saved ahead by hand (150 MB in all; nothing downloads by itself). Why: trips are read where the signal is worst,
without costing every phone every deploy.

### Sharing a trip
共有リンク ([travel](travel.md#sharing)): a member makes a link to a trip (`/s#<token>`, the token in the fragment)
that expires (1 week to 1 year, a year by default, renewable; never unlimited: a forgotten link would live forever),
can be turned off (取り消す undoes it) and counts its visits: time, device class, country and a daily-salted hash for
約N人 (no IP, UA or cookie kept; bots, our own phones and reloads aren't visits). The visitor sees a fixed safe subset
(the days, 準備, the map, the campsites, every private value 🔒; never 持ち物, the note, the guest or health); no
per-link field toggles, no social preview, the whole site noindex. Own tables on the record, not events (a token in
an event would reach every phone); anyone manages every link, the guest too (2026-11-24). A kind is a registry entry, so
another page can be shared the same way. Why: send the plan to family without pairing them, and know it was opened.
**2026-11-20, the user: the whole trips page.** One kind of link, made from the trips list: every trip, past and coming,
with 持ち物 (the list, no ticks) and the note's free values; private values stay 🔒 (the guides' `{p:}` keys never
leave the relay; other note text and packing text redacted on the relay, fail closed). v1's one-trip links still read
(none had been made). Visit times to the minute.
