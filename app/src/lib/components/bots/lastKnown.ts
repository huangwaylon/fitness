// ボット's last known status, a tab's (docs/design.md "Bots"; fitness-5e perf: a ~2 s skeleton on each open): kept in
// memory and on this phone (registry.ts storageKey: island.botsLast.*) after each good read, `{me, s, at, sum}`, so the
// page opens on it at once, marked 更新中, and the tab's and the menu's dots survive a reload (`sum`, summary.svelte.ts).
// Only for the member who read it (`me`); one that doesn't read back (another version, garbage) is none; an entry from
// before `at`/`sum` reads its status as ever, its dot unknown. A copy too large (≥ 200 KB) keeps the dot only, a full
// storage the memory one only.
import { getStoredMe, localKV } from '#lib/sync/storage.ts';
import type { BotTone, BotWord } from '#lib/bots/types.ts';
import { botMeta, type BotId } from './registry.ts';

/** A dot as kept: its tone, word and 「!」, read at `at` with that poll (`ms`: its staleness). */
export interface KeptSum { tone: BotTone; w: BotWord; needsLook: boolean; ms: number }
interface Kept { me: string | null; s?: unknown; at?: number; sum?: KeptSum }

const MAX = 200_000;
const mem = new Map<BotId, Kept>();

const TONES: readonly BotTone[] = ['good', 'busy', 'warn', 'bad', 'idle', 'unknown'];

function kept(tab: BotId): Kept | null {
  const me = getStoredMe();
  const m = mem.get(tab);
  if (m) return m.me === me ? m : null;
  try {
    const k = JSON.parse(localKV()?.getItem(botMeta(tab).storageKey) ?? 'null') as Kept | null;
    return k && typeof k === 'object' && k.me === me ? k : null;
  } catch {
    return null;
  }
}

/** The status last read on this tab by this phone's member, read back by `parse`, or null. */
export function recall<T>(tab: BotId, parse: (x: unknown) => T | null): T | null {
  const k = kept(tab);
  if (!k || k.s === undefined) return null;
  return mem.get(tab) === k ? (k.s as T) : parse(k.s);
}

/** The dot last kept for this tab by this phone's member, with when it was read, or null (none, or an older entry). */
export function recallSum(tab: BotId): (KeptSum & { at: number }) | null {
  const k = kept(tab);
  const s = k?.sum;
  if (!s || typeof k.at !== 'number' || !TONES.includes(s.tone) || typeof s.w !== 'string' || typeof s.ms !== 'number') return null;
  return { tone: s.tone, w: s.w, needsLook: s.needsLook === true, ms: s.ms, at: k.at };
}

/** A good read's status and its dot, kept for the next opening. */
export function remember(tab: BotId, s: unknown, sum?: KeptSum, at = Date.now()): void {
  const me = getStoredMe();
  const k: Kept = { me, s, at, ...(sum ? { sum } : {}) };
  mem.set(tab, k);
  try {
    let v = JSON.stringify(k);
    if (v.length >= MAX) v = JSON.stringify({ me, at, sum });
    localKV()?.setItem(botMeta(tab).storageKey, v);
  } catch {
    /* (full: this session's memory one only) */
  }
}

/** Forgets the memory copies (another member: theirs are not this one's). */
export const forgetMem = (): void => mem.clear();
