# ボット: the bots

The ボット sheet's design (moved from [design.md](design.md#settings); the kit: [Unified kit](design.md#unified-kit)).

**ボット** (`bots/BotsSheet.svelte`, members only): tabs **ジム** · **保養所** · **メニュー** (`bots/registry.ts`; not in
demo), the last reopening. A driver per bot (`lib/bots/types.ts`, `lib/<bot>/bot.ts`) words the status: tone, `needsLook`.
- **Dots** (`StatusDot`): leaf 順調 · 起動中 · 取得中, yuzu 一部不調, yuzu 「!」 遅れ · 保留 · 要対応 (a fine bot needing a look),
  coral 「!」 不調 · 故障, sunk 待機中 · 停止中 · オフ · まだ, hollow 不明; drawn on a tab and the menu's ボット (the worst) only while a person must act (`dotShown`,
  the user 2026-11-15: 一部不調 while it retries shows in its page only), a failed read dimmed, kept.
- **Reads** (`useBot`): the shown page (保養所 15 s while running, else 60 s), the others with the sheet (5 min).
- **Page** (`BotPage`): `VerdictCard` (a `.card.pad`: dot, the headline: the act (`act`) or 「対応不要」, ⋯; the word a `.tag`,
  「12:00時点」; sentence; result line; dense
  `StatStrip` 前回 · 次回 · 成果, 不調: 最後の成功) · `AttentionCard` (only steps the sentence lacks) · `StatusStrip` (ok green,
  空き full height, warn yellow capped, fail hatched, none a tick; empty: out, 保養所 running a sunk line, never a second warning) · sections · 設定 · くわしく (`FactList`).
  ⋯ (NavButton, an `ActionSheet`) is the card's one control; only stops ask.

Calendars (`MonthCalendar`, `MonthSwitch`, `monthWeeks`): whole months from 月, 11月 · 12月; past days faint,
not-yet days dashed; filled days mixed over cream by night too (ink ≥ 7.5:1); one weekday label 「{wd}曜日をすべて選ぶ」.
ジム: ⋯ 今すぐ確認 · 停止/再開 · 間隔 ›; 54pt cells (`GymCalendar`, legend 見ない first), 選択 under the grid or long
press; at once (取り消す).
保養所: ⋯ 開始 / 停止; holds in 確認が必要. 日付 unfolded, 44 cells (`ItsCalendar`: a tap a night, a weekday its column;
要対応 a yuzu 「!」 as the tab's, 仮押さえ a yuzu ring;
✕ any stay) in the 保存 draft (未保存); 設定 folded: 施設 (presets; no ★), 詳細, 通知 (per phone).
メニュー: `status.json` (`lib/kalori/status.ts`): 遅れ a day past `next` too; 保留 names `diff.tripped`; ⋯ links only.
