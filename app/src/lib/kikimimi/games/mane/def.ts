// まねっこ シャドーイング as a GameDef (docs/kikimimi-mic.md "まねっこ シャドーイング", "In the registry"): 4 villager lines at my level, each a round of
// kind `mic.shadow`: its clip plays once, blind; then, untimed, I speak along with it (shadowing, with earphones) or
// after it, see my melody and timing over the villager's and try again or go on (the view: components/kikimimi/mane/).
// Nothing is graded and nothing of my voice leaves the round: the answer is a bare "done" (0), and the row has my
// minutes only (`r: []`, contract/listen.ts MINUTES_GMS). Solo only, never on the wire. Pure.
import { mulberry32, shuffle } from '#lib/random.ts';
import type { Item, Level } from '../../bank.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';

/** A game's lines. */
export const MANE_QS = 4;
/** A line to shadow: this many words (short enough to say in one breath, long enough to have a tune). */
export const WORDS = { min: 4, max: 12 } as const;

/** The levels with lines to shadow, and the one a level plays (アナウンス's 5: もり's 4; above: ほし's 7). */
const LEVELS: readonly Level[] = [1, 2, 3, 4, 6, 7];
export const maneLevel = (lv: number): Level => [...LEVELS].reverse().find((x) => x <= lv) ?? 1;

const wordsOf = (it: Pick<Item, 'en'>): number => it.en.trim().split(/\s+/).length;

/** A line worth shadowing: one speaker, a US voice, a clean take (no channel or noise over it), 4–12 words, no
 *  figures (a price read aloud is a number drill, not a tune), voiced. */
export const shadowable = (it: Item, voiced: (id: string) => boolean): boolean =>
  !it.lines && !it.cond && !it.channel && it.voice === 'us' && wordsOf(it) >= WORDS.min && wordsOf(it) <= WORDS.max && !/[\d$¥£%]/.test(it.en) && voiced(it.id);

/** A deck: 4 lines of the level by the seed, the shortest first (a warm-up, then longer). */
export function maneDeal(seed: number, items: readonly Item[], voiced: (id: string) => boolean): Item[] {
  const pool = items.filter((it) => shadowable(it, voiced));
  return shuffle(pool, mulberry32((seed ^ 0x3a7e) >>> 0)).slice(0, MANE_QS).sort((a, b) => wordsOf(a) - wordsOf(b));
}

/** A line's own Japanese (a reply item's is the question → its reply: the half before the arrow). */
export const lineJa = (it: Pick<Item, 'ja'>): string => it.ja.split('→')[0].trim();

/** A round: the line's id and its clip's length (ms). */
interface ManeRound extends Round {
  kind: 'mic.shadow';
  play: number;
}

const DONE: Graded = { ok: true, pts: 0 };
const isDone = (a: AnswerValue): boolean => a === 0;

function maneDeck(items: () => readonly Item[], playMs: (it: Item) => number | undefined, w: RoundWindows): RoundDeck {
  const round = (i: number): ManeRound | undefined => {
    const it = items()[i];
    return it && { kind: 'mic.shadow', id: it.id, play: playMs(it) ?? PLAY_UNKNOWN };
  };
  return {
    get count() {
      return items().length;
    },
    round,
    // the clip once (the blind listen), then as long as it takes: never timed
    timing: (i) => ({ lead: w.lead, play: round(i)?.play ?? PLAY_UNKNOWN, answer: Infinity }),
    valid: (i, a) => !!round(i) && isDone(a),
    grade: () => DONE,
    maxScore: 0
  };
}

/** Where a game's lines come from (the phone's decks: lane.ts; a test's). */
export interface ManeSource {
  items(seed: number, o: QuizOpts): readonly Item[];
  playMs(it: Item): number | undefined;
}

export function maneGame(src: ManeSource): GameDef<QuizOpts> {
  return {
    id: 'mane',
    modes: { solo: true, coop: false, vs: false, same: false },
    opts: quizOpts,
    deck: (seed, o, ctx) => maneDeck(() => src.items(seed, o), src.playMs, ctx.w)
  };
}
