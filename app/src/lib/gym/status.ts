// The gym bot's status (docs/design.md "Bots": ボット's ジム tab): the Worker's public GET /status, read
// as it is (the verdict is decided there; checked with contract/guards.ts), a failed read logged as gym.fail (public:
// no key, so not lib/keyed.ts), with the page's view helpers so GymPage stays thin (直近12時間: lib/strip.ts).
import { t } from '#lib/i18n/index.ts';
import { formatSyncTime } from '#lib/i18n/format.ts';
import { isNum, isRec } from '#lib/contract/guards.ts';
import { chain, hhmm, stripTicks, type CellState, type StripCell, type StripTick } from '#lib/strip.ts';
import { fetchPublic, type PublicReply } from '#lib/bots/fetchPublic.ts';
import type { BotTone, BotWord } from '#lib/bots/types.ts';
import '#lib/i18n/gym.ts';
import '#lib/i18n/bots.ts';

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
  checks: Check[];           // newest first: a day's (an older Worker: the last 12)
  line: { used: number | null; limit: number | null; webhookOk: boolean | null; asOf: number | null };
}

/** The Worker's origin; VITE_GYM_URL overrides it (empty = ボット's ジム tab hidden). vite.config.ts's CSP allows it. */
export const GYM_URL: string = (import.meta.env?.VITE_GYM_URL as string | undefined) ?? 'https://gym-bot.island-fund-relay.workers.dev';

const VERDICTS: readonly Verdict[] = ['healthy', 'degraded', 'failing', 'late', 'broken', 'stopped', 'off'];
const REASONS: readonly Reason[] = ['mode_off', 'paused', 'no_alarm', 'no_group', 'webhook_wrong', 'overdue', 'site_failing', 'program_failing', 'push_retry', 'quota_high'];
const OUTCOMES: readonly Outcome[] = ['ok', 'timeout', 'rate_limited', 'http_4xx', 'http_5xx', 'empty', 'error'];
const PROGRAMS = ['training', 'pilates'] as const;

const num = (x: unknown): number | null => (isNum(x) ? x : null);
/** At most this many checks read (the Worker keeps 150). */
const CHECKS_MAX = 200;

function parseCheck(x: unknown): Check | null {
  if (!isRec(x) || num(x.t) === null || (x.by !== 'alarm' && x.by !== 'tap')) return null;
  const r = isRec(x.r) && PROGRAMS.every((p) => OUTCOMES.includes((x.r as Record<string, Outcome>)[p])) ? (x.r as Check['r']) : undefined;
  if (x.idle !== true && !r) return null;
  const push = (['none', 'ok', 'held', 'failed'] as const).find((p) => p === x.push) ?? 'none';
  return { t: x.t as number, by: x.by, ms: num(x.ms) ?? 0, ...(x.idle === true ? { idle: true } : { r }), open: num(x.open) ?? 0, fresh: num(x.fresh) ?? 0, push };
}

/** A /status answer as the page reads it, or null when it isn't one (another version, a proxy's page, garbage). The
 *  verdict and the times must be there; a malformed check or an unknown reason is left out. */
export function parseStatus(x: unknown): GymStatus | null {
  if (!isRec(x) || x.v !== 1 || num(x.now) === null || !VERDICTS.includes(x.verdict as Verdict)) return null;
  const line = isRec(x.line) ? x.line : {};
  const err = isRec(x.lastError) && num(x.lastError.t) !== null && typeof x.lastError.code === 'string' ? (x.lastError as GymStatus['lastError']) : null;
  return {
    v: 1, now: x.now as number, mode: x.mode === 'off' ? 'off' : 'bot', sha: typeof x.sha === 'string' ? x.sha : null,
    verdict: x.verdict as Verdict,
    reasons: Array.isArray(x.reasons) ? x.reasons.filter((r): r is Reason => REASONS.includes(r as Reason)) : [],
    intervalMin: num(x.intervalMin) ?? 0, paused: x.paused === true,
    nextCheck: num(x.nextCheck), lastCheck: num(x.lastCheck), lastOk: num(x.lastOk), lastError: err,
    failures: num(x.failures) ?? 0, siteDownSent: x.siteDownSent === true, retryPending: x.retryPending === true,
    checks: Array.isArray(x.checks) ? x.checks.slice(0, CHECKS_MAX).map(parseCheck).filter((c): c is Check => c !== null) : [],
    line: { used: num(line.used), limit: num(line.limit), webhookOk: typeof line.webhookOk === 'boolean' ? line.webhookOk : null, asOf: num(line.asOf) }
  };
}

/** A read's outcome: the status, or why not (`offline`: no answer; `http`: another status; `json`: not a status). */
export type StatusReply = PublicReply<GymStatus>;

/** GET /status (lib/bots/fetchPublic.ts: public, logged as `gym.fail`). */
export const fetchStatus = (signal?: AbortSignal, url = GYM_URL): Promise<StatusReply> => fetchPublic(`${url}/status`, 'gym.fail', parseStatus, { signal });

// ---- The page's view ----
/** The verdict card's dot: leaf, yuzu, coral, or soft for a runner that was switched off; its word (bots.w). */
const TONE: Record<Verdict, BotTone> = { healthy: 'good', degraded: 'warn', late: 'warn', failing: 'bad', broken: 'bad', stopped: 'idle', off: 'idle' };
const WORD: Record<Verdict, BotWord> = { healthy: 'healthy', degraded: 'trouble', late: 'late', failing: 'failing', broken: 'broken', stopped: 'stopped', off: 'off' };

/** The verdict card: its tone, its word, and one plain sentence from the first reason. */
export function verdictView(s: GymStatus): { tone: BotTone; w: BotWord; word: string; sentence: string } {
  const r = s.reasons[0];
  return { tone: TONE[s.verdict], w: WORD[s.verdict], word: t(`bots.w.${WORD[s.verdict]}`), sentence: t(`gym.reason.${r ?? 'none'}`, { n: s.failures }) };
}

/** 確認が必要's lines: every reason in words. */
export const reasonLines = (s: GymStatus): string[] => [...new Set(s.reasons.map((r) => t(`gym.reason.${r}`, { n: s.failures })))];

/** ボット's dot (the menu's pill, the ジム tab): 不調, 要対応 or 遅れ. */
export const needsAttention = (s: GymStatus): boolean => TONE[s.verdict] === 'bad' || s.verdict === 'late';

const at = (ms: number | null, today: string): string => formatSyncTime(ms === null ? null : new Date(ms), today);

/** The fact rows under the strip: 最後の成功 only when it isn't the last check, 連続失敗 only when there are any; 最後の成功
 *  (while nothing fails) and LINE's count under くわしく (`more`). */
export function factRows(s: GymStatus, today: string): { id: string; label: string; value: string; more?: boolean }[] {
  const { used, limit } = s.line;
  return [
    { id: 'last', label: t('gym.lastCheck'), value: at(s.lastCheck, today) },
    { id: 'next', label: t('gym.next'), value: s.nextCheck === null ? t('gym.none') : t('gym.nextAt', { time: at(s.nextCheck, today) }) },
    ...(s.lastOk !== s.lastCheck ? [{ id: 'ok', label: t('gym.lastOk'), value: at(s.lastOk, today), more: s.failures === 0 }] : []),
    ...(s.failures > 0 ? [{ id: 'failures', label: t('gym.failures'), value: t('gym.failuresN', { n: s.failures }) }] : []),
    { id: 'line', label: t('gym.line'), value: used === null ? t('gym.unknown') : limit === null ? t('gym.lineNoLimit', { used }) : t('gym.lineOf', { used, limit }), more: true }
  ];
}

// ---- 直近12時間: the checks, one cell an interval (the shared strip: lib/strip.ts) ----
const MIN_MS = 60_000;
const SPAN_MS = 12 * 3600_000;
/** The strip's cells at most (10-minute checks: 72). */
const STRIP_MAX = 72;

const outcome = (c: Check, p: (typeof PROGRAMS)[number]): string =>
  c.r![p] === 'ok' ? `${t(`gym.prog.${p}`)}○` : `${t(`gym.prog.${p}`)}✕（${t(`gym.outcome.${c.r![p]}`)}）`;

/** A check's part of its cell's line: 「14:15 · トレーニング○ ピラティス○ · 空き2」, 手動 for a 🔎, what failed in words,
 *  a failed push; an alarm with no day to check: 「14:15 · チェックする日なし」. */
function checkText(c: Check): string {
  const when = c.by === 'tap' ? `${hhmm(c.t)} ${t('gym.by.tap')}` : hhmm(c.t);
  if (!c.r) return [when, t('gym.strip.idle')].join(' · ');
  return [when, PROGRAMS.map((p) => outcome(c, p)).join(' '), ...(c.open > 0 ? [t('gym.strip.open', { n: c.open })] : []), ...(c.push === 'failed' ? [t('gym.pushFailed')] : [])].join(' · ');
}

const failed = (c: Check): boolean => !!c.r && PROGRAMS.some((p) => c.r![p] !== 'ok');

/** The last 12 hours, oldest first: one cell an interval (`intervalMin`; 15 min: 48 cells, at most STRIP_MAX), the
 *  checks in turn (lib/strip.ts chain: a check's jitter leaves no false gap); red when a program failed, else yellow
 *  when a slot was open, else green; outlined when nothing was checked (stopped, backed off, an alarm with no day to
 *  check, or before the kept checks). With its ticks (every 3 hours, Tokyo) and its line for VoiceOver:
 *  「直近12時間：確認46回、失敗1回、空きあり3回」 (the checks that fetched). */
export function checkStrip(s: GymStatus): { cells: StripCell[]; ticks: StripTick[]; summary: string } {
  const width = (s.intervalMin > 0 ? s.intervalMin : 15) * MIN_MS;
  const count = Math.min(STRIP_MAX, Math.ceil(SPAN_MS / width));
  const slots = chain(s.checks, (c) => c.t, s.now, width, count);
  const cells = slots.map(({ start, end, items }): StripCell => {
    const done = items.filter((c) => c.r);
    const state: CellState = !done.length ? 'none' : done.some(failed) ? 'fail' : done.some((c) => c.open > 0) ? 'avail' : 'ok';
    return { start, end, state, label: items.length ? items.map(checkText).join(' / ') : `${hhmm(start)} · ${t('gym.strip.none')}` };
  });
  const done = slots.flatMap((x) => x.items).filter((c) => c.r);
  const summary = t('gym.strip.summary', { n: done.length, fails: done.filter(failed).length, avail: done.filter((c) => c.open > 0).length });
  return { cells, ticks: stripTicks(cells, 3 * 3600_000), summary };
}
