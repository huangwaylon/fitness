// ことば タイル as a GameDef (docs/kikimimi-engine.md "ことば タイル", "The games" #10): 6 sentences from the
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
import type { Item, Level, SoundMark, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import type { ListenItem, ListenPart } from '../../listen.ts';
import type { Tier } from '../../lesson.ts';
import type { AnswerValue, Round } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { EMPTY, ROLES, filled, shareOf, tierAt, type ListenOpts, type ListenRules } from '../listened.ts';

/** A game's sentences. */
export const TILE_QS = 6;
/** The answer window's extra per slot (ms): a 12-word sentence takes longer to build than a 4-word one. */
const PER_SLOT = 1500;

type TileYaml = Extract<ListenItem, { kind: 'tile' }>;

/** A dealt sentence, as the sheet's game holds it (an Item: its `id` the clip it plays, a derived tile's bank clip),
 *  with its tile's own id, words and decoys. */
export interface TileCard extends Item {
  tile: { id: string; tiles: readonly string[]; decoys: readonly string[] };
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

/** What a Japanese ear hears for a word (kikimimi-engine.md "ことば タイル"'s decoys: weak forms, contractions, near sounds), lower case.
 *  Never a homophone (there/their, your/you're): only spelling tells those apart. */
const SWAPS: Readonly<Record<string, readonly string[]>> = {
  a: ['the', 'uh'], the: ['a'], an: ['and'], and: ['in', 'an'], in: ['and'], to: ['the', 'two'], for: ['four'], of: ['have', 'a'], have: ['of'],
  "i'd": ["i'll"], "i'll": ["i'd"], i: ["i've"], "i've": ['i'], "we'll": ['we'], "you'll": ['you'], "they'll": ['they'], "it's": ['is'],
  can: ["can't"], "can't": ['can'], want: ["won't"], "won't": ['want'], then: ['ten'], gonna: ['wanna'], wanna: ['gonna'], gotta: ['got'],
  him: ['them'], them: ['him'], her: ['are'], were: ['where'], are: ['our'], this: ['these'], these: ['this'], that: ['it'],
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

/** A deck's rounds at an ear (`playMs`: a card's clip length, unknown: PLAY_UNKNOWN). */
export const tileRounds = (cards: readonly TileCard[], seed: number, o: Pick<ListenOpts, 'lv' | 'ear'>, playMs: (c: TileCard) => number | undefined): TileRound[] => {
  return cards.map((c) => ({ kind: 'tile', id: c.tile.id, tiles: c.tile.tiles, board: boardOf(c.tile, seed, tierAt(o.ear, o.lv, c.lv)), play: playMs(c) ?? PLAY_UNKNOWN }));
};

/** A role's slots of a sentence of n (solo: every one). */
export const slotsOf = (n: number, role: number | null): number[] => shareOf(n, role);

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

/** ことば タイル's rules (games/listened.ts): the answer window by the sentence's length, the wrong slots as `pick`. */
export const TILE: ListenRules<TileCard, TileRound> = {
  id: 'tile',
  rounds: tileRounds,
  timing: (r, answer, w) => ({ lead: w.lead, play: r?.play ?? PLAY_UNKNOWN, answer: answer + PER_SLOT * (r?.tiles.length ?? 0) }),
  valid: tileValid,
  ok: (r, a) => tileOk(r, a as readonly number[]),
  pick: (r, a) => wrongMask(r, a as readonly number[])
};

