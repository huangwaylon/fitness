// The gym bot's status (docs/design.md "Settings": 設定's ジムボット page): the Worker's public GET /status, read
// as it is (the verdict is decided there), with the page's view helpers so GymPage stays thin.
import { t } from '#lib/i18n/index.ts';
import { formatSyncTime } from '#lib/i18n/format.ts';
import '#lib/i18n/gym.ts';

// ---- The payload: mirrors gym/src/status.ts (the Worker owns it; change both together) ----
type Verdict = 'healthy' | 'degraded' | 'failing' | 'late' | 'broken' | 'stopped' | 'off';
type Reason =
  | 'mode_off' | 'paused' | 'no_alarm' | 'no_group' | 'webhook_wrong' | 'overdue'
  | 'site_failing' | 'program_failing' | 'push_retry' | 'quota_high';
type Outcome = 'ok' | 'timeout' | 'rate_limited' | 'http_4xx' | 'http_5xx' | 'empty' | 'error';
export interface Check {
  t: number;                 // start, ms since epoch
  by: 'alarm' | 'tap';       // the alarm, or a 🔎 tap
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
  checks: Check[];           // newest first, at most CHECKS_KEPT = 12
  line: { used: number | null; limit: number | null; webhookOk: boolean | null; asOf: number | null };
}

/** The Worker's origin; VITE_GYM_URL overrides it (empty = 設定's section hidden). vite.config.ts's CSP allows it. */
export const GYM_URL: string = (import.meta.env?.VITE_GYM_URL as string | undefined) ?? 'https://gym-bot.island-fund-relay.workers.dev';

const VERDICTS: readonly Verdict[] = ['healthy', 'degraded', 'failing', 'late', 'broken', 'stopped', 'off'];
const REASONS: readonly Reason[] = ['mode_off', 'paused', 'no_alarm', 'no_group', 'webhook_wrong', 'overdue', 'site_failing', 'program_failing', 'push_retry', 'quota_high'];
const OUTCOMES: readonly Outcome[] = ['ok', 'timeout', 'rate_limited', 'http_4xx', 'http_5xx', 'empty', 'error'];
const PROGRAMS = ['training', 'pilates'] as const;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

function parseCheck(x: unknown): Check | null {
  if (!isObj(x) || num(x.t) === null || (x.by !== 'alarm' && x.by !== 'tap')) return null;
  const r = isObj(x.r) && PROGRAMS.every((p) => OUTCOMES.includes((x.r as Record<string, Outcome>)[p])) ? (x.r as Check['r']) : undefined;
  if (x.idle !== true && !r) return null;
  const push = (['none', 'ok', 'held', 'failed'] as const).find((p) => p === x.push) ?? 'none';
  return { t: x.t as number, by: x.by, ms: num(x.ms) ?? 0, ...(x.idle === true ? { idle: true } : { r }), open: num(x.open) ?? 0, fresh: num(x.fresh) ?? 0, push };
}

/** A /status answer as the page reads it, or null when it isn't one (another version, a proxy's page, garbage). The
 *  verdict and the times must be there; a malformed check or an unknown reason is left out. */
export function parseStatus(x: unknown): GymStatus | null {
  if (!isObj(x) || x.v !== 1 || num(x.now) === null || !VERDICTS.includes(x.verdict as Verdict)) return null;
  const line = isObj(x.line) ? x.line : {};
  const err = isObj(x.lastError) && num(x.lastError.t) !== null && typeof x.lastError.code === 'string' ? (x.lastError as GymStatus['lastError']) : null;
  return {
    v: 1, now: x.now as number, mode: x.mode === 'off' ? 'off' : 'bot', sha: typeof x.sha === 'string' ? x.sha : null,
    verdict: x.verdict as Verdict,
    reasons: Array.isArray(x.reasons) ? x.reasons.filter((r): r is Reason => REASONS.includes(r as Reason)) : [],
    intervalMin: num(x.intervalMin) ?? 0, paused: x.paused === true,
    nextCheck: num(x.nextCheck), lastCheck: num(x.lastCheck), lastOk: num(x.lastOk), lastError: err,
    failures: num(x.failures) ?? 0, siteDownSent: x.siteDownSent === true, retryPending: x.retryPending === true,
    checks: Array.isArray(x.checks) ? x.checks.map(parseCheck).filter((c): c is Check => c !== null) : [],
    line: { used: num(line.used), limit: num(line.limit), webhookOk: typeof line.webhookOk === 'boolean' ? line.webhookOk : null, asOf: num(line.asOf) }
  };
}

/** GET /status. Throws on a failed request or an answer that isn't one. */
export async function fetchStatus(signal?: AbortSignal, url = GYM_URL): Promise<GymStatus> {
  const res = await fetch(`${url}/status`, { signal });
  if (!res.ok) throw new Error(`gym status: HTTP ${res.status}`);
  const s = parseStatus(await res.json());
  if (!s) throw new Error('gym status: not a status');
  return s;
}

// ---- The page's view ----
/** The verdict card's dot: leaf, yuzu, coral, or soft for a runner that was switched off. */
export type Tone = 'good' | 'warn' | 'bad' | 'idle';
const TONE: Record<Verdict, Tone> = { healthy: 'good', degraded: 'warn', late: 'warn', failing: 'bad', broken: 'bad', stopped: 'idle', off: 'idle' };

/** The verdict card: its tone, its word, and one plain sentence from the first reason. */
export function verdictView(s: GymStatus): { tone: Tone; word: string; sentence: string } {
  const r = s.reasons[0];
  return { tone: TONE[s.verdict], word: t(`gym.verdict.${s.verdict}`), sentence: t(`gym.reason.${r ?? 'none'}`, { n: s.failures }) };
}

const at = (ms: number | null, today: string): string => formatSyncTime(ms === null ? null : new Date(ms), today);

/** The fact rows under the card: 最後の成功 only when it isn't the last check, 連続失敗 only when there are any. */
export function factRows(s: GymStatus, today: string): { id: string; label: string; value: string }[] {
  const { used, limit } = s.line;
  return [
    { id: 'last', label: t('gym.lastCheck'), value: at(s.lastCheck, today) },
    { id: 'next', label: t('gym.next'), value: s.nextCheck === null ? t('gym.none') : t('gym.nextAt', { time: at(s.nextCheck, today) }) },
    ...(s.lastOk !== s.lastCheck ? [{ id: 'ok', label: t('gym.lastOk'), value: at(s.lastOk, today) }] : []),
    ...(s.failures > 0 ? [{ id: 'failures', label: t('gym.failures'), value: t('gym.failuresN', { n: s.failures }) }] : []),
    { id: 'line', label: t('gym.line'), value: used === null ? t('gym.unknown') : limit === null ? t('gym.lineNoLimit', { used }) : t('gym.lineOf', { used, limit }) }
  ];
}

/** One check's line: its time (with the date when it wasn't `today`), 定時 or 手動, ○/✕ per program (none when idle),
 *  the open count, and for a failed one what failed, in words. */
export function checkLine(c: Check, today: string): {
  time: string; by: string; idle: boolean; marks: { id: string; name: string; ok: boolean }[]; open: string; problems: string[];
} {
  const r = c.r;
  const marks = r ? PROGRAMS.map((p) => ({ id: p, name: t(`gym.prog.${p}`), ok: r[p] === 'ok' })) : [];
  const problems = r ? PROGRAMS.filter((p) => r[p] !== 'ok').map((p) => t('gym.problem', { program: t(`gym.prog.${p}`), outcome: t(`gym.outcome.${r[p]}`) })) : [];
  if (c.push === 'failed') problems.push(t('gym.pushFailed'));
  return { time: at(c.t, today), by: t(`gym.by.${c.by}`), idle: !r, marks, open: t('gym.open', { n: c.open }), problems };
}
