// ボット → 定期処理's view (docs/bots.md "Jobs"): the relay's GET /jobs (contract/jobs.ts) read with this phone's key
// (the guest's too) and the Kalori scraper's status.json (lib/kalori/status.ts: メニューの更新's row, once its own tab),
// each job's health by its latest state on the phone's clock (初回, 遅れ, 止まっています, 失敗, 回復, 保留), the page's
// sections by what a job is for (要確認 first) and its verdict, and the rows' strips (the last RUNS_KEPT runs, the newest
// at the right edge) and the detail's 14 days. Pure but for the fetch: JobsPage.svelte stays thin.
import { t, formatNum, inLocale } from '#lib/i18n/index.ts';
import { memberCall } from '#lib/bots/memberCall.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import type { BotReply, BotTone, BotWord, Fact, VerdictView } from '#lib/bots/types.ts';
import { JOBS, RUNS_KEPT, DAYS_KEPT, parseJobs, type JobId, type JobRow, type JobRun, type JobsStatus, type RunSt } from '#lib/contract/jobs.ts';
import { isRec } from '#lib/contract/guards.ts';
import { alertLines, changeParts, edges, factRows as kaloriFacts, fetchStatus, menuLinks, parseStatus, verdictOf as kaloriVerdict, verdictView, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
import { addDays, localDateAt } from '#lib/contract/tokyo.ts';
import type { CellState, StripCell } from '#lib/strip.ts';
import { durationOf, shortDay, timeOf, whenOf } from '#lib/i18n/when.ts';
import '#lib/i18n/jobs.ts';
import '#lib/i18n/bots.ts';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;
/** `f` in English whatever the app's language (the page is English only by design: i18n/jobs.ts), its helpers' words
 *  (when.ts's dates and durations, bots.* and kalori.*) too. */
const en = <A extends unknown[], R>(f: (...a: A) => R) => (...a: A): R => inLocale('en', () => f(...a));

/** The page's copy: /jobs, and the Kalori scraper's status.json for メニューの更新's row (null: not read; that row then
 *  goes by its GitHub runs alone). */
export type JobsView = JobsStatus & { kalori: KaloriStatus | null };
/** The row the Kalori scraper is (its GitHub runs; status.json's verdict and detail), and its watchdog's, folded in. */
const MENU: JobId = 'kalori-scrape';
const WATCH: JobId = 'kalori-watch';

/** GET /jobs and status.json side by side: the status, or why not (no_key, offline, timeout, http, json, a refusal's
 *  code: /jobs's; status.json failing only leaves `kalori` null). Never throws. */
export async function fetchJobs(signal?: AbortSignal): Promise<BotReply<JobsView>> {
  const [c, k] = await Promise.all([memberCall(relayUrl('/jobs'), 'GET', undefined, signal), fetchStatus(signal).catch(() => null)]);
  if (!c.ok) return { ok: false, err: c.err === 'aborted' ? 'offline' : c.err, http: null };
  if (!c.res.ok) return { ok: false, err: 'http', http: c.res.status };
  const s = parseJobs(c.json);
  return s ? { ok: true, status: { ...s, kalori: k?.ok ? k.status : null } } : { ok: false, err: 'json', http: c.res.status };
}

/** The copy read back (this phone's kept one). */
export function parseView(x: unknown): JobsView | null {
  const s = parseJobs(x);
  return s && { ...s, kalori: isRec(x) && x.kalori ? parseStatus(x.kalori) : null };
}

/** A row's state: its tone and why (the word under its name); `next`: its first scheduled run (why first). */
type RowWhy = 'ok' | 'recovered' | 'running' | 'first' | 'late' | 'stopped' | 'failed' | 'failing' | 'partial' | 'held' | 'watch' | 'none';
export interface RowHealth { tone: Exclude<BotTone, 'busy'>; why: RowWhy; next?: number }

const jobOf = (id: JobId) => JOBS.find((j) => j.id === id);
/** 遅れ past this age, 止まっています past the second (a frequent job: 2 and 4 cadences; a daily or weekly one: a cadence
 *  and two, each with 2 h's margin). */
function lateAfter(ms: number): [number, number] {
  return ms <= 6 * H ? [2 * ms + 10 * MIN, 4 * ms + 10 * MIN] : [ms + 2 * H, 2 * ms + 2 * H];
}

/** A job's first scheduled time at or after `t` (its `at` plus whole cadences; null: no schedule). */
function nextRun(id: JobId, t: number): number | null {
  const j = jobOf(id);
  if (!j?.every || !j.at) return null;
  const at = Date.parse(j.at);
  return at + Math.max(0, Math.ceil((t - at) / j.every)) * j.every;
}

/** A failure this recent, a success since, reads 回復 (the strip still shows it). */
const RECOVERED_MS = D;

/** A job's health at `now` by its latest state (the history is the strip's): none yet (its first scheduled run after
 *  `since`, the relay's start, still to come: 初回, neutral; past it by as much as a late run: 遅れ, 止まっています; no
 *  schedule: 記録なし, neutral), its newest run too old (遅れ, 止まっています), its last finished run failed (once: warn,
 *  twice in a row: bad) or partly (warn), else good: 実行中, 回復 (a failure in the last day), 順調. Idle runs (nothing
 *  to do, skipped, cancelled: superseded) pass. */
export function rowHealth(row: JobRow, now: number, since?: number): RowHealth {
  const cad = jobOf(row.id)?.every ?? null;
  if (!row.runs.length) {
    const first = nextRun(row.id, since ?? now);
    if (first === null || cad === null) return { tone: 'idle', why: 'none' };
    const [late, stop] = lateAfter(cad);
    // (as if it last ran a cadence before its first slot)
    const age = now - first + cad;
    if (age > stop) return { tone: 'bad', why: 'stopped' };
    if (age > late) return { tone: 'warn', why: 'late' };
    return { tone: 'idle', why: 'first', next: nextRun(row.id, now) ?? first };
  }
  if (cad !== null) {
    const [late, stop] = lateAfter(cad);
    const age = now - row.runs[0].t;
    if (age > stop) return { tone: 'bad', why: 'stopped' };
    if (age > late) return { tone: 'warn', why: 'late' };
  }
  const done = row.runs.filter((r) => r.st !== 'run' && r.st !== 'idle');
  if (done[0]?.st === 'fail') return done[1]?.st === 'fail' ? { tone: 'bad', why: 'failing' } : { tone: 'warn', why: 'failed' };
  if (done[0]?.st === 'warn') return { tone: 'warn', why: 'partial' };
  if (row.runs[0].st === 'run') return { tone: 'good', why: 'running' };
  if (done.some((r) => (r.st === 'fail' || r.st === 'warn') && now - r.t < RECOVERED_MS)) return { tone: 'good', why: 'recovered' };
  return done.length ? { tone: 'good', why: 'ok' } : { tone: 'idle', why: 'ok' };
}

/** メニューの更新's state by status.json's verdict (遅れ by the phone's clock too): 保留 (a PR to merge by hand) warn, 不調
 *  bad, 遅れ warn, まだ 初回 at its next run. */
function menuHealth(k: KaloriStatus, now: number): RowHealth {
  switch (kaloriVerdict(k, now)) {
    case 'held': return { tone: 'warn', why: 'held' };
    case 'failing': return { tone: 'bad', why: 'failed' };
    case 'late': return { tone: 'warn', why: 'late' };
    case 'running': return { tone: 'good', why: 'running' };
    case 'none': return k.next === null ? { tone: 'idle', why: 'none' } : { tone: 'idle', why: 'first', next: k.next };
    default: return { tone: 'good', why: 'ok' };
  }
}

/** A row's health on the page: メニューの更新 by status.json when read (else its runs), its watchdog stopped or failing
 *  making a well one 見張りが停止 (warn); any other by its runs (rowHealth). */
function healthOf(s: JobsView, row: JobRow, now: number): RowHealth {
  if (row.id !== MENU) return rowHealth(row, now, s.since);
  const own = s.kalori ? menuHealth(s.kalori, now) : rowHealth(row, now, s.since);
  const watch = s.jobs.find((j) => j.id === WATCH);
  const w = watch && rowHealth(watch, now, s.since);
  return w?.tone === 'bad' && (own.tone === 'good' || own.tone === 'idle') ? { tone: 'warn', why: 'watch' } : own;
}

const jobName_ = (id: JobId): string => t(`jobs.n.${id}`);

/** The page's sections, by what a job is for (要確認 first: the rows in trouble, the worst first, out of their own). */
export type Section = 'look' | 'data' | 'watch' | 'ship';
const SECTIONS: Record<Exclude<Section, 'look'>, readonly JobId[]> = {
  data: ['wx', 'places', 'places-pull', 'places-details', MENU, 'gym'],
  watch: ['health', 'its-health', 'dispatch', 'tick', 'nightly', 'backup'],
  ship: ['pages', 'e2e-logic-full', 'e2e-flake-hunt']
};
export interface ViewRow { row: JobRow; h: RowHealth }

/** The rows by section, each with its health (a job the relay didn't send: none; the watchdog folded into メニュー). */
export function sections(s: JobsView, now: number): { id: Section; rows: ViewRow[] }[] {
  const by = new Map(s.jobs.map((j) => [j.id, j]));
  const of = (ids: readonly JobId[]) => ids.flatMap((id): ViewRow[] => ((row) => (row ? [{ row, h: healthOf(s, row, now) }] : []))(by.get(id)));
  const trouble = (x: ViewRow) => x.h.tone === 'bad' || x.h.tone === 'warn';
  const look = of(Object.values(SECTIONS).flat()).filter(trouble).sort((a, b) => Number(a.h.tone !== 'bad') - Number(b.h.tone !== 'bad'));
  return [{ id: 'look', rows: look }, ...(['data', 'watch', 'ship'] as const).map((id) => ({ id, rows: of(SECTIONS[id]).filter((x) => !trouble(x)) }))];
}

/** 確認が必要's part from メニュー (as its tab's was): status.json's lines while it needs a look (保留: the step to merge by
 *  hand; 不調: what the sentence leaves out), 保留's PR. */
function menuAttention_(s: JobsView, now: number): { lines: string[]; pr: string | null } {
  const k = s.kalori;
  if (!k) return { lines: [], pr: null };
  return { lines: alertLines(k, now), pr: menuLinks(k, now).find((l) => l.id === 'pr')?.href ?? null };
}

const TONE_RANK: readonly RowHealth['tone'][] = ['bad', 'warn', 'unknown', 'good', 'idle'];
const WORD: Record<RowHealth['tone'], BotWord> = { bad: 'failing', warn: 'trouble', unknown: 'unknown', good: 'healthy', idle: 'healthy' };

/** The page's verdict: the worst row by its latest state (neutral rows aside: 初回 to come, 記録なし), naming the rows
 *  in trouble (三つまで, 他n件), then the recovered and the first runs to come; a GitHub copy that failed said too. A look
 *  needed for a 不調 row, an open alert issue, or メニュー 保留 (its PR to merge by hand) or with an alert of its own. */
function verdictOf_(s: JobsView, now: number): VerdictView & { needsLook: boolean; bad: JobId[]; warn: JobId[] } {
  const hs = sections(s, now).flatMap((x) => x.rows).map((x) => ({ id: x.row.id, h: x.h }));
  const ids = (f: (h: RowHealth) => boolean) => hs.filter((x) => f(x.h)).map((x) => x.id);
  const bad = ids((h) => h.tone === 'bad'), warn = ids((h) => h.tone === 'warn'), held = ids((h) => h.why === 'held');
  const good = ids((h) => h.tone === 'good'), back = ids((h) => h.why === 'recovered'), first = ids((h) => h.why === 'first');
  const seen = hs.filter((x) => x.h.tone !== 'unknown' && x.h.tone !== 'idle');
  const tone = (seen.length ? TONE_RANK.find((r) => seen.some((x) => x.h.tone === r)) : hs.length ? 'idle' : 'unknown') ?? 'unknown';
  const names = (ids: JobId[]) => (ids.length > 3 ? t('jobs.say.more', { names: ids.slice(0, 3).map(jobName_).join(', '), n: ids.length - 3 }) : ids.map(jobName_).join(', '));
  const late = warn.filter((id) => !held.includes(id));
  const parts = [
    bad.length ? t('jobs.say.bad', { names: names(bad) }) : '',
    held.length ? t('jobs.say.held', { names: names(held) }) : '',
    late.length ? t('jobs.say.warn', { names: names(late) }) : '',
    !bad.length && !warn.length && good.length ? t('jobs.say.ok', { n: formatNum(good.length) }) : '',
    back.length ? t('jobs.say.back', { names: names(back) }) : '',
    first.length ? t('jobs.say.first', { names: names(first) }) : '',
    s.ext.err ? t('jobs.say.ext', { code: s.ext.err }) : ''
  ].filter(Boolean);
  const needsLook = bad.length > 0 || held.length > 0 || s.alerts.length > 0 || !!s.kalori?.alert;
  return { tone, w: WORD[tone], word: t(`bots.w.${WORD[tone]}`), sentence: parts.join(' '), needsLook, bad, warn };
}

/** 「3分前」 「5時間前」 「2日前」 (under a minute: たった今). */
function agoOf_(t0: number, now: number): string {
  const m = Math.floor(Math.max(0, now - t0) / MIN);
  if (m < 1) return t('jobs.ago.now');
  if (m < 60) return t('jobs.ago.m', { n: m });
  const h = Math.floor(m / 60);
  return h < 48 ? t('jobs.ago.h', { n: h }) : t('jobs.ago.d', { n: Math.floor(h / 24) });
}

const CELL: Record<RunSt, CellState> = { ok: 'ok', warn: 'warn', fail: 'fail', idle: 'idle', run: 'none' };

/** A run's line: 「12:15 成功 · 12秒 · スケジュール」 (a code after a failure's word; a cancelled run 取り消し: a newer
 *  one took its place). */
function runLine_(r: JobRun, now: number): string {
  const cancelled = r.st === 'idle' && r.c === 'cancelled';
  const word = t(cancelled ? 'jobs.st.cancelled' : `jobs.st.${r.st}`);
  return [timeOf(r.t, now), r.c && r.st !== 'ok' && !cancelled ? `${word} (${r.c})` : word, r.ms !== undefined ? durationOf(r.ms) : '', r.by ? t(`jobs.by.${r.by}`) : ''].filter(Boolean).join(' · ');
}

/** status.json's run as a GitHub run's line: its state by the result (取得中 running, 取り消し cancelled), its time
 *  from start to end, scheduled or dispatched. */
const KALORI_ST: Record<NonNullable<KaloriStatus['run']>['result'], RunSt> = { published: 'ok', held: 'warn', failed: 'fail', running: 'run', cancelled: 'idle' };
const KALORI_BY: Record<string, JobRun['by']> = { schedule: 's', workflow_dispatch: 'd' };

/** A row's last run (its age, Last run): its newest GitHub run; Menu update's, status.json's run when read. Its newest
 *  GitHub run is often a weekly tick that found the week's release already out and stopped in seconds, while Took
 *  (status.json) timed the scrape: the row's Last run and Took then named two runs (11/18: 「7 s」 beside 「16 min」). */
export function lastRun(row: JobRow, k: KaloriStatus | null): JobRun | undefined {
  const r = row.id === MENU ? k?.run : null;
  if (!r) return row.runs[0];
  const by = r.event ? KALORI_BY[r.event] : undefined;
  return {
    t: r.startedAt, st: KALORI_ST[r.result], ...(r.endedAt !== null ? { ms: Math.max(0, r.endedAt - r.startedAt) } : {}),
    ...(r.result === 'cancelled' ? { c: 'cancelled' } : {}), ...(by ? { by } : {})
  };
}

/** A row's strip: its last RUNS_KEPT runs oldest first, the newest at the right edge (none before the first kept). */
function runCells_(row: JobRow, now: number): StripCell[] {
  const runs = [...row.runs].reverse();
  const pad = Math.max(0, RUNS_KEPT - runs.length);
  return [
    ...Array.from({ length: pad }, (_, i): StripCell => ({ start: -(pad - i), end: -(pad - i) + 1, state: 'none', label: '' })),
    ...runs.map((r, i): StripCell => ({ start: r.t, end: runs[i + 1]?.t ?? now, state: CELL[r.st], label: runLine_(r, now) }))
  ];
}

/** The detail's days: the last DAYS_KEPT Tokyo days to today, each ok (no failure), warn (some), fail (all), none. */
function dayCells_(row: JobRow, now: number): StripCell[] {
  const today = localDateAt(now);
  const by = new Map(row.days.map((d) => [d[0], d]));
  return Array.from({ length: DAYS_KEPT }, (_, i) => {
    const day = addDays(today, i - DAYS_KEPT + 1);
    const d = by.get(day);
    const ok = d?.[1] ?? 0, fail = d?.[2] ?? 0;
    const state: CellState = !ok && !fail ? 'none' : !fail ? 'ok' : !ok ? 'fail' : 'warn';
    const start = Date.parse(`${day}T00:00:00+09:00`);
    return { start, end: start + D, state, label: t('jobs.day', { day: shortDay(day), ok: formatNum(ok), fail: formatNum(fail) }) };
  });
}

/** The days' totals: [ok, fail]. */
export const dayTotals = (row: JobRow): [number, number] => row.days.reduce<[number, number]>((a, d) => [a[0] + d[1], a[1] + d[2]], [0, 0]);

/** nightly's parts (hours since each last finished, -1 never) and places-pull's last sync, as くわしく-like rows. */
function extraRows_(row: JobRow, now: number): { id: string; label: string; value: string }[] {
  const x = row.x ?? {};
  if (row.id === 'places-pull' && x.syncedAt !== undefined) return [{ id: 'synced', label: t('jobs.x.synced'), value: agoOf_(x.syncedAt, now) }];
  if (row.id !== 'nightly') return [];
  return Object.entries(x).map(([k, h]) => ({ id: k, label: t(`jobs.part.${k}`), value: h < 0 ? t('bots.key.never') : agoOf_(now - h * H, now) }));
}

/** The page's くわしく: the GitHub copy's time, whose token read it, its failure. */
function factRows_(s: JobsView, now: number): Fact[] {
  return [
    { id: 'ext', label: t('jobs.fact.ext'), value: s.ext.at === null ? t('bots.key.never') : timeOf(s.ext.at, now) },
    { id: 'by', label: t('jobs.fact.by'), value: s.ext.by === 'app' ? 'GitHub App' : t('jobs.fact.none') },
    ...(s.ext.err ? [{ id: 'err', label: t('jobs.fact.err'), value: s.ext.err }] : []),
    { id: 'n', label: t('jobs.fact.n'), value: formatNum(s.jobs.filter((j) => j.id !== WATCH).length) }
  ];
}

/** Menu update's detail (JobRow), from status.json: its verdict's sentence, Next run, Items, the facts, the last 8
 *  weeks' strip, Last changes' bar (none before a first diff) and its links. */
function menuDetail_(k: KaloriStatus, now: number) {
  return {
    say: verdictView(k, now).sentence, next: k.next === null ? null : whenOf(k.next), outcome: edges(k, now).outcome, facts: kaloriFacts(k, now),
    weeks: weekStrip(k, now), change: k.diff && k.verdict !== 'none' ? changeParts(k.diff) : null, links: menuLinks(k, now)
  };
}

export const jobName = en(jobName_);
export const menuDetail = en(menuDetail_);
export const verdictOf = en(verdictOf_);
export const menuAttention = en(menuAttention_);
export const agoOf = en(agoOf_);
export const runLine = en(runLine_);
export const runCells = en(runCells_);
export const dayCells = en(dayCells_);
export const extraRows = en(extraRows_);
export const factRows = en(factRows_);
