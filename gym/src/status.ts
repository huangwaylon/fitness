// GET /status (index.ts): the runner's health and its recent checks, for the app's ボット → ジム (its
// app/src/lib/gym/status.ts mirrors these types). Public, so it holds totals and codes only: no LINE IDs or names,
// no group, no day settings or slot times, no error text. The verdict is decided here; the app only shows it.
import { HacomonoError, RateLimited } from './hacomono.ts';

/** @public (part of the payload the app mirrors, though nothing here names it) */
export type Verdict = 'healthy' | 'degraded' | 'failing' | 'late' | 'broken' | 'stopped' | 'off';
/** @public */
export type Reason =
  | 'mode_off' | 'paused' | 'no_alarm' | 'no_group' | 'webhook_wrong' | 'overdue'
  | 'site_failing' | 'program_failing' | 'push_retry' | 'quota_high';
export type Outcome = 'ok' | 'timeout' | 'rate_limited' | 'http_4xx' | 'http_5xx' | 'empty' | 'error';
export interface Check {
  t: number;                 // start, ms since epoch
  by: 'alarm' | 'tap';       // the alarm, or a 🔎 tap
  web?: true;                // the 🔎 was the app's (a peek: nothing marked announced)
  ms: number;                // duration
  idle?: true;               // an alarm with no day to check: nothing fetched
  r?: Record<'training' | 'pilates', Outcome>;   // absent when idle
  open: number;              // matching open slots (total)
  fresh: number;             // of which new (announced now)
  push: 'none' | 'ok' | 'held' | 'failed';       // held = 🔎: marked announced, not pushed
}
export interface GymStatus {
  v: 1;
  now: number;
  mode: 'bot' | 'off';
  sha: string | null;
  verdict: Verdict;
  reasons: Reason[];         // every reason that applies, in rule order; verdict = the first's
  intervalMin: number;
  paused: boolean;
  nextCheck: number | null;  // the alarm
  lastCheck: number | null;
  lastOk: number | null;     // the last check with every program ok
  lastError: { t: number; code: Outcome | 'push_failed' } | null;
  failures: number;          // fully failed checks in a row
  siteDownSent: boolean;
  retryPending: boolean;     // a failed push waiting for its retry
  checks: Check[];           // newest first: the last CHECKS_MS (a day), at most CHECKS_KEPT
  line: { used: number | null; limit: number | null; webhookOk: boolean | null; asOf: number | null };
}

/** The checks kept for /status (the app's 直近12時間 strip): a day's, at most CHECKS_KEPT (a day at the shortest
 *  interval, 10 min, is 144, and a few 🔎 taps). In the runtime record the check already writes: no storage op of its own. */
export const CHECKS_KEPT = 150;
export const CHECKS_MS = 24 * 3600_000;
/** Past the alarm by more than this: the checks are late. */
const OVERDUE_MS = 5 * 60_000;
const QUOTA_HIGH = 0.8;
/** Fully failed checks in a row before the group is warned (bot.ts) and the site counts as failing. */
export const FAILURES_BEFORE_WARNING = 3;

/** A failed fetch, as a code. */
export function outcomeOf(e: unknown): Outcome {
  if (e instanceof RateLimited) return 'rate_limited';
  if (e instanceof HacomonoError) {
    if (/^HTTP 4\d\d$/.test(e.message)) return 'http_4xx';
    if (/^HTTP 5\d\d$/.test(e.message)) return 'http_5xx';
    if (e.message === 'empty schedule') return 'empty';
  }
  if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) return 'timeout';
  return 'error';
}

type Facts = Pick<GymStatus, 'mode' | 'paused' | 'nextCheck' | 'failures' | 'retryPending' | 'checks' | 'line'> & {
  now: number;
  groupSet: boolean;
  /** The alarm's check is running (its alarm reads as unset meanwhile). */
  running: boolean;
};

/** The verdict and every reason that applies, in rule order (the verdict is the first's). */
export function statusOf(f: Facts): Pick<GymStatus, 'verdict' | 'reasons'> {
  const newest = f.checks.find((c) => !c.idle);
  const { used, limit } = f.line;
  const rules: [Reason, boolean, Verdict][] = [
    ['mode_off', f.mode === 'off', 'off'],
    ['paused', f.paused, 'stopped'],
    ['no_alarm', f.mode === 'bot' && !f.paused && !f.running && f.nextCheck === null, 'broken'],
    ['no_group', !f.groupSet, 'broken'],
    ['webhook_wrong', f.line.webhookOk === false, 'broken'],
    ['overdue', f.nextCheck !== null && f.now > f.nextCheck + OVERDUE_MS, 'late'],
    ['site_failing', f.failures > 0, f.failures >= FAILURES_BEFORE_WARNING ? 'failing' : 'degraded'],
    ['program_failing', !!newest?.r && Object.values(newest.r).some((o) => o !== 'ok'), 'degraded'],
    ['push_retry', f.retryPending, 'degraded'],
    ['quota_high', used !== null && !!limit && used / limit >= QUOTA_HIGH, 'degraded'],
  ];
  const apply = rules.filter(([, applies]) => applies);
  return { verdict: apply[0]?.[2] ?? 'healthy', reasons: apply.map(([reason]) => reason) };
}
