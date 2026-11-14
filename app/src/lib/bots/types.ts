// ボット's one shape for every bot (docs/design.md "Bots"): a driver reads a bot's status and words it; the tone is
// health (colour), `needsLook` whether a person must act (the dot's 「!」). Pure: no client, no i18n, so the island's
// chunk (the HUD's dot, components/bots/summary.svelte.ts) can rank the bots without loading one.

/** good 順調, busy 起動中・取得中 (drawn as good), warn 一部不調・遅れ・保留, bad 不調・故障, idle 待機中・停止中・オフ・まだ,
 *  unknown never read (不明). */
export type BotTone = 'good' | 'busy' | 'warn' | 'bad' | 'idle' | 'unknown';
/** The verdict's word, one table for the three bots (i18n/bots: `bots.w.*`). */
export type BotWord = 'healthy' | 'starting' | 'fetching' | 'trouble' | 'late' | 'held' | 'needsYou' | 'failing' | 'broken' | 'waiting' | 'stopped' | 'off' | 'none' | 'unknown';

export interface BotVerdict {
  tone: BotTone;
  /** The word's id (kept with the dot: the tab says it before the bot's chunk loads). */
  w: BotWord;
  word: string;
  sentence: string;
  needsLook: boolean;
}

/** A read: the status, or why not (`offline`, `http`, `json`, `no_key`, a Worker's code); a refusal may carry the status. */
export type BotReply<S> = { ok: true; status: S } | { ok: false; err: string; http: number | null; status?: S | null };

export interface BotDriver<S> {
  fetch(signal?: AbortSignal): Promise<BotReply<S>>;
  /** A kept status read back (lastKnown), or null. */
  parse(x: unknown): S | null;
  verdict(s: S, now: number): BotVerdict;
  /** The shown page's poll (保養所 15 s while running, else 60 s). */
  pollMs(s: S | null): number;
}

/** What a dot shows: tone and 「!」. */
export interface BotMark { tone: BotTone; needsLook: boolean }

const RANK: readonly BotTone[] = ['bad', 'warn', 'unknown', 'busy', 'good', 'idle'];

/** The worst of some bots (bad > warn > unknown > busy > good > idle), needing a look when any does; null for none. */
export function worst(list: readonly BotMark[]): BotMark | null {
  if (!list.length) return null;
  const tone = RANK.find((r) => list.some((m) => m.tone === r)) ?? 'unknown';
  return { tone, needsLook: list.some((m) => m.needsLook) };
}

/** A dot as drawn: busy as good; a good or idle bot needing a look raised to warn, its word 要対応 (`w`). */
export function shown(m: BotMark & { w?: BotWord | null }): { tone: Exclude<BotTone, 'busy'>; look: boolean; w: BotWord } {
  const base = m.tone === 'busy' ? 'good' : m.tone;
  const raise = m.needsLook && (base === 'good' || base === 'idle');
  return { tone: raise ? 'warn' : base, look: m.needsLook, w: raise ? 'needsYou' : (m.w ?? 'unknown') };
}

/** A status read at `at` is stale at `now` once older than 3 polls. */
export const staleAt = (at: number | null, pollMs: number, now: number): boolean => at === null || now - at > 3 * pollMs;
