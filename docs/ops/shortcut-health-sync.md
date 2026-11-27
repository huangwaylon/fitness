# Health sync (iOS Shortcut)

Each iPhone sends its daily activity and body numbers to the record ([backend.md](../backend.md#ingest)) whenever an
app used daily (LINE) opens: Health is readable only while unlocked. Set up once per phone. **[U]** = unverified on a
real phone.

## 1. What the Shortcut sends
`POST https://island-fund-relay.island-fund-relay.workers.dev/api`, Request Body **JSON**, no headers: `key` (`KEY_A`
or `KEY_B`), `action` = `ingest`, and daily totals as **Text**, one line per day (`relay/src/parse.ts` header: an
example body).

| Field | Content (bounds) | Stored as |
|---|---|---|
| `dates` | Shortcuts' date text, English or Japanese; only the day is used | each row's `date` |
| `steps` | steps from **this iPhone** (Source filter); ≤ 100,000 | `steps` = max(`steps`, `steps_watch`) |
| `steps_watch` | steps from **this Apple Watch**; optional | merged into `steps` |
| `exercise_minutes` | Exercise Minutes; ≤ 1,440 | `exercise_min` |
| `calories` | **Active Energy** kcal (Move); ≤ 10,000 | `move_kcal` |
| `stand_minutes` | **Stand Time** minutes; ≤ 1,440 | `stand_min` |
| `weight` | Body Mass **kg**, `0` = none; 20–300 | `weight` |
| `body_fat_percentage` | `0` = none; a fraction (`0.223`) or percent (`22.3`); 2–70 % | `body_fat_pct` |
| `body_mass_index` | `0` = none; 10–60 | `bmi` |
| `lean_body_mass` | **kg**, `0` = none; 10–150 | `lean_kg` |

Lists are optional (at least one); a list whose length differs from `dates` is dropped with a warning. Two step lists
because Find Health Samples sums every source. Re-sending is harmless. Reply `{"ok":true,"metrics":8}` plus `skipped`
/ `warnings`; errors: [runbook §5](runbook.md#5-when-sync-fails).

## 2. Build the Shortcut
Shortcuts → **+** → **しまの同期** [U: action names]:

| # | Action | Settings |
|---|---|---|
| 1 | **Text** | your key, variable **Key** |
| 2 | **Find Health Samples** | **Steps** (歩数), Start Date in the last **1 month**, **Source** **this iPhone**; **Group by Day**, **Fill Missing** |
| 3 | **Get Details of Health Sample** on 2 | **Start Date** → `Dates`; again, **Value** → `StepValues` |
| 4 | **Find Health Samples** | Steps, **Source** **this Apple Watch** → `StepWatchValues` (no Watch: skip) |
| 5–7 | **Find Health Samples** | **Exercise Minutes** → `ExValues`; **Active Energy** → `CalValues`; **Stand Time** → `StandValues` |
| 8 | **Find Health Samples** | **Body Mass** → `WeightValues`; **Body Fat Percentage** → `BodyFatValues`; **BMI** → `BMIValues`; **Lean Body Mass** → `LeanValues` |
| 8d | *(optional)* | [A day without the Watch](#a-day-without-the-watch-optional-step-8d) |
| 9 | **Get Contents of URL** | the §1 URL, **POST**, Body **JSON**, each field **Text**: `key` = Key, `action` = `ingest`, each §1 field = its list |

Every list: the same range, **Group by Day**, **Fill Missing**; units **kg**, **kcal**. Test: ▶ gives `{"ok":true,…}`
with no `warnings`.

### A day without the Watch (optional step 8d)
The app already reads all-zero Move, Exercise and Stand as no data; this sends an **empty line** instead [U]:
**Repeat with Each** on `CalValues` (with `ExValues` / `StandValues` at **Repeat Index**); if all three are `0` add an
empty Text to `CalOut`, `ExOut`, `StandOut`, otherwise the values; after the repeat **Combine Text** each with **New
Lines** back into the lists. Such a day's reply `skipped` grows by 3.

## 3. The automation
**Automation** → **+** → **App** → **LINE** → **Is Opened** → **Run Immediately**, **Notify When Run** off → **Run
Shortcut しまの同期**. Optional throttle: **Get File** `shima-last.txt`; under 10 minutes ago, **Stop This Shortcut**;
after step 9 **Save File** **Current Date** there. [U]

## 4. Copy to the other phone
ⓘ → **Setup** → **Import Questions** → a question for the **Key** Text [U]. Clear the key, **Copy iCloud Link**, send
it, put your key back. The other person answers with their key, re-picks their devices in steps 2 and 4, adds §3. A
link ever shared with a key in it: rotate that key ([runbook §3](runbook.md#3-rotate-a-key)).

## 5. One-time baseline (optional)
A copy with every range at **84 days**, run once. Only this and last week earn.

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML, or `not found` | Wrong URL in step 9 |
| `…: expected Text` | Make that field **Text** in step 9 |
| `<list>: 1 lines but 31 dates` | That list differs in range, **Group by Day** or **Fill Missing** |
| `skipped`, body-fat warnings | The `uploads` row shows each field's first line |
| Weight ~2.2× too high | Health's unit is pounds: set kg |
| Steps about twice Health's | No Source filter, or both lists name the same device |
| Nothing arrives | Settings → Health → Data Access & Devices → Shortcuts: allow the eight types |
| 記録なし for Move on a Watch day | The Watch hadn't synced yet: the next run fixes it |
