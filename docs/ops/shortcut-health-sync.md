# Health sync (iOS Shortcut)

Each iPhone sends its daily steps, exercise minutes, active energy, stand minutes and weight to the sheet whenever
you open an app you use daily (e.g. LINE): Health is readable only while the phone is unlocked. Once per phone.

**[U]** = unverified on a real phone (exact action names, whether runs are silent).

## 1. What the Shortcut sends
`POST` to the `/exec` URL ([google-setup §4](google-setup.md#4-deploy-the-web-app)), Request Body **JSON**, no
headers. Daily totals, one line per day, every field **Text**. The parser (`app/gas/parse.ts`) accepts only this:

```json
{
  "key": "<KEY_A or KEY_B>",
  "action": "ingest",
  "dates": "Sep 30, 2026 at 8:59 AM\nOct 1, 2026 at 7:12 AM\n…",
  "steps": "8564\n13786\n…",
  "steps_watch": "9120\n12950\n…",
  "exercise_minutes": "22\n0\n…",
  "calories": "249.26\n310.5\n…",
  "stand_minutes": "58\n142\n…",
  "weight": "0\n68.4\n…"
}
```

| Field | Content | Stored as |
|---|---|---|
| `dates` | Shortcuts' date text, English (`Sep 30, 2026 at 8:59 AM`) or Japanese (`2026/09/30 8:59`, `2026年9月30日 午後8:59`). Only the calendar day is used | (the `date` of each row) |
| `steps` | That day's steps recorded by **this iPhone** (Source filter), plain digits; max 100,000 | `steps` = max(`steps`, `steps_watch`) |
| `steps_watch` | That day's steps recorded by **this Apple Watch** (Source filter), plain digits; max 100,000. Optional: without it, `steps` is stored as sent | (merged into `steps`) |
| `exercise_minutes` | That day's Exercise Minutes; max 1,440 | `exercise_min` |
| `calories` | That day's **Active Energy** in kcal (the Move ring, not total); rounded; max 10,000 | `move_kcal` |
| `stand_minutes` | That day's **Stand Time** in minutes; max 1,440 | `stand_min` |
| `weight` | That day's Body Mass in **kg**, `0` = no weigh-in; 20–300 kg | `weight` |

- Lists are optional (at least one); other fields are ignored. A list whose line count differs from `dates` is
  dropped with a warning; an unreadable or over-max line is skipped.
- Why two step lists: Find Health Samples adds up every source's samples, so the iPhone's and the Watch's steps of the
  same walk would count twice (Health's own total de-duplicates them; Shortcuts doesn't). Move, Exercise and Stand
  are not affected. The server keeps the larger of the two per day, which is close to Health's total.
- Latest wins: each run replaces a day's values with Health's current totals (up or down), so re-sending is harmless
  and a corrected day is fixed by the next run. A locked week's ベル (after its Wednesday 04:00) never move.
- Reply: `{"ok":true,"metrics":8}` (rows added), plus `skipped` / `warnings`. Errors: `unauthorized`,
  `bad_request` (with a `detail`), `too_large` (over 1 MB), `busy` (lock, or over 120 requests/min), `unavailable`.
- Every run leaves a row in the `uploads` tab ([runbook §6](runbook.md#6-when-sync-fails)).

## 2. Build the Shortcut
Shortcuts → **+** → name it **しまの同期** [U: action names]:

| # | Action | Settings |
|---|---|---|
| 1 | **Text** | your key → rename the variable **Key** |
| 2 | **Find Health Samples** | **Steps** (歩数), filters: **Start Date** is in the last **1 month** and **Source** is **this iPhone** (the Source list names devices, e.g. *ウェイのiPhone*); **Group by Day**, **Fill Missing** |
| 3 | **Get Details of Health Sample** on step 2 | **Start Date** → `Dates`; again, **Value** → `StepValues` |
| 4 | **Find Health Samples** | **Steps** again, the same as step 2 but **Source** is **this Apple Watch** (e.g. *ウェイのApple Watch*) → **Get Details** **Value** → `StepWatchValues` |
| 5 | **Find Health Samples** | **Exercise Minutes** (エクササイズ時間), same range and options, no Source filter → **Value** → `ExValues` |
| 6 | **Find Health Samples** | **Active Energy** (アクティブエネルギー), same → **Value** → `CalValues` |
| 7 | **Find Health Samples** | **Stand Time** (スタンド時間), same → **Value** → `StandValues` |
| 8 | **Find Health Samples** | **Body Mass** (体重), same → **Value** → `WeightValues` (no weigh-in = 0) |
| 9 | **Get Contents of URL** | the `/exec` URL, **POST**, Request Body **JSON**, each field type **Text**: `key` = Key, `action` = `ingest`, `dates` = Dates, `steps` = StepValues, `steps_watch` = StepWatchValues, `exercise_minutes` = ExValues, `calories` = CalValues, `stand_minutes` = StandValues, `weight` = WeightValues |

Every list must use the same range (the last 1 month), **Group by Day** and **Fill Missing** (a day without samples
becomes a `0` line, not a missing one), so it lines up with `dates`. Keep Health's units in **kg** and **kcal**. Allow
read access to Steps, Exercise Minutes, Active Energy, Stand Time and Body Mass when asked. Without an Apple Watch, leave
out step 4 and `steps_watch`.

**Adding the Watch's steps to an existing Shortcut** (each phone, with its own devices) [U: menu names]:
1. Open しまの同期 → the **Find Health Samples: Steps** action → **Add Filter** → **Source** → **is** → pick this
   iPhone by name. Keep Start Date in the last 1 month, Group by Day and Fill Missing as they are.
2. Long-press that action → **Duplicate**. In the copy change Source to this Apple Watch (by name), and drag it below
   the first Steps' two **Get Details** actions (they keep reading the iPhone's samples). Under the copy add **Get
   Details of Health Sample** → **Value**, its input the copy's Health Samples; rename that variable `StepWatchValues`.
3. **Get Contents of URL** → **Add new field** → **Text**: key `steps_watch`, value `StepWatchValues`.
4. Tap ▶: the reply has no `warnings`, and きょう's steps match Health's.

**Test:** tap ▶. Expect `{"ok":true,…}` with no `warnings`.

## 3. The automation
Shortcuts → **Automation** → **+** → **App** → **LINE** (or the app you open most) → **Is Opened** → **Run
Immediately**, **Notify When Run** off → **Run Shortcut しまの同期**. Do this on both phones.

## 4. Copy to the other phone
An iCloud link carries the Shortcut's text, so a link with your key in it leaks the key. Before sharing: Shortcut
settings (ⓘ) → **Setup** → **Import Questions** → add a question for the **Key** Text action ("Paste your Island
Fund key") [U: menu names]. The Source filters (steps 2 and 4) name your own iPhone and Watch: the other person
re-picks theirs in both after importing. Clear the key text, Share → **Copy iCloud Link**, send it. Importing asks the other
person for their key. Put your own key back, and they add the automation (§3). If a link with a key in it was ever
shared, rotate that key ([runbook §4](runbook.md#4-rotate-a-key)).

## 5. One-time baseline (optional)
Duplicate the Shortcut, set the range in steps 2 and 4–8 to the last **84 days**, run it once, delete the copy.
Only this week and last week (until Wednesday 04:00) still earn; older days fill the weight
trend.

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML instead of JSON | Script authorization lapsed: [google-setup §9](google-setup.md#9-day-8-authorization-check) |
| `bad_request`, `…: expected Text` | That field is Number/Array in step 9: make it **Text** |
| `warnings: ["weight: 1 lines but 31 dates…"]` | That list didn't use the same range, **Group by Day** and **Fill Missing** as `dates` |
| `skipped` in the reply | A date or number didn't parse, or was over its max; the `uploads` row shows each field's first line |
| Weight ~2.2× too high | Health's weight unit is pounds: set kg |
| Steps about twice Health's | The Steps query has no Source filter (step 2), or both lists name the same device: one iPhone in step 2, one Watch in step 4 |
| `steps_watch: … lines but … dates` | Step 4 differs from step 2 in range, **Group by Day** or **Fill Missing** |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash one] |
| Nothing arrives | Settings → Health → Data Access & Devices → Shortcuts: allow the five types |
