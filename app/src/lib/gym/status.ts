// The gym bot's status (docs/bots.md: ボット's ジム tab): the Worker's public GET /status, read
// as it is (the verdict is decided there; checked with contract/guards.ts), a failed read logged as gym.fail (public:
// no key, so not lib/keyed.ts), with the page's view helpers so GymPage stays thin (the strip: lib/strip.ts).
import { t } from '#lib/i18n/index.ts';
import { isNum, isRec } from '#lib/contract/guards.ts';
import { chain, stripTicks, type CardStrip, type CellState, type StripCell } from '#lib/strip.ts';
import { fetchPublic, type PublicReply } from '#lib/bots/fetchPublic.ts';
import type { BotTone, BotWord } from '#lib/bots/types.ts';
import { timeOf } from '#lib/i18n/when.ts';
import { OUTCOMES, REASONS, VERDICTS, clockAt, type Check, type GymStatus, type Outcome, type Reason, type Verdict } from './contract.ts';
import '#lib/i18n/gym.ts';
import '#lib/i18n/bots.ts';

export type { Check, GymStatus };

/** The Worker's origin; VITE_GYM_URL overrides it (empty = ボット's ジム tab hidden). vite.config.ts's CSP allows it. */
export const GYM_URL: string = (import.meta.env?.VITE_GYM_URL as string | undefined) ?? 'https://gym-bot.island-fund-relay.workers.dev';

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

/** Without a reason, the verdict's own sentence (never the calm one under a coral word; none when healthy: the word
 *  says it). */
const NO_REASON: Record<Verdict, string | null> = {
  healthy: null, degraded: null, late: 'overdue', failing: 'failing', broken: 'failing', stopped: 'paused', off: 'mode_off'
};

/** The status card: its tone, its word, and one plain sentence from the first reason, or none (`app`: the page can
 *  restart the checks itself, so 停止中 points to its ⋯ rather than LINE's). */
export function verdictView(s: GymStatus, app = false): { tone: BotTone; w: BotWord; word: string; sentence: string } {
  let key: string | null = s.reasons[0] ?? NO_REASON[s.verdict];
  if (key === 'failing' && s.failures > 0) key = 'site_failing';
  if (key === 'paused' && app) key = 'pausedApp';
  return { tone: TONE[s.verdict], w: WORD[s.verdict], word: t(`bots.w.${WORD[s.verdict]}`), sentence: key ? t(`gym.reason.${key}`, { n: s.failures }) : '' };
}

/** What a person can do about a reason (gym/README.md's 「Do」), when there's something. */
const DO: readonly Reason[] = ['mode_off', 'no_alarm', 'no_group', 'webhook_wrong', 'site_failing', 'push_retry', 'quota_high'];

/** 確認が必要's lines: the reasons after the first (the sentence says that one), then what to do. */
export const reasonLines = (s: GymStatus): string[] =>
  [...new Set([...s.reasons.slice(1).map((r) => t(`gym.reason.${r}`, { n: s.failures })), ...s.reasons.filter((r) => DO.includes(r)).map((r) => t(`gym.do.${r}`))])];

/** How long a self-healing state stays dot-free (the bot's own retry, the hourly cron's re-arm) before it is an
 *  outage a person must look at: 遅れ past the next check by LATE_GRACE_MS, the site failing for SITE_GRACE_MS. */
export const LATE_GRACE_MS = 90 * 60_000;
export const SITE_GRACE_MS = 6 * 3_600_000;

/** Since when the checks have failed in a row (the oldest of the `failures` kept), null if unknown. */
const failingSince = (s: GymStatus): number | null => s.checks[Math.max(0, s.failures - 1)]?.t ?? s.checks.at(-1)?.t ?? null;

/** ボット's dot (the menu's pill, the ジム tab): only while a person must act, so 故障, or 不調 for more than the site
 *  failing. 遅れ and the site failing heal on their own (the hourly cron re-arms the alarm, the bot retries), till
 *  they last too long: 遅れ LATE_GRACE_MS past the next check, the site SITE_GRACE_MS without a success. */
export function needsAttention(s: GymStatus, now: number = s.now): boolean {
  if (s.verdict === 'broken') return true;
  if (s.verdict === 'late') return s.nextCheck !== null && now > s.nextCheck + LATE_GRACE_MS;
  if (s.verdict !== 'failing') return false;
  if (!s.reasons.every((r) => r === 'site_failing')) return true;
  const since = s.lastOk ?? failingSince(s);
  return since !== null && now - since >= SITE_GRACE_MS;
}

const at = (ms: number | null, now: number): string => (ms === null ? t('bots.key.never') : timeOf(ms, now));

/** The card's edges (docs/bots.md): 次回 (the alarm; none while stopped or off) and the 成果 term (いま空き{n}枠, the
 *  open slots the last check saw, when any; 不調: 最後の成功). */
export function edges(s: GymStatus, now: number): { next: string | null; outcome: string | null } {
  const c = s.checks[0];
  const next = s.nextCheck === null || s.paused || s.mode === 'off' ? null : t('bots.key.about', { time: timeOf(s.nextCheck, now) });
  if (TONE[s.verdict] === 'bad') return { next, outcome: t('bots.strip.lastOk', { time: at(s.lastOk, now) }) };
  return { next, outcome: c?.r && c.open > 0 ? t('gym.strip.nowOpen', { n: c.open }) : null };
}

/** くわしく: 最後の成功 (unless it's the last check, or the card has it), 連続失敗 (when any), LINE's count, the mode
 *  and the version. */
export function factRows(s: GymStatus, now: number): { id: string; label: string; value: string }[] {
  const { used, limit } = s.line;
  return [
    ...(s.lastOk !== s.lastCheck && TONE[s.verdict] !== 'bad' ? [{ id: 'ok', label: t('bots.key.lastOk'), value: at(s.lastOk, now) }] : []),
    ...(s.failures > 0 ? [{ id: 'failures', label: t('gym.failures'), value: t('gym.failuresN', { n: s.failures }) }] : []),
    { id: 'line', label: t('gym.line'), value: used === null ? t('gym.unknown') : limit === null ? t('gym.lineNoLimit', { used }) : t('gym.lineOf', { used, limit }) },
    { id: 'mode', label: t('bots.fact.mode'), value: t(`gym.mode.${s.mode}`) },
    ...(s.sha ? [{ id: 'sha', label: t('bots.fact.sha'), value: s.sha.slice(0, 7) }] : [])
  ];
}

// ---- The strip: the checks, one cell an interval (the shared strip: lib/strip.ts) ----
const MIN_MS = 60_000;
/** The strip's cells: 24 intervals (15 minutes: 6 hours). */
const CELLS = 24;

const outcome = (c: Check, p: (typeof PROGRAMS)[number]): string =>
  c.r![p] === 'ok' ? `${t(`gym.prog.${p}`)}○` : `${t(`gym.prog.${p}`)}✕（${t(`gym.outcome.${c.r![p]}`)}）`;

/** A check's part of its cell's line: 「14:15 · トレーニング○ ピラティス○ · 空き2」, 手動 for a 🔎, what failed in words,
 *  a failed push; an alarm with no day to check: 「14:15 · 確認する日なし」. */
function checkText(c: Check): string {
  const when = c.by === 'tap' ? `${clockAt(c.t)} ${t('gym.by.tap')}` : clockAt(c.t);
  if (!c.r) return [when, t('gym.strip.idle')].join(' · ');
  return [when, PROGRAMS.map((p) => outcome(c, p)).join(' '), ...(c.open > 0 ? [t('gym.strip.open', { n: c.open })] : []), ...(c.push === 'failed' ? [t('gym.pushFailed')] : [])].join(' · ');
}

const failed = (c: Check): boolean => !!c.r && PROGRAMS.some((p) => c.r![p] !== 'ok');
const allFailed = (c: Check): boolean => !!c.r && PROGRAMS.every((p) => c.r![p] !== 'ok');

/** The last 24 intervals (`intervalMin`; 15 min: 6 hours), oldest first, a cell each, the checks in turn (lib/strip.ts
 *  chain: a check's jitter leaves no false gap); fail when both programs failed, warn when one did, else avail when a
 *  slot was open, else ok; idle when its checks were alarms with no day to check; none when nothing was checked
 *  (stopped, backed off, or before the kept checks). With its ticks (every 2 hours, Tokyo), 前回 (the newest check's
 *  cell, its time, idle or not), the states' words (idle's none: its cells' lines name it), its line for VoiceOver
 *  「直近6時間：確認24回、失敗1回、空き検出3回」 (the checks that fetched), and, never checked, 「まだ確認していません」 in its place. */
export function checkStrip(s: GymStatus): Omit<CardStrip, 'next' | 'outcome'> {
  const width = (s.intervalMin > 0 ? s.intervalMin : 15) * MIN_MS;
  const slots = chain(s.checks, (c) => c.t, s.now, width, CELLS);
  const cells = slots.map(({ start, end, items }): StripCell => {
    const done = items.filter((c) => c.r);
    const state: CellState = !items.length ? 'none' : !done.length ? 'idle' : done.some(allFailed) ? 'fail' : done.some(failed) ? 'warn' : done.some((c) => c.open > 0) ? 'avail' : 'ok';
    return { start, end, state, label: items.length ? items.map(checkText).join(' / ') : `${clockAt(start)} · ${t('gym.strip.none')}` };
  });
  const i = slots.findLastIndex((x) => x.items.length > 0);
  const done = slots.flatMap((x) => x.items).filter((c) => c.r);
  const n = { h: (CELLS * width) / 3600_000, n: done.length, fails: done.filter(failed).length, avail: done.filter((c) => c.open > 0).length };
  return {
    cells, ticks: stripTicks(cells, 2 * 3600_000), last: i < 0 ? null : { i, label: clockAt(slots[i].items.at(-1)!.t) }, summary: t('gym.strip.summary', n),
    words: { ok: t('gym.strip.legend.ok'), avail: t('gym.strip.legend.avail'), warn: t('gym.strip.legend.warn'), fail: t('gym.strip.legend.fail'), idle: t('gym.strip.idle') },
    empty: s.checks.length ? null : { text: t('gym.strip.never') }
  };
}
