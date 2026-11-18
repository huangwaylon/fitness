// 英語すごろく on several phones (docs/sugoroku.md "Online"): this phone's online game (its id and moves, kept on the
// phone: DEVICE.sugorokuOnline), heard from and sent to the relay (`sg` intents, kept by the room per game: a phone that
// opens later or reloads gets the moves again, its own included). Listening starts with the app (the layout, on every
// screen), so a game someone starts with me in it comes as an invitation (invite.svelte.ts: a banner with 参加,
// straight into the game's screen) wherever the phone is. Light (wire.ts only): the rules, the words and the lines
// (online.ts, the invitation's fold: is the game over?) load only when an invitation may ask or a game opens. The game
// itself is the moves folded (online.ts foldMoves), by the sheet. The turn's live view (view.ts, `sgv`: presence only)
// is sent from here while it's my turn, and the latest heard kept for the sheet to show while it isn't.
import { untrack } from 'svelte';
import type { Intent, Relayed, SgIntent, SgView } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { log } from '#lib/sync/log.ts';
import { roomRelay } from '#lib/components/rooms/roomRelay.ts';
import { hook } from '#lib/world/devHooks.ts';
import { now } from '#lib/time/clock.ts';
import { week } from '#lib/store/week.svelte.ts';
import { GUEST, PEOPLE } from '#lib/config/rules.ts';
import { RULES, heard, invited, newGameId, otherRules, sameMove, seatsOf, type Heard, type Move } from './wire.ts';
import { invite, readAnswered } from './invite.svelte.ts';
import type { Words } from './words.ts';
import type { Line } from './sentences.ts';
import { s } from './i18n.ts';
import { encode, fit, type View } from './view.ts';

/** The game's id, its moves in order and those waiting for a gap, and its last move's time (`at`: the relay's clock). */
interface Kept { g: string; log: Move[]; held: Move[]; at?: number }
const EMPTY: Kept = { g: '', log: [], held: [] };
const read = (): Kept => {
  const k = readJson<Kept>(localKV(), DEVICE.sugorokuOnline);
  return k && typeof k.g === 'string' && Array.isArray(k.log) && Array.isArray(k.held) ? k : EMPTY;
};

/** The online game (`cur`: its id and moves, replaced whole on each move), whether the relay is in, and the latest view
 *  of a turn heard (`view`: another player's sheet as it is; the sheet shows it only at the game's next move, theirs). */
class Online {
  cur = $state.raw<Kept>(EMPTY);
  connected = $state(false);
  view = $state.raw<(SgView & { who: Who }) | null>(null);
}
export const online = new Online();
/** Whether the game held was started on another build's rules: it can't be played here (アプリを更新). */
export const updateNeeded = (): boolean => otherRules(online.cur.log);
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

/** What went wrong in a game's sync, logged once per game and reason (`sg.sync`: never a move each). */
const said = new Set<string>();
function warn(why: 'gap' | 'wait' | 'clash' | 'refused' | 'version', i: number, held = 0): void {
  const k = `${online.cur.g}:${why}`;
  if (said.has(k)) return;
  said.add(k);
  log('sg.sync', { why, i, held }, 2);
}

/** A heard move kept (nothing when it changed nothing), what it did logged. */
function take(cur: Kept, h: Heard | null, at: number): void {
  if (!h) return;
  keep({ ...cur, log: h.log, held: h.held, at });
  if (h.why) warn(h.why, h.log.length, h.held.length);
}

/** Two starts this close (a phone each, at once): the table plays the lower id, every phone the same. */
const START_RACE_MS = 15_000;

function hear(m: Relayed): void {
  // (a turn's view: never logged, its words the table's)
  if (m.kind === 'sgv') return void (m.g === online.cur.g && (online.view = m));
  if (m.kind !== 'sg') return;
  const { kind: _k, v: _v, t, who, ...rest } = m as SgIntent & { v: number; t: number; who: Who };
  const move: Move = { ...rest, who };
  const cur = online.cur, at = Math.max(cur.at ?? 0, t);
  if (move.a === 'start' && move.g !== cur.g) {
    // a new game with me in it: mine now (the invitation, if it asks: the effect in listen); one started at once with
    // mine: the lower id
    if (!seatsOf(move.s ?? '').some((x) => x.who === me())) return;
    const mineJust = cur.log.length === 1 && cur.log[0].who === me() && Math.abs(t - (cur.at ?? 0)) < START_RACE_MS;
    if (mineJust && move.g > cur.g) return;
    keep({ g: move.g, log: [move], held: [], at: t });
    if (otherRules([move])) warn('version', 0);
    return;
  }
  // (another game's move: the room replays a game in order, its start first)
  if (move.g !== cur.g) return;
  take(cur, heard(cur.log, cur.held, move, me()), at);
}

/** My move the room refused (a race lost: what won, it sends me; else it goes from my log, those after it too). */
function refused(i: Intent, ok: boolean): void {
  if (ok || i.kind !== 'sg') return;
  const cur = online.cur, { kind: _k, ...rest } = i, mine: Move = { ...rest, who: me() };
  if (i.g !== cur.g) return;
  warn('refused', i.i, cur.held.length);
  if (cur.log[i.i] && sameMove(cur.log[i.i], mine)) keep({ ...cur, log: cur.log.slice(0, i.i) });
}

// the invitation's fold (is the game over?): the rules, words and lines, asked for only when one may ask
type Fold = typeof import('./online.ts').foldMoves;
let ctx = $state.raw<{ fold: Fold; words: Words; lines: readonly Line[] } | null>(null);
let asking = false;
function loadCtx(): void {
  if (asking) return;
  asking = true;
  Promise.all([import('./online.ts'), import('./words.ts').then((w) => w.loadWords()), import('./sentences.ts').then((x) => x.loadSentences())])
    .then(([o, words, lines]) => (ctx = { fold: o.foldMoves, words, lines }), () => (asking = false));
}
/** The invitation, kept up with the game held (a minute's tick while one shows: a game left goes stale). */
function watchInvite(): void {
  let tick = $state(0);
  $effect(() => {
    void tick;
    const cur = online.cur, model = week.model;
    const ask = invited({ log: cur.log, me: model?.me ?? null, at: cur.at ?? 0, now: clock(), answered: invite.answered, over: false });
    if (ask && !ctx) loadCtx();
    const g = ask && ctx ? ctx.fold(cur.log, { words: ctx.words, lines: ctx.lines, name: nameOf }) : null;
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
  relay?.onAck?.(refused);
  // (each hello says the game held and how many of its moves: the room replays it from there, across midnight too)
  relay?.sgAt?.(() => (online.cur.g ? { g: online.cur.g, n: online.cur.log.length } : null));
  relay?.onStatus((st) => (online.connected = st.connected));
  $effect.root(watchInvite);
}

/** Start an online game: its id and first move (the rules' version on it), sent. */
export function startOnline(seats: string, l: 's' | 'n' | 'l'): void {
  listen();
  // (an e2e's pinned id: `?demo&sgId=<10 letters>`, test mode only)
  const g = hook('sgId') || newGameId(untrack(() => online.cur.g));
  const move: Move = { g, i: 0, a: 'start', s: seats, l, r: RULES, who: me() };
  keep({ g, log: [move], held: [], at: clock() });
  send(move);
}

/** One move of mine in the online game (its index the next one): none while a move is missing here (the game moved on
 *  without this phone: it waits for it), after the end, or in a game of other rules. */
export function sendMove(m: Omit<Move, 'g' | 'i' | 'who'>): void {
  const cur = untrack(() => online.cur);
  if (!cur.g || otherRules(cur.log)) return;
  const move = { ...m, g: cur.g, i: cur.log.length, who: me() } as Move;
  if (cur.held.length) return warn('wait', move.i, cur.held.length);
  const h = heard(cur.log, [], move, me());
  if (!h) return;
  keep({ ...cur, log: h.log, at: clock() });
  send(move);
}

function send({ who: _w, ...m }: Move): void {
  relay?.send({ kind: 'sg', ...m } as SgIntent);
}

/** My turn's view (view.ts) for the others at the table: sent as it changes, at most one each VIEW_GAP_MS (the latest
 *  then), and again once VIEW_AGAIN_MS have gone by without one while the turn is open (a phone that comes late or
 *  missed one catches up: each is whole); null, the turn's panel gone. Only with someone there (sync/live.ts send). */
const VIEW_GAP_MS = 200, VIEW_AGAIN_MS = 2000;
let viewNow: View | null = null, viewSent = '', viewAt = -Infinity;
let viewTimer: ReturnType<typeof setTimeout> | undefined, viewBeat: ReturnType<typeof setInterval> | undefined;
export function sendView(v: View | null): void {
  viewNow = v;
  if (!v) {
    clearTimeout(viewTimer);
    clearInterval(viewBeat);
    viewTimer = viewBeat = undefined;
    viewSent = '';
    return;
  }
  viewBeat ??= setInterval(() => performance.now() - viewAt >= VIEW_AGAIN_MS && flushView(true), VIEW_AGAIN_MS / 4);
  if (viewTimer) return;
  const wait = viewAt + VIEW_GAP_MS - performance.now();
  if (wait <= 0) flushView(false);
  else viewTimer = setTimeout(() => ((viewTimer = undefined), flushView(false)), wait);
}
function flushView(again: boolean): void {
  const cur = untrack(() => online.cur);
  if (!viewNow || !relay || !cur.g) return;
  // (its index the game's next move: a watcher lets go of a view of an older one)
  const frame = fit({ kind: 'sgv', g: cur.g, i: cur.log.length, ...encode(viewNow) });
  const key = JSON.stringify(frame);
  if (!again && key === viewSent) return;
  viewSent = key;
  viewAt = performance.now();
  relay.send(frame);
}
