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
import { forceMini } from './mini/offer.ts';
import { now } from '#lib/time/clock.ts';
import { week } from '#lib/store/week.svelte.ts';
import { GUEST, PEOPLE } from '#lib/config/rules.ts';
import { OUTBOX, RULES, answered, beaten, firstSeat, heard, invited, isMiniMove, newGameId, otherRules, queued, sameMove, seatsCode, seatsOf, toSend, type Heard, type Move, type Outbox } from './wire.ts';
import { invite, readAnswered } from './invite.svelte.ts';
import type { Words } from './words.ts';
import type { Line } from './sentences.ts';
import type { MiniData } from './mini/data.ts';
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
  /** Who else is here now (the relay's presence: a みんなで！'s seats present, its `mg`'s `s`). */
  here = $state.raw<Who[]>([]);
  view = $state.raw<(SgView & { who: Who }) | null>(null);
}
export const online = new Online();
/** Whether the game held was started on another build's rules: it can't be played here (アプリを更新). */
export const updateNeeded = (): boolean => otherRules(online.cur.log);
let relay: Live | null = null;
/** The relay's clock, a move's `t`'s (the tabs' local relay: the island's, clock.ts now(), a `?date=` moving it). */
let clock = (): number => Date.now();
/** The relay's clock now (a mini-game's countdown and bar: mini/clock.ts, from its `mg`'s stamp). */
export const relayNow = (): number => clock();

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
function warn(why: 'gap' | 'wait' | 'clash' | 'refused' | 'drop' | 'version', i: number, held = 0): void {
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
  if (m.kind === 'sgv') return void (m.g === online.cur.g && viewKey(m) !== viewKey(online.view) && (online.view = m));
  if (m.kind !== 'sg') return;
  const { kind: _k, v: _v, t, who, ...rest } = m as SgIntent & { v: number; t: number; who: Who };
  const move: Move = { ...rest, who, t };
  const cur = online.cur, at = Math.max(cur.at ?? 0, t);
  if (move.a === 'start' && move.g !== cur.g) {
    // a new game with me in it: mine now (the invitation, if it asks: the effect in listen); one started at once with
    // mine: the lower id
    if (!seatsOf(move.s ?? '').some((x) => x.who === me())) return;
    const mineJust = cur.log.length === 1 && cur.log[0].who === me() && Math.abs(t - (cur.at ?? 0)) < START_RACE_MS;
    if (mineJust && move.g > cur.g) return;
    keep({ g: move.g, log: [move], held: [], at: t });
    outbox = OUTBOX;
    if (otherRules([move])) warn('version', 0);
    return;
  }
  // (another game's move: the room replays a game in order, its start first)
  if (move.g !== cur.g) return;
  // (another's at the place of my mini-game move in flight: mine lost the race, it goes again at the new end)
  if (who !== me() && outbox.q[0]?.at === move.i) outbox = beaten(outbox, move.i);
  take(cur, heard(cur.log, cur.held, move, me()), at);
  pump();
}

/** My move the room refused (a race lost: what won, it sends me; else it goes from my log, those after it too); a
 *  mini-game's in flight answered either way (the next one goes, or it again). */
function refused(i: Intent, ok: boolean): void {
  if (!ok) unsend(i, 'refused');
  if (i.kind === 'sg' && i.g === untrack(() => online.cur.g) && isMiniMove(i)) {
    outbox = answered(outbox, i.i, ok);
    pump();
  }
}
/** My move the outbox gave up on (no ack: sync/live.ts onDrop): out of my log as a refused one, so the turn can be
 *  played again (had the room taken it, the next hello's replay brings it back: the hello's `sg`). */
function unsend(i: Intent, why: 'refused' | 'drop'): void {
  if (i.kind !== 'sg') return;
  const cur = online.cur, { kind: _k, ...rest } = i, mine: Move = { ...rest, who: me() };
  if (i.g !== cur.g) return;
  warn(why, i.i, cur.held.length);
  if (cur.log[i.i] && sameMove(cur.log[i.i], mine)) keep({ ...cur, log: cur.log.slice(0, i.i) });
  // (a mini-game's given up on by the outbox: never sent again, the room may have it; the next goes)
  if (why === 'drop' && isMiniMove(i) && outbox.q[0]?.at === i.i) {
    outbox = { ...outbox, q: outbox.q.slice(1) };
    pump();
  }
}

// the invitation's fold (is the game over?): the rules, words and lines, asked for only when one may ask; kept up
// move by move (online.ts folder: the effect runs on every model change and every move heard)
type Fold = ReturnType<typeof import('./online.ts').folder>;
let ctx = $state.raw<{ fold: Fold; words: Words; lines: readonly Line[]; mini: MiniData } | null>(null);
let asking = false;
function loadCtx(): void {
  if (asking) return;
  asking = true;
  Promise.all([import('./online.ts'), import('./words.ts').then((w) => w.loadWords()), import('./sentences.ts').then((x) => x.loadSentences()), import('./mini/data.ts').then((x) => x.loadMiniData())])
    .then(([o, words, lines, mini]) => (ctx = { fold: o.folder(), words, lines, mini }), () => (asking = false));
}
/** The invitation, kept up with the game held (a minute's tick while one shows: a game left goes stale). */
function watchInvite(): void {
  let tick = $state(0);
  $effect(() => {
    void tick;
    const cur = online.cur, model = week.model;
    const ask = invited({ log: cur.log, me: model?.me ?? null, at: cur.at ?? 0, now: clock(), answered: invite.answered, over: false });
    if (ask && !ctx) loadCtx();
    const g = ask && ctx ? ctx.fold(cur.log, { words: ctx.words, lines: ctx.lines, mini: ctx.mini, name: nameOf }) : null;
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
  // (the e2e's forced みんなで！, dev/test only: mini/offer.ts)
  forceMini(hook('sgMini'));
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
  relay?.onDrop?.((i) => unsend(i, 'drop'));
  // (each hello says the game held and how many of its moves: the room replays it from there, across midnight too)
  relay?.sgAt?.(() => (online.cur.g ? { g: online.cur.g, n: online.cur.log.length } : null));
  let here = new Set<Who>();
  relay?.onStatus((st) => {
    online.connected = st.connected;
    // someone just here (or me back): my turn's view again, whole (the frames go only on change)
    const now = new Set(st.connected ? st.here : []);
    if ([...now].some((w) => !here.has(w))) flushView(true);
    here = now;
    if (online.here.join() !== [...now].join()) online.here = [...now];
  });
  $effect.root(watchInvite);
}

/** Start an online game: its id and first move (the rules' version on it), sent. */
export function startOnline(seats: string, l: 's' | 'n' | 'l'): void {
  listen();
  // (an e2e's pinned id: `?demo&sgId=<10 letters>`, test mode only)
  const pinned = hook('sgId'), g = pinned || newGameId(untrack(() => online.cur.g));
  // (who goes first: from the id, in the start's seats)
  const s = seatsCode(firstSeat(seatsOf(seats), g, pinned ? (hook('sgFirst') ?? '0') : null));
  const move: Move = { g, i: 0, a: 'start', s, l, r: RULES, who: me() };
  keep({ g, log: [move], held: [], at: clock() });
  outbox = OUTBOX;
  send(move);
}

/** My mini-game moves not yet taken (wire.ts Outbox: one in flight, a race lost sent again at the new end); with a
 *  relay that answers (acks), else each goes at once as any move (the demo's tabs). */
let outbox: Outbox = OUTBOX;

/** One move of mine in the online game (its index the next one): none while a move is missing here (the game moved on
 *  without this phone: it waits for it), after the end, or in a game of other rules. A mini-game's (`mp`, `mc`) waits
 *  its turn in the outbox, sent at the log's end then. */
export function sendMove(m: Omit<Move, 'g' | 'i' | 'who'>): void {
  const cur = untrack(() => online.cur);
  if (!cur.g || otherRules(cur.log)) return;
  if (isMiniMove(m) && relay?.onAck) {
    outbox = queued(outbox, m);
    return pump();
  }
  const move = { ...m, g: cur.g, i: cur.log.length, who: me(), t: clock() } as Move;
  if (cur.held.length) return warn('wait', move.i, cur.held.length);
  put(cur, move);
}
/** A move of mine at the log's end: kept (in my log at once) and sent. */
function put(cur: Kept, move: Move): void {
  const h = heard(cur.log, [], move, me());
  if (!h) return;
  keep({ ...cur, log: h.log, at: clock() });
  send(move);
}
/** A closed mini-game's plays not yet sent let go (the in-flight one's answer still comes): never a stray move at the
 *  next turn's place. */
export function dropMiniPlays(): void {
  outbox = { ...outbox, q: outbox.q.filter((x) => x.at !== null) };
}
/** The outbox's next, if it may go now. */
function pump(): void {
  const cur = untrack(() => online.cur);
  const next = cur.g ? toSend(outbox, cur.log, cur.held) : null;
  if (!next) return;
  const m = next.o.q[0].m;
  outbox = next.o;
  put(cur, { ...m, g: cur.g, i: next.i, who: me(), t: clock() } as Move);
}

function send({ who: _w, t: _t, ...m }: Move): void {
  relay?.send({ kind: 'sg', ...m } as SgIntent);
}

/** My turn's view (view.ts) for the others at the table: sent as it changes, at most one each VIEW_GAP_MS (the latest
 *  then); again whole when someone arrives (listen: the status's `here`), and once VIEW_AGAIN_MS have gone by without
 *  one while the turn is open (a watcher's reload, which no presence tells: a slow beat, so the room sleeps between);
 *  null, the turn's panel gone. Only with someone there (sync/live.ts send). */
const VIEW_GAP_MS = 200, VIEW_AGAIN_MS = 30_000;
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
  viewBeat ??= setInterval(() => performance.now() - viewAt >= VIEW_AGAIN_MS && flushView(true), VIEW_AGAIN_MS / 3);
  if (viewTimer) return;
  const wait = viewAt + VIEW_GAP_MS - performance.now();
  if (wait <= 0) flushView(false);
  else viewTimer = setTimeout(() => ((viewTimer = undefined), flushView(false)), wait);
}
/** A view as the sheet shows it (its stamp aside): one heard again unchanged isn't set again. */
const viewKey = (v: (SgView & { who: Who }) | null): string => (v ? JSON.stringify([v.who, v.g, v.i, v.p, v.s, v.x]) : '');
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
