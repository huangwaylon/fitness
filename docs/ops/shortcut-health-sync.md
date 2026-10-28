# Health sync with iOS Shortcuts

Sends steps, exercise minutes and workouts from each iPhone to the Mac **every time you open an app you use daily** (e.g. LINE), at most once an hour. No app to buy and no third party involved. You set it up once per phone; after that, nothing is manual.

**Why "when I open LINE"?** iOS locks Health data while the phone is locked, so a 3 am timer can't read it. Opening an app means the phone is unlocked, so the read always works. Background: [ADR 0012](../decisions/0012-shortcuts-health-sync.md).

Things marked **[U]** are unverified until Phase 0 (exact action names/options on iOS 27, whether runs are silent).

## 0. Before you start (on the Mac, once per phone)

```sh
cd app && npm run token -- A shortcut iphone   # or B; prints isl_… once — keep it for step 2
```
The same token also works for the gym Arrive/Leave Shortcuts.

## 1. What the Shortcut sends

`POST https://island.<tailnet>.ts.net/ingest/shortcut/A` with header `Authorization: Bearer isl_…` and a JSON body:

```json
{
  "steps":    { "values": [312, 1204, …], "starts": ["2026-10-28T07:05:00+09:00", …], "sources": ["Apple Watch", "iPhone", …] },
  "exercise": { "values": [1, 1, …],      "starts": ["…"] },
  "workouts": { "types": ["伝統的な筋力トレーニング", …], "starts": ["…"], "ends": ["…"], "avgHrs": ["118", …] }
}
```

- The lists are just what **Find Health Samples** returns, read out with **Get Details** into lists. There are no Repeat loops, so it runs fast.
- The server totals per day, so Watch + iPhone steps aren't double-counted. It reads `8,123` or `8123 歩`, and dates as ISO or `2026/10/28 7:05`.
- It maps Japanese workout names, and replies with `unknownTypes` for any it doesn't know yet.
- A day's numbers only ever go up, so a partial first day can't overwrite a full one.
- `{"days":[{"date":"2026-10-28","steps":8123,"exerciseMin":34}]}` also works, if you'd rather total on the phone.

The reply is `{"ok":true,"metrics":4,"workouts":2,"status":"ok"}`.

## 2. Build the Shortcut (iPhone A, once, about 15 min)

Shortcuts app → **+** → name it **しまの同期** (Island Sync). Add these actions in order (Japanese UI names in brackets) [U: names]:

| # | Action | Settings |
|---|---|---|
| 1 | **Text** (テキスト) | your `isl_…` token → rename variable **Token** |
| 2 | **Text** | `A` (or `B`) → **Person** |
| 3 | **Get Value** (iOS 27 storage) [U] | key `island.lastSync` → **Last** |
| 4 | **If** Last *is after* **Adjust Date** (Current Date − 60 minutes) → **Stop This Shortcut** | hourly throttle (skip on first run) |
| 5 | **Date** = **Adjust Date**: Current Date, *Get Start of Day*, then − 1 day → **From** | start of **yesterday** |
| 6 | **Find Health Samples** (ヘルスケアサンプルを検索) | Type **Steps** (歩数), Start Date *is after* **From**, Sort by Start Date, no limit → **StepSamples** |
| 7 | **Get Details of Health Sample** ×3 on StepSamples | **Value** → `StepValues`; **Start Date** → **Format Date** (ISO 8601, include time) → `StepStarts`; **Source** → `StepSources` |
| 8 | **Find Health Samples** | Type **Exercise Minutes** (エクササイズ時間) [U: listed under Activity], Start Date after **From** → **ExSamples** |
| 9 | **Get Details** ×2 on ExSamples | **Value** → `ExValues`; **Start Date** → **Format Date** ISO 8601 → `ExStarts` |
| 10 | **Find Health Samples** | Type **Workouts** (ワークアウト), Start Date after **From** → **Workouts** |
| 11 | **Get Details** on Workouts | **Type** → `WTypes`; **Start Date** → Format ISO → `WStarts`; **End Date** → Format ISO → `WEnds`; **Average Heart Rate** if offered [U] → `WHr` |
| 12 | **Dictionary** (辞書) | `steps` → Dictionary {`values`: StepValues, `starts`: StepStarts, `sources`: StepSources}; `exercise` → {`values`: ExValues, `starts`: ExStarts}; `workouts` → {`types`: WTypes, `starts`: WStarts, `ends`: WEnds, `avgHrs`: WHr} (set each list field's type to **Array**) |
| 13 | **Get Contents of URL** (URLの内容を取得) | URL `https://island.<tailnet>.ts.net/ingest/shortcut/` + **Person**; Method **POST**; Headers `Authorization` = `Bearer ` + **Token**; Request Body **File** = Dictionary (or **JSON** with the fields above) |
| 14 | **If** the result's `ok` is true → **Set Value** `island.lastSync` = Current Date | only throttle after a success |

**Format Date on a list:** if Format Date only formats the first item [U], wrap steps 7, 9 and 11 in a **Repeat with Each** loop. It's slower (a few seconds for ~300 step samples), but safe. Dates left unformatted usually still parse; check the reply's `status` is `ok`, not `partial`.

Settings (ⓘ) → **Privacy** → allow Health read access for Steps, Exercise Minutes and Workouts when asked. Turn on **Allow Running When Locked** too: it doesn't help Health reads, but it avoids a prompt.

**Test:** tap ▶. The last result should show `"ok":true`. On the Mac, `sqlite3 data/island.db "select * from raw_payload order by id desc limit 1"`, or watch your fruit move in the app.

## 3. The automation (both phones)

Shortcuts → **Automation** → **+** → **App** (アプリ) → choose **LINE** (or whatever you open most) → **Is Opened** → **Run Immediately** → turn **Notify When Run** off → action: **Run Shortcut しまの同期**.

Optional extras:
- A second automation on **Apple Watch Workout → Ends**, which sends right after training. It only works if the phone happens to be unlocked then.
- **Charger → Is Connected** at bedtime, which works if you charge while the phone is still unlocked.

## 4. Copy to the other phone

On phone A: share the Shortcut → **Copy iCloud Link** → send it to B. B opens it, adds it, and changes just **Token** (B's token) and **Person** (`B`), then creates the automation from step 3.

## 5. One-time baseline (optional)

Duplicate the Shortcut and change step 5 to **− 84 days**, then run it once. The server accepts big bodies (20 MB) and totals per day. (With calibration we don't strictly need it.)

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Reply `401` | Wrong or revoked token. Make one with `npm run token -- A shortcut …` |
| Reply `422 unparseable` | Look at `detail`; the raw body is saved in `raw_payload` for inspection |
| `status: partial` | Some dates or numbers didn't parse. Add Format Date (ISO 8601) |
| `unknownTypes: [...]` | A workout name we don't map yet. Add it to `app/src/lib/server/ingest/workout-names.ts` |
| A banner every time LINE opens | Check **Notify When Run** is off [U: iOS may still show a brief banner] |
| Nothing arrives | Health permissions for the Shortcut (Settings → Health → Data Access → Shortcuts) |
