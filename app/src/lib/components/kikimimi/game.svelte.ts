// ききみみ クイズ's game on this phone (docs/kikimimi.md "Sync", "Audio"): the session (kikimimi/session.ts, pure) wired to
// the island's Live (or to nothing: solo without a relay), its view refreshed at each phase's end and at each message,
// and the clips: each question's played at its start on the relay's clock (playVoice's relayAt), the next one fetched
// meanwhile, the reveal's replay, and the player's 🔁 / 🐢. A dialogue's lines are a sequence of clips (playSequence:
// each line scheduled on the relay's clock after the one before, LINE_GAP apart; the session's schedule has their summed
// length, clips.ts itemDur). A deck is built only from loaded levels (pool.ts): what's heard and my own taps wait, in
// order, for the chunk the deck they touch needs (`#then`). Loaded with the sheet only.
import { clipIds, isDialogue, type Item, type Level } from '#lib/kikimimi/bank.ts';
import { clipDur, clipUrl, itemDur, sequenceStarts } from '#lib/kikimimi/clips.ts';
import { SPEEDS, ladderDeck, ladderPoints } from '#lib/kikimimi/ladder.ts';
import { FAST_WINDOWS, QuizSession, isLadder, quizLink, wireQuiz, type DeckOf, type QuizIn, type QuizLink, type QuizOut, type QuizTimer, type QuizView } from '#lib/kikimimi/session.ts';
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { loadVoice, playVoice } from '#lib/sound/sound.svelte.ts';
import { audioUrl } from '#lib/sound/manifest.ts';
import { cue } from '#lib/sound/cues.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import type { ListenRow } from '#lib/contract/listen.ts';
import { listenAnswers } from '#lib/kikimimi/progress.ts';
import { preloadStage } from './scene/stage.ts';
import { itemsOf, pinDeck, usePractice } from './decks.ts';
import { deck } from '#lib/kikimimi/deck.ts';
import { agesOf, freshSeed } from '#lib/kikimimi/recent.ts';
import { recentGames, rememberGame } from './progress.svelte.ts';
import { TEST_CLIP, ladders, load, loaded, type Unit } from '#lib/kikimimi/pool.ts';

/** The deck as the session sees it: how many, each item's length as played (ms, clips.json: a dialogue's lines and
 *  the gaps) and its right choice. Read through at each call: にがて れんしゅう puts its own items in before the start
 *  (usePractice), and the session counts them again at `go`. */
const deckOf: DeckOf = (seed, lv) => {
  const at = (i: number) => itemsOf(seed, lv)[i];
  return {
    get count() {
      return itemsOf(seed, lv).length;
    },
    dur: (i) => Math.round((at(i) ? (itemDur(at(i)) ?? 2) : 2) * 1000),
    answer: (i) => at(i)?.answer ?? -1,
    // スピード はしご: the rungs climbed (ladder.ts), not each answer's points
    ...(isLadder(seed) && {
      score: (a: ReadonlyMap<number, { k: number; rp: boolean }>) => ladderPoints(itemsOf(seed, lv), a),
      // a rung below the top: its reveal hides the line, so it moves on by itself (session.ts WINDOWS.auto)
      auto: (i: number) => hidesLine(at(i))
    })
  };
};

/** A スピード はしご rung below its ladder's top: its reveal keeps the line hidden and silent (no replay, no transcript),
 *  so the next, faster rung is a listen of its own. */
export const hidesLine = (it: Item | undefined): boolean => !!it?.rung && it.rung.n < SPEEDS.length;

/** A dialogue's lines' lengths (s, clips.json; 2 s while one has no clip). */
const lineDurs = (it: Item): number[] => clipIds(it).map((id) => clipDur(id) ?? 2);

/** No relay (a dev build without one): a game alone, on the device's clock. */
const soloLink = (): QuizLink => ({ now: () => Date.now(), send: () => false, on: () => () => {}, onHere: (fn) => (fn([]), () => {}) });

/** The host's seed (recent.ts): of SEED_TRIES, the deck that overlaps this phone's last games least, its flags kept. */
const seedFor = ({ lv, flags, random }: { lv: Level; flags: number; random: () => number }): number =>
  freshSeed({ random, flags, recent: recentGames(), ids: (s) => (isLadder(s) ? ladderDeck(s, ladders()) : deck(s, lv)).map((it) => it.id) });

/** The chunk a game's deck needs: its level's, or the ladders'. */
export const unitFor = (seed: number, lv: Level): Unit => (isLadder(seed) ? 'ladder' : lv);
/** What a heard intent needs before the session takes it: an `open`, its deck's chunk. */
const needs = (m: QuizIn): Unit[] => (m.op === 'open' ? [unitFor(m.seed, m.lv as Level)] : []);

type Handle = { stop(): void };
/** The longest between wake-ups (the host's beacon is every 3 s: session.ts WINDOWS.beacon). */
const WAKE = 3000;

export class QuizGame {
  /** The session's view as of `now` (the relay's clock). */
  view = $state.raw<QuizView>(null as unknown as QuizView);
  now = $state(0);
  /** The game's items (its deck), [] outside one. */
  items = $derived(this.view?.g ? itemsOf(this.view.seed, this.view.lv) : []);
  /** Question i was replayed or slowed before my answer (an answer's `rp`). */
  replayed = $state<boolean[]>([]);
  /** A replay sounding (🔁, 🐢, the reveal's, a review row's: i -1), on the relay's clock: the bubble's bar, the
   *  karaoke (`at` the item's id). */
  sounding = $state.raw<{ i: number; at: string; from: number; until: number; slow: boolean } | null>(null);
  /** A dialogue's line being spoken (its speaker bobs, its karaoke runs): question i (-1: a review row), line k of item
   *  `at`, started at `from` (the relay's clock); on every phone, from the schedule (おなじへや's others hear the host's). */
  talk = $state.raw<{ i: number; k: number; at: string; from: number } | null>(null);
  /** Who else has the island open (the lobby's list). */
  here = $state.raw<readonly Who[]>([]);
  /** おなじへや on a phone that doesn't speak: 🔁 / 🐢 shown disabled (「ホストの スマホで ながれます」), and no
   *  first-listen bonus for anyone (session.ts). */
  listenOnly = $derived(!!this.view?.same && !this.view.speaks);
  /** This game is にがて れんしゅう (a solo deck of my weak spots: 'weak') or the last game's misses again ('missed'),
   *  else false. Both are recorded as practice (the row's `p`). */
  practicing = $state<false | 'weak' | 'missed'>(false);
  /** My answers of the last game, as recorded (the results' feedback), or null. */
  recorded = $state.raw<ListenRow | null>(null);

  readonly me: Who;
  readonly #link: QuizLink;
  readonly #session: QuizSession;
  readonly #wire: ReturnType<typeof wireQuiz>;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #handles = new Set<Handle>();
  /** The first play planned: its question and start (a `skip` moving it plans it again). */
  #planned: { i: number; at: number; h: Handle | null } | null = null;
  /** The question whose reveal replay was played, the phase last cued, the deck whose clips were fetched. */
  #revealed = -1;
  #cued = '';
  #fetched = '';
  #gone = false;
  /** My replays per question before answering (the row's `rp`), when the game began, the game recorded. */
  #rp: number[] = [];
  #began = 0;
  #recordedG = '';
  /** The game whose items went into this phone's history. */
  #remembered = '';
  readonly #record: ((row: ListenRow) => void) | undefined;
  #soundingTimer: ReturnType<typeof setTimeout> | undefined;
  #talkTimers: ReturnType<typeof setTimeout>[] = [];
  /** The first play whose lines' turns were planned (its question and start). */
  #talked = '';
  #offHere: () => void;
  /** What's waiting for a chunk (`#then`), in order; null when nothing is. */
  #queue: Promise<void> | null = null;

  constructor(o: { live: Live | null; me: Who; fast?: boolean; heard?: readonly QuizIn[]; record?: (row: ListenRow) => void }) {
    this.me = o.me;
    this.#record = o.record;
    this.#link = o.live ? quizLink(o.live) : soloLink();
    this.#session = new QuizSession({ me: o.me, deckOf, seedFor, windows: o.fast ? FAST_WINDOWS : undefined });
    // what the island heard before this sheet opened: as if heard now (a host re-sends only when someone comes back)
    const now = this.#link.now();
    for (const m of o.heard ?? []) this.#then(() => needs(m), () => void this.#session.receive(m, now));
    this.#offHere = this.#link.onHere((h) => h && (this.here = h));
    // what's heard from now on: in order, each once the chunk it needs is in
    const link = this.#link;
    this.#wire = wireQuiz(this.#session, { ...link, on: (fn) => link.on((m) => this.#then(() => needs(m), () => fn(m))) }, () => this.#refresh());
    this.#refresh();
  }

  // ---------- taps ----------

  /** Open a lobby (I host it), on this phone only until `invite`. */
  open(lv: Level, same = false, vs = false, ladder = false, timer?: QuizTimer): void {
    this.#then(() => [ladder ? 'ladder' : lv], () => {
      this.practicing = false;
      this.#act((s, now) => s.open({ lv, same, vs, ladder, timer }, now));
    });
  }
  /** にがて れんしゅう (`kind` weak: srs.ts practiceDeck) or the misses again (missed: the last game's items I got
   *  wrong): my lobby kept alone starts at once with `items` as its deck. Nothing on the wire. */
  practice(items: Item[], kind: 'weak' | 'missed' = 'weak'): void {
    this.#then(() => [], () => {
      const v = this.view;
      if (!v?.g || v.phase !== 'lobby' || !v.local || !v.amHost || !items.length) return;
      usePractice(v.seed, v.lv as Level, items);
      this.#fetched = '';
      this.practicing = kind;
      this.go();
    });
  }
  /** みんなを さそう: my lobby announced to everyone here. */
  invite(): void {
    this.#then(() => [], () => this.#act((s, now) => s.invite(now)));
  }
  /** The lobby's settings (a level or the mode changed: once its chunk is in). */
  configure(o: { lv?: Level; same?: boolean; vs?: boolean; ladder?: boolean; timer?: QuizTimer }): void {
    this.#then(() => [(o.ladder ?? this.view?.ladder) ? 'ladder' : ((o.lv ?? this.view?.lv ?? 1) as Level)], () => this.#act((s, now) => s.configure(o, now)));
  }
  join(g?: string): void {
    this.#then(() => [], () => this.#act((s, now) => s.join(now, g)));
  }
  go(): void {
    this.#then(() => [], () => {
      // a solo game (my lobby kept alone, a quiz): its own deck, the items not heard lately first (nothing on the wire)
      const v = this.view;
      if (v?.g && v.phase === 'lobby' && v.local && v.amHost && !this.practicing && !v.ladder) {
        usePractice(v.seed, v.lv as Level, deck(v.seed, v.lv as Level, undefined, agesOf(recentGames())));
        this.#fetched = '';
      }
      this.#act((s, now) => s.go(now));
    });
  }
  /** My one, final answer to the current question. */
  answer(k: number): void {
    const i = this.view.i;
    this.#then(() => [], () => this.#act((s, now) => s.answer(k, !!this.replayed[i], now)));
  }
  /** つぎへ (the host's; anyone's once the host has gone). */
  next(): void {
    this.#then(() => [], () => this.#act((s, now) => s.next(now)));
  }
  /** よみおわった (a player's, in a reveal). */
  ready(): void {
    this.#then(() => [], () => this.#act((s, now) => s.ready(now)));
  }
  /** Leave the game (✕, やめる). */
  leave(): void {
    this.#then(() => [], () => this.#act((s, now) => s.leave(now)));
  }
  /** Done with the results or a notice. */
  close(): void {
    this.#then(() => [], () => this.#act((s, now) => void s.close(now)));
  }

  /** 🔁 / 🐢: the current question's clip again (normal or slow), now; counts as a replay for my answer. */
  replay(slow = false): void {
    const it = this.items[this.view.i];
    if (!it) return;
    const i = this.view.i;
    if (this.view.phase === 'answer' && !this.view.answers[i]) {
      this.replayed = Object.assign([...this.replayed], { [i]: true });
      this.#rp[i] = (this.#rp[i] ?? 0) + 1;
    }
    void this.#playNow(it, i, slow);
  }

  /** A review row's ▶︎ / 🐢 (the results). */
  hear(it: Item, slow = false): void {
    void this.#playNow(it, -1, slow);
  }

  /** The relay's clock now (ms): the karaoke's frame loop reads it (SoundLine.svelte). */
  clock(): number {
    return this.#link.now();
  }

  /** The lobby's 🔊 「きこえる？」: whether a clip could play (false: no voice session, interrupted). */
  async test(): Promise<boolean> {
    const buf = await loadVoice(clipUrl(TEST_CLIP));
    if (!buf || this.#gone) return false;
    this.#stopAll();
    return !!this.#track(playVoice(buf));
  }

  /** The sheet closed: leave the game, stop listening and every clip. */
  dispose(): void {
    if (this.#gone) return;
    // a game left mid-way: the questions I answered still count
    if (this.view?.g && this.view.phase !== 'lobby' && this.view.phase !== 'idle') this.#keep(this.view, this.#link.now(), false);
    this.#act((s, now) => s.leave(now)); // (now: not after what waits for a chunk, which is dropped)
    this.#gone = true;
    clearTimeout(this.#timer);
    clearTimeout(this.#soundingTimer);
    this.#untalk();
    this.#wire.stop();
    this.#offHere();
    this.#stopAll();
  }

  // ---------- inside ----------

  #act(f: (s: QuizSession, now: number) => QuizOut[] | void): void {
    if (!this.#gone) this.#wire.act(f);
  }

  /**
   * `f` once the chunks `need()` names are loaded (pool.ts), after whatever waits already: at once when nothing does
   * (the usual case: the lobby's level is in before the sheet opens), else in order once loaded, the view refreshed.
   * `need` is asked at its turn (a configure after another's level). A chunk that won't load drops `f` (offline with
   * the chunk never fetched: the host's re-sent `open` tries again).
   */
  #then(need: () => readonly Unit[], f: () => void): void {
    const step = (later: boolean): Promise<void> | void => {
      if (this.#gone) return;
      const missing = need().filter((u) => !loaded(u));
      if (missing.length) return load(...missing).then(() => step(true));
      f();
      if (later) this.#refresh();
    };
    if (!this.#queue) {
      const p = step(false);
      if (p) this.#settle(p);
    } else this.#settle(this.#queue.then(() => step(true)));
  }

  #settle(p: Promise<void>): void {
    const q: Promise<void> = p.catch((e) => console.warn('kikimimi: a chunk didn’t load', e)).then(() => {
      if (this.#queue === q) this.#queue = null;
    });
    this.#queue = q;
  }

  /** The view now, the clips and cues it calls for, and a wake-up at the phase's end (each second of the 3-2-1; at
   *  least every few seconds: the host's beacon, a lobby's grace and TTL). */
  #refresh(): void {
    if (this.#gone) return;
    this.#wire?.tick(); // (undefined while wireQuiz itself calls in, at the start)
    const now = this.#link.now();
    const v = this.#session.view(now);
    if (this.view && v.g !== this.view.g) {
      this.replayed = [];
      this.#rp = [];
      this.#began = 0;
    }
    // the game I'm in keeps its deck whatever other phones' lobbies build (decks.ts)
    pinDeck(v.g ? v.seed : null, v.lv as Level);
    if (v.g && v.phase !== 'lobby' && v.phase !== 'idle' && !this.#began) this.#began = now;
    // a game begun: its items first in this phone's history (recent.ts)
    if (v.g && v.phase !== 'lobby' && v.phase !== 'idle' && this.#remembered !== v.g) {
      this.#remembered = v.g;
      rememberGame(itemsOf(v.seed, v.lv as Level).map((it) => it.id));
    }
    if (v.phase === 'results' && v.g) this.#keep(v, now, true);
    this.view = v;
    this.now = now;
    this.#sounds(v, now);
    this.#cues(v);
    clearTimeout(this.#timer);
    let wait = Number.isFinite(v.until) ? v.until - now : WAKE;
    if (v.phase === 'countdown') wait = Math.min(wait, (v.until - now) % 1000 || 1000);
    this.#timer = setTimeout(() => this.#refresh(), Math.max(20, Math.min(WAKE, wait)) + 10);
  }

  #sounds(v: QuizView, now: number): void {
    const items = this.items;
    // the lobby: the deck's clips fetched into the cache (8 × ~15 KB), the first one decoded
    if (v.g && (v.phase === 'lobby' || v.phase === 'countdown') && this.#fetched !== `${v.seed}:${v.lv}` && items.length) {
      this.#fetched = `${v.seed}:${v.lv}`;
      for (const id of items.flatMap((it) => clipIds(it))) void fetch(audioUrl(clipUrl(id))).then((r) => (this.#gone ? null : r.arrayBuffer())).catch(() => {});
      if (v.speaks) void loadVoice(clipUrl(clipIds(items[0])[0]));
      preloadStage(items[0]);
    }
    if (v.phase === 'idle' || v.phase === 'lobby' || v.phase === 'results') {
      if (this.#planned || this.#handles.size) this.#stopAll();
      this.#planned = null;
      this.#revealed = -1;
      this.#untalk();
      return;
    }
    const it = items[v.i];
    if (!it || v.i < 0) return;
    if (this.#planned && this.#planned.i !== v.i) {
      this.#stopAll();
      this.#planned = null;
    }
    // (untimed, a phone that came in after the clip: its first play now, once, not counted as a replay)
    const late = v.phase === 'answer' && !Number.isFinite(v.limit) && !v.answers[v.i] && this.#planned?.i !== v.i;
    const first = v.phase === 'lead' || v.phase === 'play' || late;
    if (first && v.speaks && !v.out && (!this.#planned || (this.#planned.at !== v.playAt && now < this.#planned.at) || late)) {
      this.#planned?.h?.stop();
      const plan: { i: number; at: number; h: Handle | null } = { i: v.i, at: v.playAt, h: null };
      this.#planned = plan;
      void this.#playSequence(it, late ? null : plan.at, () => this.#planned === plan).then((h) => (plan.h = h));
      // the next question's (first) clip decoded meanwhile (the engine keeps the last 4)
      const after = items[v.i + 1];
      if (after) void loadVoice(clipUrl(clipIds(after)[0]));
      // and its scene card's art (one question ahead: one backdrop on screen, the next in the image cache)
      preloadStage(after);
    }
    // a dialogue's turns (the speaker who bobs), from the schedule, on every phone
    if (first && !v.out && isDialogue(it) && this.#talked !== `${v.i}:${v.playAt}`) {
      this.#talked = `${v.i}:${v.playAt}`;
      this.#turns(it, v.i, v.playAt);
    }
    if (v.phase === 'reveal' && this.#revealed !== v.i) {
      this.#revealed = v.i;
      // (a スピード はしご rung below the top: no replay, the next rung's listen is the next, faster one)
      if (v.speaks && !v.out && !hidesLine(it)) void this.#playNow(it, v.i, false);
    }
  }

  /** My answers of this game as a `listen` row (contract/listen.ts), recorded once: at the results (an unanswered
   *  question timed out) or when I leave mid-way (only those answered). Only the questions I had (the view's `had`):
   *  those before a mid-game join or slept through aren't in it. Joined again after leaving, the game's second row
   *  has the same `g`; the stats fold them into one game (progress.ts gamesOf). */
  #keep(v: QuizView, now: number, done: boolean): void {
    if (!v.g || this.#recordedG === v.g) return;
    const r = listenAnswers(itemsOf(v.seed, v.lv as Level), v.answers, v.had, this.#rp, done);
    if (!r.length) return;
    this.#recordedG = v.g;
    const row: ListenRow = {
      d: localDateAt(now), g: v.g, lv: v.lv, n: Math.max(1, Math.min(3, v.players.length)),
      ms: Math.max(0, Math.min(3_600_000, Math.round(now - (this.#began || now)))), ...(this.practicing !== false && { p: 1 as const }), r
    };
    this.recorded = row;
    this.#record?.(row);
  }

  #cues(v: QuizView): void {
    const key = `${v.g}:${v.i}:${v.phase}`;
    if (key === this.#cued) return;
    this.#cued = key;
    if (v.phase === 'lead' && !v.out) cue('quiz-pop');
    else if (v.phase === 'reveal' && !v.out) {
      const a = v.answers[v.i];
      cue(a && a.k === this.items[v.i]?.answer ? 'quiz-right' : 'quiz-wrong');
    } else if (v.phase === 'results' && v.g) cue('quiz-end');
  }

  /**
   * An item's clips played as one, from `at` on the relay's clock: a single clip, or a dialogue's lines each after the
   * one before with LINE_GAP between (sequenceStarts: heard late, a line over is skipped and the one under way plays
   * whole from now). Each line through playVoice; the buffers decoded first (all held here, whatever the engine's LRU
   * drops). `at` null: now, once decoded. `still()`: false once it's no longer wanted (the plan moved); `before()` runs
   * as it starts (a replay stops what sounds). One handle stops them all, with its start and length (ms).
   */
  async #playSequence(it: Item, at: number | null, still: () => boolean, o: { slow?: boolean; before?: () => void } = {}): Promise<(Handle & { from: number; ms: number }) | null> {
    const bufs = await Promise.all(clipIds(it).map((id) => loadVoice(clipUrl(id, o.slow))));
    if (bufs.some((b) => !b) || this.#gone || !still()) return null;
    o.before?.();
    const now = () => this.#link.now();
    const from = at ?? now();
    const starts = sequenceStarts(bufs.map((b) => b!.duration), from, now());
    const hs = bufs.flatMap((b, k) => (starts[k] < 0 ? [] : [this.#track(playVoice(b!, { relayAt: starts[k], now }))])).filter((h) => !!h);
    if (!hs.length) return null;
    const last = starts.length - 1;
    return { stop: () => hs.forEach((h) => h.stop()), from, ms: Math.max(0, starts[last] + bufs[last]!.duration * 1000 - from) };
  }

  /** A dialogue's turns from `from` (relay clock): `talk` follows its lines (clips.json lengths), then clears. */
  #turns(it: Item, i: number, from: number): void {
    this.#untalk();
    const now = this.#link.now();
    const durs = lineDurs(it), starts = sequenceStarts(durs, from, from); // the schedule as planned (none heard late)
    const ends = starts.map((start, k) => start + durs[k] * 1000);
    starts.forEach((start, k) => {
      if (ends[k] > now) this.#talkTimers.push(setTimeout(() => !this.#gone && (this.talk = { i, k, at: it.id, from: start }), Math.max(0, start - now)));
    });
    this.#talkTimers.push(setTimeout(() => !this.#gone && (this.talk = null), Math.max(0, ends.at(-1)! - now)));
  }

  #untalk(): void {
    for (const h of this.#talkTimers) clearTimeout(h);
    this.#talkTimers = [];
    this.talk = null;
  }

  async #playNow(it: Item, i: number, slow: boolean): Promise<void> {
    const at = this.view.i;
    // gone, or the game moved on while it loaded (a replay of the last question over the next one's clip: dropped)
    const h = await this.#playSequence(it, null, () => i < 0 || this.view.i === at, { slow: slow && !isDialogue(it), before: () => this.#stopAll(true) });
    if (!h) return;
    if (isDialogue(it)) this.#turns(it, i, h.from);
    const s = { i, at: it.id, from: h.from, until: h.from + h.ms, slow };
    this.sounding = s;
    clearTimeout(this.#soundingTimer);
    this.#soundingTimer = setTimeout(() => this.sounding === s && (this.sounding = null), h.ms + 50);
  }

  #track(h: { stop(): void } | null): Handle | null {
    if (!h) return null;
    this.#handles.add(h);
    return h;
  }

  /** Every clip of mine stops (`keepPlan`: but the first play planned, when it's a replay over it: never, the
   *  replay buttons wait for its end). */
  #stopAll(keepPlan = false): void {
    for (const h of this.#handles) h.stop();
    this.#handles.clear();
    if (!keepPlan) this.#planned = this.#planned ? { ...this.#planned, h: null } : null;
    this.sounding = null;
  }
}
