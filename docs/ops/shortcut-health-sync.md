# Health sync with iOS Shortcuts

Sends steps, exercise minutes, workouts and body weight from each iPhone to the Island Fund sheet (through the Apps Script web
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
  "steps_sources": "Waylon's Apple Watch\nWaylon's iPhone\n…",
  "exercise_dates": "Oct 28, 2026 at 7:05 AM\n…",
  "exercise_minutes": "1\n…",
  "exercise_sources": "Waylon's Apple Watch\n…",
  "workouts": { "types": ["伝統的な筋力トレーニング"], "starts": ["…"], "ends": ["…"], "avgHrs": ["118"] },
  "weight_dates": "Oct 28, 2026 at 7:02 AM\nOct 29, 2026 at 6:58 AM\n…",
  "weights": "68.4 kg\n68.2 kg\n…",
  "weight_sources": "Withings\nWithings\n…"
}
```

- `dates`/`steps`/`steps_sources` are parallel lists (one line per Health sample, or JSON arrays), and so are
  `exercise_dates`/`exercise_minutes`/`exercise_sources`. Exercise samples come from their own Health query, so they
  need their **own dates**: without `exercise_dates` the minutes are paired with `dates`, which is only right if
  both lists happen to line up. Values on the same day are added up **per source**, and the larger source wins: the
  Watch and the iPhone both count steps, and summing them would double-pay (the `*_sources` lists are optional, but
  without them everything is summed). Dates may be ISO, `2026/10/28 7:05` or Shortcuts' default format.
  `workouts` is optional.
- **Weight (ADR 0020):** `weight_dates`/`weights`/`weight_sources` are the parallel lists of Health **Body Mass**
  samples (optional; `weight_sources` too). A day's weight is the **first sample of that day** (the morning weigh-in);
  later ones that day are ignored. Values are kg with one decimal: `68.4`, `68.4 kg` and `68,4` all work; pounds only
  when marked (`150.8 lb`); an unmarked number is kg. Anything outside 20–300 kg is skipped. Weight is shown as a
  trend in きろく and **never earns ベル**. Without these fields nothing changes.
- A list whose length differs from its dates (or sources) is **dropped** and named in `warnings`, and the rest is
  still saved: a broken exercise list never costs the steps.
- Other accepted shapes (series `{"steps":{"values","starts"}}`, `{"days":[…]}`): see `app/gas/parse.ts`.
- A day's steps and minutes from the Shortcut only ever go up, so a partial first day can't overwrite a full one, and re-sending is harmless. (A きろく edit can still lower a day in an open week.) **Weight is the exception:** a day's weight is its latest row, and a new row is saved whenever the day's first sample changes (up or down), e.g. after you delete a wrong reading in Health.
- Reply: `{"ok":true,"metrics":4,"workouts":1}` (rows actually added), plus `skipped` / `unknownTypes` / `warnings`
  when relevant.
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
| 6 | **Get Details** on StepSamples | **Start Date** → `StepDates`; **Value** → `StepValues`; **Source** → `StepSources` [U: name of the detail] |
| 7 | **Find Health Samples** + **Get Details** | Type **Exercise Minutes** (エクササイズ時間), same range → **Start Date** → `ExDates`, **Value** → `ExValues`, **Source** → `ExSources` [U] |
| 8 | **Find Health Samples** + **Get Details** | Type **Workouts** → `WTypes`, `WStarts`, `WEnds`, `WHr` (Average Heart Rate, if offered [U]) |
| 9 | **Find Health Samples** + **Get Details** ×3 | Type **Body Mass** (体重), same range (Start Date *is after* **From**) → **WeightSamples**; then three **Get Details of Health Samples** on WeightSamples: **Start Date** → `WeightDates`, **Value** → `WeightValues`, **Source** → `WeightSources` [U] |
| 10 | **Get Contents of URL** | URL = the `/exec` URL; Method **POST**; no headers; Request Body **JSON**, with the fields added directly (no Dictionary action): `key` = **Key**, `action` = `ingest`, `dates` = StepDates, `steps` = StepValues, `steps_sources` = StepSources, `exercise_dates` = ExDates, `exercise_minutes` = ExValues, `exercise_sources` = ExSources, `workouts` = {`types`, `starts`, `ends`, `avgHrs`}, `weight_dates` = WeightDates, `weights` = WeightValues, `weight_sources` = WeightSources |
| 11 | **If** the result's `ok` is true → **Set Value** `island.lastSync` = Current Date | throttle only after a success |

**Adding weight to the Shortcut you already have** (about 3 minutes; nothing else changes):
1. Below the exercise/workout actions, add **Find Health Samples**. Tap *Type* → **Body Mass** (体重). Add the filter
   **Start Date** *is after* the same **From** variable the step query uses (start of yesterday). Leave Sort/Limit off.
2. Add **Get Details of Health Samples** → detail **Start Date**, input = the Find result. Long-press its output →
   **Rename** → `WeightDates`.
3. Add two more **Get Details of Health Samples** on the same Find result: **Value** → `WeightValues`, and **Source** →
   `WeightSources` [U: the detail's name].
4. Open **Get Contents of URL** → *Request Body* (JSON) → **Add new field** three times, each type **Text**:
   `weight_dates` = `WeightDates`, `weights` = `WeightValues`, `weight_sources` = `WeightSources`. (Text fields
   send each list as one line per sample, which is what the script expects.)
5. Run it once. When asked, allow Shortcuts to read **Body Mass**. The reply should be `{"ok":true,…}` with no
   `warnings`, and きろく → からだ → 体重のながれ shows your weigh-ins after the next sync.

A day with no weigh-in sends empty lists: that's fine. All three weight lists must come from the same Find result, so
their counts always match (a mismatch drops only the weights, with a warning).

Each list must come from the same **Get Details** chain as its partner (StepDates with StepValues and StepSources,
ExDates with ExValues and ExSources), so the counts always match. **Never** pair ExValues with StepDates. Allow
Health read access for Steps, Exercise Minutes, Workouts and Body Mass when asked.

**Check on the device once [U]:** run it, then look at the reply: no `warnings`, and on a day you wore the Watch the
`metrics` tab's steps should be close to the Health app's figure (not about double).

**Test:** tap ▶. The result should be `{"ok":true,…}`; a new line appears in the `uploads` tab.

## 3. The automation (both phones)
Shortcuts → **Automation** → **+** → **App** → **LINE** (or whatever you open most) → **Is Opened** → **Run
Immediately**, **Notify When Run** off → **Run Shortcut しまの同期**. Optional: **Apple Watch Workout → Ends**.

## 4. Copy to the other phone
An iCloud link carries the Shortcut's text, so **a link to the Shortcut with A's key in it leaks KEY_A** to anyone who
gets the link. Before sharing: Shortcut settings (ⓘ) → **Setup** → **Import Questions** → add a question for the
**Key** Text action in step 1 ("Paste your Island Fund key") [U: menu names]. Then clear the key text, Share →
**Copy iCloud Link** → send it to B. Importing asks B for B's key. Put your own key back afterwards. B then adds the
automation from §3. If a link with a key in it was ever shared, rotate that key (google-setup.md §10).

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
| `warnings` in the reply | A list's length differs from its dates (e.g. exercise paired with the step dates): fix step 10 |
| Steps about double the Health app | `steps_sources` missing in step 10 |
| `unknownTypes: [...]` | A workout name we don't map yet: add it to `WORKOUT_LABELS_JA` in `app/src/lib/contract/labels.ts` (the parser inverts it), then google-setup.md §11 |
| A banner every time LINE opens | **Notify When Run** off [U: iOS may still flash a banner] |
| `warnings: ["weight: …"]` | `weight_dates`, `weights` and `weight_sources` came from different Find results: use one Body Mass Find for all three |
| No weight in きろく | Settings → Health → Data Access → Shortcuts → allow **Body Mass**; check the scale app writes to Health |
| A weight about 2.2× too high | The value came through as an unmarked pound figure: set Health → Body Measurements → Weight unit to kg, or keep the unit text in the value (`150.8 lb`) |
| Nothing arrives | Settings → Health → Data Access → Shortcuts permissions |
