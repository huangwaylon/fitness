# ボット: the bots

The ボット sheet's design ([Unified kit](design.md#unified-kit)); each bot's own doc: [gym/README.md](../gym/README.md),
[its/README.md](../its/README.md), [food-data "Kalori"](food-data.md#kalori).

**ボット** (`bots/BotsSheet.svelte`; the guest's view is read-only: `bots.viewOnly`): tabs **ジム** · **保養所** ·
**メニュー** · **定期処理** (`bots/registry.ts`), the last one reopening. A driver per bot (`lib/bots/types.ts`,
`lib/<bot>/bot.ts`) words the status: tone, `needsLook`.

- **Dots** (`StatusDot`): leaf 順調 · 起動中 · 取得中; yuzu 一部不調, yuzu 「!」 遅れ · 保留 · 要対応; coral 「!」 不調 · 故障;
  sunk 待機中 · 停止中 · オフ · まだありません; hollow 不明. On a tab and the menu's ボット (the worst) only while a person must
  act (`dotShown`, each driver's `needsAttention`). What heals on its own shows in its page only: ジム's 遅れ until 90 min
  past the next check, 不調 until 6 h of failed checks (`LATE_GRACE_MS`, `SITE_GRACE_MS` in `lib/gym/status.ts`).
- **Reads** (`useBot`): the shown page (保養所 15 s while running, else 60 s), the others while the sheet is open (5 min).
- **Page** (`BotPage`): one `StatusCard` (dot · word · 「12:00時点」 · ⋯; the act or a sentence, never restating the word;
  a strip of recent checks; counts and one result; 「次回 12:09ごろ」), then `AttentionCard`, sections, 設定, くわしく
  (`FactList`). ⋯ (an `ActionSheet`) is the card's one control; only stops ask first.

Calendars (`MonthCalendar`, `MonthSwitch`, `monthWeeks`): whole months from 月; past days faint, future dashed.

ジム: ⋯ 今すぐ確認 · 停止/再開 · 間隔 ›; `GymCalendar` (選択 / 完了 or long press, applied at once with 取り消す). Alone at
`/gym#<key>` (`routes/gym`, bare like `/s`): LINE's menu link opens it with `LINK_KEY` (member A's, gym only), which
leaves the URL and is kept for the tab (`lib/gym/linkKey.ts`); `gym.html` starts both reads inline (`lib/gym/early.ts`).

保養所: ⋯ 開始 / 停止; holds in the card. `ItsCalendar` (a tap a night, a weekday its column) edits a 保存 draft; 設定:
施設, 間隔と人数, 通知 (自動で確定 in the draft; the push per phone, at once).

メニュー: `status.json` (`lib/kalori/status.ts`): 遅れ a day past `next`, naming the missed run; 保留 names `diff.tripped`;
⋯ links only.

定期処理: the relay's `GET /jobs` (`relay/src/jobs.ts`, `lib/jobs/status.ts`): every other job by where it runs, a row
each (age, dot, last 24 runs; a tap: 14 days). 遅れ past 2 cadences + 10 min (daily or weekly: 1 cadence + 2 h);
止まっています past 4 cadences + 10 min (2 + 2 h), 失敗が続いています on two failures in a row (both coral);
「!」 also for an open alert issue. The relay reads GitHub on its tick or a read ≥ 5 min after the last, never per
request.
