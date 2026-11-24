// ボット → 定期処理's contract (docs/bots.md "Jobs"): the relay's `GET /jobs` (relay/src/jobs.ts) and the page
// (lib/jobs/status.ts). Every recurring job, where it runs, its nominal cadence; each one's last runs (newest first,
// at most RUNS_KEPT) and its Tokyo days' [ok, fail] counts (at most DAYS_KEPT). Codes and times only: the repo is
// public, the guest reads it.
import { isNum, isRec } from './guards.ts';

export type JobGroup = 'server' | 'github' | 'bot';
export type JobId =
  | 'tick' | 'wx' | 'places' | 'nightly' | 'backup'
  | 'health' | 'its-health' | 'places-pull' | 'places-details' | 'e2e-flake-hunt' | 'kalori-scrape' | 'kalori-watch' | 'pages' | 'e2e-logic-full'
  | 'dispatch' | 'gym';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;
/** Each job: its group, nominal cadence (ms; null: runs on an event, never late) and one of its scheduled times (`at`:
 *  the next is `at` plus whole cadences; a job that hasn't run yet reads 初回 then). Left to right, top to bottom. */
export const JOBS: readonly { id: JobId; group: JobGroup; every: number | null; at?: string }[] = [
  { id: 'tick', group: 'server', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'wx', group: 'server', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'places', group: 'server', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'nightly', group: 'server', every: D, at: '2026-11-24T03:00+09:00' },
  { id: 'backup', group: 'server', every: D, at: '2026-11-24T03:00+09:00' },
  // (its-bot dispatches these at :15 and :45)
  { id: 'health', group: 'github', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'its-health', group: 'github', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'places-pull', group: 'github', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  { id: 'places-details', group: 'github', every: D, at: '2026-11-24T03:30+09:00' },
  { id: 'e2e-flake-hunt', group: 'github', every: D, at: '2026-11-24T04:30+09:00' },
  { id: 'kalori-watch', group: 'github', every: 6 * H, at: '2026-11-24T03:29+09:00' },
  { id: 'kalori-scrape', group: 'github', every: 7 * D, at: '2026-11-25T02:41+09:00' },
  { id: 'pages', group: 'github', every: null },
  { id: 'e2e-logic-full', group: 'github', every: null },
  { id: 'dispatch', group: 'bot', every: 30 * MIN, at: '2026-11-24T00:15+09:00' },
  // (gym-bot's interval is its own setting, and it pauses: its lateness is ジム's tab's)
  { id: 'gym', group: 'bot', every: null }
];
/** The GitHub workflows read (their file's name is the job's id). @public (relay/src/jobs.ts) */
export const WORKFLOWS: readonly JobId[] = JOBS.filter((j) => j.group === 'github').map((j) => j.id);
export const RUNS_KEPT = 24;
export const DAYS_KEPT = 14;

/** A run's outcome: ok, warn (a part failed), fail, idle (ran with nothing to do, or was skipped / cancelled), run (under way). */
export type RunSt = 'ok' | 'warn' | 'fail' | 'idle' | 'run';
/** What started it (GitHub's): s schedule, d workflow_dispatch, p push, r workflow_run, m anything else. @public (relay/src/jobs.ts) */
export type RunBy = 's' | 'd' | 'p' | 'r' | 'm';
export interface JobRun {
  /** Its start (ms). */
  t: number;
  st: RunSt;
  /** Its duration (ms), when known. */
  ms?: number;
  /** A short code: a conclusion, an error's class, the failed parts. */
  c?: string;
  by?: RunBy;
  /** A GitHub run's id (its page: runUrl). */
  id?: number;
}
/** A Tokyo day's counts: [YYYY-MM-DD, ok, fail]. @public (relay/src/jobs.ts) */
export type JobDay = [string, number, number];
export interface JobRow {
  id: JobId;
  runs: JobRun[];
  days: JobDay[];
  /** More facts: nightly's parts (`<job>`: hours since it last finished, -1 never), places-pull's `syncedAt`. */
  x?: Record<string, number>;
}
/** An open alert issue: its number, title, label (or `ops`), when it was opened. @public (relay/src/jobs.ts) */
export interface JobAlert { n: number; title: string; label: string; at: number }
export interface JobsStatus {
  ok: true;
  v: 1;
  now: number;
  /** When the relay began keeping its own jobs' runs (absent: not known): a job with none scheduled after it is late. */
  since?: number;
  /** The GitHub and gym copy: when it was read, with whose token (app / none), its failure code. */
  ext: { at: number | null; by: 'app' | null; err: string | null };
  jobs: JobRow[];
  /** The open alert issues. */
  alerts: JobAlert[];
}

const REPO_URL = 'https://github.com/huangwaylon/fitness';
export const runUrl = (id: number): string => `${REPO_URL}/actions/runs/${id}`;
export const issueUrl = (n: number): string => `${REPO_URL}/issues/${n}`;
export const workflowUrl = (wf: string): string => `${REPO_URL}/actions/workflows/${wf}.yml`;

const STS: readonly RunSt[] = ['ok', 'warn', 'fail', 'idle', 'run'];
const BYS: readonly RunBy[] = ['s', 'd', 'p', 'r', 'm'];
const IDS = new Set<string>(JOBS.map((j) => j.id));
const short = (v: unknown, max: number): string | undefined => (typeof v === 'string' && v.length > 0 ? v.slice(0, max) : undefined);

function parseRun(x: unknown): JobRun | null {
  if (!isRec(x) || !isNum(x.t) || !STS.includes(x.st as RunSt)) return null;
  const r: JobRun = { t: x.t, st: x.st as RunSt };
  if (isNum(x.ms) && x.ms >= 0) r.ms = x.ms;
  const c = short(x.c, 40);
  if (c) r.c = c;
  if (BYS.includes(x.by as RunBy)) r.by = x.by as RunBy;
  if (isNum(x.id)) r.id = x.id;
  return r;
}

const isDay = (x: unknown): x is JobDay => Array.isArray(x) && x.length === 3 && typeof x[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x[0]) && isNum(x[1]) && isNum(x[2]);

/** `/jobs`'s answer read back (the phone's kept copy too), unknown jobs and bad runs dropped; null when it isn't one. */
export function parseJobs(x: unknown): JobsStatus | null {
  if (!isRec(x) || x.ok !== true || x.v !== 1 || !isNum(x.now) || !Array.isArray(x.jobs) || !isRec(x.ext)) return null;
  const e = x.ext;
  const jobs: JobRow[] = [];
  for (const j of x.jobs) {
    if (!isRec(j) || typeof j.id !== 'string' || !IDS.has(j.id) || !Array.isArray(j.runs)) continue;
    const row: JobRow = {
      id: j.id as JobId,
      runs: j.runs.map(parseRun).filter((r): r is JobRun => r !== null).slice(0, RUNS_KEPT),
      days: (Array.isArray(j.days) ? j.days.filter(isDay) : []).slice(-DAYS_KEPT)
    };
    if (isRec(j.x)) row.x = Object.fromEntries(Object.entries(j.x).filter(([, v]) => isNum(v))) as Record<string, number>;
    jobs.push(row);
  }
  const alerts = (Array.isArray(x.alerts) ? x.alerts : []).flatMap((a): JobAlert[] =>
    isRec(a) && isNum(a.n) && typeof a.title === 'string' && typeof a.label === 'string' && isNum(a.at) ? [{ n: a.n, title: a.title.slice(0, 120), label: a.label.slice(0, 30), at: a.at }] : []);
  return {
    ok: true, v: 1, now: x.now, ...(isNum(x.since) ? { since: x.since } : {}), jobs, alerts,
    ext: { at: isNum(e.at) ? e.at : null, by: e.by === 'app' ? 'app' : null, err: short(e.err, 40) ?? null }
  };
}
