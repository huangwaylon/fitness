// ボット → Jobs' view (docs/bots.md "Jobs"): the relay's GET /jobs (contract/jobs.ts) read with this phone's key (the
// guest's too) and the Kalori scraper's status.json (lib/kalori/status.ts: Chain menus' row), each job's health by its
// latest state on the phone's clock (First run, Late, Stopped, Failed, Recovered, Held; Waiting on a job it depends
// on), the page's layout (Needs you, then the sections by what a row is for, with the Gym and ITS bots' rows and the
// Cloudflare limits), its verdict over all of them, and the rows' strips (the last RUNS_KEPT runs, the newest at the
// right edge) and the detail's 14 days. Pure but for the fetch: JobsPage.svelte stays thin.
import { t, formatNum, inLocale } from '#lib/i18n/index.ts';
import { memberCall } from '#lib/bots/memberCall.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { shown, type BotReply, type BotTone, type BotVerdict, type BotWord, type Fact, type VerdictView } from '#lib/bots/types.ts';
import { JOBS, RUNS_KEPT, DAYS_KEPT, issueUrl, parseJobs, parseUsage, type JobId, type JobRow, type JobRun, type JobsStatus, type RunSt, type Usage, type UsageKey } from '#lib/contract/jobs.ts';
import { isRec } from '#lib/contract/guards.ts';
import { alertLines, changeParts, edges, factRows as kaloriFacts, fetchStatus, menuLinks, parseStatus, verdictOf as kaloriVerdict, verdictView, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
import { addDays, localDateAt } from '#lib/contract/tokyo.ts';
import type { CellState, StripCell } from '#lib/strip.ts';
import { durationOf, shortDay, timeOf, whenOf } from '#lib/i18n/when.ts';
import '#lib/i18n/jobs.ts';
import { outage } from './outage.svelte.ts';
import { alertTitle } from './specNames.ts';
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
 *  code: /jobs's; status.json failing only leaves `kalori` null; a refusal's usage kept in `outage`). Never throws. */
export async function fetchJobs(signal?: AbortSignal): Promise<BotReply<JobsView>> {
  const [c, k] = await Promise.all([memberCall(relayUrl('/jobs'), 'GET', undefined, signal), fetchStatus(signal).catch(() => null)]);
  if (!c.ok) return { ok: false, err: c.err === 'aborted' ? 'offline' : c.err, http: null };
  // (a refusal may carry the free tier's usage: the record over a limit, outage.svelte.ts)
  outage.usage = c.res.ok ? null : (isRec(c.json) ? parseUsage(c.json.usage) : null);
  if (!c.res.ok) return { ok: false, err: 'http', http: c.res.status };
  const s = parseJobs(c.json);
  return s ? { ok: true, status: { ...s, kalori: k?.ok ? k.status : null } } : { ok: false, err: 'json', http: c.res.status };
}

/** The copy read back (this phone's kept one). */
export function parseView(x: unknown): JobsView | null {
  const s = parseJobs(x);
  return s && { ...s, kalori: isRec(x) && x.kalori ? parseStatus(x.kalori) : null };
}

/** A row's state: its tone and why (the word under its name); `next`: its first scheduled run (why first); `on`: the
 *  job it waits on (why waiting); `pauses`: the jobs waiting on it (DEPS). */
type RowWhy = 'ok' | 'recovered' | 'running' | 'first' | 'late' | 'stopped' | 'failed' | 'failing' | 'partial' | 'held' | 'watch' | 'waiting' | 'none';
export interface RowHealth { tone: Exclude<BotTone, 'busy'>; why: RowWhy; next?: number; on?: JobId; pauses?: JobId[] }

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

/** A row on the page: a job's, a bot's (Gym bot, ITS bot: their tabs' verdicts, JobsPage), a Cloudflare limit's. */
export type RowKey = JobId | 'svc-gym' | 'svc-its' | `cf-${UsageKey}`;
type SvcId = 'gym' | 'its';
/** A bot's verdict as its tab reads it (null: none read yet); only the bots this phone has. */
export interface SvcIn { id: SvcId; v: BotVerdict | null }
type Tone = Exclude<BotTone, 'busy'>;
export type Item =
  | { kind: 'job'; key: JobId; tone: Tone; row: JobRow; h: RowHealth }
  | { kind: 'svc'; key: `svc-${SvcId}`; tone: Tone; id: SvcId }
  | { kind: 'cf'; key: `cf-${UsageKey}`; tone: Tone; u: UsageRowView };

/** The page's sections by what a row is for, in order (Needs you above them: JobsPage); Behind the scenes and Releases
 *  fold while healthy; the Cloudflare limits always last. */
export type SectionId = 'bots' | 'data' | 'yours' | 'behind' | 'ship' | 'cf';
const SECTIONS: Record<Exclude<SectionId, 'cf'>, readonly RowKey[]> = {
  bots: ['svc-gym', 'gym', 'svc-its', 'its-health'],
  data: ['wx', 'places-pull', 'places', 'places-details', MENU],
  yours: ['backup', 'nightly'],
  behind: ['tick', 'dispatch', 'health'],
  ship: ['pages', 'relay', 'e2e-logic-full', 'e2e-flake-hunt']
};
const FOLDS: ReadonlySet<SectionId> = new Set(['behind', 'ship']);
/** The flake hunt's failures are the `flake` issue's, never the verdict's nor Needs you's. */
const FLAKE: JobId = 'e2e-flake-hunt';
/** What a job starts: the server timer the weather and the places' sorting (relay/src/index.ts scheduled), its-bot's
 *  dispatch the dispatched workflows (relay/src/jobs.ts DISPATCHED). Late or stopped, its dependents wait on it. */
const DEPS: Partial<Record<JobId, readonly JobId[]>> = { tick: ['wx', 'places'], dispatch: ['health', 'its-health', 'places-pull'] };

export interface SectionView {
  id: SectionId;
  /** The rows left at home (Needs you took the rest; the limits stay, Needs you shows a copy). */
  items: Item[];
  /** How many moved up to Needs you. */
  above: number;
  /** Behind the scenes and Releases fold; `fold`: folded at first (every row at home well, the flake hunt aside). */
  foldable: boolean;
  fold: boolean;
  /** The folded row's dot and words: 「All 3 OK」, 「2 OK · 1 waiting」. */
  tone: Tone;
  summary: string;
}
export interface Layout { needs: Item[]; sections: SectionView[] }

const trouble = (x: Item) => (x.tone === 'bad' || x.tone === 'warn') && x.key !== FLAKE;
const TONE_RANK: readonly Tone[] = ['bad', 'warn', 'unknown', 'good', 'idle'];
const worstTone = (ts: readonly Tone[]): Tone => TONE_RANK.find((r) => ts.includes(r)) ?? 'idle';

/** The jobs' health, a dependent of a late or stopped job waiting on it (neutral) rather than late itself. */
function healths(s: JobsView, now: number): Map<JobId, { row: JobRow; h: RowHealth }> {
  const m = new Map(s.jobs.filter((r) => r.id !== WATCH).map((row) => [row.id, { row, h: healthOf(s, row, now) }]));
  for (const [on, deps] of Object.entries(DEPS) as [JobId, readonly JobId[]][]) {
    const p = m.get(on);
    if (!p || (p.h.why !== 'late' && p.h.why !== 'stopped')) continue;
    p.h = { ...p.h, pauses: deps.filter((d) => m.has(d)) };
    for (const d of deps) {
      const x = m.get(d);
      if (x && (x.h.why === 'late' || x.h.why === 'stopped')) x.h = { tone: 'idle', why: 'waiting', on };
    }
  }
  return m;
}

/** The page's rows: Needs you (the rows in trouble from anywhere, red then amber, the page's order within; the flake
 *  hunt never) and the sections with what's left, each folded row's summary. `s` null: /jobs not read yet (the bots'
 *  rows only); `usage`: usageView's. */
function layout_(s: JobsView | null, now: number, svc: readonly SvcIn[], usage: UsageView | null): Layout {
  const jobs = s ? healths(s, now) : new Map<JobId, { row: JobRow; h: RowHealth }>();
  const item = (key: RowKey): Item | null => {
    if (key === 'svc-gym' || key === 'svc-its') {
      const b = svc.find((x) => `svc-${x.id}` === key);
      return b ? { kind: 'svc', key, id: b.id, tone: b.v ? shown(b.v).tone : 'unknown' } : null;
    }
    const j = jobs.get(key as JobId);
    return j ? { kind: 'job', key: key as JobId, tone: j.h.tone, row: j.row, h: j.h } : null;
  };
  const homes = (Object.entries(SECTIONS) as [SectionId, readonly RowKey[]][]).map(([id, keys]) => ({ id, all: keys.map(item).filter((x): x is Item => x !== null) }));
  const cf = (usage?.rows ?? []).map((u): Item => ({ kind: 'cf', key: `cf-${u.k}`, tone: u.tone, u }));
  const needs = [...homes.flatMap((x) => x.all), ...cf].filter(trouble).sort((a, b) => Number(a.tone !== 'bad') - Number(b.tone !== 'bad'));
  const sections = homes.map(({ id, all }): SectionView => {
    const items = all.filter((x) => !trouble(x));
    return { id, items, above: all.length - items.length, foldable: FOLDS.has(id), ...foldOf(id, items) };
  });
  if (usage) sections.push({ id: 'cf', items: cf, above: 0, foldable: false, fold: false, tone: worstTone(cf.map((x) => x.tone)), summary: '' });
  return { needs, sections };
}

/** A section's folded row: its worst dot, 「All 3 OK」 or the counts (OK, waiting, not run yet, failed); folded at
 *  first while every row is well (the flake hunt's failures aside: its issue's). */
function foldOf(id: SectionId, items: readonly Item[]): { fold: boolean; tone: Tone; summary: string } {
  const what = (x: Item) => (x.kind === 'job' && x.h.why === 'waiting' ? 'waiting' : x.kind === 'job' && (x.h.why === 'first' || x.h.why === 'none') ? 'new' : x.tone === 'good' || x.tone === 'idle' ? 'ok' : 'trouble');
  const n = { ok: 0, waiting: 0, new: 0, trouble: 0 };
  for (const x of items) n[what(x)]++;
  const summary = !items.length ? '' : n.ok === items.length ? t('jobs.fold.all', { n: formatNum(n.ok) })
    : (['ok', 'waiting', 'new', 'trouble'] as const).filter((k) => n[k]).map((k) => t(`jobs.fold.${k}`, { n: formatNum(n[k]) })).join(' · ');
  const fold = FOLDS.has(id) && items.every((x) => x.key === FLAKE || what(x) === 'ok' || what(x) === 'new');
  return { fold, tone: worstTone(items.map((x) => x.tone)), summary };
}

/** A row's word under its name: 「Late」, 「Waiting on Server timer」; a job others wait on, what's paused. */
function whyOf_(h: RowHealth): { word: string; pauses: string | null } {
  return {
    word: h.why === 'waiting' && h.on ? t('jobs.why.waiting', { on: jobName_(h.on) }) : t(`jobs.why.${h.why}`),
    pauses: h.pauses?.length ? t('jobs.why.pauses', { names: listOf(h.pauses.map(jobName_)) }) : null
  };
}

/** 「A」 「A and B」 「A, B and C」. */
const listOf = (xs: readonly string[]): string => (xs.length < 2 ? (xs[0] ?? '') : t('jobs.say.and', { a: xs.slice(0, -1).join(', '), b: xs.at(-1)! }));

/** Needs you's person steps: the open alert issues (the flake hunt's `flake` issue aside: its row's), then Menu
 *  update's (held: the step to merge by hand, and its PR). Each a line and its links. */
function stepsOf_(s: JobsView, now: number): { id: string; text: string; links: { id: string; href: string; label: string }[] }[] {
  const alerts = s.alerts.filter((a) => a.label !== 'flake');
  const menu = menuAttention_(s, now);
  return [
    ...alerts.map((a) => ({ id: `a${a.n}`, text: t('jobs.alert', { title: alertTitle(a.title), ago: agoOf_(a.at, now) }), links: [{ id: String(a.n), href: issueUrl(a.n), label: t('jobs.alertLink') }] })),
    ...menu.lines.map((text, i) => ({ id: `m${i}`, text, links: i === menu.lines.length - 1 && menu.pr ? [{ id: 'pr', href: menu.pr, label: t('bots.attn.pr') }] : [] }))
  ];
}

/** Needs you's part from Chain menus (as its tab's was): status.json's lines while it needs a look (held: the step to
 *  merge by hand; failing: what the sentence leaves out), held's PR. */
function menuAttention_(s: JobsView, now: number): { lines: string[]; pr: string | null } {
  const k = s.kalori;
  if (!k) return { lines: [], pr: null };
  return { lines: alertLines(k, now), pr: menuLinks(k, now).find((l) => l.id === 'pr')?.href ?? null };
}

const WORD: Record<Tone, BotWord> = { bad: 'failing', warn: 'trouble', unknown: 'unknown', good: 'healthy', idle: 'healthy' };

/** The page's verdict over every row Needs you weighs (the jobs, the Gym and ITS bots, the Cloudflare limits; the
 *  flake hunt and the rows waiting on another aside), its sentence what to do, the first that applies: read the open
 *  alert, merge Chain menus' PR, a bot's own step, check the failing rows, keep an eye on the late ones or a tight limit; then 「2 more
 *  below.」 for the rest; all well: 「All 18 OK. Nothing to do.」 with the first runs to come. A failed GitHub read
 *  said too. 「!」 for a failing row or limit, an open alert, Chain menus held or alerting, or a bot's own 「!」. */
function verdictOf_(s: JobsView, now: number, svc: readonly SvcIn[] = []): VerdictView & { needsLook: boolean; bad: RowKey[]; warn: RowKey[] } {
  const { needs, sections } = layout_(s, now, svc, usageView_(s.usage, now));
  const counted = [...needs, ...sections.flatMap((x) => x.items).filter((x) => x.kind !== 'cf' && x.key !== FLAKE)];
  const nameOf = (x: Item) => (x.kind === 'job' ? jobName_(x.key) : x.kind === 'svc' ? t(`jobs.svc.${x.id}`) : t('jobs.say.at', { name: x.u.name, pct: x.u.pct }));
  const names = (xs: Item[]) => listOf(xs.length > 3 ? [...xs.slice(0, 2).map(nameOf), t('jobs.say.others', { n: xs.length - 2 })] : xs.map(nameOf));
  const bad = needs.filter((x) => x.tone === 'bad'), warn = needs.filter((x) => x.tone === 'warn');
  const held = needs.some((x) => x.kind === 'job' && x.h.why === 'held');
  const alerts = s.alerts.filter((a) => a.label !== 'flake').length;
  // (a bot with its own 「!」: a step for the person, said as such; the rest by kind)
  const look = needs.filter((x) => x.kind === 'svc' && svc.find((b) => b.id === x.id)?.v?.needsLook);
  const cf = (xs: Item[], on: boolean) => xs.filter((x) => (x.kind === 'cf') === on && !look.includes(x));
  const late = cf(warn, false).filter((x) => !(x.kind === 'job' && x.h.why === 'held'));
  const steps = [
    alerts ? t(alerts > 1 ? 'jobs.say.alerts' : 'jobs.say.alert', { n: formatNum(alerts) }) : '',
    held ? t('jobs.say.held') : '',
    look.length ? t('jobs.say.look', { names: names(look) }) : '',
    cf(bad, false).length ? t('jobs.say.bad', { names: names(cf(bad, false)) }) : '',
    cf(bad, true).length ? t('jobs.say.cfBad', { names: names(cf(bad, true)) }) : '',
    late.length ? t('jobs.say.warn', { names: names(late) }) : '',
    cf(warn, true).length ? t('jobs.say.cf', { names: names(cf(warn, true)) }) : ''
  ].filter(Boolean);
  const good = counted.filter((x) => x.tone === 'good'), first = counted.filter((x) => x.kind === 'job' && x.h.why === 'first');
  const parts = steps.length
    ? [steps[0], steps.length > 1 ? t('jobs.say.more', { n: formatNum(steps.length - 1) }) : '']
    : [good.length ? t('jobs.say.ok', { n: formatNum(good.length) }) : '', first.length ? t('jobs.say.first', { names: names(first) }) : ''];
  if (s.ext.err) parts.push(t('jobs.say.ext', { code: s.ext.err }));
  const seen = counted.map((x) => x.tone).filter((x) => x !== 'unknown' && x !== 'idle');
  const tone: Tone = seen.length ? worstTone(seen) : counted.length ? 'idle' : 'unknown';
  const needsLook = bad.some((x) => x.kind !== 'svc') || held || alerts > 0 || !!s.kalori?.alert || svc.some((b) => b.v?.needsLook);
  return { tone, w: WORD[tone], word: t(`bots.w.${WORD[tone]}`), sentence: parts.filter(Boolean).join(' '), needsLook, bad: bad.map((x) => x.key), warn: warn.map((x) => x.key) };
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

/** A row's last run (its age, Last run): its newest GitHub run; Chain menus', status.json's run when read. Its newest
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

/** The page's くわしく, only while the GitHub copy failed: its time, whose token read it, its failure. */
function factRows_(s: JobsView, now: number): Fact[] {
  if (!s.ext.err) return [];
  return [
    { id: 'ext', label: t('jobs.fact.ext'), value: s.ext.at === null ? t('bots.key.never') : timeOf(s.ext.at, now) },
    { id: 'by', label: t('jobs.fact.by'), value: s.ext.by === 'app' ? 'GitHub App' : t('jobs.fact.none') },
    { id: 'err', label: t('jobs.fact.err'), value: s.ext.err },
    { id: 'n', label: t('jobs.fact.n'), value: formatNum(s.jobs.filter((j) => j.id !== WATCH).length) }
  ];
}

/** Chain menus' detail (JobRow), from status.json: its verdict's sentence, Next run, Items, the facts, the last 8
 *  weeks' strip, Last changes' bar (none before a first diff) and its links. */
function menuDetail_(k: KaloriStatus, now: number) {
  return {
    say: verdictView(k, now).sentence, next: k.next === null ? null : whenOf(k.next), outcome: edges(k, now).outcome, facts: kaloriFacts(k, now),
    weeks: weekStrip(k, now), change: k.diff && k.verdict !== 'none' ? changeParts(k.diff) : null, links: menuLinks(k, now)
  };
}

// ---- the Cloudflare free tier (/jobs `usage`: relay/src/cfUsage.ts) ----

/** A limit's tone by its share used: good under 60 %, warn from it, bad from 85 % (past 100 % its calls fail). */
export const usageTone = (used: number, max: number): 'good' | 'warn' | 'bad' => (used >= 0.85 * max ? 'bad' : used >= 0.6 * max ? 'warn' : 'good');
const USAGE_ORDER: readonly UsageKey[] = ['doRead', 'doWrite', 'doReq', 'wReq'];

/** 「840」 「38.2k」 「325k」 「1.25M」 「5M」. */
export function compactNum(n: number): string {
  const trim = (x: number, d: number) => String(Number(x.toFixed(d)));
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return `${trim(n / 1e3, n < 1e4 ? 1 : 0)}k`;
  return `${trim(n / 1e6, n < 1e7 ? 2 : 1)}M`;
}
/** 「7%」 (floored: 84.9 % isn't 85 %), 「<1%」 for a little. */
const pctOf = (used: number, max: number): string => (used > 0 && used < max / 100 ? '<1%' : `${Math.floor((100 * used) / max)}%`);

export interface UsageRowView {
  k: UsageKey;
  name: string;
  /** idle: a reading from an earlier UTC day (the limits have reset since). */
  tone: 'good' | 'warn' | 'bad' | 'idle';
  /** The share used, 0–1 (the bar; capped at 1). */
  share: number;
  pct: string;
  of: string;
  by: { name: string; n: string; pct: string }[];
}
export interface UsageView { rows: UsageRowView[]; resets: string; asOf: string | null; note: string | null; trouble: boolean }

/** The section: a row per limit (its tone, share, 「325k / 5M」, who used it), the reset's countdown (00:00 UTC), when
 *  it was read, and a note: unavailable (no reading: its code), couldn't refresh (the day's last kept), or the reading
 *  from an earlier day (its tones idle). Null: a relay from before it. */
function usageView_(u: Usage | undefined, now: number): UsageView | null {
  if (!u) return null;
  const today = new Date(now).toISOString().slice(0, 10);
  const current = u.day === today;
  const rows = [...u.limits].sort((a, b) => USAGE_ORDER.indexOf(a.k) - USAGE_ORDER.indexOf(b.k)).map((l): UsageRowView => ({
    k: l.k, name: t(`jobs.cf.${l.k}`), tone: current ? usageTone(l.used, l.max) : 'idle', share: Math.min(1, l.used / l.max),
    pct: pctOf(l.used, l.max), of: t('jobs.cf.of', { used: compactNum(l.used), max: compactNum(l.max) }),
    by: l.by.map((b) => ({ name: b.name, n: compactNum(b.n), pct: l.used > 0 ? pctOf(b.n, l.used) : '0%' }))
  }));
  const left = Math.max(0, Date.parse(`${today}T00:00:00Z`) + D - now);
  const resets = t('jobs.cf.resets', { in: left >= H ? t('jobs.cf.h', { n: Math.floor(left / H) }) : t('jobs.cf.m', { n: Math.max(1, Math.ceil(left / MIN)) }) });
  const note = !rows.length ? t('jobs.cf.none', { code: u.err ?? 'empty' }) : u.err ? t('jobs.cf.stale', { code: u.err }) : !current && u.day ? t('jobs.cf.old', { day: u.day }) : null;
  return { rows, resets, asOf: rows.length ? agoOf_(u.at, now) : null, note, trouble: rows.some((r) => r.tone === 'warn' || r.tone === 'bad') };
}

export const usageView = en(usageView_);
export const jobName = en(jobName_);
export const menuDetail = en(menuDetail_);
export const verdictOf = en(verdictOf_);
export const layout = en(layout_);
export const whyOf = en(whyOf_);
export const stepsOf = en(stepsOf_);
export const agoOf = en(agoOf_);
export const runLine = en(runLine_);
export const runCells = en(runCells_);
export const dayCells = en(dayCells_);
export const extraRows = en(extraRows_);
export const factRows = en(factRows_);
