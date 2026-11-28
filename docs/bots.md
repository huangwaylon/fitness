# ボット: the bots

The ボット sheet ([Unified kit](design.md#unified-kit)); each bot's own doc: [gym/README.md](../gym/README.md),
[its/README.md](../its/README.md), [food-data "Kalori"](food-data.md#kalori).

**ボット** (`bots/BotsSheet.svelte`; read-only for the guest: `bots.viewOnly`): tabs **ジム** · **保養所** · **Jobs**
(`bots/registry.ts`), the last one reopening; a `kalori` tab opens Jobs with Chain menus unfolded. A driver per bot
(`lib/bots/types.ts`, `lib/<bot>/bot.ts`) words the status: tone, `needsLook`.

- **Dots** (`StatusDot`): leaf 順調 · 起動中 · 取得中; yuzu 一部不調, yuzu 「!」 遅れ · 保留 · 要対応; coral 「!」 不調 · 故障;
  sunk 待機中 · 停止中 · オフ · まだありません; hollow 不明. On a tab and the menu's ボット only while a person must act
  (`dotShown`, `needsAttention`); what heals itself shows in its page only (ジム: `LATE_GRACE_MS` 90 min,
  `SITE_GRACE_MS` 6 h in `lib/gym/status.ts`).
- **Reads** (`useBot`): the shown page (保養所 15 s while running, else 60 s), the others every 5 min while open.
  Offline: the saved copy with 「HH:MM時点」 and もう一度, never a stuck 更新中.
- **Page** (`BotPage`): a head (空き枠の確認 / 空室の確認, its dot opens the bot's row in Jobs; ⋯ `ActionSheet`, only stops
  ask first), `AttentionCard` (the act, or 保養所's holds), sections, 設定, くわしく. Calendars (`MonthCalendar`,
  `monthWeeks`): whole months from 月; past faint, future dashed.

ジム: いま空いている枠 (`/gym/config` `open`/`openAt`) with 予約ページを開く; ⋯ 今すぐ確認 · 停止/再開 · 間隔 ›;
`GymCalendar` (選択 / 完了 or long press, at once with 取り消す). Alone at `/gym#<key>` (`routes/gym`): LINE's menu link
opens it with `LINK_KEY` (member A's, gym only), kept for the tab (`lib/gym/linkKey.ts`); `lib/gym/early.ts` starts the
reads inline.

保養所: ⋯ 開始 / 停止; holds in 確認が必要. `ItsCalendar` (a tap a night, a weekday its column) edits a 保存 draft; 設定:
施設, 間隔と人数, 通知 (自動で確定 in the draft; push per phone, at once).

## Jobs
English whatever the app's language (`i18n/jobs.en.json`, `pinLocale`). Sources: the relay's `GET /jobs`
(`relay/src/jobs.ts`), Kalori's `status.json`, the two bots as their tabs read them; laid out by `lib/jobs/status.ts`
(`layout`, `verdictOf`).
- **Verdict card**: the first that applies: read the open alert · merge Chain menus' PR · a bot's step · check failing
  rows · watch late ones · a tight Cloudflare limit; else "All N OK. Nothing to do." The flake hunt and rows waiting on
  another don't count. The tab's dot is the worst of Jobs' and the bots' (`jobsMark`).
- **Needs you** (only while something does): the person's steps, then rows in trouble, red then amber.
- **Groups**: Bots (Gym bot · Gym slot check · ITS bot · ITS bot check); Data for the app (Weather · Google Maps sync ·
  Place sorting · Place hours · Chain menus); Your data (Backup · Nightly cleanup); Behind the scenes (Server timer ·
  Job trigger · Server check); Releases (Site deploy · Relay deploy · Full test run · Flaky-test hunt). The last two fold
  while healthy. Names map to jobs in [runbook §0](ops/runbook.md#0-scheduled-work).
- **Dependencies** (`DEPS`): Server timer late pauses Weather and Place sorting ("Waiting on Server timer", neutral);
  Job trigger likewise for Server check, ITS bot check, Google Maps sync.
- **Rows** (`JobRow`, `ServiceRow`): age, dot, the last 24 runs; a tap shows 14 days. States: OK, Recovered (a success
  after a failure in the last day), First run, Running, Late (2 cadences + 10 min; daily/weekly 1 + 2 h), Stopped (4 +
  10 min; 2 + 2 h), Last run failed, Failing (two in a row), Partly failed, Waiting on…, No runs yet.
- **Chain menus** (kalori-scrape + kalori-watch) from `status.json`: Held (a failed test, main moved) is warn + 「!」 with the step and branch link; a merge past the bands, healthy with its note; Late
  a day past `next`; detail: next run, items, 8 weeks, links.
- The relay reads GitHub (`group: 'github'` jobs in `contract/jobs.ts`) on its tick or a read ≥ 5 min after the last.
- **Daily limits (Cloudflare)**, last (`UsageRow`, `relay/src/cfUsage.ts`): DO rows read 5M, written 100k, DO requests
  100k, Worker requests 100k: used / max, a bar, "Resets in Xh" (09:00 JST). Green < 60 %, amber, red ≥ 85 % (「!」).
  The relay asks GraphQL Analytics (`CF_ANALYTICS_TOKEN`), 10 min cached; else "Usage unavailable (code)". An outage:
  `/jobs` answers 503 with `usage`, shown under the LoadError (`lib/jobs/outage.svelte.ts`).
