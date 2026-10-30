# 0020 — Weight trend, never rewarded
**Status:** Accepted (user decision 2026-10-30). Values: `WEIGHT` in `app/src/lib/config/rules.ts`.

**Context.** Both players want to lose about 4 kg or more while gaining muscle before the wedding on 2027-10-08, then
hold it. The scale is the obvious measure. But paying per kilogram rewards crash diets, dehydration and skipping
strength days, and punishes the muscle they are trying to build. A day's weight also swings by 1–2 kg with water and
food, so a raw number shown every day is mostly noise.

## Decision
1. **Show a trend, never pay for it.** Weight earns no ベル, gives no badge and has no weekly goal. It's never read by the
   economy: `model/bells.ts` doesn't import `model/weight.ts`, and weight rows are indexed apart from steps and minutes
   (`State.weights` / `State.weightSets`). `model/weight.test.ts` checks that weight rows, weight edits and goals change
   no view.
2. **Ingest:** the Shortcut sends `weight`, one line per day alongside `dates`: that day's Body Mass in kg as Health
   groups it by day, `0` = no weigh-in (`docs/ops/shortcut-health-sync.md` §1; the one format, amended 2026-10-30
   after the `uploads` log showed what the Shortcut really sends). Outside 20–300 kg is skipped.
3. **Stored** in `metrics` as metric `weight`. A day's steps only ever go up (the max), but a weight goes down too, so
   **the latest row wins**: the server appends a weight row whenever the day's value differs from its last row.
4. **Hand entry:** きろく can log or correct a weight with `metric_set {date, metric:'weight', value}`: 20–300 kg, at most
   one decimal (decimals are allowed for weight only). There's no week lock, because nothing is paid: any day up to
   today. A day's weight is the latest of its ingested rows and edits, so a later *different* value from Health
   replaces an edit, and re-sending the same value doesn't.
5. **Trend:** an exponentially weighted moving average, as in The Hacker's Diet, Libra and Happy Scale. Each day moves
   the trend 10% of the way to that day's weight; a gap of g days weighs the next weigh-in 1 − 0.9^g. The trend is
   seeded with the first weigh-in. Shown per person:
   - the trend in kg;
   - this week's change: the trend minus the trend 7 days before the latest weigh-in;
   - the change since the first weigh-in;
   - the weekly pace: the trend's average change over the last 28 days, from 14 days of data;
   - 12 weeks of daily dots and the trend line.
6. **Goal (optional):** `pref {key:'goalWeight', value: kg | null}` per person, set in きろく. It's drawn as a dashed
   line. When the trend is heading towards it at 0.05 kg a week or more, a month is projected at that pace (if it's
   under 3 years away). Otherwise the wording stays encouraging (「あせらず、ゆっくりいきましょう」), and a goal
   that's been reached says to keep it steady.
7. **Calm UI:** a small 体重のながれ card at the top of きろく's からだ tab (both people, ADR 0016), opening a
   per-person screen. Nothing appears on the island. No red and no "bad week": a change is only a number.

## Consequences
- `Code.js` changes (parser, latest-row ingest for weight, `metric_set` weight validation): **redeploy it**. A
  Shortcut without the weight lists works exactly as before.
- `compactRows` keeps only the newest `weight` row per person and day (never "the largest").
- The goal and the projection are guides, not targets: nothing in the game reacts to them.
