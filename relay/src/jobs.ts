// ボット → 定期処理 (docs/bots.md "定期処理"; contract: app/src/lib/contract/jobs.ts): every recurring job's last runs and
// days, for `GET /jobs` (a person's key: the guest's too). Free of the Workers runtime (test/jobs.test.ts).
// - The relay's own jobs keep rings in the record object's storage, one key per writer: `jobs|tick` (the :15/:45 cron's
//   tick, the weather, the places' categories: one put a tick), `jobs|nightly` (a cell a Tokyo day), `jobs|backup`.
// - GitHub's workflows, the open alert issues and gym-bot's checks are a copy (`jobs|ext`, one put a refresh): read on
//   the cron's tick, and by a phone's read finding it older than EXT_STALE_MS (in the background: the answer is the
//   copy), one refresh at a time. GitHub is never asked per request. Its token: the shared GitHub App's, narrowed to
//   `actions: read` on fitness. Each workflow's days are counted once per run (`seen`: the newest run counted, none
//   after one still under way), so the 14 days outlive the page of runs read.
// - Logged: nothing (a refresh's failure is the copy's `err`, shown on the page).
import { localDateAt } from '../../app/src/lib/contract/tokyo.ts';
import { DAYS_KEPT, JOBS, RUNS_KEPT, WORKFLOWS, type JobAlert, type JobDay, type JobId, type JobRow, type JobRun, type JobsStatus, type RunBy, type RunSt } from '../../app/src/lib/contract/jobs.ts';
import { bearerOf, corsOf } from './auth.ts';
import { isNum, isRec } from '../../app/src/lib/contract/guards.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

/** A job's history: its last runs (newest first) and its days' [ok, fail]. */
export interface Ring { r: JobRun[]; d: JobDay[] }
const EMPTY: Ring = { r: [], d: [] };
/** The tick's key: the cron's own tick, the weather, the places' categories. */
export type TickRings = Partial<Record<'tick' | 'wx' | 'places', Ring>>;
/** The copy: GitHub's workflows (and `seen`, the newest run counted), its-bot's dispatches, gym-bot's checks, the alerts. */
export interface Ext {
  at: number | null;
  by: 'app' | null;
  err: string | null;
  rows: Partial<Record<JobId, Ring & { seen?: number }>>;
  alerts: JobAlert[];
}
export const NO_EXT: Ext = { at: null, by: null, err: null, rows: {}, alerts: [] };

export const KEY = { tick: 'jobs|tick', nightly: 'jobs|nightly', backup: 'jobs|backup', ext: 'jobs|ext' } as const;
/** A read finds the copy stale after this (then refreshes it); the cron's tick after EXT_CRON_MS. */
export const EXT_STALE_MS = 5 * 60_000;
export const EXT_CRON_MS = 4 * 60_000;
const REPO = 'huangwaylon/fitness';
const API = `https://api.github.com/repos/${REPO}`;
const UA = 'island-fund-relay (huangwaylon/fitness relay)';
/** The labels (and a title prefix) of the alert issues the workflows open. */
const ALERT_LABELS = ['alert', 'its-alert', 'gym-alert', 'flake'];
const OPS_TITLE = /^ops:/i;
/** Runs read per workflow: the strip's and a margin. */
const PER_PAGE = 30;
/** its-bot dispatches at :15 and :45 (its/worker/src/dispatch.ts dueHealth): a slot's dispatch is created in its first minutes. */
const SLOT_MS = 30 * 60_000, SLOT_OFF_MS = 15 * 60_000, DISPATCH_WINDOW_MS = 5 * 60_000;
const DISPATCHED: readonly JobId[] = ['health', 'its-health', 'places-pull'];
const DAY_MS = 86_400_000;

const counted = (st: RunSt): [number, number] => (st === 'ok' ? [1, 0] : st === 'fail' || st === 'warn' ? [0, 1] : [0, 0]);

/** Days added to (or set, `set`), the last DAYS_KEPT Tokyo days up to `now`'s, oldest first. */
function addDay(days: readonly JobDay[], day: string, ok: number, fail: number, now: number, set = false): JobDay[] {
  const out = days.map((d) => [...d] as JobDay);
  const i = out.findIndex((d) => d[0] === day);
  if (i >= 0) out[i] = set ? [day, ok, fail] : [day, out[i][1] + ok, out[i][2] + fail];
  else out.push([day, ok, fail]);
  return trimDays(out, now);
}
const trimDays = (days: JobDay[], now: number): JobDay[] => {
  const first = localDateAt(now - (DAYS_KEPT - 1) * DAY_MS);
  return days.filter((d) => d[0] >= first).sort((a, b) => a[0].localeCompare(b[0]));
};

/** A run noted (newest first, RUNS_KEPT), counted in its day. */
export function noteRun(ring: Ring | undefined, run: JobRun, now: number): Ring {
  const r = ring ?? EMPTY;
  const [ok, fail] = counted(run.st);
  return { r: [run, ...r.r].slice(0, RUNS_KEPT), d: ok || fail ? addDay(r.d, localDateAt(run.t), ok, fail, now) : trimDays([...r.d], now) };
}

/** A day's run (nightly: a cell a Tokyo day): replaces that day's run and its count. */
export function noteDayRun(ring: Ring | undefined, run: JobRun, now: number): Ring {
  const r = ring ?? EMPTY, day = localDateAt(run.t);
  const [ok, fail] = counted(run.st);
  return { r: [run, ...r.r.filter((x) => localDateAt(x.t) !== day)].slice(0, RUNS_KEPT), d: addDay(r.d, day, ok, fail, now, true) };
}

/** The tick's outcomes as runs: the tick itself, the weather (not due: idle), the places' categories (nothing to do: idle). */
export function tickRuns(o: { t: number; ms: number; wx: { ok: boolean; fetched: boolean; fail?: string } | null; places: { ok: boolean; why?: string; ai?: number; aiFail?: number } | null }): Record<'tick' | 'wx' | 'places', JobRun> {
  const wx: JobRun = !o.wx ? { t: o.t, st: 'fail', c: 'threw' } : !o.wx.fetched ? { t: o.t, st: 'idle' } : o.wx.ok ? { t: o.t, st: 'ok' } : { t: o.t, st: 'fail', c: o.wx.fail ?? 'fail' };
  const p = o.places;
  const places: JobRun = !p ? { t: o.t, st: 'fail', c: 'threw' } : !p.ok ? { t: o.t, st: 'fail', c: p.why ?? 'fail' }
    : p.aiFail ? { t: o.t, st: 'warn', c: `ai_fail:${p.aiFail}` } : p.ai ? { t: o.t, st: 'ok' } : { t: o.t, st: 'idle' };
  return { tick: { t: o.t, st: 'ok', ms: o.ms }, wx, places };
}

// ---- GitHub ----

/** A run as the Actions API lists it (the fields read). */
interface GhRun { id: number; status: string; conclusion: string | null; event: string; created_at: string; run_started_at?: string; updated_at: string; triggering_actor?: { login?: string } | null }

const BY: Record<string, RunBy> = { schedule: 's', workflow_dispatch: 'd', push: 'p', workflow_run: 'r' };
const FAIL = new Set(['failure', 'timed_out', 'startup_failure', 'action_required']);

/** A GitHub run as a job's run. */
function ghRun(g: GhRun): JobRun {
  const t = Date.parse(g.run_started_at ?? g.created_at);
  const by = BY[g.event] ?? 'm';
  if (g.status !== 'completed') return { t, st: 'run', by, id: g.id };
  const st: RunSt = g.conclusion === 'success' ? 'ok' : FAIL.has(g.conclusion ?? '') ? 'fail' : 'idle';
  const ms = Date.parse(g.updated_at) - t;
  return { t, st, ...(ms >= 0 ? { ms } : {}), ...(st === 'ok' ? {} : { c: g.conclusion ?? 'none' }), by, id: g.id };
}

const ghRuns = (x: unknown): GhRun[] => (isRec(x) && Array.isArray(x.workflow_runs) ? x.workflow_runs.filter((r): r is GhRun => isRec(r) && isNum(r.id) && typeof r.created_at === 'string' && typeof r.updated_at === 'string') : []);

/** A workflow's row from its page of runs (newest first; the skipped dropped): the runs, and each run counted in its day once (`seen`). */
export function wfRow(old: (Ring & { seen?: number }) | undefined, all: readonly GhRun[], now: number): Ring & { seen?: number } {
  // (a run whose jobs were all skipped, e2e logic full's for a gate that doesn't qualify, isn't one)
  const page = all.filter((g) => g.conclusion !== 'skipped');
  const runs = page.map(ghRun);
  let d = old?.d ?? [], seen = old?.seen;
  // (oldest first; none past one still under way: it is counted once it ends)
  const asc = page.map((g, i) => ({ g, r: runs[i] })).sort((a, b) => a.g.id - b.g.id);
  const open = asc.find((x) => x.r.st === 'run')?.g.id ?? Infinity;
  for (const { g, r } of asc) {
    if (g.id >= open) break;
    if (seen !== undefined && g.id <= seen) continue;
    const [ok, fail] = counted(r.st);
    // (the first read counts the page as it is)
    if (ok || fail) d = addDay(d, localDateAt(r.t), ok, fail, now);
    seen = g.id;
  }
  return { r: runs.slice(0, RUNS_KEPT), d: trimDays([...d], now), ...(seen !== undefined ? { seen } : {}) };
}

/** its-bot's dispatches: a cell per :15/:45 slot the pages cover, ok when a workflow_dispatch of a health workflow was
 *  created in its first DISPATCH_WINDOW_MS (`c` app: the GitHub App's bot, pat: another actor), else fail (`none`); the
 *  slot under way (younger than the window) left out. Each slot counted once (`seen`: the last slot counted). */
export function dispatchRow(old: (Ring & { seen?: number }) | undefined, pages: readonly (readonly GhRun[])[], now: number): Ring & { seen?: number } {
  const all = pages.flat();
  if (!all.length) return old ?? { ...EMPTY };
  // (each page covers back to its oldest run: the slots after the latest of those)
  const from = Math.max(...pages.filter((p) => p.length).map((p) => Math.min(...p.map((g) => Date.parse(g.created_at)))));
  const slotOf = (t: number) => Math.floor((t - SLOT_OFF_MS) / SLOT_MS) * SLOT_MS + SLOT_OFF_MS;
  const sent = new Map<number, 'app' | 'pat'>();
  for (const g of all) {
    if (g.event !== 'workflow_dispatch') continue;
    const c = Date.parse(g.created_at), s = slotOf(c);
    if (c - s >= DISPATCH_WINDOW_MS) continue;
    if (sent.get(s) !== 'app') sent.set(s, g.triggering_actor?.login?.endsWith('[bot]') ? 'app' : 'pat');
  }
  const fresh: JobRun[] = [];
  for (let s = slotOf(now - DISPATCH_WINDOW_MS); s >= from && fresh.length < RUNS_KEPT; s -= SLOT_MS) {
    const by = sent.get(s);
    fresh.push(by ? { t: s, st: 'ok', c: by } : { t: s, st: 'fail', c: 'none' });
  }
  const newest = fresh[0]?.t ?? -Infinity, oldest = fresh.at(-1)?.t ?? Infinity;
  const runs = [...fresh, ...(old?.r ?? []).filter((r) => r.t < oldest && r.t < newest)].slice(0, RUNS_KEPT);
  let d = old?.d ?? [], seen = old?.seen;
  for (const r of [...fresh].reverse()) {
    if (seen !== undefined && r.t <= seen) continue;
    const [ok, fail] = counted(r.st);
    d = addDay(d, localDateAt(r.t), ok, fail, now);
    seen = r.t;
  }
  return { r: runs, d: trimDays([...d], now), ...(seen !== undefined ? { seen } : {}) };
}

/** The open alert issues (no pull requests): an alert label, or an `Ops:` title. */
export function alertsOf(x: unknown): JobAlert[] {
  if (!Array.isArray(x)) return [];
  return x.flatMap((i): JobAlert[] => {
    if (!isRec(i) || i.pull_request || !isNum(i.number) || typeof i.title !== 'string' || typeof i.created_at !== 'string') return [];
    const labels = (Array.isArray(i.labels) ? i.labels : []).map((l) => (isRec(l) && typeof l.name === 'string' ? l.name : '')).filter(Boolean);
    const label = labels.find((l) => ALERT_LABELS.includes(l)) ?? (OPS_TITLE.test(i.title) ? 'ops' : null);
    return label ? [{ n: i.number, title: i.title.slice(0, 120), label, at: Date.parse(i.created_at) }] : [];
  });
}

// ---- gym-bot ----

/** gym-bot's checks (its public /status, newest first) as runs: idle (no day to check), ok (every program), warn (some),
 *  fail (none: the first's outcome its code). Each check counted once (`seen`: the newest's time). */
export function gymRow(old: (Ring & { seen?: number }) | undefined, status: unknown, now: number): Ring & { seen?: number } {
  const checks = isRec(status) && Array.isArray(status.checks) ? status.checks.filter((c): c is Record<string, unknown> => isRec(c) && isNum(c.t)) : [];
  const runs = checks.map((c): JobRun => {
    const ms = isNum(c.ms) ? { ms: c.ms } : {};
    const outs = isRec(c.r) ? Object.values(c.r).filter((v): v is string => typeof v === 'string') : [];
    if (c.idle === true || !outs.length) return { t: c.t as number, st: 'idle', ...ms };
    const bad = outs.filter((o) => o !== 'ok');
    return { t: c.t as number, st: !bad.length ? 'ok' : bad.length < outs.length ? 'warn' : 'fail', ...ms, ...(bad.length ? { c: bad[0] } : {}) };
  });
  let d = old?.d ?? [], seen = old?.seen;
  for (const r of [...runs].reverse()) {
    if (seen !== undefined && r.t <= seen) continue;
    const [ok, fail] = counted(r.st);
    if (ok || fail) d = addDay(d, localDateAt(r.t), ok, fail, now);
    seen = r.t;
  }
  return { r: runs.slice(0, RUNS_KEPT), d: trimDays([...d], now), ...(seen !== undefined ? { seen } : {}) };
}

// ---- the refresh ----

export interface ExtDeps {
  now: number;
  fetch: typeof fetch;
  /** The App's token (null: none, GitHub not asked). */
  token: string | null;
  /** gym-bot's /status (the GYM_BOT binding), absent without it. */
  gym?: () => Promise<Response>;
}

const ghGet = (d: ExtDeps, path: string) => d.fetch(`${API}${path}`, {
  headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${d.token}`, 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28' }
});

/** The copy read again: each workflow's runs, the dispatches, the alerts, the gym's checks. A part that fails keeps its
 *  old rows; the first failure's code is `err` (`no_token`, `gh_<status>`, `gh_fetch`, `gym_<status>`). Never throws. */
export async function refreshExt(old: Ext, d: ExtDeps): Promise<Ext> {
  const rows = { ...old.rows };
  const errs: string[] = [];
  const pages: Partial<Record<JobId, GhRun[]>> = {};
  if (!d.token) errs.push('no_token');
  else {
    await Promise.all(WORKFLOWS.map(async (wf) => {
      try {
        const res = await ghGet(d, `/actions/workflows/${wf}.yml/runs?per_page=${PER_PAGE}&exclude_pull_requests=true`);
        if (!res.ok) return void errs.push(`gh_${res.status}`);
        pages[wf] = ghRuns(await res.json());
      } catch {
        errs.push('gh_fetch');
      }
    }));
    for (const wf of WORKFLOWS) if (pages[wf]) rows[wf] = wfRow(old.rows[wf], pages[wf], d.now);
    if (DISPATCHED.every((wf) => pages[wf])) rows.dispatch = dispatchRow(old.rows.dispatch, DISPATCHED.map((wf) => pages[wf]!), d.now);
  }
  let alerts = old.alerts;
  if (d.token) {
    try {
      const res = await ghGet(d, '/issues?state=open&per_page=50');
      if (res.ok) alerts = alertsOf(await res.json());
      else errs.push(`issues_${res.status}`);
    } catch {
      errs.push('gh_fetch');
    }
  }
  if (d.gym) {
    try {
      const res = await d.gym();
      if (res.ok) rows.gym = gymRow(old.rows.gym, await res.json(), d.now);
      else errs.push(`gym_${res.status}`);
    } catch {
      errs.push('gym_fetch');
    }
  }
  return { at: d.now, by: d.token ? 'app' : null, err: errs[0] ?? null, rows, alerts };
}

/** `/jobs`'s answer: every job in JOBS's order (none kept: no runs), nightly's parts' ages and places-pull's last sync. */
export function jobsStatus(s: { tick?: TickRings; nightly?: Ring; backup?: Ring; ext: Ext; nightlyAges: Record<string, number>; syncedAt: number | null; now: number }): JobsStatus {
  const ring = (id: JobId): Ring | undefined =>
    id === 'tick' || id === 'wx' || id === 'places' ? s.tick?.[id] : id === 'nightly' ? s.nightly : id === 'backup' ? s.backup : s.ext.rows[id];
  const jobs = JOBS.map(({ id }): JobRow => {
    const r = ring(id);
    const row: JobRow = { id, runs: r?.r ?? [], days: r?.d ?? [] };
    if (id === 'nightly') row.x = s.nightlyAges;
    if (id === 'places-pull' && s.syncedAt !== null) row.x = { syncedAt: s.syncedAt };
    return row;
  });
  return { ok: true, v: 1, now: s.now, ext: { at: s.ext.at, by: s.ext.by, err: s.ext.err }, jobs, alerts: s.ext.alerts };
}

/** `GET /jobs`: a person's key (the guest's too), CORS for the app's origin. */
export async function jobsRoute(req: Request, env: { allowed: string; roleOf(key: string): Who | null; read(): Promise<string> }): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), env.allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const base = { ...cors, 'Cache-Control': 'private, no-store' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...base, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Authorization, X-Request-Id', 'Access-Control-Max-Age': '86400' } });
  if (req.method !== 'GET') return new Response('method not allowed', { status: 405, headers: { ...base, Allow: 'GET' } });
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: base });
  if (!env.roleOf(bearerOf(req))) return json({ ok: false, error: 'unauthorized' }, 401);
  try {
    return new Response(await env.read(), { headers: { ...base, 'Content-Type': 'application/json' } });
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
