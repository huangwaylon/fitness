# Health sync with iOS Shortcuts

Sends steps, exercise minutes and workouts from each iPhone to the Island Fund sheet (through the Apps Script web
app) **every time you open an app you use daily** (e.g. LINE), at most once an hour. Set it up once per phone.

**Why "when I open LINE"?** iOS locks Health data while the phone is locked, so a 3 am timer can't read it. Opening
an app means the phone is unlocked. Background: [ADR 0012](../decisions/0012-shortcuts-health-sync.md); endpoint:
[ADR 0015](../decisions/0015-google-sheet-backend.md). This is step 3 of the setup order in [runbook §1](runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here).

**[U]** = unverified on a real phone (exact action names on iOS 27, whether runs are silent).

## 1. What the Shortcut sends
`POST <exec URL>` (the web app URL ending in `/exec`, google-setup.md §4). **No `Authorization` header**: the key goes
in the body. Request Body **JSON** (Apps Script reads the raw text, so **Text** containing the JSON works too):

```json
{
  "key": "<your KEY_A or KEY_B>",
  "action": "ingest",
  "dates": "Oct 28, 2026 at 7:05 AM\nOct 28, 2026 at 7:40 AM\n…",
  "steps": "312\n1204\n…",
  "exercise_minutes": "1\n0\n…",
  "workouts": { "types": ["伝統的な筋力トレーニング"], "starts": ["…"], "ends": ["…"], "avgHrs": ["118"] }
}
```

- `dates`/`steps`/`exercise_minutes` are parallel lists (one line per Health sample, or JSON arrays); values on the
  same day are added up. Dates may be ISO, `2026/10/28 7:05` or Shortcuts' default format. `workouts` is optional.
- Other accepted shapes (series `{"steps":{"values","starts"}}`, `{"days":[…]}`): see `app/gas/parse.ts`.
- A day's numbers from the Shortcut only ever go up, so a partial first day can't overwrite a full one, and re-sending is harmless. (A きろく edit can still lower a day in an open week.)
- Reply: `{"ok":true,"metrics":4,"workouts":1}` (rows actually added), plus `skipped` / `unknownTypes` when relevant.
  Errors: `{"ok":false,"error":"unauthorized"|"bad_request"|"too_large"|"busy"|"unavailable"}`.
- Limits: 1 MB per request, 120 requests per key per minute. Every run leaves an audit row in the `uploads` tab.

## 2. Build the Shortcut (iPhone A, once, about 15 min)
Shortcuts → **+** → name it **しまの同期** (Island Sync). Actions in order [U: names]:

| # | Action | Settings |
|---|---|---|
| 1 | **Text** | your key → rename the variable **Key** |
| 2 | **Get Value** (iOS 27 storage) [U] | key `island.lastSync` → **Last** |
| 3 | **If** Last *is after* **Adjust Date** (Current Date − 60 minutes) → **Stop This Shortcut** | hourly throttle |
| 4 | **Adjust Date**: Current Date, *Get Start of Day*, − 1 day → **From** | start of **yesterday** |
| 5 | **Find Health Samples** | Type **Steps** (歩数), Start Date *is after* **From** → **StepSamples** |
| 6 | **Get Details** on StepSamples | **Start Date** → `StepDates`; **Value** → `StepValues` |
| 7 | **Find Health Samples** + **Get Details** | Type **Exercise Minutes** (エクササイズ時間), same range → `ExValues` (and its dates) [U] |
| 8 | **Find Health Samples** + **Get Details** | Type **Workouts** → `WTypes`, `WStarts`, `WEnds`, `WHr` (Average Heart Rate, if offered [U]) |
| 9 | **Dictionary** | `key` = **Key**, `action` = `ingest`, `dates` = StepDates, `steps` = StepValues, `exercise_minutes` = ExValues, `workouts` = {`types`, `starts`, `ends`, `avgHrs`} |
| 10 | **Get Contents of URL** | URL = the `/exec` URL; Method **POST**; Request Body **JSON** = the Dictionary; no headers |
| 11 | **If** the result's `ok` is true → **Set Value** `island.lastSync` = Current Date | throttle only after a success |

If steps and exercise samples have different dates, send exercise as a second request with its own `dates` (or use
the series shape). Allow Health read access for Steps, Exercise Minutes and Workouts when asked.

**Test:** tap ▶. The result should be `{"ok":true,…}`; a new line appears in the `uploads` tab.

## 3. The automation (both phones)
Shortcuts → **Automation** → **+** → **App** → **LINE** (or whatever you open most) → **Is Opened** → **Run
Immediately**, **Notify When Run** off → **Run Shortcut しまの同期**. Optional: **Apple Watch Workout → Ends**.

## 4. Copy to the other phone
Share → **Copy iCloud Link** → send it to B. B changes only **Key** (B's key), then adds the automation from §3.

## 5. Gym Arrive/Leave (optional, per phone)
Shortcuts → Automation → **Arrive** at the gym address → **Run Immediately** → **Get Contents of URL**: the `/exec`
URL, **POST**, Request Body **JSON**:

```json
{ "key": "<your key>", "action": "presence", "place": "anytime", "event": "arrive" }
```

Duplicate it as a **Leave** automation with `"event": "leave"`. Place keys (`app/src/lib/config/places.ts`):
`anytime` (A), `pt_studio` and `anytime_b` (B). An optional `"at"` (ISO time) back-dates the event. After a visit of
30 minutes or more with no Watch strength workout, the app asks 「…は筋トレでしたか？」 on 島.

## 6. One-time baseline (optional)
Duplicate the Shortcut, change step 4 to **− 84 days** and run it once. Over 1 MB? Run it in chunks of a few weeks.

## 7. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML instead of JSON | The script's authorization lapsed: google-setup.md §9 |
| `bad_request` | The body isn't JSON, or `action` is missing/misspelled |
| `skipped` in the reply | Some dates or numbers didn't parse; the `uploads` tab notes how many |
| `unknownTypes: [...]` | A workout name we don't map yet: add it to `WORKOUT_LABELS_JA` in `app/src/lib/contract/labels.ts` (the parser inverts it), then google-setup.md §11 |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash a banner] |
| Nothing arrives | Settings → Health → Data Access → Shortcuts permissions |
