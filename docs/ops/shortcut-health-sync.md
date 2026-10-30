# Health sync with iOS Shortcuts

Sends steps, exercise minutes, Move (active energy), stand minutes, workouts and body weight from each iPhone to the Island Fund sheet (through the Apps Script web
app) **every time you open an app you use daily** (e.g. LINE), at most once an hour. Set it up once per phone.

**Why "when I open LINE"?** iOS locks Health data while the phone is locked, so a 3 am timer can't read it. Opening
an app means the phone is unlocked. Background: [ADR 0012](../decisions/0012-shortcuts-health-sync.md); endpoint:
[ADR 0015](../decisions/0015-google-sheet-backend.md). This is step 3 of the setup order in [runbook §1](runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here).

**[U]** = unverified on a real phone (exact action names on iOS 27, whether runs are silent).

## 1. What the Shortcut sends (the one format)
`POST <exec URL>` (the web app URL ending in `/exec`, google-setup.md §4), Request Body **JSON**, no headers. This is
exactly what the user's Shortcut sends (read from the `uploads` log, 2026-10-30): **daily totals, one line per day**,
every list a **Text** field. The parser accepts this and nothing else (`app/gas/parse.ts`).

```json
{
  "key": "<your KEY_A or KEY_B>",
  "action": "ingest",
  "dates": "Sep 30, 2026 at 8:59 AM\nOct 1, 2026 at 7:12 AM\n…",
  "steps": "8564\n13786\n…",
  "exercise_minutes": "22\n0\n…",
  "calories": "249.26\n310.5\n…",
  "stand_minutes": "58\n142\n…",
  "weight": "0\n68.4\n…"
}
```

- **`dates`**: one line per day, Shortcuts' date text (English `Sep 30, 2026 at 8:59 AM` or Japanese
  `2026/09/30 8:59` / `2026年9月30日 午後8:59`). Only the calendar day is used. The other lists line up with it.
- **`steps`, `exercise_minutes`**: that day's totals (Health merges the Watch and the iPhone, so nothing is
  double-counted). Plain digits.
- **`weight`**: that day's Body Mass in **kg**, `0` = no weigh-in. Outside 20–300 kg is skipped. Shown as a trend in
  きろく, **never earns ベル** (ADR 0020).
- **`calories`**: that day's **active energy** in kcal (the Move ring; the log shows ≈ 250 kcal days, not ≈ 2,000
  total). Stored as the metric `move_kcal` (rounded) and earns 🍐 against your Move goal (ADR 0021). Above 10,000 is
  skipped with a warning.
- **`stand_minutes`** (new, ADR 0021): that day's Health **Stand Time** in minutes (Shortcuts doesn't expose the ring's
  Stand *Hours*). Stored as `stand_min`; earns 🍒, goal 180 min. Above 1,440 is skipped with a warning.
- Every daily list is optional (an older Shortcut without `stand_minutes` still works). Any other field: ignored.
- **`workouts`** (optional, not sent yet): `{"types": "…", "starts": "…", "ends": "…", "avgHrs": "…"}`, each Text
  with one line per workout (start/end in the same date text). Without it, strength days come from gym arrivals (§5) and
  workouts added in きろく.
- A list whose line count differs from `dates` is **dropped** and named in `warnings`; the rest is saved. An
  unreadable line is skipped and counted in `skipped`.
- A day's steps, minutes, kcal and stand minutes only ever go up, so re-sending is harmless and a partial day never overwrites a full one
  (a きろく edit can still lower a day in an open week). A day's weight is its latest value: a new row is saved whenever
  it changes.
- Reply: `{"ok":true,"metrics":8,"workouts":0}` (rows actually added), plus `skipped` / `unknownTypes` / `warnings`.
  Errors: `{"ok":false,"error":"unauthorized"|"bad_request"|"too_large"|"busy"|"unavailable"}`.
- **Log:** every run leaves a row in the `uploads` tab with the warnings and the body's **shape** (each field's type,
  line count and first line; never the key). Read your last 20 with `{"key": "…", "action": "uploads"}` (runbook §5):
  this is how a new Shortcut field is checked before the parser learns it.
- Limits: 1 MB per request, 120 requests per key per minute.

## 2. Build the Shortcut (each phone, once)
Shortcuts → **+** → name it **しまの同期** (Island Sync) [U: action names]:

| # | Action | Settings |
|---|---|---|
| 1 | **Text** | your key → rename the variable **Key** |
| 2 | **Find Health Samples** | Type **Steps** (歩数), Start Date in the last **31 days**, **Group by Day** → `Steps` |
| 3 | **Get Details** on `Steps` | **Start Date** → `Dates`; **Value** → `StepValues` |
| 4 | **Find Health Samples** | Type **Exercise Minutes** (エクササイズ時間), same range, **Group by Day** → **Value** → `ExValues` |
| 5 | **Find Health Samples** | Type **Active Energy** (アクティブエネルギー), same range, **Group by Day**, **Fill Missing** → **Value** → `CalValues` |
| 6 | **Find Health Samples** | Type **Stand Time** (スタンド時間), same range (last month), **Group by Day**, **Fill Missing** → **Value** → `StandValues` (minutes) |
| 7 | **Find Health Samples** | Type **Body Mass** (体重), same range, **Group by Day** → **Value** → `WeightValues` (days without a weigh-in come through as 0) |
| 8 | **Get Contents of URL** | the `/exec` URL; **POST**; Request Body **JSON**, fields added directly, each type **Text**: `key` = Key, `action` = `ingest`, `dates` = Dates, `steps` = StepValues, `exercise_minutes` = ExValues, `calories` = CalValues, `stand_minutes` = StandValues, `weight` = WeightValues |

All lists must come from the same 31-day, grouped-by-day range (with **Fill Missing**, so a day with no samples is a 0
line, not a missing one) so they line up with `dates`; a list of a different length is dropped with a warning. Keep
Health's weight unit in **kg** and energy in **kcal**. Allow Health read access for Steps, Exercise Minutes, Active
Energy, Stand Time and Body Mass when asked. **Adding `stand_minutes`** to an existing Shortcut: add step 6 and the
`stand_minutes` field, tap ▶, then check `{"action":"uploads"}` shows `stand_minutes:text[31]` and no warning.

**Test:** tap ▶. The result should be `{"ok":true,…}` with no `warnings`.

## 3. The automation (both phones)
Shortcuts → **Automation** → **+** → **App** → **LINE** (or whatever you open most) → **Is Opened** → **Run
Immediately**, **Notify When Run** off → **Run Shortcut しまの同期**. Optional: **Apple Watch Workout → Ends**.

## 4. Copy to the other phone
An iCloud link carries the Shortcut's text, so **a link to the Shortcut with A's key in it leaks KEY_A** to anyone who
gets the link. Before sharing: Shortcut settings (ⓘ) → **Setup** → **Import Questions** → add a question for the
**Key** Text action in step 1 ("Paste your Island Fund key") [U: menu names]. Then clear the key text, Share →
**Copy iCloud Link** → send it to B. Importing asks B for B's key. Put your own key back afterwards. B then adds the
automation from §3. If a link with a key in it was ever shared, rotate that key (google-setup.md §10).

## 5. Gym Arrive (per phone: one automation per gym)
An arrival at a gym is a 🥥 strength day for the person whose key sent it, on that (Tokyo) date: no question, no
minimum stay, no Leave automation. Arriving twice in a day (or at two gyms) is still one strength day. Build this once
per gym, on each phone (the automations are identical apart from the location and the optional label):

1. Shortcuts → **Automation** → **+** → **Arrive**.
2. **Location** → **Choose** → search the gym → shrink the radius to **100–150 m** → **Done**.
3. Choose **Run Immediately** and turn **Notify When Run** off [U: labels vary by iOS version] → **Next** → **New Blank
   Automation**.
4. Add **Get Contents of URL**: the `/exec` URL; ▸ **Method** **POST**; **Headers** none; **Request Body** **JSON**,
   with these fields, each typed **Text**:

   ```json
   { "key": "<your key>", "action": "gym" }
   ```

   That is the whole request. Two optional fields:
   - `"place"`: any text up to 40 characters (e.g. `エニタイム`), only a label shown in きろく; without it きろく shows
     ジム. It never changes what counts.
   - `"at"`: the true arrival time, so a late or retried run keeps it: add **Current Date** above **Get Contents of URL**,
     then **Format Date** (Date Format **ISO 8601**, **Include Time** on) and use its result as the `at` value. It must
     be an ISO 8601 instant with an offset (`2026-10-30T18:05:00+09:00`); one more than 48 h from the server time is
     ignored.
5. **Done**. Test it with the ▶ button of the **Get Contents of URL** action (in the automation's editor): the reply is
   `{"ok":true}`. That records a **real gym day** for today, so test on a day you go to the gym anyway (or delete the
   row from the sheet's `presence` tab afterwards, then run `resync`).

**Location permission:** Arrive automations need Location Services on for Shortcuts (Settings → Privacy & Security →
Location Services → **Shortcuts** → **While Using the App** or **Always**, with **Precise Location** on) [U: iOS asks on
the first Arrive automation]. If an arrival never fires, check this first. A repeat arrival within 2 minutes is
dropped. The server refuses the old `"action": "presence"` (`bad_request`): replace any old automation with this one.

## 6. One-time baseline (optional)
Duplicate the Shortcut, change the range in steps 2, 4 and 5 to the last **84 days** and run it once.

## 7. Troubleshooting
| Symptom | Fix |
|---|---|
| `unauthorized` | Wrong or rotated key in step 1 |
| HTML instead of JSON | The script's authorization lapsed: google-setup.md §9 |
| `bad_request` with `…: expected Text` | That field is typed Number/Array in step 6: make it **Text** |
| `warnings: ["weight: 1 lines but 31 dates…"]` | That list didn't use the same 31-day **Group by Day** range as `dates` |
| `skipped` in the reply | A date or number didn't parse; `{"action":"uploads"}` shows the first line of each field |
| `unknownTypes: [...]` | A workout name we don't map yet: add it to `WORKOUT_LABELS_JA` in `app/src/lib/contract/labels.ts`, then google-setup.md §11 |
| A weight about 2.2× too high | Health's weight unit is pounds: set it to kg |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash a banner] |
| Nothing arrives | Settings → Health → Data Access → Shortcuts permissions |
| No gym day after arriving | Location permission (§5); the Arrive radius too small for the gym's GPS fix; `bad_request` = an old `presence` body or a `place` over 40 characters |
