// すうじ ラッシュ as a GameDef (docs/curriculum-wave2.md §2.4): 8 customers from the `listened` rush files at the
// lobby's place (content/listen/s*-rush.yaml, written by scripts/kikimimi-rush.ts; pool.ts listenOf), each a round: an
// order with a number in it (a price, a time, a count, a table, a date), about a third corrected mid-line, then the
// ticket's chips, 8 s to tap the right one (the lobby's なし: no limit). The answer is the chip's index. Pure.
//
// Tiers per player on the same audio (GameDef.tier, the listening games' ear: games/listened.ts tierAt): hard all 4
// chips (the pre-correction value always among them); as authored 3 (the farthest from the answer dropped, never the
// -teen / -ty trap); easy 3
// (the pre-correction value dropped where there is one).
//
// Co-op 「ふたつの レジ」 (two roles): one queue, the customers alternating, role 0 the 1st, 3rd…, role 1 the others;
// the other register passes (PASS: no row, no points), so a customer is the team's when its register got it (the
// session's `team.right`). しょうぶ: everyone serves every customer, a right ticket paid against what the player's ear
// expects (the tournament's rule: taikai/def.ts questionPoints).
import { mulberry32, shuffle } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import type { Item, Level, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import type { ListenItem, ListenPart, RUSH_AT } from '../../listen.ts';
import type { Tier } from '../../lesson.ts';
import type { AnswerValue, GameDef, Round, RoundDeck } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { questionPoints } from '../taikai/def.ts';
import { ROLES, listenGame, listenRecord, placeOf, tierAt, type ListenOpts, type ListenRules, type ListenSource } from '../listened.ts';

/** A game's customers. */
export const RUSH_QS = 8;
/** The other register's answer in co-op: not mine to serve (valid, never right, no row). */
export const PASS = 99;
/** The answer window (ms) whatever the lobby's こたえる じかん, but なし. */
export const WINDOW = 8000;
/** A right ticket's most points (questionPoints' stretch). */
const MAX_PTS = 150;

type RushYaml = Extract<ListenItem, { kind: 'rush' }>;
type Counter = (typeof RUSH_AT)[number];

/** A dealt customer, as the sheet's game holds it (an Item: its clip its id, the choices its chips as authored), with
 *  what the ticket asks, its counter, the chip said before a self-correction and its difficulty (`b`, on the ears'
 *  scale: its place, half a step more for a correction). */
export interface RushCard extends Item {
  rush: { ask: string; at: Counter; was?: number; b: number };
}


function cardOf(it: RushYaml, stage: number): RushCard {
  const lv = PLACES[stage - 1]?.lvs[0] as Level;
  return {
    id: it.id, lv, type: 'num', en: it.en, ja: it.ja, speaker: it.speaker, voice: 'us', choices: it.options, answer: it.answer,
    note: it.note, tags: it.tags as Tags, ...(it.cja && { cja: it.cja }), ...(it.why && { why: it.why }), ...(it.ctx && { ctx: it.ctx }), ...(it.scene && { scene: it.scene }),
    rush: { ask: it.ask, at: it.at, ...(it.was !== undefined && { was: it.was }), b: placeOf(lv) + (it.was !== undefined ? 0.5 : 0) }
  };
}

/** The frame an item was written from (its id less its number): two of one frame never queue together. */
const frameOf = (id: string): string => id.replace(/-\d+$/, '');

/** A deck's customers from its files' parts: 8 by the seed, each from another frame. */
export function rushDeal(seed: number, parts: readonly ListenPart[]): RushCard[] {
  const pool = parts.flatMap((p) => p.items.flatMap((it) => (it.kind === 'rush' ? [cardOf(it, p.stage)] : [])));
  const seen = new Set<string>();
  return shuffle(pool, mulberry32((seed ^ 0x2a5b) >>> 0)).filter((c) => !seen.has(frameOf(c.id)) && (seen.add(frameOf(c.id)), true)).slice(0, RUSH_QS);
}

// ---------- tiers ----------

/** A chip's value, to tell the farthest from the answer: a time's minutes, a date's day, else its first number. */
export function valueOf(chip: string): number {
  const t = /(\d+):(\d+)/.exec(chip);
  if (t) return +t[1] * 60 + +t[2];
  const d = /(\d+)日/.exec(chip);
  return Number((d?.[1] ?? /\d[\d,]*(?:\.\d+)?/.exec(chip)?.[0] ?? 'NaN').replace(/,/g, ''));
}

/** -teen ↔ -ty (14 ↔ 40). */
const teenTy = (x: number, y: number): boolean => (x >= 13 && x <= 19 && y === (x - 10) * 10) || (y >= 13 && y <= 19 && x === (y - 10) * 10);
/** Two chips that differ only by a -teen and its -ty (14番 / 40番, 3:15 / 3:50, $16.25 / $60.25): the sound trap. */
export function twins(a: string, b: string): boolean {
  const ra = a.match(/\d+/g) ?? [], rb = b.match(/\d+/g) ?? [];
  if (ra.length !== rb.length || a.replace(/\d+/g, '#') !== b.replace(/\d+/g, '#')) return false;
  const diff = ra.flatMap((x, k) => (x === rb[k] ? [] : [[+x, +rb[k]]]));
  return diff.length === 1 && teenTy(diff[0][0], diff[0][1]);
}

/** The authored chips a tier shows, in order: hard all; else 3, easy without the pre-correction value, as authored
 *  without the farthest from the answer (the pre-correction value and the -teen / -ty trap kept). */
export function chipsAt(c: Pick<RushCard, 'choices' | 'answer' | 'rush'>, tier: Tier | undefined): number[] {
  const all = c.choices.map((_, k) => k);
  if (tier === 'hard') return all;
  const was = c.rush.was;
  if (tier === 'easy' && was !== undefined) return all.filter((k) => k !== was);
  const cut = all.filter((k) => k !== c.answer && k !== was), plain = cut.filter((k) => !twins(c.choices[k], c.choices[c.answer]));
  const at = valueOf(c.choices[c.answer]), far = (plain.length ? plain : cut).sort((x, y) => Math.abs(valueOf(c.choices[y]) - at) - Math.abs(valueOf(c.choices[x]) - at) || y - x)[0];
  return all.filter((k) => k !== far);
}

// ---------- rounds and grading ----------

/** A round: the customer's id (the row's), the chips at the player's tier (`map`: each one's authored index), the
 *  right one, the clip's length (ms) and the customer's difficulty. */
export interface RushRound extends Round {
  kind: 'rush';
  map: readonly number[];
  answer: number;
  play: number;
  b: number;
}

/** A deck's rounds at an ear (`playMs`: a clip's length, unknown: PLAY_UNKNOWN). */
export const rushRounds = (cards: readonly RushCard[], o: Pick<ListenOpts, 'lv' | 'ear'>, playMs: (c: RushCard) => number | undefined): RushRound[] => {
  const tier = tierAt(o.ear, o.lv);
  return cards.map((c) => {
    const map = chipsAt(c, tier);
    return { kind: 'rush', id: c.id, map, answer: map.indexOf(c.answer), play: playMs(c) ?? PLAY_UNKNOWN, b: c.rush.b };
  });
};

/** Whose register a customer comes to (co-op): role 0 the 1st, 3rd…, role 1 the others. */
export const registerOf = (i: number): number => i % ROLES;

const isChip = (r: Pick<RushRound, 'map'>, a: AnswerValue): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < r.map.length;

export const RUSH: ListenRules<RushCard, RushRound> = {
  id: 'rush',
  rounds: (cards, _seed, o, playMs) => rushRounds(cards, o, playMs),
  timing: (r, answer, w) => ({ lead: w.lead, play: r?.play ?? PLAY_UNKNOWN, answer: Number.isFinite(answer) ? Math.min(answer, WINDOW) : answer }),
  valid: (r, a) => a === PASS || isChip(r, a),
  ok: (r, a) => isChip(r, a) && a === r.answer,
  // (the row's pick: the chip as authored, whatever the tier)
  pick: (r, a) => (isChip(r, a) ? r.map[a] : -1)
};

/** A deck whose right tickets pay against what the player's ear expects (しょうぶ's rule, and the same in co-op, whose
 *  results count the customers served, not points). */
function expecting(d: RoundDeck, ear: number): RoundDeck {
  return {
    get count() {
      return d.count;
    },
    round: (i) => d.round(i),
    timing: (i) => d.timing(i),
    valid: (i, a) => d.valid(i, a),
    grade: (i, a, rp) => {
      const g = d.grade(i, a, rp), r = d.round(i) as RushRound | undefined;
      return g.ok && r ? { ok: true, pts: questionPoints(ear, r.b) } : g;
    },
    get maxScore() {
      return MAX_PTS * d.count;
    }
  };
}

/** The listening games' GameDef with しょうぶ, its points by expectation. */
function rushGame(base: GameDef<ListenOpts>): GameDef<ListenOpts> {
  return { ...base, modes: { ...base.modes, vs: true }, deck: (seed, o, ctx) => expecting(base.deck(seed, o, ctx), o.ear) };
}

/** A game over a source of cards (a test's; the phone's: lane.ts). */
export const rushGameOf = (src: ListenSource<RushCard>): GameDef<ListenOpts> => rushGame(listenGame(RUSH, src));

/** My answers of a game as its `listen` row's (listened.ts listenRecord): each customer I had, by its id, right or not,
 *  the chip I picked as authored (-1: none), my replays; the other register's (PASS) left out. */
export function rushRecord(rounds: readonly RushRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] {
  const mine = had.map((h, i) => h && answers[i] !== PASS);
  return listenRecord(RUSH, rounds, answers.map((a) => (a === PASS ? null : a)), mine, rp, done);
}

/** Customers served right in a row, ending at round `upto` (a combo): `served(i)` true, false (the run ends) or null
 *  (not counted: not yet, or not ours). */
export function comboAt(upto: number, served: (i: number) => boolean | null): number {
  let n = 0;
  for (let i = upto; i >= 0; i--) {
    const s = served(i);
    if (s === false) break;
    if (s) n++;
  }
  return n;
}

/** The longest run of served customers. */
export function bestCombo(n: number, served: (i: number) => boolean | null): number {
  let best = 0;
  for (let i = 0; i < n; i++) best = Math.max(best, comboAt(i, served));
  return best;
}
