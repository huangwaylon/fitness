// 英語すごろく on several phones (docs/sugoroku.md "Online"): this phone's online game (its id and moves, kept on the
// phone: DEVICE.sugorokuOnline), heard from and sent to the relay (`sg` intents, kept in the day's ring: a phone that
// opens later or reloads gets the day's moves again, its own included). Listening starts with the app (the layout,
// on every screen), so a game someone starts with me in it comes as an invitation (invite.svelte.ts: a banner with
// 参加, straight into the game's screen) wherever the phone is. The game itself is the moves folded (online.ts
// foldMoves), by the sheet.
import { untrack } from 'svelte';
import type { Relayed, SgIntent } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { roomRelay } from '#lib/components/rooms/roomRelay.ts';
import { hook } from '#lib/world/devHooks.ts';
import { now } from '#lib/time/clock.ts';
import { week } from '#lib/store/week.svelte.ts';
import { GUEST, PEOPLE } from '#lib/config/rules.ts';
import { foldMoves, heard, invited, newGameId, seatsOf, type Move } from './online.ts';
import { invite, readAnswered } from './invite.svelte.ts';
import { loadWords, type Words } from './words.ts';
import { loadSentences, type Line } from './sentences.ts';
import { s } from './i18n.ts';

/** The game's id, its moves in order and those waiting for a gap, and its last move's time (`at`: the relay's clock). */
interface Kept { g: string; log: Move[]; held: Move[]; at?: number }
const EMPTY: Kept = { g: '', log: [], held: [] };
const read = (): Kept => {
  const k = readJson<Kept>(localKV(), DEVICE.sugorokuOnline);
  return k && typeof k.g === 'string' && Array.isArray(k.log) && Array.isArray(k.held) ? k : EMPTY;
};

/** The online game: its id and moves (raw: replaced whole on each move). */
export const online = $state<{ cur: Kept; connected: boolean }>({ cur: EMPTY, connected: false });
let relay: Live | null = null;
/** The relay's clock, a move's `t`'s (the tabs' local relay: the island's, clock.ts now(), a `?date=` moving it). */
let clock = (): number => Date.now();

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
  const { kind: _k, v: _v, t, who, ...rest } = m as SgIntent & { v: number; t: number; who: Who };
  const move: Move = { ...rest, who };
  const cur = online.cur, at = Math.max(cur.at ?? 0, t);
  if (move.a === 'start') {
    if (move.g === cur.g) return keep({ ...cur, ...heard(cur.log, cur.held, move), at });
    // a new game with me in it: mine now (the invitation, if it asks: the effect in listen)
    if (!seatsOf(move.s ?? '').some((x) => x.who === me())) return;
    return keep({ g: move.g, log: [move], held: cur.g === move.g ? cur.held : [], at: t });
  }
  // a move of a game not (yet) here: held, in case its start comes after it (a replay's order)
  if (move.g !== cur.g) return void (cur.g === '' && keep({ g: move.g, log: [], held: [move], at: t }));
  keep({ ...cur, ...heard(cur.log, cur.held, move), at });
}

// the invitation's fold (is the game over?): the words and lines, asked for only when one may ask
let ctx = $state.raw<{ words: Words; lines: readonly Line[] } | null>(null);
let asking = false;
function loadCtx(): void {
  if (asking) return;
  asking = true;
  Promise.all([loadWords(), loadSentences()]).then(([words, lines]) => (ctx = { words, lines }), () => (asking = false));
}
/** The invitation, kept up with the game held (a minute's tick while one shows: a game left goes stale). */
function watchInvite(): void {
  let tick = $state(0);
  $effect(() => {
    void tick;
    const cur = online.cur, model = week.model;
    const ask = invited({ log: cur.log, me: model?.me ?? null, at: cur.at ?? 0, now: clock(), answered: invite.answered, over: false });
    if (ask && !ctx) loadCtx();
    const g = ask && ctx ? foldMoves(cur.log, { ...ctx, name: nameOf }) : null;
    const who = cur.log[0]?.who;
    invite.cur = g && g.phase.k !== 'end' && who ? { g: cur.g, who, text: s('invite', { name: nameOf(who) }), join: s('join') } : null;
  });
  $effect(() => {
    if (!invite.cur) return;
    const id = setInterval(() => tick++, 60_000);
    return () => clearInterval(id);
  });
}

let started = false;
/** Listen (once): the island's relay (the demo's own: its tabs share a channel). `eager` (the app's opening): not
 *  with an e2e's test relay, where a socket of its own would be a second one of the same key (the sheet's opening still
 *  listens). */
export function listen(eager = false): void {
  if (started || typeof window === 'undefined' || (eager && week.demo && hook('relay'))) return;
  started = true;
  online.cur = read();
  invite.answered = readAnswered();
  const r = roomRelay(!!week.demo, me());
  relay = r.relay;
  const local = !!r.own && !hook('relay');
  clock = () => (local ? now().getTime() : r.now());
  r.own?.start();
  relay?.on(hear);
  relay?.onStatus((st) => (online.connected = st.connected));
  $effect.root(watchInvite);
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
  const cur = untrack(() => online.cur), at = clock();
  keep(fresh ? { g: m.g, log: [move], held: [], at } : { ...cur, ...heard(cur.log, cur.held, move), at });
  relay?.send({ kind: 'sg', ...m } as SgIntent);
}
