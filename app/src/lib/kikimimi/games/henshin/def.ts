// 音の へんしん as a GameDef (docs/kikimimi.md "音の へんしん", kikimimi-engine.md "音の へんしん"): a daily drill of 8 phrases
// of American connected speech (level 8: content/henshin.ts), 5 of today's phenomenon (the options' `focus`:
// henshin.ts focusOf, the host's) and 3 of those before it, each phrase in another voice. The rounds take turns:
// 「なんて 言った？」 (pick: the focus's full form from 3 near-sound choices, as the quiz's `word`) and 「書きとり」 (type:
// the focus's words, typed and matched forgivingly, match.ts, or tapped from tiles: the board's index per word, OTHER a
// typed word that isn't a tile, EMPTY none). Pure.
//
// Tiers per player on the same audio (GameDef.tier, the listening games' ear: games/listened.ts tierAt against かわ, where
// these features are taught): easy, two choices and one decoy tile; hard, four decoy tiles (the wrong choices' words and
// sound swaps of its own); else as authored, three choices and up to three decoys. Co-op: each answers alone, the team
// has a phrase when anyone does (「ふたりで n/8」). A replay is free (the row's `rp`: "hard" for review).
import { fnv1a, mulberry32, shuffle } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import { HENSHIN_LV, type Item, type Level } from '../../bank.ts';
import { PHENOMENA, phenomenonOf } from '../../henshin.ts';
import type { Tier } from '../../lesson.ts';
import { RIGHT } from '../../score.ts';
import { TIMERS, type QuizTimer } from '../../seed.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { EARS, EMPTY, filled, listenRecord, tierAt } from '../listened.ts';

/** A drill's phrases, and how many are today's phenomenon's. */
export const HENSHIN_QS = 8;
const TODAY_N = 5;
/** A typed word that's none of the tiles (an answer's int, beside EMPTY 63). */
export const OTHER = 62;
/** The answer window's extra per missing word for the dictation (ms). */
const PER_WORD = 3000;
/** The place the drill's tiers are measured against: かわ (games/listened.ts placeOf 1: its level 3). */
const AT_LV = 3;

/** The drill's options: its level (8), こたえる じかん, the host's ear (each player's own on their join), today's phenomenon. */
export interface HenshinOpts {
  lv: Level;
  timer: QuizTimer;
  ear: number;
  focus: number;
}
export const henshinOpts = {
  encode: (o: HenshinOpts): number[] => [HENSHIN_LV, Math.max(0, TIMERS.indexOf(o.timer)), o.ear, o.focus],
  decode: (a: readonly number[]): HenshinOpts | null => {
    const [lv, ti = 0, ear = 1, focus = 0] = a, timer = TIMERS[ti];
    const ok = lv === HENSHIN_LV && timer !== undefined && Number.isInteger(ear) && ear >= 0 && ear < EARS && Number.isInteger(focus) && focus >= 0 && focus < PHENOMENA.length;
    return ok ? { lv: HENSHIN_LV, timer, ear, focus } : null;
  }
};

/** A dealt phrase: its Item (the natural clip, the speaker, the text and help, the reveal's marks) and its round's kind. */
export interface HenshinCard extends Item {
  ask: 'pick' | 'type';
}

/** A drill's phrases from the loaded level-8 items: TODAY_N of today's phenomenon by the seed, then one each of the
 *  phenomena before it (the most recent first; none before the first: more of today's), no two in a row in one voice
 *  where it can be helped; the rounds take turns, a choice first. */
export function henshinDeal(seed: number, items: readonly Item[], o: Pick<HenshinOpts, 'focus'> | null): HenshinCard[] {
  const focus = o?.focus ?? 0, r = mulberry32((seed ^ 0x45e5) >>> 0);
  const of = (k: number) => shuffle(items.filter((it) => it.hs && phenomenonOf(it) === PHENOMENA[k]), r);
  const today = of(focus), before = Array.from({ length: focus }, (_, i) => of(focus - 1 - i)[0]).filter((it): it is Item => !!it);
  const back = before.slice(0, HENSHIN_QS - Math.min(TODAY_N, today.length));
  const picked = [...today.slice(0, HENSHIN_QS - back.length), ...back].slice(0, HENSHIN_QS);
  // no voice twice in a row where it can be helped: each next the voice most left among those unlike the last (today's
  // phrases first on a tie)
  const order: Item[] = [], ahead = [...picked];
  while (ahead.length) {
    const left = (c: Item['cast']) => ahead.filter((x) => x.cast === c).length;
    let k = -1;
    ahead.forEach((it, j) => it.cast !== order.at(-1)?.cast && (k < 0 || left(it.cast) > left(ahead[k].cast)) && (k = j));
    order.push(...ahead.splice(Math.max(0, k), 1));
  }
  return order.map((it, i) => ({ ...it, ask: i % 2 ? 'type' : 'pick' }));
}

// ---------- tiers, choices and tiles ----------

/** What a Japanese ear hears for a word (games/tile/def.ts's swaps, the drill's own: weak forms and the reductions'). */
const SWAPS: Readonly<Record<string, readonly string[]>> = {
  to: ['the', 'a'], the: ['a', 'to'], a: ['the', 'of'], of: ['a', 'have'], and: ['in', 'or'], for: ['four', 'fur'], you: ['your', 'ya'], your: ['you', 'her'],
  have: ['of', 'had'], got: ['get', 'god'], going: ['gone', 'go'], want: ["won't", 'went'], do: ['did', 'are'], did: ['do', 'does'], are: ['were', 'or'],
  can: ["can't", 'could'], him: ['them', 'her'], her: ['him', 'are'], them: ['him', 'then'], me: ['my', 'him'], let: ["let's", 'lead'], give: ['gave', 'given'],
  "don't": ["didn't", 'do'], know: ['no', 'now'], it: ['at', 'that'], at: ['it', 'to'], is: ['was', 'as'], what: ["what's", 'which']
};
const lower = (w: string) => w.toLowerCase().replace(/’/g, "'");
/** A word's near sounds for a Japanese ear (SWAPS; none: []), まるごと 聞く's dictation tiles too. */
export const swapsOf = (w: string): readonly string[] => SWAPS[lower(w)] ?? [];

/** A phrase's choices at a tier: easy the right one and its first wrong one, else all three. */
export const choicesFor = (it: Pick<Item, 'choices' | 'answer'>, tier: Tier | undefined): readonly string[] =>
  tier === 'easy' ? [it.choices[it.answer], it.choices.find((_, i) => i !== it.answer)!] : it.choices;

/** A phrase's decoy tiles at a tier: the wrong choices' words it hasn't (easy one, else up to three); hard four, topped up from
 *  SWAPS over its own words. */
export function decoysFor(it: Pick<Item, 'choices' | 'answer' | 'focus'>, tier: Tier | undefined): string[] {
  const words = (it.focus ?? '').split(/\s+/), taken = new Set(words.map(lower)), out: string[] = [];
  const add = (w: string) => !taken.has(lower(w)) && (taken.add(lower(w)), out.push(w));
  for (const c of it.choices.filter((_, i) => i !== it.answer)) for (const w of c.split(/\s+/)) add(w);
  const n = tier === 'easy' ? 1 : tier === 'hard' ? 4 : 3;
  if (tier === 'hard') for (const w of words) for (const s of SWAPS[lower(w)] ?? []) out.length < n + 2 && add(s);
  return out.slice(0, n);
}

/** A phrase's tiles at a tier: its focus's words and the decoys, shuffled by the seed and the phrase (never in order). */
export function boardOf(it: Pick<Item, 'id' | 'choices' | 'answer' | 'focus'>, seed: number, tier: Tier | undefined): string[] {
  const words = (it.focus ?? '').split(/\s+/), all = [...words, ...decoysFor(it, tier)], r = mulberry32((seed ^ fnv1a(it.id)) >>> 0);
  for (let k = 0; k < 8; k++) {
    const b = shuffle([...all], r);
    if (words.length < 2 || b.filter((w) => words.includes(w)).join(' ') !== words.join(' ')) return b;
  }
  return [...all.slice(1), all[0]];
}

// ---------- rounds and grading ----------

/** A round: 「なんて 言った？」's choices (in the deal's order, the right one's place) or 「書きとり」's words and tiles;
 *  the clip's length (ms). */
export type HenshinRound = Round & { play: number } & (
  | { kind: 'henshin.pick'; choices: readonly string[]; answer: number }
  | { kind: 'henshin.type'; words: readonly string[]; board: readonly string[] }
);

/** A deck's rounds at an ear (`playMs`: a card's clip length, unknown: PLAY_UNKNOWN). */
export function henshinRounds(cards: readonly HenshinCard[], seed: number, o: Pick<HenshinOpts, 'ear'>, playMs: (c: HenshinCard) => number | undefined): HenshinRound[] {
  const tier = tierAt(o.ear, AT_LV);
  return cards.map((c): HenshinRound => {
    const play = playMs(c) ?? PLAY_UNKNOWN;
    if (c.ask === 'type') return { kind: 'henshin.type', id: c.id, play, words: (c.focus ?? '').split(/\s+/), board: boardOf(c, seed, tier) };
    const set = choicesFor(c, tier), order = shuffle(set.map((_, i) => i), mulberry32((seed ^ fnv1a(`${c.id}:pick`)) >>> 0));
    return { kind: 'henshin.pick', id: c.id, play, choices: order.map((i) => set[i]), answer: order.indexOf(0) };
  });
}

/** Whether slot j holds its word (by the word: two "to"s are one tile). */
export const slotOk = (r: { words: readonly string[]; board: readonly string[] }, a: readonly number[], j: number): boolean =>
  a[j] !== EMPTY && a[j] !== OTHER && r.board[a[j]] === r.words[j];

function henshinValid(r: HenshinRound, a: AnswerValue): boolean {
  if (r.kind === 'henshin.pick') return typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < r.choices.length;
  if (!Array.isArray(a) || a.length !== r.words.length) return false;
  const used = (a as readonly number[]).filter((x) => x !== EMPTY && x !== OTHER);
  return filled(a).length > 0 && a.every((x) => Number.isInteger(x) && x >= 0 && (x === EMPTY || x === OTHER || x < r.board.length)) && new Set(used).size === used.length;
}

export const henshinOk = (r: HenshinRound, a: AnswerValue): boolean =>
  r.kind === 'henshin.pick' ? a === r.answer : Array.isArray(a) && r.words.every((_, j) => slotOk(r, a as readonly number[], j));

/** A valid answer as its row's `pick`: a choice as authored (0 the right one), the dictation's wrong words as a bitmask. */
function henshinPick(r: HenshinRound, a: AnswerValue, item?: Pick<Item, 'choices'>): number {
  if (r.kind === 'henshin.pick') return item ? item.choices.indexOf(r.choices[a as number]) : (a as number);
  return r.words.reduce((m, _, j) => (slotOk(r, a as readonly number[], j) ? m : m | (1 << j)), 0);
}

/** A typed answer (match.ts matchTyped's slots) as the round's: each right word its tile, else OTHER. */
export const typedAnswer = (r: { words: readonly string[]; board: readonly string[] }, ok: readonly boolean[]): number[] =>
  r.words.map((w, j) => (ok[j] ? r.board.indexOf(w) : OTHER));

/** Where the drill's cards come from (the phone's decks: lane.ts; a test's), a card's clip length, its content version. */
interface HenshinSource {
  cards(seed: number, o: HenshinOpts): readonly HenshinCard[];
  playMs(c: HenshinCard): number | undefined;
  cv?(o: HenshinOpts): string | undefined;
}

/** A deck's rounds kept per its cards and ear (the session reads them at every call). */
const ROUNDS = new WeakMap<readonly HenshinCard[], Map<string, readonly HenshinRound[]>>();
function roundsOf(src: HenshinSource, seed: number, o: HenshinOpts): readonly HenshinRound[] {
  const cards = src.cards(seed, o);
  let by = ROUNDS.get(cards);
  if (!by) ROUNDS.set(cards, (by = new Map()));
  const k = `${seed}:${o.ear}`;
  let rs = by.get(k);
  if (!rs) by.set(k, (rs = henshinRounds(cards, seed, o, src.playMs)));
  return rs;
}

/** A player's deck at their ear: one point a phrase right. */
function deckOf(rounds: () => readonly HenshinRound[], o: HenshinOpts, w: RoundWindows): RoundDeck {
  const answer = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    timing: (i) => {
      const r = rounds()[i];
      return { lead: w.lead, play: r?.play ?? PLAY_UNKNOWN, answer: answer + (r?.kind === 'henshin.type' ? PER_WORD * r.words.length : 0) };
    },
    valid: (i, a) => !!rounds()[i] && henshinValid(rounds()[i], a),
    grade: (i, a) => {
      const r = rounds()[i];
      if (!r || !henshinValid(r, a)) return none;
      const ok = henshinOk(r, a);
      return { ok, pts: ok ? RIGHT : 0 };
    },
    get maxScore() {
      return RIGHT * rounds().length;
    }
  };
}

/** The drill as a GameDef: solo and co-op (no roles, no たいせん), each player at their own ear. */
export function henshinGame(src: HenshinSource): GameDef<HenshinOpts> {
  return {
    id: 'henshin',
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: henshinOpts,
    deck: (seed, o, ctx) => deckOf(() => roundsOf(src, seed, o), o, ctx.w),
    cv: (o) => src.cv?.(o),
    tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ear: Math.max(0, Math.min(EARS - 1, tr)) }) }
  };
}

/** My answers of a drill as its `listen` row's: a choice as authored, the dictation's wrong words as a mask. */
export function henshinRecord(cards: readonly HenshinCard[], rounds: readonly HenshinRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] {
  return listenRecord({ valid: henshinValid, ok: henshinOk, pick: (r, a) => henshinPick(r, a, cards.find((c) => c.id === r.id)) }, rounds, answers, had, rp, done);
}
