# ボット: the bots

The ボット sheet's design ([Unified kit](design.md#unified-kit)); each bot's own doc: [gym/README.md](../gym/README.md),
[its/README.md](../its/README.md), [food-data "Kalori"](food-data.md#kalori).

**ボット** (`bots/BotsSheet.svelte`; the guest's view is read-only: `bots.viewOnly`): tabs **ジム** · **保養所** ·
**Jobs** (`bots/registry.ts`), the last one reopening; a kept or asked `kalori` tab opens Jobs with Chain menus
unfolded. A driver per bot (`lib/bots/types.ts`,
`lib/<bot>/bot.ts`) words the status: tone, `needsLook`.

- **Dots** (`StatusDot`): leaf 順調 · 起動中 · 取得中; yuzu 一部不調, yuzu 「!」 遅れ · 保留 · 要対応; coral 「!」 不調 · 故障;
  sunk 待機中 · 停止中 · オフ · まだありません; hollow 不明. On a tab and the menu's ボット (the worst) only while a person must
  act (`dotShown`, each driver's `needsAttention`). What heals on its own shows in its page only: ジム's 遅れ until 90 min
  past the next check, 不調 until 6 h of failed checks (`LATE_GRACE_MS`, `SITE_GRACE_MS` in `lib/gym/status.ts`).
- **Reads** (`useBot`): the shown page (保養所 15 s while running, else 60 s), the others while the sheet is open (5 min).
  Offline a page shows its saved copy with 「HH:MM時点」, 「オフラインのため、前回の内容を表示しています」 and もう一度
  (Jobs in English), never a stuck 更新中.
- **Page** (`BotPage`): ジム and 保養所 open with a head (空き枠の確認 / 空室の確認, the status dot inline: a tap opens the
  bot's row in Jobs; ⋯, an `ActionSheet`, only stops ask first; an act's answer under it), then `AttentionCard` (the
  act, or the sentence while a person must look; 保養所's holds), sections, 設定, くわしく (the page's history only).
  Their status lives in Jobs (since 2026-11-25). Jobs keeps its `StatusCard` (dot · word · 「12:00時点」; the sentence).

Calendars (`MonthCalendar`, `MonthSwitch`, `monthWeeks`): whole months from 月; past days faint, future dashed.

ジム: いま空いている枠 (the last check's open slots, `/gym/config` `open`/`openAt`) with 予約ページを開く; ⋯
今すぐ確認 (its slots land in that section) · 停止/再開 · 間隔 ›; `GymCalendar` (選択 / 完了 or long press, applied at
once with 取り消す). Alone at
`/gym#<key>` (`routes/gym`, bare like `/s`): LINE's menu link opens it with `LINK_KEY` (member A's, gym only), which
leaves the URL and is kept for the tab (`lib/gym/linkKey.ts`); `gym.html` starts both reads inline (`lib/gym/early.ts`).

保養所: ⋯ 開始 / 停止; holds in 確認が必要. `ItsCalendar` (a tap a night, a weekday its column) edits a 保存 draft; 設定:
施設, 間隔と人数, 通知 (自動で確定 in the draft; the push per phone, at once).

**Jobs** (English only whatever the app's language: i18n `inLocale` / `pinLocale` / `scoped`; `i18n/jobs.en.json`):
the relay's `GET /jobs` (`relay/src/jobs.ts`), Kalori's `status.json`, and the Gym and ITS bots as their tabs read them
(`useBot`), laid out by `lib/jobs/status.ts` (`layout`, `verdictOf`):
- **Verdict card**: one sentence of what to do, the first that applies: read the open alert · merge Chain menus' PR · a
  bot's own step · check the failing rows · keep an eye on the late ones · a tight Cloudflare limit; then "N more below";
  all well: "All N OK. Nothing to do." It weighs every row (the bots and the limits too) but the flake hunt (its `flake`
  issue, shown on its row) and rows waiting on another; Recovered stays on its row. The Jobs tab's dot is the worst of
  Jobs' and the bots' dots (`BotsSheet` `jobsMark`), so its 「!」 matches. くわしく (GitHub read, Auth) only while GitHub's read
  failed.
- **Needs you** (only while something does): the person's steps (open alerts, Chain menus' PR), then the rows in
  trouble from anywhere, red then amber: jobs, Gym bot / ITS bot, and copies of amber/red Cloudflare limits. A home
  heading counts what moved ("· 1 above").
- **Bots**: Gym bot · Gym slot check · ITS bot · ITS bot check. **Data for the app**: Weather · Google Maps sync · Place
  sorting · Place hours · Chain menus. **Your data**: Backup · Nightly cleanup. **Behind the scenes**: Server timer · Job
  trigger · Server check. **Releases**: Site deploy · Relay deploy (`relay.yml`) · Full test run · Flaky-test hunt. The
  last two fold while healthy (a summary row, "All 3 OK"; a tap unfolds, kept this session; `openRow` opens its fold).
- **Dependencies** (`DEPS`): Server timer late or stopped says "Weather and Place sorting paused" and those rows read
  "Waiting on Server timer" (neutral, not in Needs you); Job trigger likewise for Server check, ITS bot check, Google
  Maps sync.
- **Rows** (`JobRow`; bots `ServiceRow`): age, dot, the last 24 runs (OK, Partly failed, Failed, Nothing to do, Running,
  Cancelled); a tap shows 14 days and the runs. States: OK, Recovered (a success after a failure in the last day), First
  run 3:00 (JOBS `at`, the relay's `since`), Running, Late (past 2 cadences + 10 min; daily or weekly 1 cadence + 2 h),
  Stopped (4 cadences + 10 min; 2 + 2 h), Last run failed, Failing (two in a row), Partly failed, Waiting on…, No runs yet.
- **Chain menus** (kalori-scrape; kalori-watch folded in: Watch stopped) takes its state from `status.json`: Held is warn
  + 「!」 with the step and the PR link, a failure bad, not yet run First run, Late a day past `next`. Its detail: the
  sentence, Next run, items, the last 8 weeks, the last change, run / PR / workflow links.
- The relay reads GitHub (every `group: 'github'` job in `contract/jobs.ts`) on its tick, or on a read ≥ 5 min after the
  last, never per request.
- **Daily limits (Cloudflare)**, always last (`UsageRow`; `/jobs` `usage`, `relay/src/cfUsage.ts`): a row per limit (DO
  rows read 5M, DO rows written 100k, DO requests 100k, Worker requests 100k): used / max, percent, a bar; "Resets in Xh"
  (00:00 UTC = 9:00); a tap says what it is in plain words ("the app stops at 100%") and who used it. Green < 60 %, amber
  ≥ 60 %, red ≥ 85 % (「!」). The relay asks GraphQL Analytics itself (secret `CF_ANALYTICS_TOKEN`), kept 10 min per
  isolate; no token or a failure: "Usage unavailable (code)". An outage (the record unreadable): `/jobs` answers 503
  `unavailable` with `usage`, and the page shows the limits under its LoadError (`lib/jobs/outage.svelte.ts`).
