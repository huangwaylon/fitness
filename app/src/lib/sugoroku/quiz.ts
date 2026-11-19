// 英語すごろく's イベント quiz (docs/sugoroku.md "Rules", RULES '5'): a card that only gave stars asks about its key word
// instead, so no stone is a free tap. やさしい picks the key word's Japanese from three, ふつう from four, むずかしい reads
// the card with the word gone and picks the English that fits from four (the others another part of speech: only one
// reads right). Pure: the choices from the game's seed and step (every phone, and a resumed turn, the same), the stars
// by the tries (game.ts eventDone: 3, 2 after 「おしい！」, 1 with 「答えはこれ」); the fold sees only the misses.
import { seeded, shuffle } from '#lib/random.ts';
import { CARDS, type Card } from './cards.ts';
import type { Level } from './game.ts';

/** The stars by misses (2: after 答えはこれ). */
export const QUIZ_STARS = [3, 2, 1] as const;
/** The quiz cards (CARDS' indices): the ones with a key word to ask. */
const QUIZ = CARDS.map((c, i) => (c.kw ? i : -1)).filter((i) => i >= 0);

/** A quiz card's lines (its own when the card's name a gift or stars). */
export const quizLines = (c: Card): { en: string; ja: string } => ({ en: c.qen ?? c.en, ja: c.qja ?? c.ja });
/** The card's key word (the starred one). */
export const keyOf = (c: Card): string => /\*([^*]+)\*/.exec(quizLines(c).en)?.[1] ?? '';
/** Whether the game's rules ask a quiz on this card. */
export const isQuiz = (rules: string | undefined, card: number): boolean => Number(rules ?? 0) >= 5 && !!CARDS[card]?.kw;

export interface Quiz {
  /** `meaning`: the key word's Japanese to pick; `cloze`: the English that fits the gap. */
  kind: 'meaning' | 'cloze';
  /** The card's English as shown: the key word starred, or (cloze) a gap `___`. */
  en: string;
  choices: string[];
  answer: number;
}

/** The quiz for `card` at `level`, its choices seeded by `seed` (the game's seed and step). */
export function quizOf(card: number, level: Level, seed: string): Quiz {
  const c = CARDS[card], r = seeded(`${seed}:quiz`), key = keyOf(c);
  const others = QUIZ.filter((i) => i !== card).map((i) => CARDS[i]);
  if (level >= 3) {
    // (the other part of speech only: "You catch a big ___!" fish, never shell)
    const wrong = shuffle(others.filter((o) => o.pos !== c.pos).map(keyOf), r).slice(0, 3);
    const choices = shuffle([key, ...wrong], r);
    return { kind: 'cloze', en: quizLines(c).en.replace(/\*[^*]+\*/, '___'), choices, answer: choices.indexOf(key) };
  }
  const wrong = shuffle(others.map((o) => o.kw!).filter((k) => k !== c.kw), r).slice(0, level === 1 ? 2 : 3);
  const choices = shuffle([c.kw!, ...wrong], r);
  return { kind: 'meaning', en: quizLines(c).en, choices, answer: choices.indexOf(c.kw!) };
}
