// 英語すごろく on several phones (docs/sugoroku.md "Online"): this phone's online game (its id and moves, kept on the
// phone: DEVICE.sugorokuOnline), heard from and sent to the relay (`sg` intents, kept in the day's ring: a phone that
// opens later or reloads gets the day's moves again, its own included). Listening starts with the island (Hud), so
// a game someone starts with me in it comes as an invitation (a banner with 参加, opening English Study on すごろく). The game itself
// is the moves folded (online.ts foldMoves), by the sheet.
import { untrack } from 'svelte';
import type { Relayed, SgIntent } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { roomRelay } from '#lib/components/rooms/roomRelay.ts';
import { hook } from '#lib/world/devHooks.ts';
import { week } from '#lib/store/week.svelte.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { GUEST, PEOPLE } from '#lib/config/rules.ts';
import { heard, newGameId, seatsOf, type Move } from './online.ts';
import { english } from '#lib/english/open.svelte.ts';
import { s } from './i18n.ts';

interface Kept { g: string; log: Move[]; held: Move[] }
const EMPTY: Kept = { g: '', log: [], held: [] };
const read = (): Kept => {
  const k = readJson<Kept>(localKV(), DEVICE.sugorokuOnline);
  return k && typeof k.g === 'string' && Array.isArray(k.log) && Array.isArray(k.held) ? k : EMPTY;
};

/** The online game: its id and moves (raw: replaced whole on each move). */
export const online = $state<{ cur: Kept; connected: boolean }>({ cur: EMPTY, connected: false });
let relay: Live | null = null;

/** A person's name as everyone sees it. */
export const nameOf = (w: Who): string =>
  w === 'G' ? (week.view?.guest?.villagerName ?? GUEST.villager) : (week.view?.people[w].villagerName ?? PEOPLE[w].villager);
const me = (): Who => week.model?.me ?? 'A';

function keep(k: Kept): void {
  online.cur = k;
  writeJson(localKV(), DEVICE.sugorokuOnline, k);
}

function hear(m: Relayed): void {
  if (m.kind !== 'sg') return;
  const { kind: _k, v: _v, t: _t, who, ...rest } = m as SgIntent & { v: number; t: number; who: Who };
  const move: Move = { ...rest, who };
  const cur = online.cur;
  if (move.a === 'start') {
    if (move.g === cur.g) return keep({ ...cur, ...heard(cur.log, cur.held, move) });
    // a new game with me in it: mine now, and the invitation (not for one I started: my own replayed)
    if (!seatsOf(move.s ?? '').some((x) => x.who === me())) return;
    keep({ g: move.g, log: [move], held: cur.g === move.g ? cur.held : [] });
    if (who !== me() && !english.open) toasts.show(s('invite', { name: nameOf(who) }), 12_000, { action: { label: s('join'), run: () => english.show('sugoroku') } });
    return;
  }
  // a move of a game not (yet) here: held, in case its start comes after it (a replay's order)
  if (move.g !== cur.g) return void (cur.g === '' && keep({ g: move.g, log: [], held: [move] }));
  keep({ ...cur, ...heard(cur.log, cur.held, move) });
}

let started = false;
/** Listen (once): the island's relay (the demo's own: its tabs share a channel). `eager` (the island's opening): not
 *  with an e2e's test relay, where a socket of its own would be a second one of the same key (the sheet's opening still
 *  listens). */
export function listen(eager = false): void {
  if (started || typeof window === 'undefined' || (eager && week.demo && hook('relay'))) return;
  started = true;
  online.cur = read();
  const r = roomRelay(!!week.demo, me());
  relay = r.relay;
  r.own?.start();
  relay?.on(hear);
  relay?.onStatus((st) => (online.connected = st.connected));
}

/** Start an online game: its id and first move, sent. */
export function startOnline(seats: string, l: 's' | 'n' | 'l'): void {
  listen();
  const g = newGameId(untrack(() => online.cur.g));
  send({ g, i: 0, a: 'start', s: seats, l }, true);
}

/** One move of mine in the online game (its index the next one). */
export function sendMove(m: Omit<Move, 'g' | 'i' | 'who'>): void {
  const cur = untrack(() => online.cur);
  if (!cur.g) return;
  send({ ...m, g: cur.g, i: cur.log.length } as Omit<Move, 'who'>);
}

function send(m: Omit<Move, 'who'>, fresh = false): void {
  const move: Move = { ...m, who: me() };
  const cur = untrack(() => online.cur);
  keep(fresh ? { g: m.g, log: [move], held: [] } : { ...cur, ...heard(cur.log, cur.held, move) });
  relay?.send({ kind: 'sg', ...m } as SgIntent);
}

