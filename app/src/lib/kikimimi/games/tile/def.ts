// ことば タイル as a GameDef (docs/curriculum-wave2.md §2.1; kikimimi-framework.md §7 #10): 6 sentences from the
// `listened` tile files at the lobby's place (content/listen/s*-tile*.yaml, pool.ts listenOf), each a round: its clip
// plays once with no tiles, then its words and a few sound decoys (weak forms, contractions, near sounds) to tap into
// order. The answer is the board's index per slot (≤ 12 ints; EMPTY a slot not filled). Pure.
//
// Tiers per player on the same audio (GameDef.tier): each player's `ear` (0 はまべ … 3 やま, their comfortable level's
// place: taikai's tierOf) against the deck's place: below it easy (one decoy, the first tile placed for them), above
// it hard (3-4 decoys: the authored ones and sound swaps of its own words), else the authored decoys.
//
// Co-op (two roles): one board, the slots split, role 0 the 1st, 3rd, 5th… and role 1 the others. Each player answers
// their own slots (the rest EMPTY) and is right when all of theirs are; the team has a sentence when the halves are
// all right (the session's `team.all`). Solo, every slot. A replay is free (the row's `rp`: "hard" for review).
import { fnv1a, mulberry32, shuffle } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import type { Item, Level, SoundMark, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import type { ListenEntry, ListenItem, ListenPart } from '../../listen.ts';
import { RIGHT } from '../../score.ts';
import { TIMERS, type QuizTimer } from '../../seed.ts';
import type { Tier } from '../../lesson.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';

/** A game's sentences. */
export const TILE_QS = 6;
/** A slot not filled (the wire's ints are 0-63). */
export const EMPTY = 63;
/** The answer window's extra per slot (ms): a 12-word sentence takes longer to build than a 4-word one. */
const PER_SLOT = 1500;
/** The roles of a co-op board (odd and even slots). */
const ROLES = 2;
/** The places' `ear` (0 はまべ … 3 やま). */
const EARS = 4;

type TileYaml = Extract<ListenItem, { kind: 'tile' }>;

/** A dealt sentence, as the sheet's game holds it (an Item: its `id` the clip it plays, a derived tile's bank clip),
 *  with its tile's own id, words and decoys. */
export interface TileCard extends Item {
  tile: { id: string; tiles: readonly string[]; decoys: readonly string[] };
}

/** A ことば タイル lobby's options: its level (a place's first: 3 かわ, 4 もり, 6 やま), こたえる じかん, the host's ear. */
export interface TileOpts {
  lv: Level;
  timer: QuizTimer;
  ear: number;
}

/** A level's place (0 はまべ … 4 ほし; -1 none: アナウンス's 5). */
const placeOf = (lv: number): number => PLACES.findIndex((p) => p.lvs.includes(lv));

export const tileOpts = {
  encode: (o: TileOpts): number[] => [o.lv, Math.max(0, TIMERS.indexOf(o.timer)), o.ear],
  decode: (a: readonly number[]): TileOpts | null => {
    const [lv, ti = 0, ear = 1] = a, timer = TIMERS[ti];
    return Number.isInteger(lv) && placeOf(lv) >= 0 && timer !== undefined && Number.isInteger(ear) && ear >= 0 && ear < EARS ? { lv: lv as Level, timer, ear } : null;
  }
};

/** The tile files a level's deck deals from: the `listened` ones at its place, by name. */
export function tileFiles(lv: number, listen: Readonly<Record<string, ListenEntry>>): string[] {
  const stage = placeOf(lv) + 1;
  return Object.entries(listen).filter(([, [g, st, s]]) => g === 'tile' && st === stage && s === 'listened').map(([u]) => u).sort();
}

/** A tile as dealt: its Item (the clip, the speaker, the text and help, the reveal's marks) and its words. */
function cardOf(it: TileYaml, stage: number): TileCard {
  return {
    id: it.clip ?? it.id, lv: PLACES[stage - 1]?.lvs[0] as Level, type: 'word', en: it.en, ja: it.ja, speaker: it.speaker, voice: 'us', choices: it.tiles, answer: 0,
    note: it.note, tags: it.tags as Tags, ...(it.why && { why: it.why }), ...(it.ctx && { ctx: it.ctx }), ...(it.marks && { marks: it.marks as SoundMark[] }),
    ...(it.scene && { scene: it.scene }), ...(it.channel && { channel: it.channel }),
    tile: { id: it.id, tiles: it.tiles, decoys: it.decoys }
  };
}

/** A deck's sentences from its files' parts: 6 by the seed, the shortest first (a warm-up, then longer). */
export function tileDeal(seed: number, parts: readonly ListenPart[]): TileCard[] {
  const pool = parts.flatMap((p) => p.items.flatMap((it) => (it.kind === 'tile' ? [cardOf(it, p.stage)] : [])));
  return shuffle(pool, mulberry32((seed ^ 0x7113) >>> 0)).slice(0, TILE_QS).sort((a, b) => a.tile.tiles.length - b.tile.tiles.length);
}

// ---------- tiers and boards ----------

/** A player's tier on a deck: their ear against its place. */
export const tierAt = (ear: number, lv: number): Tier | undefined => {
  const at = placeOf(lv);
  return ear < at ? 'easy' : ear > at ? 'hard' : undefined;
};

/** What a Japanese ear hears for a word (wave 2 §2.1's decoys: weak forms, contractions, near sounds), lower case. */
const SWAPS: Readonly<Record<string, readonly string[]>> = {
  a: ['the', 'uh'], the: ['a'], an: ['and'], and: ['in', 'an'], in: ['and'], to: ['the', 'two'], for: ['four'], of: ['have', 'a'], have: ['of'],
  "i'd": ["i'll"], "i'll": ["i'd"], i: ["i've"], "i've": ['i'], "we'll": ['we'], "you'll": ['you'], "they'll": ['they'], "it's": ['is'],
  can: ["can't"], "can't": ['can'], want: ["won't"], "won't": ['want'], then: ['ten'], there: ['their'], their: ['there'], your: ["you're"],
  "you're": ['your'], him: ['them'], them: ['him'], her: ['are'], were: ['where'], are: ['our'], this: ['these'], these: ['this'], that: ['it'],
  at: ['it'], on: ['an'], "should've": ["shouldn't have"], "would've": ["wouldn't have"], "could've": ["couldn't have"], "don't": ["won't"],
  "didn't": ["don't"], was: ['is'], is: ['was'], will: ['would'], would: ['will']
};
/** Hard's least and most decoys. */
const HARD = [3, 4] as const;

const capital = (w: string, like: string): string => (/^[A-Z]/.test(like) ? w[0].toUpperCase() + w.slice(1) : w);

/** A sentence's decoys at a tier: easy its first; hard its own topped up from SWAPS over its words (never a word it
 *  has, nor twice); else as authored. */
export function decoysFor(t: TileCard['tile'], tier: Tier | undefined): string[] {
  if (tier === 'easy') return t.decoys.slice(0, 1);
  const out = [...t.decoys];
  if (tier !== 'hard' || out.length >= HARD[0]) return out;
  const taken = new Set([...t.tiles, ...out].map((w) => w.toLowerCase()));
  for (const w of t.tiles) {
    for (const s of SWAPS[w.toLowerCase().replace(/’/g, "'")] ?? []) {
      if (out.length >= HARD[1] || taken.has(s)) continue;
      taken.add(s);
      out.push(capital(s, w));
    }
  }
  return out;
}

/** A sentence's board at a tier: its words and decoys shuffled by the seed and the tile (never its words in order). */
export function boardOf(t: TileCard['tile'], seed: number, tier: Tier | undefined): string[] {
  const words = [...t.tiles, ...decoysFor(t, tier)], r = mulberry32((seed ^ fnv1a(t.id)) >>> 0);
  for (let k = 0; k < 8; k++) {
    const b = shuffle([...words], r);
    if (!inOrder(b, t.tiles)) return b;
  }
  return [...words.slice(1), words[0]];
}
/** The sentence's words read in order off the board (a give-away). */
const inOrder = (board: readonly string[], tiles: readonly string[]): boolean => board.filter((w) => tiles.includes(w)).join(' ') === tiles.join(' ');

// ---------- rounds and grading ----------

/** A round: the tile's id (the row's), its words, the board at the player's tier, the clip's length (ms). */
export interface TileRound extends Round {
  kind: 'tile';
  tiles: readonly string[];
  board: readonly string[];
  play: number;
}

/** A deck's rounds at an ear (`playMs`: a clip's length, unknown: PLAY_UNKNOWN). */
export const tileRounds = (cards: readonly TileCard[], seed: number, o: Pick<TileOpts, 'lv' | 'ear'>, playMs: (id: string) => number | undefined): TileRound[] => {
  const tier = tierAt(o.ear, o.lv);
  return cards.map((c) => ({ kind: 'tile', id: c.tile.id, tiles: c.tile.tiles, board: boardOf(c.tile, seed, tier), play: playMs(c.id) ?? PLAY_UNKNOWN }));
};

/** A role's slots of a sentence of n (solo: every one). */
export const slotsOf = (n: number, role: number | null): number[] => Array.from({ length: n }, (_, j) => j).filter((j) => role === null || j % ROLES === role % ROLES);

/** An answer's filled slots. */
const filled = (a: readonly number[]): number[] => a.flatMap((x, j) => (x === EMPTY ? [] : [j]));

/** Whether slot j holds its word (by the word: a sentence's two "the"s are the same tile). */
export const slotOk = (r: Pick<TileRound, 'tiles' | 'board'>, a: readonly number[], j: number): boolean => a[j] !== EMPTY && r.board[a[j]] === r.tiles[j];

export function tileValid(r: Pick<TileRound, 'tiles' | 'board'>, a: AnswerValue): a is readonly number[] {
  if (!Array.isArray(a) || a.length !== r.tiles.length) return false;
  const used = (a as readonly number[]).filter((x) => x !== EMPTY);
  return used.length > 0 && a.every((x) => Number.isInteger(x) && x >= 0 && (x === EMPTY || x < r.board.length)) && new Set(used).size === used.length;
}

/** Right: every slot filled holds its word, and they're the whole sentence or one role's half. */
export function tileOk(r: Pick<TileRound, 'tiles' | 'board'>, a: readonly number[]): boolean {
  const f = filled(a), n = r.tiles.length;
  const whole = f.length === n || Array.from({ length: ROLES }, (_, k) => slotsOf(n, k)).some((s) => s.join() === f.join());
  return whole && f.every((j) => slotOk(r, a, j));
}

/** The slots an answer got wrong, as a bitmask (the row's `pick`, 0-4095): those it filled with another word. */
export const wrongMask = (r: Pick<TileRound, 'tiles' | 'board'>, a: readonly number[]): number => filled(a).reduce((m, j) => (slotOk(r, a, j) ? m : m | (1 << j)), 0);

/** The team's board: each slot from the answer that filled it (the owners', in turn), its word; null where none did. */
export const unionOf = (boards: readonly { board: readonly string[]; a: readonly number[] }[], n: number): (string | null)[] =>
  Array.from({ length: n }, (_, j) => {
    const by = boards.find((b) => b.a[j] !== undefined && b.a[j] !== EMPTY);
    return by ? (by.board[by.a[j]] ?? null) : null;
  });

/** A player's deck at their ear. */
function tileDeck(rounds: () => readonly TileRound[], o: TileOpts, w: RoundWindows): RoundDeck {
  const base = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    timing: (i) => {
      const r = rounds()[i];
      return { lead: w.lead, play: r?.play ?? PLAY_UNKNOWN, answer: base + PER_SLOT * (r?.tiles.length ?? 0) };
    },
    valid: (i, a) => {
      const r = rounds()[i];
      return !!r && tileValid(r, a);
    },
    grade: (i, a) => {
      const r = rounds()[i];
      if (!r || !tileValid(r, a)) return none;
      const ok = tileOk(r, a);
      return { ok, pts: ok ? RIGHT : 0 };
    },
    get maxScore() {
      return RIGHT * rounds().length;
    }
  };
}

/** Where a game's rounds come from (the phone's decks: lane.ts; a test's): its sentences for a seed and options, and
 *  its content version (its files'). */
export interface TileSource {
  cards(seed: number, o: TileOpts): readonly TileCard[];
  playMs(id: string): number | undefined;
  cv?(o: TileOpts): string | undefined;
}

/** A deck's rounds kept per its cards and ear (the session reads them at every call). */
const ROUNDS = new WeakMap<readonly TileCard[], Map<string, readonly TileRound[]>>();
function roundsOf(cards: readonly TileCard[], seed: number, o: TileOpts, playMs: TileSource['playMs']): readonly TileRound[] {
  let by = ROUNDS.get(cards);
  if (!by) ROUNDS.set(cards, (by = new Map()));
  const k = `${seed}:${o.lv}:${o.ear}`;
  let rs = by.get(k);
  if (!rs) by.set(k, (rs = tileRounds(cards, seed, o, playMs)));
  return rs;
}

export function tileGame(src: TileSource): GameDef<TileOpts> {
  return {
    id: 'tile',
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: tileOpts,
    deck: (seed, o, ctx) => tileDeck(() => roundsOf(src.cards(seed, o), seed, o, src.playMs), o, ctx.w),
    cv: (o) => src.cv?.(o),
    tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ear: Math.max(0, Math.min(EARS - 1, tr)) }) },
    roles: ROLES
  };
}

/** My answers of a game as its `listen` row's (contract/listen.ts): each round I had, right or not, the wrong slots'
 *  mask as `pick` (-1: no answer), my replays. */
export function tileRecord(rounds: readonly TileRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] {
  return rounds.flatMap((r, i): ListenRow['r'] => {
    const a = answers[i];
    if (!had[i] || (!a && !done)) return [];
    const ok = !!a && tileValid(r, a) && tileOk(r, a);
    return [[r.id, ok ? 1 : 0, a && tileValid(r, a) ? wrongMask(r, a) : -1, Math.min(99, rp[i] ?? 0)]];
  }).slice(0, 12);
}

/** A row's answer read back (きろく, a test): the words its mask says were wrong. */
export const wrongWords = (tiles: readonly string[], pick: number): string[] => (pick < 0 ? [] : tiles.filter((_, j) => pick & (1 << j)));

/** A content version over several files' (6 hex; one file: its own; none known: undefined). */
export function cvOver(cvs: readonly (string | undefined)[]): string | undefined {
  if (!cvs.length || cvs.some((c) => c === undefined)) return undefined;
  return cvs.length === 1 ? cvs[0] : (fnv1a(cvs.join(',')) >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}
