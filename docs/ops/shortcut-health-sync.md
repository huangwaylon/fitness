# Health sync (iOS Shortcut)

Each iPhone sends its daily steps, exercise minutes, active energy, stand minutes, weight, body fat percentage, BMI and
lean body mass to the sheet whenever
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
  "weight": "0\n68.4\n…",
  "body_fat": "0\n22.3\n…",
  "bmi": "0\n22.8\n…",
  "lean_mass": "0\n52.1\n…"
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
| `body_fat` | That day's **Body Fat Percentage**, `0` = no sample; a fraction (`0.223`) or a percent (`22.3`, `22.3%`): a value ≤ 1 is read as a fraction; 2–70 % | `body_fat_pct` (%, one decimal) |
| `bmi` | That day's **Body Mass Index**, `0` = no sample; 10–60 | `bmi` (one decimal) |
| `lean_mass` | That day's **Lean Body Mass** in **kg**, `0` = no sample; 10–150 kg | `lean_kg` (one decimal) |

- Lists are optional (at least one); other fields are ignored. A Shortcut without `body_fat`, `bmi` and `lean_mass`
  (set up before they existed) keeps working; add them (§2 steps 8a–8c) to see them in けんこう. A list whose line count differs from `dates` is
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
| 8a | **Find Health Samples** | **Body Fat Percentage** (体脂肪率), same as step 8 → **Value** → `BodyFatValues` (no sample = 0) |
| 8b | **Find Health Samples** | **Body Mass Index** (ボディマス指数), same as step 8 → **Value** → `BMIValues` |
| 8c | **Find Health Samples** | **Lean Body Mass** (除脂肪体重), same as step 8 → **Value** → `LeanValues` |
| 9 | **Get Contents of URL** | the `/exec` URL, **POST**, Request Body **JSON**, each field type **Text**: `key` = Key, `action` = `ingest`, `dates` = Dates, `steps` = StepValues, `steps_watch` = StepWatchValues, `exercise_minutes` = ExValues, `calories` = CalValues, `stand_minutes` = StandValues, `weight` = WeightValues, `body_fat` = BodyFatValues, `bmi` = BMIValues, `lean_mass` = LeanValues |

Every list must use the same range (the last 1 month), **Group by Day** and **Fill Missing** (a day without samples
becomes a `0` line, not a missing one), so it lines up with `dates`. Keep Health's units in **kg** and **kcal** (Lean Body Mass follows the weight unit). Allow
read access to Steps, Exercise Minutes, Active Energy, Stand Time, Body Mass, Body Fat Percentage, Body Mass Index and Lean
Body Mass when asked. Body fat may come through as `0.223` or `22.3` [U: which]; both are read as 22.3 %. Without an Apple Watch, leave
out step 4 and `steps_watch`.

**Test:** tap ▶. Expect `{"ok":true,…}` with no `warnings`.

### Adding body fat, BMI and lean body mass to an existing Shortcut
On each iPhone, open **しまの同期** and:

1. Below the **Body Mass** (体重) query (step 8) and its **Get Details of Health Sample** → **Value**, add **Find Health
   Samples** → Type **Body Fat Percentage** (体脂肪率). Set it up exactly like the Body Mass one: filter **Start Date**
   is in the last **1 month** (the same range as the others), no Source filter, **Group by Day**, **Fill Missing**,
   and the same sort as the others (if they say Sort by Start Date, Oldest First, so does this one).
2. Add **Get Details of Health Sample** on it → **Value**. Rename the variable **BodyFatValues** (or add **Set
   Variable** BodyFatValues).
3. Repeat 1–2 with **Body Mass Index** (ボディマス指数) → **BMIValues**, and with **Lean Body Mass** (除脂肪体重) →
   **LeanValues**.
4. In **Get Contents of URL** (step 9), under Request Body, tap **Add new field** → **Text** three times: key
   `body_fat`, value **BodyFatValues**; key `bmi`, value **BMIValues**; key `lean_mass`, value **LeanValues**. Each
   must be **Text** (not Number or Array), like `weight`.
5. Tap ▶. When asked, allow Shortcuts to read Body Fat Percentage, Body Mass Index and Lean Body Mass. Expect
   `{"ok":true,…}` with no `warnings`. A day without a measurement is `0` and simply has no point in けんこう.

If the scale doesn't write BMI or lean body mass to Health, those lists are all `0`: harmless. To fill the past, run the
§5 baseline with the three new queries set to 84 days too.

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
Duplicate the Shortcut, set the range in steps 2 and 4–8c to the last **84 days**, run it once, delete the copy.
Only this week and last week (until Wednesday 04:00) still earn; older days fill the weight
trend.

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML instead of JSON | Script authorization lapsed: [google-setup §9](google-setup.md#9-day-8-authorization-check) |
| `bad_request`, `…: expected Text` | That field is Number/Array in step 9: make it **Text** |
| `warnings: ["weight: 1 lines but 31 dates…"]` | That list didn't use the same range, **Group by Day** and **Fill Missing** as `dates` (the same for `body_fat`, `bmi`, `lean_mass`) |
| `warnings: ["body_fat: 0.5 on … is outside 2–70…"]` | Body fat came through in an unexpected form: send the `uploads` row's first line to the developer |
| Lean body mass ~2.2× too high, or skipped | Health's weight unit is pounds: set kg |
| `skipped` in the reply | A date or number didn't parse, or was over its max; the `uploads` row shows each field's first line |
| Weight ~2.2× too high | Health's weight unit is pounds: set kg |
| Steps about twice Health's | The Steps query has no Source filter (step 2), or both lists name the same device: one iPhone in step 2, one Watch in step 4 |
| `steps_watch: … lines but … dates` | Step 4 differs from step 2 in range, **Group by Day** or **Fill Missing** |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash one] |
| Nothing arrives | Settings → Health → Data Access & Devices → Shortcuts: allow the eight types |
