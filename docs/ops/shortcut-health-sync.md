# Health sync (iOS Shortcut)

Each iPhone sends its daily activity and body numbers to the record ([backend.md](../backend.md#the-record)) whenever
you open an app you use daily (e.g. LINE): Health is readable only while the phone is unlocked. Set up once per phone.

**[U]** = unverified on a real phone (exact action names, whether runs are silent).

## 1. What the Shortcut sends
`POST` to `https://island-fund-relay.island-fund-relay.workers.dev/api`, Request Body **JSON**, no headers. Daily
totals, one line per day, every field **Text** (`relay/src/parse.ts`):

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
  "body_fat_percentage": "0\n22.3\n…",
  "body_mass_index": "0\n22.8\n…",
  "lean_body_mass": "0\n52.1\n…"
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
| `body_fat_percentage` | That day's **Body Fat Percentage**, `0` = no sample; a fraction (`0.223`) or a percent (`22.3`, `22.3%`): a value ≤ 1 is read as a fraction; 2–70 % | `body_fat_pct` (%, one decimal) |
| `body_mass_index` | That day's **Body Mass Index**, `0` = no sample; 10–60 | `bmi` (one decimal) |
| `lean_body_mass` | That day's **Lean Body Mass** in **kg**, `0` = no sample; 10–150 kg | `lean_kg` (one decimal) |

- Each list is optional (at least one); other fields are ignored. A list whose line count differs from `dates` is
  dropped with a warning; an unreadable or over-max line is skipped.
- Two step lists because Find Health Samples sums every source (one walk would count twice); the server keeps the
  larger per day, close to Health's de-duplicated total.
- Latest wins, so re-sending is harmless ([backend](../backend.md#ingest)).
- Reply: `{"ok":true,"metrics":8}` (rows added), plus `skipped` / `warnings`. Errors: `unauthorized`, `bad_request`
  (with `detail`), `too_large`, `busy`, `unavailable` ([runbook §5](runbook.md#5-when-sync-fails), which also reads
  each run's `uploads` audit row).

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
| 8d | *(optional)* **Repeat with Each** | Blank the Watch's zeros: [below](#a-day-without-the-watch-optional-step-8d) |
| 9 | **Get Contents of URL** | the URL in §1, **POST**, Request Body **JSON**, each field **Text**: `key` = Key, `action` = `ingest`, and each §1 field = its list above |

Every list uses the same range, **Group by Day** and **Fill Missing** (an empty day becomes a `0` line), so it lines
up with `dates`. Health's units in **kg** and **kcal**. Allow read access to all eight types. Without an Apple Watch,
leave out step 4 and `steps_watch`.

**Test:** tap ▶. Expect `{"ok":true,…}` with no `warnings`.

### A day without the Watch (optional step 8d)
**Fill Missing** makes a day the Watch stayed off Move 0, Exercise 0, Stand 0. The app already reads that as no data
([design](../design.md#kenkou)); this step makes the record say so too: an **empty line** instead of `0` for those
three (no row; counted under `skipped`), only when all three are 0. [U: action names]

1. After step 8c, **Repeat with Each** on `CalValues`. Inside it: **Get Item from List** `ExValues`, **Item at Index**
   = **Repeat Index** → `Ex`; the same on `StandValues` → `Stand`.
2. **If** **Repeat Item** is `0` and `Ex` is `0` and `Stand` is `0` (three nested **If**s, or **Calculate** Repeat Item
   + Ex + Stand and **If** the result is `0`): **Text** with nothing in it → **Add to Variable** `CalOut`, `ExOut`,
   `StandOut`. **Otherwise**: **Add to Variable** Repeat Item → `CalOut`, `Ex` → `ExOut`, `Stand` → `StandOut`.
3. After the repeat, **Combine Text** `CalOut` with **New Lines** → `CalValues`; the same for `ExOut` → `ExValues` and
   `StandOut` → `StandValues` (each list keeps one line per date, so nothing is dropped).
4. Step 9 sends them as before. Tap ▶: on a day without the Watch the reply's `skipped` grows by 3, with no `warnings`.

## 3. The automation
Shortcuts → **Automation** → **+** → **App** → **LINE** (or the app you open most) → **Is Opened** → **Run
Immediately**, **Notify When Run** off → **Run Shortcut しまの同期**. Do this on both phones.

**At most every 10 minutes (recommended):** at the start of しまの同期, **Get File** **shima-last.txt** in the
Shortcuts folder (**Error If Not Found** off) → **Get Time Between Dates** (its text and **Current Date**, minutes) →
**If** under 10, **Stop This Shortcut**. After step 9: **Text** **Current Date** → **Save File** **shima-last.txt**,
**Overwrite** on. [U: action names] Each run sends the whole month, so nothing is lost.

## 4. Copy to the other phone
An iCloud link carries the Shortcut's text, key included. Before sharing: Shortcut settings (ⓘ) → **Setup** →
**Import Questions** → a question for the **Key** Text action [U: menu names]. Clear the key text, Share → **Copy
iCloud Link**, send it, put your key back. The other person answers with their key, re-picks their own iPhone and
Watch in steps 2 and 4, and adds the automation (§3). A link ever shared with a key in it: rotate that key
([runbook §3](runbook.md#3-rotate-a-key)).

## 5. One-time baseline (optional)
Duplicate the Shortcut, set the range in steps 2 and 4–8c to the last **84 days**, run it once, delete the copy.
Only this week and last week (until Wednesday 04:00) still earn; older days fill the weight trend.

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML instead of JSON, or `not found` | The URL in step 9 is wrong: exactly `https://island-fund-relay.island-fund-relay.workers.dev/api` (§1) |
| `bad_request`, `…: expected Text` | That field is Number/Array in step 9: make it **Text** |
| `warnings: ["<list>: 1 lines but 31 dates…"]` | That list (or step 4's) didn't use the same range, **Group by Day** and **Fill Missing** as `dates` |
| `warnings: ["body_fat_percentage: 0.5 on … is outside 2–70…"]` | Body fat came through in an unexpected form: send the `uploads` row's first line to the developer |
| `skipped` in the reply | A date or number didn't parse, or was over its max; the `uploads` row shows each field's first line |
| Weight or lean body mass ~2.2× too high (or skipped) | Health's weight unit is pounds: set kg |
| Steps about twice Health's | The Steps query has no Source filter (step 2), or both lists name the same device: one iPhone in step 2, one Watch in step 4 |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash one] |
| Nothing arrives | Settings → Health → Data Access & Devices → Shortcuts: allow the eight types |
| `calories: … lines but … dates` after step 8d | An empty item was dropped from a list: each pass of the repeat must add one item to each `…Out` (the empty **Text** too) |
| 健康 shows 記録なし for Move on a day I wore the Watch | Move, Exercise and Stand were all 0 that day (the Watch hadn't synced to the iPhone yet): the next run fixes it |
