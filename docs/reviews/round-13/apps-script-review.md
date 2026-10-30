# Round 13: Apps Script backend review
**Date:** 2026-10-30. **Scope:** `app/gas/{main,parse,build,fakes}.ts`, `gas.d.ts`, the tests, the shared contract
(`src/lib/contract/{api,labels}.ts`) against `docs/design/sheets-architecture.md`, `docs/ops/shortcut-health-sync.md` §1,
the runbook, google-setup and ADRs 0015/0020. **Reviewer role:** senior backend / Apps Script.

**Bottom line.** The backend is small, careful and correct in its core rules: it never throws, keys are gated and
compared in constant time, `at` is strictly monotonic under the script lock, events dedupe by id, higher-only and
weight-latest are right, `rev` catches hand edits. The real problem was **cost on the hot paths**. At year-3 volume both
the hourly ingest and every client poll read the *whole* sheet under the script lock, because the ingest "tail" never
applied to the real 31-day Shortcut body and `snapshot` with `since` filtered in memory after a full read. Both now read
only a tail. The client-facing contract (request/response shapes, row formats, tab schemas) is unchanged, and no
migration of existing rows is needed. **One `Code.js` to redeploy** (build `8a6af536103c`).

**Premise check.** The brief assumed ~5k *compacted* metric rows at year 3. Only the client's cache is compacted
(`model/compact.ts`). The sheet never is: `bench-rows.ts` gives **41,744** `metrics` rows after 3 years of hourly syncs
(the round 9 estimate was ~53k), plus ~17k `uploads` rows a year.

## Measurements (`app/gas/perf.test.ts`, new)
Year-3 sheet from `syntheticRows(1095)`, the hourly body (31 days × steps, minutes, weight). The fake sheet's time is
not Apps Script's, so the test asserts **cells read**. That is what a `getValues` costs, roughly linear: in practice
~1–2 s per 100k cells, with the lock held.

| Request | Before | After |
|---|---|---|
| Hourly ingest (31 days × 3 metrics) | 208,720 cells (whole `metrics` tab) | **8,960** (≈ the last 32 days, 2 chunks) |
| Re-send of the same body | 209,085 | **8,960** |
| `snapshot` with `since` (a poll) | 255,919 (all four tabs) | **6,144** (one 256-row chunk per tab) |
| `snapshot` without `since` (pairing, resync) | 255,919 | 255,919 (unchanged, see L6) |

`Code.js`: 27,020 → 27,988 bytes (26.4 → 27.3 KB). Tests: 504 pass (38 files). `npm run check` 0 errors, `knip` clean
apart from the other engineer's untracked `.r13-audit.mjs`.

## Findings, by severity

### High
**H1. The hourly ingest read the entire `metrics` tab under the lock. Fixed.** The tail optimisation applied only when
every date in the body was ≤ 14 days old. The Shortcut sends **31 days** every hour (shortcut-health-sync.md §2), so
every real ingest fell through to `Infinity`. At year 3 that is ~200k cells per run per phone, a few seconds each with
the lock held, so it also delayed both phones' polls. *Fix:* `ingest` now reads only the rows written since the day
before the body's earliest date, via the new `readTail`. This is correct because the app only appends with strictly
increasing `at`, and a row about day D is only ever written from day D on (Health has no future; one day of slack
covers a phone in a zone ahead of Tokyo). The same cutoff limits the workout dedupe. `INGEST_TAIL_ROWS` and
`RECENT_DAYS` are gone: the read now follows the body's dates, not a row count.

**H2. `snapshot` with `since` read all four tabs in full on every poll. Fixed.** `since` was applied with an in-memory
filter after `getValues` over every row, plus a `parseInstant` and a `Date` round-trip per row. *Fix:* with `since`,
each tab is read backwards in doubling chunks (256, 512, …) until a chunk starts at or before `since`. A typical poll
is now 4 `getRange` calls of 256 rows. This is safe for the same reason as `since` itself: rows after X are a tail. A
row pasted by hand out of order already bumps `rev` (`noteRows`, `onEdit`), and the client then discards the reply and
fetches everything. `instant()` also got a fast path for the script's own canonical `at`, which is nearly every cell.

### Medium
**M1. A request that failed after appending skipped `saveState`. Fixed.** If, say, the `uploads` append timed out
after the metrics were written, `ROWS` and `LAST_AT` were not saved. The next request saw a row count it didn't know,
bumped `REV`, and both phones did a full 3.7 MB refetch. *Fix:* `withLock` saves the state in `finally`. A test covers
it (an ingest whose `uploads` write throws leaves `rev` unchanged).

**M2. An unreadable `since` silently hid every row. Fixed.** `instant()` keeps unparseable text as is, so
`since: "yesterday"` compared as text (`"y" > "2"`), and the reply was always empty with `ok: true`. *Fix:* `snapshot`
answers `bad_request`. The client only ever sends the ISO `at` it received, so this is backwards-compatible.

### Low
- **L1. `uploads` read the whole `uploads` tab** (~17k rows a year) to show 20 rows. Fixed: it reads back until it has
  the caller's 20.
- **L2. The workout dedupe read the whole `workouts` tab.** Fixed (H1's cutoff).
- **L3. The weight rule was hard-coded twice (`=== 'weight'`).** Fixed: the rule now comes from the contract.
  `isActivityMetric` means higher-only, anything else means latest-row. A new metric is then a contract entry
  (`MetricKey`, `METRIC_BOUNDS`/`validMetricValue`), a `COLUMNS` line in `parse.ts`, and the model. The server needs
  no change.
- **L4. The audit-row format was duplicated** between the error path and the success path. Fixed (`auditRow`).
- **L5. Not fixed: the `event` id dedupe reads the whole `id` column** (~16k cells at year 3, one call, ~0.1–0.3 s).
  Ids carry no date, and a queued retry can arrive days later, so a tail would be unsafe. `TextFinder` would avoid the
  transfer but adds fake surface. Revisit if events grow 10×.
- **L6. Not fixed: a full `snapshot`** (pairing, a `rev` change, the manual button) still reads everything: ~256k
  cells and 3.7 MB at year 3, maybe 3–6 s. It is rare and holds the lock only for that time. If it ever gets too
  slow, the next step is to archive locked-week `metrics` rows server-side with `compactRows`' rule (a contract change,
  ADR needed).
- **L7. Not fixed: `uploads` grows without bound** (an audit only; ~300 chars a row). This is fine for years. It can be
  trimmed by hand at any time, because it isn't synced, so no `rev` bump and no client effect.
- **L8. Not fixed: `avgHrs` `0` is stored as `0`, not empty.** Workouts aren't sent yet, and nothing scores on
  `avgHr`. Decide when the Shortcut starts sending workouts.
- **L9. Not fixed (accepted): rows pasted by hand at the very end of a tab with old `at`s** can end a tail read early.
  For `snapshot` that is harmless: `rev` changes and the client refetches. For `ingest` the worst case is a redundant
  row, and a stale steps value revived after a lowering `metric_set`, until ~256 newer rows follow (about a week).
  The runbook already says to `resync` after hand fixes. Pasting old rows is not a normal operation.

### Verified OK (no change)
- **Locking:** one script lock, tried for ≤ 10 s, then `busy`. Parsing, validation, auth and the rate limit run outside
  it. Every sheet read that decides a write (higher-only, dedupe) and every snapshot read is inside it. `flush()` runs
  before release. Snapshot needs the lock: one request's rows share one `at` across up to three tabs.
- **Time:** `nextAt` is `max(now, LAST_AT + 1 ms)` under the lock, persisted once per request, so it is strictly
  increasing, also within a millisecond.
- **`rev`:** row-count drift per synced tab (`ROWS`), `onEdit` for cell edits, and `resync()`. A concurrent `onEdit`
  bump is never overwritten (only a request's own bump is written).
- **Keys:** a hex shape gate before any Properties read; a constant-time compare over the longer length; both
  comparisons always run; unset or short properties never match. Keys are cached 5 min in CacheService (rotation lag
  documented). Never `e.parameter`, no `doGet`.
- **Quotas:** one `getProperties` and at most one `setProperties` per locked request. Snapshots without new tab drift
  write nothing. The rate limit and key cache use CacheService (no daily quota). Every request is far below the 6 min
  execution limit. Writes are one `setNumberFormats` + `setValues` per tab per request, never per row.
- **Formats:** text columns are `@`, set at tab creation and again on every append. Numbers are `0.##`. Pasted Date
  cells and numeric text are read defensively. `ContentService` output is `MimeType.JSON`.
- **Limits:** 1 MB body cap before the key is looked at. `event.data` ≤ 20,000 chars (a cell holds 50,000).
- **Simplicity:** after the 2026-10-30 ingest simplification, `parse.ts` holds only the one format
  (shortcut-health-sync.md §1, unchanged). No Mac-migration or old-format code remains in `app/gas/`, and knip finds
  nothing unused. Shared rules (`TABS`, `EVENT_TYPES`, `validMetricValue`, `MANUAL_ID_RE`, `WEIGHT_KG`) come from the
  contract and are not copied.
- **Extensibility:** a new action is one `case` in `handle` and one reply type in `api.ts`. A new synced tab is a
  `TABS` entry, `SYNCED_TABS`, and a row mapper in `snapshot`.

## Contract
No change to request or reply shapes, row formats or tabs. The only behaviour change: `snapshot` with an unparseable
`since` is now `bad_request` instead of an empty `ok`. Docs: sheets-architecture.md §2 (tail reads, the lock saves
state on failure, the sheet is uncompacted).

## Deploy
**Redeploy `app/apps-script/Code.js` once** (google-setup.md §11): paste it, then Deploy → Manage deployments → edit →
New version. `{"action":"health"}` should answer `build: "8a6af536103c"`. No Script Property or sheet change is needed:
existing rows, `ROWS`, `LAST_AT` and `REV` are read as before.
