# Decisions

The decisions in force now, each with a one-line why. Git history keeps the past. The numbers live in
`app/src/lib/config/rules.ts`; if this file and the code disagree, the code wins.

## Data and backend

### Google Sheet backend
One spreadsheet, *Island Fund*, on the shared Google account. A bound Apps Script web app (`app/gas/main.ts`;
scope `spreadsheets.currentonly`, runs as the owner, open to anyone) is its only reader and writer, and it never
hands out Google tokens. Why: free, nothing to host, and a leaked Island key reaches only Island data.

### Per-person keys
Two keys, `KEY_A` and `KEY_B`, live in Script Properties. A key identifies the person. It travels in the POST body,
never in the URL; requests are `text/plain` so there is no CORS preflight. A phone pairs with a `#key=…` link or by
typing the key. Why: no accounts and no login, for two people.

### Append-only compute-on-read
The sheet holds raw rows only: `metrics`, `events`, `uploads`. The server stamps every row with its own `at` and
checks shapes; the app computes everything else (ベル, locks, the wallet) from the rows on read. Why: no
ledger and no scheduler, and the rules sit in one place, in the app.

### Local-first sync
The app paints from a local snapshot and polls for rows newer than the last `at` it has seen (`since`). Taps are
optimistic and queue until sent. When the sheet's `rev` changes (a hand edit), the client drops its cache and
refetches everything. Why: Apps Script takes 1–4 s, and that must never block a tap.

### Shortcut health sync
Each iPhone runs one built-in Shortcut that posts daily totals (`steps`, `exercise_minutes`, `calories` as Move
kcal, `stand_minutes`, `weight`). It is triggered when everyday apps open, because Health can't be read while the
phone is locked. A day's activity value only goes up (the server appends only a higher value). Why: no third-party
app and nothing manual.

### No manual check-ins
The app asks nothing day to day: no eating check-ins and no "was that strength?" questions. Everything that earns
comes from the Watch. Why: the daily loop needs no taps.

### No privacy rules
Everything is visible to both people: raw numbers, ベル and weight. Why: two people, one game.

### No alerts
No notifications, no reminders and no web push. Only in-app confirmations remain (undo, a failed save). Why:
simpler, and the app is opened by choice.

## Economy

### Bells play money
ベル are play money, not tied to yen: no transfers and no payday. Amounts are small whole numbers. Why: prices the
couple chooses, with no real money at stake.

### A stamp card
Per person per Tokyo day, +1 ベル for each daily goal met, all or nothing (at most 4), and ふたりでぜんぶ: +2 shared
when both meet all four the same day. One `RULES` object, no versions; the user resets the sheet for it. A typical
week is ≈ 46 for the pair, a perfect one 70, a lazy one ≈ 28. Why: numbers a child can add up, every goal counts the
same, and the bonus makes a day a team effort.

### Economy start
The economy starts with the data: the first week with an activity row stamped by its lock. Why: no start date to
keep in the code, and a baseline of old days can't earn.

### Rings four automatic fruits
Four automatic metrics, one fruit each, always listed in Apple's ring order (Move, Exercise, Stand), then steps:

| Fruit | Metric | Daily goal |
|---|---|---|
| 🍐 pear | Move, active kcal | per person (`moveGoal`, defaults 600 / 400) |
| 🍑 peach | Exercise minutes | 60 min |
| 🍒 cherry | Stand Time, minutes | 120 min |
| 🍎 apple | Steps | 8,000 |

Why: the Watch measures them with no effort, and the same goals apply to both people (except Move, which follows
each person's own Fitness goal).

### Exercise minutes
A day's minutes are the Watch's exercise minutes. Steps never turn into minutes. Why: one source, no double counting.

### Move goal per person
A `pref` `moveGoal` (whole kcal, 100–2,000), which either person may set. It applies from the Tokyo day it is set
and never re-prices earlier days. Why: Move kcal depend on body size.

### Harvest and week lock
Each week has two times (JST). At Sunday 19:30 the harvest recap opens (each person's ベル, the ふたりでぜんぶ days, the
total); tapping 受け取る is ceremony only and nothing lands then. At the Wednesday 04:00 after, the week locks: its
earnings are fixed, and later syncs don't count. Spends are never locked. The lock is internal (no 🔒 or countdown in
the UI). Why: late Health syncs get a grace period, then the past stays put; it also lets the client compact and
memoise locked weeks.

### One wallet
Every ベル earned goes into one shared wallet, from its day. Why: one number to watch; trips are paid for outside the
game.

### Two rewards
Exactly two fixed treats: おやつ 8 ベル and 外食 15 ベル (`SHOP`). Either person buys, either person can undo any buy
(`spend_void`), and a buy the wallet can't cover is ignored on read, so the balance never goes negative. A spend names
its item at exactly its price; the server refuses anything else. Why: two clear choices priced against the week
(a perfect week, 70, buys three of each; a typical one, 46, two of each), nothing to edit or argue about. Raised from
6 and 20 (2026-10-31): a perfect day pays 10, so at 6 the おやつ was a daily treat; now each is a two-to-three-times-a-week
thing, depending on effort.

### Erasing a buy
The ごほうび page lists every buy (「かいもの きろく」) and either of us can erase any of them, at any time; the ベル go back
(2026-10-31, user: "in case we make a mistake"). It reuses the append-only `spend_void` (nothing is deleted from the
sheet), no longer the buyer's only: one shared wallet, and any of us may edit any data. The script now checks a void
names a `spend` on the sheet (else `bad_request`), and a second void of the same buy is acknowledged as a duplicate and
not appended (the other phone got there first), so it stays idempotent. The week lock freezes earnings, not spending, so
a buy from a locked week can still be erased; the harvest recap counts earnings only and never changes.

### Weight never earns
Weight is shown as a trend only: no ベル, no goal that pays, and the economy never reads it. The trend is
an EWMA (alpha 0.1), with an optional goal line; a day's weight is its latest row, 20–300 kg. Why: paying
for kilograms rewards crash diets and punishes muscle.

## Health data

### Apple Health is the source of truth
Steps, exercise, Move, Stand and weight come only from the Shortcut; the app never enters or fixes them (no
`metric_set`, `workout_add` or `workout_edit`: the server refuses them and the model ignores old rows). The goals
(`moveGoal`, `goalWeight`) stay editable for either person (`data.person`), and either may void any buy (`spend_void`);
other prefs are the sender's own. Why: all health data is already in Apple Health, so manual edits only add a second, conflicting source.

## App and hosting

### PWA on GitHub Pages
The UI is a static SvelteKit SPA (adapter-static, base `/fitness`), deployed by `.github/workflows/pages.yml` and
installed to the home screen. A strict CSP allows only our own origin and the Apps Script origins. Why: free hosting,
and data never sits on the site.

### Public repo for now
The repo and the site are public, since free Pages needs it. Without a key the site shows only pairing or `?demo`
(made-up data). Why: free; it can move to a private host later without code changes.

### Offline shell
The service worker precaches the build, loads pages network-first with a 3 s fallback to the cached shell, and
keeps one previous version so a stale page can still load its chunks. It never touches the Apps Script backend.
Why: the app opens instantly and offline.

### Japanese first
The UI defaults to Japanese; each person can switch to English (`pref` `locale`). Strings live in `ja.json` and
`en.json`, the type is rounded (Zen Maru Gothic), and dates are formatted the Japanese way. Why: both live in
Japan.

## Content, art and sound

### Official NH art
Official Animal Crossing: New Horizons renders, fetched by hand with `npm run assets:fetch` into `app/static/art/`
(with a manifest), never hot-linked. `<OfficialArt>` falls back to our own SVG drawings. Why: the real look; if a
takedown comes, delete the art and the app keeps working. Personal use only, never commercial.

### Sound off by default
Music, effects and voice blips are per device and all off until turned on. The hourly music is fetched on demand,
never precached. Why: an app opened on a train must never surprise anyone.
