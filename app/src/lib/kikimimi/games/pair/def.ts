// はつおん ききわけ as a GameDef (docs/kikimimi-mic.md §2.4, §3.4): 8 minimal pairs (content/mic/pairs.yaml, pairs.ts),
// each a round of kind `mic.pair`: both words play (perception before production), then one of them is mine to say,
// untimed. Solo, the villager hears it (whisper's two candidates, else the transcript; two tries a card: the view) and
// my answer is the word they heard, 0 or 1 (UNSURE: neither, or skipped). Co-op あてっこ (`roles: 2`): round i's word is
// role i % 2's to say, out loud in the room; the others tap the picture they heard (0 or 1) and the speaker answers SAID.
// A round is right when its answer is the word to say, so the team's tally is 「通じた k / n」. No points; the row is
// minutes only (contract/listen.ts). Pure.
import { fnv1a, mulberry32, shuffle } from '#lib/random.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { ROLES } from '../listened.ts';
import type { PairCard, Sound } from './pairs.ts';

/** A game's cards. */
export const PAIR_QS = 8;
/** At most this many cards of one contrast in a game (a mix: r/l and the vowels and teen/ty…). */
const PER_SOUND = 2;
/** The answers: the word heard or tapped (0, 1); the villager couldn't tell, or I skipped; the speaker said it (あてっこ). */
export const UNSURE = 2;
export const SAID = 3;


/** A deck: 8 pairs by the seed, at most two of a contrast. */
export function pairDeal(seed: number, cards: readonly PairCard[]): PairCard[] {
  const per = new Map<Sound, number>(), out: PairCard[] = [];
  for (const c of shuffle([...cards], mulberry32((seed ^ 0x9a17) >>> 0))) {
    const n = per.get(c.pair.sound) ?? 0;
    if (n >= PER_SOUND) continue;
    per.set(c.pair.sound, n + 1);
    out.push(c);
    if (out.length === PAIR_QS) break;
  }
  return out;
}

/** A round: its card, the word to say (0, 1: by the seed and the card) and both words' length (ms). */
interface PairRound extends Round {
  kind: 'mic.pair';
  say: 0 | 1;
  play: number;
}

/** The word to say on a card in a game of this seed (the same on every phone). */
export const sayOf = (seed: number, id: string): 0 | 1 => (mulberry32((seed ^ fnv1a(id)) >>> 0)() < 0.5 ? 0 : 1);

/** Who says round i's word in あてっこ: the player of this role. */
export const speakerRole = (i: number): number => i % ROLES;

const NONE: Graded = { ok: false, pts: 0 };
const answers = new Set([0, 1, UNSURE, SAID]);

function pairDeck(seed: number, cards: () => readonly PairCard[], playMs: (c: PairCard) => number | undefined, w: RoundWindows): RoundDeck {
  const round = (i: number): PairRound | undefined => {
    const c = cards()[i];
    return c && { kind: 'mic.pair', id: c.id, say: sayOf(seed, c.id), play: playMs(c) ?? PLAY_UNKNOWN };
  };
  return {
    get count() {
      return cards().length;
    },
    round,
    // both words, then as long as it takes (two tries, or the room's turn): never timed
    timing: (i) => ({ lead: w.lead, play: round(i)?.play ?? PLAY_UNKNOWN, answer: Infinity }),
    valid: (i, a) => !!round(i) && typeof a === 'number' && answers.has(a),
    grade: (i, a: AnswerValue) => {
      const r = round(i);
      return r && a === r.say ? { ok: true, pts: 0 } : NONE;
    },
    maxScore: 0
  };
}

/** Where a game's cards come from (the phone's decks: lane.ts; a test's), a card's length and the content version. */
export interface PairSource {
  cards(seed: number, o: QuizOpts): readonly PairCard[];
  playMs(c: PairCard): number | undefined;
  cv?(): string | undefined;
}

export function pairGame(src: PairSource): GameDef<QuizOpts> {
  return {
    id: 'pair',
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: quizOpts,
    deck: (seed, o, ctx) => pairDeck(seed, () => src.cards(seed, o), src.playMs, ctx.w),
    cv: () => src.cv?.(),
    roles: ROLES
  };
}
