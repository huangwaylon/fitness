// くまのもり's wire (docs/backend.md "The forest room"): what goes over the relay's /expedition socket, checked the same
// way on both ends. No runtime imports, so the relay's Worker bundles it as it does live-protocol.ts.
//   Phone → room: `hello` {key, v} first, then `ping` {c} and the game's messages (protocol.ts Msg).
//   Room → phone: `welcome` {me, here, host, t}, `pong` {c, t}, `here` {who, on} (someone's socket came or went), and
//   the game's messages relayed, each stamped `from` (who sent it; the room's own checks: see relay/src/expedition.ts).
import type { Msg } from './protocol.ts';
import type { Who } from '../../sync/live-protocol.ts';

export const FOREST_V = 1;
/** @public (the relay's) A message's most bytes (a bear update for four bears is ~400). */
export const FOREST_MAX = 2048;

/** @public (the relay's) What only the round's host may send: the bears, the claims' answers, the world's events, the start and the end. */
export const HOST_KINDS: ReadonlySet<string> = new Set(['bear', 'picked', 'pile', 'banked', 'catch', 'trap', 'fell', 'swarm', 'giri', 'end']);
/** @public (the relay's) What carries its sender in `who` (the room writes the sender there: nobody speaks for another). */
export const SENDER_KINDS: ReadonlySet<string> = new Set(['hi', 'bye', 'p', 'pick', 'drop', 'bank', 'home', 'seed', 'push', 'nest', 'host']);
/** @public (the relay's) The fast stream (its own rate: a pickup never waits behind a position). */
export const STREAM_KINDS: ReadonlySet<string> = new Set(['p', 'bear']);
const GAME_KINDS = new Set([...HOST_KINDS, ...SENDER_KINDS, 'start', 'revive']);

/** @public (the relay's) */
export type ToRoom = { k: 'hello'; key: string; v: number } | { k: 'ping'; c: number } | Msg;
export type FromRoom =
  | { k: 'welcome'; me: Who; here: Who[]; host: Who | null; t: number }
  | { k: 'pong'; c: number; t: number }
  | { k: 'here'; who: Who; on: boolean }
  | (Msg & { from: Who });

const WHO = new Set(['A', 'B', 'G']);
/** @public (the relay's) */
export const isWho = (v: unknown): v is Who => typeof v === 'string' && WHO.has(v);
const obj = (raw: string): Record<string, unknown> | null => {
  if (raw.length > FOREST_MAX) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) && typeof (v as { k?: unknown }).k === 'string' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
/** Every number in it finite (a NaN position would poison the bears). */
const finite = (v: unknown): boolean =>
  typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === 'object' ? Object.values(v).every(finite) : true;

/** @public (the relay's) A phone's message to the room, or null (unknown, malformed, too big). */
export function parseToRoom(raw: string): ToRoom | null {
  const m = obj(raw);
  if (!m || !finite(m)) return null;
  if (m.k === 'hello') return typeof m.key === 'string' && m.key.length <= 256 && typeof m.v === 'number' ? (m as ToRoom) : null;
  if (m.k === 'ping') return typeof m.c === 'number' ? (m as ToRoom) : null;
  return GAME_KINDS.has(m.k as string) ? (m as unknown as ToRoom) : null;
}

/** The room's message to a phone, or null. */
export function parseFromRoom(raw: string): FromRoom | null {
  const m = obj(raw);
  if (!m) return null;
  if (m.k === 'welcome') return isWho(m.me) && Array.isArray(m.here) && typeof m.t === 'number' ? (m as FromRoom) : null;
  if (m.k === 'pong') return typeof m.c === 'number' && typeof m.t === 'number' ? (m as FromRoom) : null;
  if (m.k === 'here') return isWho(m.who) ? (m as FromRoom) : null;
  return GAME_KINDS.has(m.k as string) && isWho(m.from) ? (m as unknown as FromRoom) : null;
}
