// ききみみ's game on this phone (docs/kikimimi.md "Sync", "Audio"): the round session (kikimimi/round/session.ts, pure)
// over the quiz's GameDefs (the quiz, スピード はしご, a unit's lesson: kikimimi/games/, through games/quiz/session.ts's
// lobby) wired to the island's Live (or to nothing: solo without a relay), its view refreshed at each phase's end and at
// each message; the clips it calls for (clipPlayer.svelte.ts), my record of it (recorder.ts). A deck is built only from
// loaded chunks (pool.ts): what's heard and my own taps wait, in order, for the chunk the deck they touch needs
// (chunkQueue.ts). Loaded with the sheet only.
import { isDialogue, type Item, type Level } from '#lib/kikimimi/bank.ts';
import { SPEEDS, ladderDeck } from '#lib/kikimimi/ladder.ts';
import { FAST_WINDOWS, type SeedAsk } from '#lib/kikimimi/round/session.ts';
import { gameIn, type GameIn, type RoundIn, type RoundOut } from '#lib/kikimimi/round/wire.ts';
import { roundLink, soloLink, wire, type RoundLink } from '#lib/kikimimi/round/link.ts';
import { QuizRounds } from '#lib/kikimimi/games/quiz/session.ts';
import { quizOpts } from '#lib/kikimimi/games/quiz/def.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import type { QuizTimer } from '#lib/kikimimi/seed.ts';
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/types.ts';
import { cue } from '#lib/sound/cues.ts';
import type { ListenRow } from '#lib/contract/listen.ts';
import { GAMES, chunksOf, itemsOf, pinDeck, usePractice } from './decks.ts';
import { deck } from '#lib/kikimimi/deck.ts';
import { agesOf, freshSeed, seedWith } from '#lib/kikimimi/recent.ts';
import { recentGames } from './progress.svelte.ts';
import { ladders, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
import { lessonDeck, type Lesson, type Tier, type UnitPlay } from '#lib/kikimimi/lesson.ts';
import { ChunkQueue } from './chunkQueue.ts';
import { ClipPlayer } from './clipPlayer.svelte.ts';
import { GameRecorder } from './recorder.ts';
import type { Stage } from '#lib/kikimimi/stages.ts';

/** A スピード はしご rung below its ladder's top: its reveal keeps the line hidden and silent (no replay, no transcript),
 *  so the next, faster rung is a listen of its own. */
export const hidesLine = (it: Item | undefined): boolean => !!it?.rung && it.rung.n < SPEEDS.length;
/** 🐢 offered for an item: levels 1-2 (its own level: にがて れんしゅう mixes them), never a dialogue (its lines play
 *  at their own speed: `#playNow`). Play's and the review's alike. */
export const canSlow = (it: Item): boolean => it.lv <= 2 && !isDialogue(it);

/** The host's seed (recent.ts): of SEED_TRIES, the deck that overlaps this phone's last games least, its flags kept (a
 *  quiz's level deck, スピード はしご's ladders; another game's: a random one). */
function seedFor({ gm, o, flags, random }: SeedAsk): number {
  const lv = quizOpts.decode(o)?.lv;
  if (gm === 'ladder') return freshSeed({ random, flags, recent: recentGames(), ids: (s) => ladderDeck(s, ladders()).map((it) => it.id) });
  if (gm === 'quiz' && lv) return freshSeed({ random, flags, recent: recentGames(), ids: (s) => deck(s, lv).map((it) => it.id) });
  return seedWith(random, flags);
}

/** What a heard op needs before the session takes it: an `open`, its deck's chunk. */
export const needs = (m: RoundIn | null): Unit[] => (m?.op === 'open' ? chunksOf(m.gm, m.o, m.u) : []);

/** The longest between wake-ups (the host's beacon is every 3 s: round/session.ts WINDOWS.beacon). */
const WAKE = 3000;

export class QuizGame {
  /** The session's view as of `now` (the relay's clock). */
  view = $state.raw<QuizView>(null as unknown as QuizView);
  now = $state(0);
  /** The game's items (its deck), [] outside one. */
  items = $derived(this.view?.g ? itemsOf(this.view) : []);
  /** Question i was replayed or slowed before my answer (an answer's `rp`). */
  replayed = $state.raw<boolean[]>([]);
  /** A replay sounding, and a dialogue's line being spoken (clipPlayer.svelte.ts). */
  get sounding() {
    return this.#clips.sounding;
  }
  get talk() {
    return this.#clips.talk;
  }
  /** Who else has the island open (the lobby's list). */
  here = $state.raw<readonly Who[]>([]);
  /** おなじへや on a phone that doesn't speak: 🔁 / 🐢 shown disabled (「ホストの スマホで ながれます」), and no
   *  first-listen bonus for anyone (round/session.ts). */
  listenOnly = $derived(!!this.view?.same && !this.view.speaks);
  /** This game is にがて れんしゅう (a solo deck of my weak spots: 'weak') or the last game's misses again ('missed'),
   *  else false. Both are recorded as practice (the row's `p`). */
  practicing = $state<false | 'weak' | 'missed'>(false);
  /** My answers of the last game, as recorded (the results' feedback), or null. */
  recorded = $state.raw<ListenRow | null>(null);
  /** A unit's lesson (docs/curriculum-units.md §3): its unit, which lesson, my tier, whether it's the 30-day recheck;
   *  its deck dealt into my lobby kept alone (the game `lesson`, games/lesson/def.ts), which shows its intro card till
   *  はじめる. Null: a quiz. */
  lesson = $state.raw<{ unit: UnitPlay; lesson: Lesson; tier?: Tier; recheck: boolean } | null>(null);

  readonly me: Who;
  readonly #link: RoundLink;
  readonly #session: QuizRounds;
  readonly #wire: ReturnType<typeof wire<QuizRounds>>;
  #timer: ReturnType<typeof setTimeout> | undefined;
  /** The phase last cued. */
  #cued = '';
  #gone = false;
  readonly #record: ((row: ListenRow) => void) | undefined;
  readonly #recorder = new GameRecorder();
  readonly #clips: ClipPlayer;
  readonly #queue: ChunkQueue;
  #offHere: () => void;

  constructor(o: { live: Live | null; me: Who; fast?: boolean; heard?: readonly GameIn[]; record?: (row: ListenRow) => void }) {
    this.me = o.me;
    this.#record = o.record;
    this.#link = o.live ? roundLink(o.live) : soloLink();
    this.#clips = new ClipPlayer(() => this.#link.now(), () => this.view.i);
    this.#queue = new ChunkQueue(() => this.#gone, () => this.#refresh());
    this.#session = new QuizRounds({ me: o.me, defs: GAMES, seedFor, windows: o.fast ? FAST_WINDOWS : undefined });
    // what the island heard before this sheet opened: as if heard now (a host re-sends only when someone comes back)
    const now = this.#link.now();
    for (const h of o.heard ?? []) {
      const m = gameIn(h);
      if (m) this.#queue.then(() => needs(m), () => void this.#session.receive(m, now));
    }
    this.#offHere = this.#link.onHere((h) => h && (this.here = h));
    // what's heard from now on: in order, each once the chunk it needs is in
    const link = this.#link;
    this.#wire = wire(this.#session, { ...link, on: (fn) => link.on((m) => this.#queue.then(() => needs(m), () => fn(m))) }, () => this.#refresh());
    this.#refresh();
  }

  // ---------- taps ----------

  /** Open a lobby (I host it), on this phone only until `invite`: おなじへや, たいせん, スピード はしご off and the
   *  session's default こたえる じかん unless `o` says. */
  open(lv: Level, o: { same?: boolean; vs?: boolean; ladder?: boolean; timer?: QuizTimer } = {}): void {
    const { same = false, vs = false, ladder = false, timer } = o;
    this.#queue.then(() => [ladder ? 'ladder' : lv], () => {
      this.practicing = false;
      this.lesson = null;
      this.#act((s, now) => s.open({ lv, same, vs, ladder, timer }, now));
    });
  }
  /** にがて れんしゅう (`kind` weak: srs.ts practiceDeck) or the misses again (missed: the last game's items I got
   *  wrong): my lobby kept alone starts at once with `items` as its deck. Nothing on the wire. */
  practice(items: Item[], kind: 'weak' | 'missed' = 'weak'): void {
    this.#queue.then(() => [], () => {
      const v = this.view;
      if (!v?.g || v.phase !== 'lobby' || !v.local || !v.amHost || !items.length) return;
      usePractice(v, items);
      this.#clips.refetch();
      this.practicing = kind;
      this.lesson = null;
      this.go();
    });
  }
  /** A unit's lesson (lesson.ts): once the unit's chunk is in, my lobby kept alone (a quiz's, not a ladder's) becomes
   *  the lesson's game (its 6 questions by the lobby's seed, at my tier: `tier`), and waits on the lesson's intro card
   *  for はじめる (`go`). `recheck`: the 30-day おさらい チェック (a チェック like any). Nothing on the wire. */
  playLesson(unit: string, lesson: Lesson, o: { tier?: Tier | ((stage: Stage) => Tier | undefined); recheck?: boolean } = {}): void {
    this.#queue.then(() => [unit as Unit], () => {
      const v = this.view, part = unitPart(unit);
      if (!part || !v?.g || v.phase !== 'lobby' || !v.local || !v.amHost || v.ladder) return;
      const tier = typeof o.tier === 'function' ? o.tier(part.unit.stage) : o.tier;
      if (!lessonDeck(part, lesson, v.seed, tier).length) return;
      this.practicing = false;
      this.lesson = { unit: part.unit, lesson, ...(tier && { tier }), recheck: !!o.recheck };
      this.#act((s, now) => s.lesson({ u: unit, lesson, ...(tier && { tier }) }, now));
      this.#clips.refetch();
    });
  }
  /** Back from a lesson's intro card to the lobby (its quiz, the lobby's seed kept). */
  dropLesson(): void {
    this.#queue.then(() => [], () => {
      this.lesson = null;
      this.#act((s, now) => s.unlesson(now));
    });
  }
  /** みんなを さそう: my lobby announced to everyone here. */
  invite(): void {
    this.#queue.then(() => [], () => this.#act((s, now) => s.invite(now)));
  }
  /** The lobby's settings (a level or the mode changed: once its chunk is in). */
  configure(o: { lv?: Level; same?: boolean; vs?: boolean; ladder?: boolean; timer?: QuizTimer }): void {
    this.#queue.then(() => [(o.ladder ?? this.view?.ladder) ? 'ladder' : ((o.lv ?? this.view?.lv ?? 1) as Level)], () => this.#act((s, now) => s.configure(o, now)));
  }
  join(g?: string): void {
    this.#queue.then(() => [], () => this.#act((s, now) => s.join(now, g)));
  }
  go(): void {
    this.#queue.then(() => [], () => {
      // a solo game (my lobby kept alone, a quiz): its own deck, the items not heard lately first (nothing on the wire)
      const v = this.view;
      if (v?.g && v.phase === 'lobby' && v.local && v.amHost && !this.practicing && !this.lesson && v.gm === 'quiz') {
        usePractice(v, deck(v.seed, v.lv as Level, undefined, agesOf(recentGames())));
        this.#clips.refetch();
      }
      this.#act((s, now) => s.go(now));
    });
  }
  /** My one, final answer to the current question. */
  answer(k: number): void {
    const i = this.view.i;
    this.#queue.then(() => [], () => this.#act((s, now) => s.answer(k, !!this.replayed[i], now)));
  }
  /** つぎへ (the host's; anyone's once the host has gone). */
  next(): void {
    this.#queue.then(() => [], () => this.#act((s, now) => s.next(now)));
  }
  /** よみおわった (a player's, in a reveal). */
  ready(): void {
    this.#queue.then(() => [], () => this.#act((s, now) => s.ready(now)));
  }
  /** Leave the game (✕, やめる). */
  leave(): void {
    this.#queue.then(() => [], () => this.#act((s, now) => s.leave(now)));
  }
  /** Done with the results or a notice. */
  close(): void {
    this.#queue.then(() => [], () => this.#act((s, now) => void s.close(now)));
  }

  /** 🔁 / 🐢: the current question's clip again (normal or slow), now; counts as a replay for my answer. */
  replay(slow = false): void {
    const it = this.items[this.view.i];
    if (!it) return;
    const i = this.view.i;
    if (this.view.phase === 'answer' && !this.view.answers[i]) {
      this.replayed = Object.assign([...this.replayed], { [i]: true });
      this.#recorder.replayed(i);
    }
    void this.#clips.playNow(it, i, slow);
  }

  /** A review row's ▶︎ / 🐢 (the results). */
  hear(it: Item, slow = false): void {
    void this.#clips.playNow(it, -1, slow);
  }

  /** The relay's clock now (ms): the karaoke's frame loop reads it (SoundLine.svelte). */
  clock(): number {
    return this.#link.now();
  }

  /** The lobby's 🔊 「きこえる？」: whether a clip could play (false: no voice session, interrupted). */
  test(): Promise<boolean> {
    return this.#clips.test();
  }

  /** The sheet closed: leave the game, stop listening and every clip. */
  dispose(): void {
    if (this.#gone) return;
    // a game left mid-way: the questions I answered still count
    if (this.view?.g && this.view.phase !== 'lobby' && this.view.phase !== 'idle') this.#keep(this.view, this.#link.now(), false);
    this.#act((s, now) => s.leave(now)); // (now: not after what waits for a chunk, which is dropped)
    this.#gone = true;
    clearTimeout(this.#timer);
    this.#wire.stop();
    this.#offHere();
    this.#clips.dispose();
  }

  // ---------- inside ----------

  #act(f: (s: QuizRounds, now: number) => RoundOut[] | void): void {
    if (!this.#gone) this.#wire.act(f);
  }

  /** The view now, the clips and cues it calls for, and a wake-up at the phase's end (each second of the 3-2-1; at
   *  least every few seconds: the host's beacon, a lobby's grace and TTL). */
  #refresh(): void {
    if (this.#gone) return;
    this.#wire?.tick(); // (undefined while wire itself calls in, at the start)
    const now = this.#link.now();
    const v = this.#session.view(now);
    if (this.view && v.g !== this.view.g) {
      this.replayed = [];
      this.#recorder.reset();
    }
    // the game I'm in keeps its deck whatever other phones' lobbies build (decks.ts)
    pinDeck(v.g ? v : null);
    this.#recorder.seen(v, now);
    if (v.phase === 'results' && v.g) this.#keep(v, now, true);
    this.view = v;
    this.now = now;
    this.#clips.follow(v, this.items, now, hidesLine);
    this.#cues(v);
    clearTimeout(this.#timer);
    let wait = Number.isFinite(v.until) ? v.until - now : WAKE;
    if (v.phase === 'countdown') wait = Math.min(wait, (v.until - now) % 1000 || 1000);
    this.#timer = setTimeout(() => this.#refresh(), Math.max(20, Math.min(WAKE, wait)) + 10);
  }

  /** My answers of this game recorded, once (recorder.ts): at the results, or when I leave mid-way. */
  #keep(v: QuizView, now: number, done: boolean): void {
    const row = this.#recorder.keep(v, now, done, { lesson: this.lesson, practicing: this.practicing !== false });
    if (!row) return;
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
}
