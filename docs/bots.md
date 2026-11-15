# ボット: the bots

The ボット sheet's design (moved from [design.md](design.md#settings); the kit: [Unified kit](design.md#unified-kit)).

**ボット** (`bots/BotsSheet.svelte`, members only): tabs **ジム** · **保養所** · **メニュー** (`bots/registry.ts`; not in
demo), the last reopening. A driver per bot (`lib/bots/types.ts`, `lib/<bot>/bot.ts`) words the status: tone, `needsLook`.
- **Dots** (`StatusDot`): leaf 順調 · 起動中 · 取得中, yuzu 一部不調, yuzu 「!」 遅れ · 保留 · 要対応 (a fine bot needing a look),
  coral 「!」 不調 · 故障, sunk 待機中 · 停止中 · オフ · まだ, hollow 不明; drawn on a tab and the menu's ボット (the worst) only while a person must act (`dotShown`,
  the user 2026-11-15: what heals on its own shows in its page only: 一部不調, ジム's 遅れ and 不調 from the site failing), a failed read dimmed, kept.
- **Reads** (`useBot`): the shown page (保養所 15 s while running, else 60 s), the others with the sheet (5 min).
- **Page** (`BotPage`): one `StatusCard` (~132px): dot · word (15 bold) · 「12:00時点」 (13 soft) · ⋯; the act in ink (`act`,
  保養所's mail, メニュー 保留's merge) else the sentence, never restating the word (none when it says it); result line; the strip, 32 drawn in
  a 44 hit (ok green, avail full height, warn capped, fail hatched, none a tick; 前回 ringed, its time the right tick in
  ink; 次回 a dashed ghost, 「次回 12:09ごろ」 under it, none stopped or off); 11px ticks; the counts > 0 with swatches + one 成果
  (いま空き{n}枠 · 予約 · 品目・店; 不調: 最後の成功). Never kept: a 32px sunk line (保養所 running: a plain 確認なし). Night: only
  warn (`--n-warn`) and bad filled. · `AttentionCard` (what the card lacks; an act's sentence) · sections · 設定 · くわしく (`FactList`; its `more` rows at the bottom, named with their counts in its summary: ジム アプリで変更, 保養所 最近の動き, メニュー 前回の変更).
  ⋯ (NavButton, an `ActionSheet`) is the card's one control; only stops ask.

Calendars (`MonthCalendar`, `MonthSwitch`, `monthWeeks`): whole months from 月, 11月 · 12月; past days faint,
not-yet days dashed; filled days mixed over cream by night too (ink ≥ 7.5:1); one weekday label 「{wd}曜日をすべて選ぶ」.
ジム: ⋯ 今すぐ確認 · 停止/再開 · 間隔 ›; 54pt cells (`GymCalendar`, legend 見ない first), 選択 under the grid or long
press; at once (取り消す).
保養所: ⋯ 開始 / 停止; holds in 確認が必要. 日付 unfolded, 44 cells (`ItsCalendar`: a tap a night, a weekday its column;
要対応 a yuzu 「!」 as the tab's, 仮押さえ a yuzu ring;
✕ any stay) in the 保存 draft (未保存); 設定 folded: 施設 (presets; no ★), 詳細, 通知 (per phone).
メニュー: `status.json` (`lib/kalori/status.ts`): 遅れ a day past `next` too; 保留 names `diff.tripped`; ⋯ links only.
