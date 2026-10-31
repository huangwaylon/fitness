# けんこう: team discussion and review (2026-10-31)

The user asked for a new panel tab with the Health data over time and its trends, for their personal trainer. Roles:
**UX** (UX designer), **Game** (game/UI designer, owns the Animal Crossing look), **Viz** (data-visualisation
specialist), **PT** (the personal trainer, the reviewing user). Decisions are recorded in
[decisions.md](../../decisions.md) ("Health trends", "きろく is earnings only") and [design.md](../../design.md#kenkou).

## Discussion

**Name and place.** Game: 「けんこう」 in the game's hiragana voice, between きろく and せってい; three pills share the row
(flex, no fixed 112px). UX: the weight trend in きろく would now be said twice: move it here, keep its goal ✎ in きろく's
目標 card (one place to set both goals).

**What a trainer needs.** PT: per metric the daily average, how often the goal is met, the best day and whether it's
going up or down against the previous block; exact numbers with units, and I must know when a number is missing rather
than zero. Viz: then "missing" must be a rule, not a guess at render: no row, 0 steps, or a Watch day with Move,
Exercise and Stand all 0 is *no record* (the Shortcut sends zeros when the Watch sat on its charger). Left out of every
average, goal count and change; counted and shown as 記録なし; the header says 「1日の平均（記録のある日）」. Today is
running: draw it outlined, never count it.

**Periods.** UX: 1週 / 1か月 / 3か月 / 1年 / すべて as one segmented row; one period for all charts, so the cards stay
comparable while scrolling. Viz: 60 paired daily bars at 320px are 2px wide: bucket by week at 3か月 (13) and by calendar
month at 1年 and すべて, each bucket the daily average of its recorded days; colour depth = share of goal days. PT: the
previous period must be the same length, or the % means nothing. Rolling windows end on the last day shown (today until
‹), 1年 by calendar months.

**Navigation.** UX: ‹ › around a large range label, きょう to come back, and the row stays sticky so the range is always
in view. Horizontal drag on any chart turns the page (right = older, as a calendar), vertical drag scrolls the panel
(`touch-action: pan-y`; a drag never opens a callout). Tap a bar → its numbers for both of us inside the chart, on the
side away from the bar.

**Look.** Game: cards, tokens, pills and the fruit icons as elsewhere; no chart library. Viz: one hue per person,
fixed by entity: blue for ウェイ, orange for うめ; validated (CVD ΔE 21, ≥ 3:1 on the card, a lighter pair at night);
identity also by the avatar swatch and side-by-side order, never colour alone; text stays ink. Goal dashed, 7-day line
with a card-colour halo. Weight: small multiples, each person on their own axis.

**Summary and export.** The user asked for a 今週と 先週 card at the top: both of us, calendar weeks (Mon–Sun, the
app's week; the Wednesday lock is the economy's only), this week over its finished days, last week, the change, goal
days. It is the one summary card (no second "period summary"). The user decided against copying a text/CSV summary.

**Performance.** One daily series per model and day (memoised), stats are linear scans; the tab is its own chunk.

## Review pass (screenshots at 375×667, 390×844, 320×568; `?demo&weeks=60` and `?demo&weeks=4`)

- PT: a week bar above the goal looked "missed" when pale. Fixed: for weeks and months the key reads 「こいほど 目標達成の
  日が 多い」 instead of met / not met.
- PT: 「記録なし 57日」 in the 1-month demo: weight history started weeks before activity. Fixed: missing days count
  from the first *activity* record.
- UX: the tap callout floated above the chart, under the sticky range row. Fixed: it sits inside the plot, on the side
  away from the bar, and a tap scrolls the chart clear of the row.
- Viz: the weight goal 3 kg below the data flattened the line. Fixed: a far goal becomes an edge label 「目標 66.0 ↓」.
- UX: 「2024/10–2026/10」 overflowed beside the buttons at 320. Fixed: the range wraps after its dash.
- Game: 「エクササイズ」 truncated in the week card at 320. Fixed: fixed column widths, units under the names.
- Game: the weight goal in the person header repeated the chart's goal label: removed.
- Measured at 4× CPU, two years of data: opening the tab ~170 ms (one 70 ms task), a period switch or page turn
  ~100 ms with no long task; no horizontal scroll at 320.

## Open questions for the user

- Should a day with steps but no Watch count against the 歩数 goal days? (Now: steps from the phone still count.)
- 1年 by calendar month, or 52 weekly bars when one person is shown?
