// ボット's last known status, a tab's (docs/design.md "Bots"; fitness-5e perf: a ~2 s skeleton on each open): kept in
// memory and on this phone (LIVE.botsIts, LIVE.botsGym, LIVE.botsKalori) after each good read, so the page opens on it at once, marked
// 更新中, and the read refreshes it in place. Only for the member who read it (`me`); one that doesn't read back
// (another version, garbage) is none. A copy too large (≥ 200 KB) or a full storage keeps the memory one only.
import { LIVE, getStoredMe, localKV } from '#lib/sync/storage.ts';
import type { BotTab } from './open.svelte.ts';

const KEYS: Record<BotTab, string> = { its: LIVE.botsIts, gym: LIVE.botsGym, kalori: LIVE.botsKalori };
const MAX = 200_000;
const mem = new Map<BotTab, { me: string | null; s: unknown }>();

/** The status last read on this tab by this phone's member, read back by `parse`, or null. */
export function recall<T>(tab: BotTab, parse: (x: unknown) => T | null): T | null {
  const me = getStoredMe();
  const m = mem.get(tab);
  if (m) return m.me === me ? (m.s as T) : null;
  try {
    const kept = JSON.parse(localKV()?.getItem(KEYS[tab]) ?? 'null') as { me?: unknown; s?: unknown } | null;
    return kept && kept.me === me ? parse(kept.s) : null;
  } catch {
    return null;
  }
}

/** A good read's status, kept for the next opening. */
export function remember(tab: BotTab, s: unknown): void {
  const me = getStoredMe();
  mem.set(tab, { me, s });
  try {
    const v = JSON.stringify({ me, s });
    if (v.length < MAX) localKV()?.setItem(KEYS[tab], v);
  } catch {
    /* (full: this session's memory one only) */
  }
}
