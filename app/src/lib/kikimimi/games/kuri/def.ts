// くりかえし チャレンジ (elicited imitation, docs/kikimimi-mic.md "くりかえし チャレンジ") as a GameDef: a sentence plays once, a beat, then
// you say it back; the phone's recogniser hears it and the view counts the content words you got (lib/mic/match.ts
// recall: no prompt is given to the recogniser). Solo, adaptive (GameDef.next), nothing on the wire. Pure.
//
// The ladder: 8 rungs by syllables (8 → 22). A run starts on the lowest; each sentence is the unused voiced item of
// the player's level nearest its rung's length (the seed breaks ties). Saying ≥ 80% of its content words climbs a
// rung, unless the sentence was heard again first (a replay never climbs); two misses in a row end the run, so does
// the 8th sentence. A take the recogniser couldn't hear (skipped) neither climbs nor counts as a miss.
//
// Answer: `[hit, of, heard]` (content words got, of how many; heard 1, skipped 0). Three ints: a pair would read as
// the tournament's wager. Rows are minutes only (§5): nothing heard or scored leaves the phone.
import { mulberry32 } from '#lib/random.ts';
import type { Item } from '../../bank.ts';
import { condOf } from '../../conditions.ts';
import { quizOpts, type QuizOpts } from '../quiz/def.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';

/** The rungs' lengths (syllables), lowest first. */
export const RUNGS: readonly number[] = [8, 10, 12, 14, 16, 18, 20, 22];
/** A run's most sentences. */
export const KURI_MAX = 8;
/** The share of content words that climbs (4 of 5). */
const CLIMB = 0.8;
/** The beat between the clip's end and your turn (ms): you rebuild the sentence rather than echo it. */
export const BEAT = 1000;
/** A sentence's words, fewest and most (the mic doc's content count). */
const WORDS_MIN = 5, WORDS_MAX = 16;
/** Light conditions are allowed from もり (level 4) up; heavy ones never. */
const COND_FROM = 4;

/** A sentence's words as shown. */
export const wordsOf = (en: string): string[] => en.split(/\s+/).filter(Boolean);

/** A word's syllables, roughly: its vowel groups, a silent final e off, at least one; digits about two each. */
function syllablesOfWord(w: string): number {
  const digits = w.replace(/\D/g, '').length;
  const x = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!x) return digits ? digits * 2 : 0;
  const groups = x.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)?.length ?? 0;
  return Math.max(1, groups) + digits * 2;
}

/** A sentence's syllables (the ladder's measure). */
export const syllables = (en: string): number => wordsOf(en).reduce((s, w) => s + syllablesOfWord(w), 0);

/** Whether an item can be a rung: one American voice, no dialogue, 5–16 words, its clip clean (light from もり up). */
export function eligible(it: Pick<Item, 'voice' | 'lines' | 'en' | 'lv' | 'cond' | 'channel' | 'tags'>): boolean {
  const n = wordsOf(it.en).length;
  if (it.voice !== 'us' || it.lines?.length || n < WORDS_MIN || n > WORDS_MAX) return false;
  const c = condOf(it);
  return !c || (c.level === 'light' && it.lv >= COND_FROM);
}

/** An item the run can draw: its numeric id (the deck's `ids`) and length. */
export interface KuriItem {
  n: number;
  syl: number;
}

/** One sentence done: right (≥ 80%), heard again first, skipped (nothing heard). */
export interface Said {
  ok: boolean;
  rp: number;
  skipped: boolean;
}

/** Where a run is: the next sentence's rung, the misses in a row, whether it's over. */
export interface Climb {
  rung: number;
  misses: number;
  stop: boolean;
}

export function climbOf(done: readonly Said[]): Climb {
  let rung = 0, misses = 0;
  for (const d of done) {
    if (d.skipped) continue;
    if (!d.ok) {
      misses++;
      continue;
    }
    misses = 0;
    if (d.rp === 0) rung = Math.min(RUNGS.length - 1, rung + 1);
  }
  return { rung, misses, stop: misses >= 2 || done.length >= KURI_MAX };
}

/** The next sentence's numeric id (null: the run is over) from the sentences so far: the unused item nearest its
 *  rung's length, the seed picking among the nearest. */
export function kuriNext(seed: number, done: readonly (Said & { n: number })[], pool: readonly KuriItem[]): number | null {
  const c = climbOf(done);
  if (c.stop) return null;
  const used = new Set(done.map((d) => d.n));
  const left = pool.filter((x) => !used.has(x.n));
  if (!left.length) return null;
  const want = RUNGS[c.rung], best = Math.min(...left.map((x) => Math.abs(x.syl - want)));
  const near = left.filter((x) => Math.abs(x.syl - want) === best);
  const r = mulberry32((seed ^ Math.imul(done.length + 1, 0x9e3779b1)) >>> 0);
  return near[Math.floor(r() * near.length)].n;
}

// ---------- answers ----------

/** An answer read: content words got, of how many, heard (else skipped). */
export interface KuriAnswer {
  hit: number;
  of: number;
  heard: boolean;
}

export function answerOf(a: AnswerValue | null | undefined): KuriAnswer | null {
  if (!Array.isArray(a) || a.length !== 3) return null;
  const [hit, of, heard] = a as readonly number[];
  const int = (x: number, lo: number, hi: number) => Number.isInteger(x) && x >= lo && x <= hi;
  return int(of, 1, 63) && int(hit, 0, of) && int(heard, 0, 1) && (heard === 1 || hit === 0) ? { hit, of, heard: heard === 1 } : null;
}

/** Said well enough to climb (but for a replay). */
export const saidOk = (a: KuriAnswer | null): boolean => !!a && a.heard && a.hit >= a.of * CLIMB;

/** A sentence said as its answer; skipped: nothing heard. */
export const kuriAnswer = (hit: number, of: number): number[] => [hit, Math.max(1, of), 1];
export const skipAnswer = (of: number): number[] => [0, Math.max(1, of), 0];

// ---------- the deck ----------

/** A round: its item and its clip's length (ms). */
export interface KuriRound extends Round {
  kind: 'kuri';
  play: number;
}

/** Where a run's rounds come from (lane.ts over the phone's decks; a test's). */
export interface KuriSource {
  rounds(seed: number, o: QuizOpts, ids: readonly number[]): readonly KuriRound[];
  next(seed: number, o: QuizOpts, done: readonly (Said & { id: string })[]): number | null;
}

function kuriDeck(rounds: () => readonly KuriRound[], w: RoundWindows): RoundDeck {
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    // the clip, then the beat; your turn has no time limit (the take has its own cap)
    timing: (i) => ({ lead: w.lead, play: (rounds()[i]?.play ?? PLAY_UNKNOWN) + BEAT, answer: Infinity }),
    valid: (i, a) => !!rounds()[i] && answerOf(a) !== null,
    grade: (i, a) => (rounds()[i] && answerOf(a) ? { ok: saidOk(answerOf(a)), pts: 0 } : none),
    maxScore: 0
  };
}

/** The game: solo only, its options the quiz's (`[lv, timer]`: the player's level; the timer unused), its deck the ids
 *  dealt so far. */
export function kuriGame(src: KuriSource): GameDef<QuizOpts> {
  return {
    id: 'kuri',
    modes: { solo: true, coop: false, vs: false, same: false },
    opts: quizOpts,
    deck: (seed, o, ctx) => kuriDeck(() => src.rounds(seed, o, ctx.ids ?? []), ctx.w),
    next: (seed, o, done) => src.next(seed, o, done.map((d) => ({ id: d.id, ok: d.ok, rp: d.rp ?? 0, skipped: answerOf(d.a)?.heard === false })))
  };
}

/** The longest sentence said (its words), 0 for none: the run's 「ここまで n語」. */
export function reached(items: readonly Pick<Item, 'en'>[], answers: readonly (AnswerValue | null | undefined)[]): number {
  return items.reduce((m, it, i) => (saidOk(answerOf(answers[i])) ? Math.max(m, wordsOf(it.en).length) : m), 0);
}
