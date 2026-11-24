// ボット → 定期処理's view (docs/bots.md "定期処理"): the relay's GET /jobs (contract/jobs.ts) read with this phone's key
// (the guest's too), each job's health by the phone's clock (遅れ, 止まっています, 失敗), the page's verdict over them, and
// the rows' strips (the last RUNS_KEPT runs, the newest at the right edge) and the detail's 14 days. Pure but for
// the fetch: JobsPage.svelte stays thin.
import { t, formatNum } from '#lib/i18n/index.ts';
import { memberCall } from '#lib/bots/memberCall.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import type { BotReply, BotTone, BotWord, Fact, VerdictView } from '#lib/bots/types.ts';
import { JOBS, RUNS_KEPT, DAYS_KEPT, parseJobs, type JobGroup, type JobId, type JobRow, type JobRun, type JobsStatus, type RunSt } from '#lib/contract/jobs.ts';
import { addDays, localDateAt } from '#lib/contract/tokyo.ts';
import type { CellState, StripCell } from '#lib/strip.ts';
import { durationOf, shortDay, timeOf } from '#lib/i18n/when.ts';
import '#lib/i18n/jobs.ts';
import '#lib/i18n/bots.ts';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;

/** GET /jobs: the status, or why not (no_key, offline, timeout, http, json, a refusal's code). Never throws. */
export async function fetchJobs(signal?: AbortSignal): Promise<BotReply<JobsStatus>> {
  const c = await memberCall(relayUrl('/jobs'), 'GET', undefined, signal);
  if (!c.ok) return { ok: false, err: c.err === 'aborted' ? 'offline' : c.err, http: null };
  if (!c.res.ok) return { ok: false, err: 'http', http: c.res.status };
  const s = parseJobs(c.json);
  return s ? { ok: true, status: s } : { ok: false, err: 'json', http: c.res.status };
}

/** A row's state: its tone and why (the word under its name); `next`: its first scheduled run (why first). */
type RowWhy = 'ok' | 'recovered' | 'running' | 'first' | 'late' | 'stopped' | 'failed' | 'failing' | 'partial' | 'none';
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

export const jobName = (id: JobId): string => t(`jobs.n.${id}`);
const GROUPS: readonly JobGroup[] = ['server', 'github', 'bot'];

/** The rows by group, in JOBS's order (a job the relay didn't send: none). */
export function grouped(s: JobsStatus): { group: JobGroup; rows: JobRow[] }[] {
  const by = new Map(s.jobs.map((j) => [j.id, j]));
  return GROUPS.map((group) => ({ group, rows: JOBS.filter((j) => j.group === group).flatMap((j) => by.get(j.id) ?? []) }));
}

const TONE_RANK: readonly RowHealth['tone'][] = ['bad', 'warn', 'unknown', 'good', 'idle'];
const WORD: Record<RowHealth['tone'], BotWord> = { bad: 'failing', warn: 'trouble', unknown: 'unknown', good: 'healthy', idle: 'healthy' };

/** The page's verdict: the worst row by its latest state (neutral rows aside: 初回 to come, 記録なし), naming the rows
 *  in trouble (三つまで, 他n件), then the recovered and the first runs to come; a GitHub copy that failed said too. A look
 *  needed for a 不調 row or an open alert issue. */
export function verdictOf(s: JobsStatus, now: number): VerdictView & { needsLook: boolean; bad: JobId[]; warn: JobId[] } {
  const hs = s.jobs.map((j) => ({ id: j.id, h: rowHealth(j, now, s.since) }));
  const ids = (f: (h: RowHealth) => boolean) => hs.filter((x) => f(x.h)).map((x) => x.id);
  const bad = ids((h) => h.tone === 'bad'), warn = ids((h) => h.tone === 'warn');
  const good = ids((h) => h.tone === 'good'), back = ids((h) => h.why === 'recovered'), first = ids((h) => h.why === 'first');
  const seen = hs.filter((x) => x.h.tone !== 'unknown' && x.h.tone !== 'idle');
  const tone = (seen.length ? TONE_RANK.find((r) => seen.some((x) => x.h.tone === r)) : hs.length ? 'idle' : 'unknown') ?? 'unknown';
  const names = (ids: JobId[]) => (ids.length > 3 ? t('jobs.say.more', { names: ids.slice(0, 3).map(jobName).join('・'), n: ids.length - 3 }) : ids.map(jobName).join('・'));
  const parts = [
    bad.length ? t('jobs.say.bad', { names: names(bad) }) : '',
    warn.length ? t('jobs.say.warn', { names: names(warn) }) : '',
    !bad.length && !warn.length && good.length ? t('jobs.say.ok', { n: formatNum(good.length) }) : '',
    back.length ? t('jobs.say.back', { names: names(back) }) : '',
    first.length ? t('jobs.say.first', { names: names(first) }) : '',
    s.ext.err ? t('jobs.say.ext', { code: s.ext.err }) : ''
  ].filter(Boolean);
  return { tone, w: WORD[tone], word: t(`bots.w.${WORD[tone]}`), sentence: parts.join(' '), needsLook: bad.length > 0 || s.alerts.length > 0, bad, warn };
}

/** 「3分前」 「5時間前」 「2日前」 (under a minute: たった今). */
export function agoOf(t0: number, now: number): string {
  const m = Math.floor(Math.max(0, now - t0) / MIN);
  if (m < 1) return t('jobs.ago.now');
  if (m < 60) return t('jobs.ago.m', { n: m });
  const h = Math.floor(m / 60);
  return h < 48 ? t('jobs.ago.h', { n: h }) : t('jobs.ago.d', { n: Math.floor(h / 24) });
}

const CELL: Record<RunSt, CellState> = { ok: 'ok', warn: 'warn', fail: 'fail', idle: 'idle', run: 'none' };

/** A run's line: 「12:15 成功 · 12秒 · スケジュール」 (a code after a failure's word; a cancelled run 取り消し: a newer
 *  one took its place). */
export function runLine(r: JobRun, now: number): string {
  const cancelled = r.st === 'idle' && r.c === 'cancelled';
  const word = t(cancelled ? 'jobs.st.cancelled' : `jobs.st.${r.st}`);
  return [timeOf(r.t, now), r.c && r.st !== 'ok' && !cancelled ? `${word}（${r.c}）` : word, r.ms !== undefined ? durationOf(r.ms) : '', r.by ? t(`jobs.by.${r.by}`) : ''].filter(Boolean).join(' · ');
}

/** A row's strip: its last RUNS_KEPT runs oldest first, the newest at the right edge (none before the first kept). */
export function runCells(row: JobRow, now: number): StripCell[] {
  const runs = [...row.runs].reverse();
  const pad = Math.max(0, RUNS_KEPT - runs.length);
  return [
    ...Array.from({ length: pad }, (_, i): StripCell => ({ start: -(pad - i), end: -(pad - i) + 1, state: 'none', label: '' })),
    ...runs.map((r, i): StripCell => ({ start: r.t, end: runs[i + 1]?.t ?? now, state: CELL[r.st], label: runLine(r, now) }))
  ];
}

/** The detail's days: the last DAYS_KEPT Tokyo days to today, each ok (no failure), warn (some), fail (all), none. */
export function dayCells(row: JobRow, now: number): StripCell[] {
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
export function extraRows(row: JobRow, now: number): { id: string; label: string; value: string }[] {
  const x = row.x ?? {};
  if (row.id === 'places-pull' && x.syncedAt !== undefined) return [{ id: 'synced', label: t('jobs.x.synced'), value: agoOf(x.syncedAt, now) }];
  if (row.id !== 'nightly') return [];
  return Object.entries(x).map(([k, h]) => ({ id: k, label: t(`jobs.part.${k}`), value: h < 0 ? t('bots.key.never') : agoOf(now - h * H, now) }));
}

/** The page's くわしく: the GitHub copy's time, whose token read it, its failure. */
export function factRows(s: JobsStatus, now: number): Fact[] {
  return [
    { id: 'ext', label: t('jobs.fact.ext'), value: s.ext.at === null ? t('bots.key.never') : timeOf(s.ext.at, now) },
    { id: 'by', label: t('jobs.fact.by'), value: s.ext.by === 'app' ? 'GitHub App' : t('jobs.fact.none') },
    ...(s.ext.err ? [{ id: 'err', label: t('jobs.fact.err'), value: s.ext.err }] : []),
    { id: 'n', label: t('jobs.fact.n'), value: formatNum(s.jobs.length) }
  ];
}
