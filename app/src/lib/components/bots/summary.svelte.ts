// ボット's dots (docs/design.md "Bots"): each bot's last tone, 「!」 and word, for the tabs and the menu's ボット, kept
// across a reload (lastKnown.ts `sum`). Always loaded (the HUD reads it), so the drivers come lazily (registry.ts).
// Reads: the shown page polls its own (useBot.svelte.ts: `pageRead`, `accept`); the other tabs are read here, once as
// the sheet opens or the menu unfolds, then every 5 min while the sheet is open (`watch`), each at most once a minute
// (FLOOR_MS) and one read at a time per bot; none while hidden; offline marks the dot stale, keeping its tone. A
// failed read keeps the last tone (stale, `err`); ITS without a key: unknown. Another member's dots are never shown.
// Each minute the verdicts read are weighed again on the clock (メニュー's 遅れ: verdictOf), no read.
import { untrack } from 'svelte';
import { minuteNow } from '#lib/time/clock.ts';
import { staleAt, worst, type BotDriver, type BotMark, type BotTone, type BotWord } from '#lib/bots/types.ts';
import { getStoredMe } from '#lib/sync/storage.ts';
import { testModeAllowed } from '#lib/ui-state/testMode.ts';
import { botMeta, type BotId } from './registry.ts';
import { forgetMem, recallSum, remember } from './lastKnown.ts';

export interface BotSummary { tone: BotTone; w: BotWord; needsLook: boolean; updatedAt: number | null; stale: boolean; err: string | null }

const IDS: readonly BotId[] = ['gym', 'its', 'kalori'];
const FLOOR_MS = 60_000;
const BG_MS = 5 * 60_000;

/** The background reads' interval: 5 min (an e2e may set `localStorage['e2e.botsBg']`, the floor then at most it). */
function bgMs(): number {
  try {
    const v = testModeAllowed() ? Number(localStorage.getItem('e2e.botsBg')) : 0;
    return v > 0 ? v : BG_MS;
  } catch {
    return BG_MS;
  }
}

const blank = (): BotSummary => ({ tone: 'unknown', w: 'unknown', needsLook: false, updatedAt: null, stale: false, err: null });

/** The poll each dot was read with (its staleness: 3 polls). */
const every: Record<BotId, number> = { gym: 60_000, its: 60_000, kalori: 60_000 };

function hydrate(id: BotId): BotSummary {
  const k = recallSum(id);
  if (!k) return blank();
  every[id] = k.ms;
  return { tone: k.tone, w: k.w, needsLook: k.needsLook, updatedAt: k.at, stale: staleAt(k.at, k.ms, Date.now()), err: null };
}

let owner = getStoredMe();
export const summaries: Record<BotId, BotSummary> = $state({ gym: hydrate('gym'), its: hydrate('its'), kalori: hydrate('kalori') });

const drivers: Partial<Record<BotId, BotDriver<unknown>>> = {};
const readAt: Record<BotId, number> = { gym: -Infinity, its: -Infinity, kalori: -Infinity };
const inflight: Record<BotId, AbortController | null> = { gym: null, its: null, kalori: null };
const paging: Record<BotId, boolean> = { gym: false, its: false, kalori: false };
/** The status each dot was read from this session (the minute's re-weighing). */
const lastS: Partial<Record<BotId, unknown>> = {};
/** When a background read (refresh) last answered well. */
const bgAt: Record<BotId, number> = { gym: -Infinity, its: -Infinity, kalori: -Infinity };

/** Another member on this phone (re-paired): the dots and the memory copies are theirs, read afresh. */
function sameMember(): void {
  const me = getStoredMe();
  if (me === owner) return;
  owner = me;
  forgetMem();
  for (const id of IDS) {
    inflight[id]?.abort();
    inflight[id] = null;
    readAt[id] = bgAt[id] = -Infinity;
    delete lastS[id];
    summaries[id] = hydrate(id);
  }
}

/** A good read's status (a read's, 保養所's 保存 or 開始 answering with it): the dot, kept with the status. */
export function accept(id: BotId, s: unknown, d: BotDriver<unknown> | undefined = drivers[id]): void {
  sameMember();
  if (!d) return;
  drivers[id] = d;
  const now = Date.now();
  const v = d.verdict(s, now);
  every[id] = d.pollMs(s);
  readAt[id] = now;
  lastS[id] = s;
  summaries[id] = { tone: v.tone, w: v.w, needsLook: v.needsLook, updatedAt: now, stale: false, err: null };
  remember(id, s, { tone: v.tone, w: v.w, needsLook: v.needsLook, ms: every[id] }, now);
}

/** A failed read: the last tone kept, stale (no key: unknown, nothing to keep). */
export function fail(id: BotId, err: string): void {
  if (err === 'no_key') summaries[id] = blank();
  else summaries[id] = { ...summaries[id], stale: summaries[id].updatedAt !== null, err };
}

/** The verdicts read this session weighed again at `now` (tone, word, 「!」; the read's time kept). */
export function retone(now: number): void {
  for (const id of IDS) {
    const d = drivers[id], st = lastS[id];
    if (!d || st === undefined) continue;
    const v = d.verdict(st, now);
    const s = summaries[id];
    if (v.tone !== s.tone || v.w !== s.w || v.needsLook !== s.needsLook) summaries[id] = { ...s, tone: v.tone, w: v.w, needsLook: v.needsLook };
  }
}

if (typeof window !== 'undefined') $effect.root(() => {
  $effect(() => {
    const now = minuteNow().getTime();
    untrack(() => retone(now));
  });
});

/** A background read answered well within `ms`, nothing since: a page just opened needn't read again (once: the
 *  next opening reads). */
export function takeWarm(id: BotId, ms: number): boolean {
  const s = summaries[id];
  const warm = s.updatedAt === bgAt[id] && !s.err && Date.now() - bgAt[id] < ms;
  bgAt[id] = -Infinity;
  return warm;
}

/** The shown page's read begins (a background one in flight let go: one read a bot) or ends. */
export function pageRead(id: BotId, on: boolean, d?: BotDriver<unknown>): void {
  if (d) drivers[id] = d;
  paging[id] = on;
  if (!on) return;
  inflight[id]?.abort();
  inflight[id] = null;
  readAt[id] = Date.now();
}

/** A bot read now: `bg` at most once a minute; none while one is on its way, hidden, or offline (stale then). */
export async function refresh(id: BotId, kind: 'focus' | 'bg'): Promise<void> {
  sameMember();
  if (typeof document !== 'undefined' && document.hidden) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return void (summaries[id].updatedAt !== null && (summaries[id] = { ...summaries[id], stale: true }));
  if (inflight[id] || paging[id]) return;
  const now = Date.now();
  if (kind === 'bg' && now - readAt[id] < Math.min(FLOOR_MS, bgMs())) return;
  readAt[id] = now;
  const ctl = (inflight[id] = new AbortController());
  try {
    const d = (drivers[id] ??= await botMeta(id).driver());
    const r = await d.fetch(ctl.signal);
    if (ctl.signal.aborted) return;
    if (r.ok) (accept(id, r.status, d), (bgAt[id] = summaries[id].updatedAt ?? -Infinity));
    else fail(id, r.err);
  } catch {
    if (!ctl.signal.aborted) fail(id, 'offline');
  } finally {
    if (inflight[id] === ctl) inflight[id] = null;
  }
}

/** The sheet open: `others` (the tabs not shown) read now and every 5 min while it stays open; the watch's end. */
export function watch(others: readonly BotId[]): () => void {
  const tick = () => {
    const now = Date.now();
    for (const id of IDS) {
      const s = summaries[id];
      if (s.updatedAt !== null && !s.stale && staleAt(s.updatedAt, every[id], now)) summaries[id] = { ...s, stale: true };
    }
    for (const id of others) void refresh(id, 'bg');
  };
  tick();
  const timer = setInterval(tick, bgMs());
  return () => clearInterval(timer);
}

/** The worst of these bots' dots (the menu's ボット), or null for none. */
export const worstOf = (ids: readonly BotId[]): BotMark | null => worst(ids.map((id) => summaries[id]));
