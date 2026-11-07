// The games a phone knows (docs/kikimimi-framework.md §2; docs/curriculum-wave2.md §4 W2-C2): each game is a lane, what
// it plugs into the sheet with: its GameDef, the chunks its deck needs, how its items are dealt from them, the host's
// seed, a solo game's own deck (its pages, if any: components/kikimimi/<gm>/views.ts). The games built before wave 2
// (the quiz, スピード はしご, a unit's lesson, the tournament, みみ チェック) ride the sheet's chunk (EAGER); a later game is
// one line in LATER, its folder's lane.ts by import(), its own chunk with its strings (its i18n file, addCatalog), and
// its pages loaded only when one is played: the session takes a game's `open` only once its lane is in (game.svelte.ts
// `wants`: framework §3.2 "Content before the deck"). Its mode (catalog.ts, or its line's own) shows once this build
// has its lane and content (`ready`).
import type { Item } from '../bank.ts';
import type { Tier } from '../lesson.ts';
import type { Stage } from '../stages.ts';
import type { ListenEntry } from '../listen.ts';
import { INDEX, type Unit } from '../pool.ts';
import type { Recent } from '../recent.ts';
import type { QuizTimer } from '../seed.ts';
import type { QuizView } from '../games/quiz/view.ts';
import type { Defs, SeedAsk } from './session.ts';
import type { GameDef, GameId } from './types.ts';
import type { QuizLv } from '../../contract/live-protocol.ts';
import type { ListenRow } from '../../contract/listen.ts';
import { addMode, contentLevels, type ModeMeta } from '../catalog.ts';
import { quizOpts } from '../games/quiz/def.ts';
import { quizLane } from '../games/quiz/lane.ts';
import { ladderLane } from '../games/ladder/lane.ts';
import { lessonLane } from '../games/lesson/lane.ts';
import { taikaiLane } from '../games/taikai/lane.ts';
import { checkLane } from '../games/check/lane.ts';
import { DEVICE, localKV, readJson } from '../../sync/storage.ts';
import { KURI_MODE } from '../games/kuri/mode.ts';

/** A game's deck as the phone names it: its game, seed, options (as on the wire), unit and items' ids (an `open`'s). */
export interface DeckOf {
  gm: GameId | null;
  seed: number;
  o: readonly number[];
  u?: string;
  ids?: readonly number[];
}

/** What a lane's GameDef reads its deck through (components/kikimimi/decks.ts): the items dealt (kept per deck: dealt
 *  once, the game I'm in held) and a game's content version over a unit of content (levels/index.json's `games`). */
export interface Phone {
  items(d: DeckOf): readonly Item[];
  cv(gm: GameId, u: Unit): string | undefined;
}

/** A game lane: what a game implements to be played (`O`: its options, as its GameDef decodes them). */
export interface Lane<O = any> {
  id: GameId;
  /** Its GameDef over the phone's decks. */
  def(phone: Phone): GameDef<O>;
  /** The chunks (pool.ts) a deck of its needs in before it's dealt: its level's, its unit's, its ids' levels. */
  chunks(d: Omit<DeckOf, 'gm' | 'seed'>): Unit[];
  /** Its items from the loaded chunks: pure, the same on every phone for the deck's seed, options, unit and ids. */
  deal(d: DeckOf): Item[];
  /** Its deck is the open's ids (the cache keys a deck by them too). */
  byIds?: boolean;
  /** The host's seed for a lobby of its (recent.ts: the deck that overlaps my last games least); none: a random one. */
  seed?(ask: SeedAsk, recent: Recent): number;
  /** A game I start alone: its own deck (the quiz's: the items not heard lately first), nothing on the wire. */
  solo?(d: DeckOf, recent: Recent): Item[];
  /** My tier for a game of its I join (a join's `tr`: GameDef.tier), from my comfortable level or my tier for a
   *  unit's stage (lesson.ts tierFor); none: no tiers. */
  myTier?(u: string | undefined, my: { level: number | null; tierOf(stage: Stage): Tier | undefined }): number | undefined;
  /** The chunks to have in while a game of it runs (みみ チェック's: the levels round its band). */
  ahead?(v: QuizView, items: readonly Item[]): Unit[];
  /** A lobby's options from its page's picks (a place's level, こたえる じかん) and my comfortable level (a host's tier);
   *  none: `[lv, timer]` (quizOpts). They lead with those two as the quiz's do (the lobby's view reads its level and timer
   *  from them), a game's own after. */
  opts?(p: { lv: number; timer: QuizTimer; level?: number | null }): number[];
  /** My answers of its game as my `listen` row's (components/kikimimi/recorder.ts), when they aren't choices (else
   *  progress.ts listenAnswers): from the view (my options, seed, raw answers, the rounds I had), its items and my
   *  replays; the row carries its `gm`. */
  record?(v: QuizView, items: readonly Item[], rp: readonly number[], done: boolean): ListenRow['r'];
  /** The title bar's i18n key while it runs and at its results (else the question's count), and a lobby of another's
   *  I joined (else みんなで). */
  title?: { game?: string; lobby?: string };
}

/**
 * A later game: its lane by import() (its own chunk); its mode when the catalog hasn't one for it (a mic mode's,
 * docs/kikimimi-mic.md §3.4: catalog.ts addMode); whether this build has its content (none: a `listened` file of its
 * game in the index, as wave 2's: kikimimi-framework.md "Listen parts as built"). One line each, e.g.
 *   tile: { lane: () => import('../games/tile/lane.ts') },
 *   mane: { lane: () => import('../games/mane/lane.ts'), content: () => true, mode: { id: 'mane', group: 'koe', …, requires: 'mic', gate: micReady } },
 */
export interface Later {
  lane: () => Promise<{ lane: Lane }>;
  mode?: ModeMeta;
  content?: () => boolean;
}

/** The mic is on on this phone (せってい › マイク: DEVICE.mic, lib/mic/pick.ts's): a mic mode's gate. */
const micOn = (): boolean => readJson<{ on?: unknown }>(localKV(), DEVICE.mic)?.on === true;

/** The games built into the sheet's chunk. */
const EAGER: readonly Lane[] = [quizLane, ladderLane, lessonLane, taikaiLane, checkLane];
/** The games of their own chunks, by id (docs/curriculum-wave2.md §2: tile, tachi, call, rush, news; the mic modes). */
const LATER: Readonly<Record<GameId, Later>> = {
  // one line a game (Later)
  tile: { lane: () => import('../games/tile/lane.ts') },
  tachi: { lane: () => import('../games/tachi/lane.ts') },
  call: { lane: () => import('../games/call/lane.ts') },
  rush: { lane: () => import('../games/rush/lane.ts') },
  mane: { lane: () => import('../games/mane/lane.ts'), content: () => true, mode: { id: 'mane', group: 'koe', icon: '🦜', mins: 2, qs: 4, coop: false, game: 'mane', requires: 'mic', gate: micOn } },
  kuri: { lane: () => import('../games/kuri/lane.ts'), content: () => true, mode: KURI_MODE },
};

/** The levels of the places a game's listened files are at (catalog.ts contentLevels over this build's index). */
export const laneLevels = (gm: GameId): number[] => contentLevels(gm, INDEX.listen);

/** The level a lane's game plays for `want` (a place's first level, as StageRow's): want when its content has that
 *  place, else the nearest below, else its easiest (none: want). */
export function levelFor(gm: GameId, want: number, listen: Readonly<Record<string, ListenEntry>> = INDEX.listen): number {
  const lvs = contentLevels(gm, listen);
  return lvs.includes(want) ? want : (lvs.filter((x) => x <= want).at(-1) ?? lvs[0] ?? want);
}

/** A lobby's options for a lane's game from the picks (Lane.opts, else the quiz's `[lv, timer]`). */
export const laneOpts = (lane: Lane, p: { lv: number; timer: QuizTimer; level?: number | null }): number[] =>
  lane.opts?.(p) ?? quizOpts.encode({ lv: p.lv as QuizLv, timer: p.timer });

export class Registry {
  readonly #lanes = new Map<GameId, Lane>();
  readonly #later: Readonly<Record<GameId, Later>>;
  readonly #listen: Readonly<Record<string, ListenEntry>>;
  readonly #coming = new Map<GameId, Promise<Lane | undefined>>();

  /** `listen`: the index's listening files (game, stage, status), whose `listened` ones are a later game's content. */
  constructor(eager: readonly Lane[], later: Readonly<Record<GameId, Later>> = {}, listen: Readonly<Record<string, ListenEntry>> = INDEX.listen) {
    for (const l of eager) this.#lanes.set(l.id, l);
    this.#later = later;
    this.#listen = listen;
  }

  /** A game's lane, loaded (undefined: not yet, or a game this build hasn't). */
  of(gm: GameId | null | undefined): Lane | undefined {
    return gm ? this.#lanes.get(gm) : undefined;
  }
  /** Whether a later game's mode can show: this build has its lane and its content. */
  ready(gm: GameId): boolean {
    const r = Object.hasOwn(this.#later, gm) ? this.#later[gm] : undefined;
    return !!r && (r.content ? r.content() : Object.values(this.#listen).some(([g, , status]) => g === gm && status === 'listened'));
  }
  /** The modes the later games bring (beside the catalog's own). */
  modes(): ModeMeta[] {
    return Object.values(this.#later).flatMap((r) => (r.mode ? [r.mode] : []));
  }
  /** What to wait for before a game of `gm` is taken: its lane's chunk (null: nothing, it's in or this build hasn't it).
   *  A lane that won't load is tried again next time. */
  loading(gm: GameId | null | undefined): Promise<Lane | undefined> | null {
    if (!gm || this.#lanes.has(gm) || !Object.hasOwn(this.#later, gm)) return null;
    let p = this.#coming.get(gm);
    if (!p) {
      p = this.#later[gm].lane().then(({ lane }) => {
        this.#lanes.set(gm, lane);
        return lane;
      }).finally(() => this.#coming.delete(gm));
      this.#coming.set(gm, p);
    }
    return p;
  }
}

/** This build's games (and the later ones' modes, on the catalog's shelves). */
export const LANES = new Registry(EAGER, LATER);
for (const m of LANES.modes()) addMode(m);

/** A session's game lookup over these games. */
export function registry(defs: readonly GameDef<unknown>[]): Defs {
  const by = new Map(defs.map((d) => [d.id, d]));
  return (gm) => by.get(gm);
}
