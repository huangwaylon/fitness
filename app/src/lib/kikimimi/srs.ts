// ききみみ クイズ's spaced repetition and にがて れんしゅう (docs/kikimimi.md "Adaptivity", curriculum §10): Leitner cards
// for the items I missed (or got only after a replay) and for every feature I answered, folded from my answers in
// order (never stored), and a solo deck of my weak spots. The shared deck (deck.ts) stays deterministic for every
// multiplayer game; this is solo only. Pure.
import { mulberry32, shuffle } from '#lib/random.ts';
import type { LocalDate } from '../types.ts';
import type { Accent, Feature, Item, Level } from './bank.ts';
import { BANK } from './bank.ts';
import { DECK_SIZE, inMix } from './deck.ts';
import { dayNum, type Answer, type Stats } from './progress.ts';
import { SKILLS, skillsOf, tagsOf, type Skill } from './tags.ts';

/** Days until a card is due again, by box (0: at once). */
const INTERVALS = [0, 1, 3, 7, 16, 35, 90] as const;
const TOP = INTERVALS.length - 1;

export interface Card {
  box: number;
  /** The day (dayNum) it's due. */
  due: number;
  /** The day it was last answered. */
  last: number;
}
export type Grade = 'good' | 'hard' | 'again';

/** Right on the first listen: good; right after a replay: hard; wrong or timed out: again. */
export const gradeOf = (a: Pick<Answer, 'ok' | 'rp'>): Grade => (a.ok ? (a.rp === 0 ? 'good' : 'hard') : 'again');

/** A card after an answer on `day`: good up a box, hard the box kept (at least 1), again box 0 (due at once). */
export function step(c: Card | undefined, g: Grade, day: number): Card {
  const box = g === 'again' ? 0 : g === 'hard' ? Math.max(1, c?.box ?? 0) : Math.min(TOP, (c?.box ?? 0) + 1);
  return { box, due: day + INTERVALS[box], last: day };
}

export interface Cards {
  items: Map<string, Card>;
  features: Map<Feature, Card>;
}

/** The cards my answers (in order) leave: an item card from its first miss or replay on, a feature card for every
 *  feature answered. */
export function cardsOf(answers: readonly Answer[], items: ReadonlyMap<string, Item> = BY_ID): Cards {
  const out: Cards = { items: new Map(), features: new Map() };
  for (const a of answers) {
    const it = items.get(a.id);
    if (!it) continue;
    const g = gradeOf(a), day = dayNum(a.d);
    const held = out.items.get(a.id);
    if (held || g !== 'good') out.items.set(a.id, step(held, g, day));
    for (const f of tagsOf(it).features) out.features.set(f, step(out.features.get(f), g, day));
  }
  return out;
}
const BY_ID: ReadonlyMap<string, Item> = new Map(BANK.map((it) => [it.id, it]));

/** The cards due on `today`. */
export function dueOf(cards: Cards, today: LocalDate): { items: string[]; features: Feature[] } {
  const t = dayNum(today);
  return {
    items: [...cards.items].filter(([, c]) => c.due <= t).map(([id]) => id),
    features: [...cards.features].filter(([, c]) => c.due <= t).map(([f]) => f)
  };
}

/** What a practice deck is narrowed to (a recommendation's tap): one skill or one accent; none: every weak spot. */
export type Focus = { skill: Skill } | { accent: Accent } | null;

function fits(it: Item, focus: Focus): boolean {
  if (!focus) return true;
  if ('accent' in focus) return it.voice === focus.accent;
  const s = skillsOf(it);
  return s.primary === focus.skill || s.also.includes(focus.skill);
}

/** Due item cards drawn first, at most. */
const DUE_MAX = 4;

/**
 * にがて れんしゅう: DECK_SIZE items of the offered levels (the types their mix draws), never one twice: my due item cards
 * first (lowest box, most overdue; at most 4), then items carrying my weakest features (due ones first; another item
 * than the one missed when there is one, nearest my comfortable level), then my weakest skills' items, then any; all
 * within `focus`. Choices shuffled by `seed`, as deck() does; deterministic.
 */
export function practiceDeck(o: { answers: readonly Answer[]; stats: Stats; today: LocalDate; seed: number; levels: readonly Level[]; focus?: Focus }): Item[] {
  const r = mulberry32(o.seed >>> 0);
  const t = dayNum(o.today);
  const focus = o.focus ?? null;
  const pool = shuffle(BANK.filter((it) => o.levels.includes(it.lv) && inMix(it) && fits(it, focus)), r);
  const cards = cardsOf(o.answers);
  const lastSeen = new Map<string, number>();
  for (const a of o.answers) lastSeen.set(a.id, dayNum(a.d));
  const near = o.stats.level ?? 2;
  /** Fresher and nearer my level first (the pool's seeded order breaks ties). */
  const rank = (it: Item) => (t - (lastSeen.get(it.id) ?? -1e6) < 2 ? 10 : 0) + Math.abs(it.lv - near);
  const out: Item[] = [], taken = new Set<string>();
  const take = (it: Item | undefined) => {
    if (it && !taken.has(it.id) && out.length < DECK_SIZE) (out.push(it), taken.add(it.id));
  };
  // 1. due item cards
  const dueItems = pool.filter((it) => (cards.items.get(it.id)?.due ?? Infinity) <= t)
    .sort((a, b) => cards.items.get(a.id)!.box - cards.items.get(b.id)!.box || cards.items.get(a.id)!.due - cards.items.get(b.id)!.due);
  for (const it of dueItems.slice(0, DUE_MAX)) take(it);
  // 2. the weakest features (due first), one item each per round
  const fm = (f: Feature) => o.stats.features[f]?.raw ?? 0.7;
  const weak = [...cards.features].filter(([f, c]) => c.due <= t || fm(f) < 0.85).map(([f]) => f)
    .sort((a, b) => Number((cards.features.get(b)!.due <= t)) - Number((cards.features.get(a)!.due <= t)) || fm(a) - fm(b));
  for (let round = 0, grew = true; out.length < DECK_SIZE && grew && round < DECK_SIZE; round++) {
    grew = false;
    for (const f of weak) {
      const it = pool.filter((x) => !taken.has(x.id) && tagsOf(x).features.includes(f)).sort((a, b) => rank(a) - rank(b))[0];
      if (it) (take(it), (grew = true));
      if (out.length >= DECK_SIZE) break;
    }
  }
  // 3. the weakest skills' items, then any
  const skills = [...SKILLS].sort((a, b) => o.stats.skills[a].raw - o.stats.skills[b].raw);
  for (const s of skills) for (const it of pool.filter((x) => skillsOf(x).primary === s).sort((a, b) => rank(a) - rank(b)).slice(0, 2)) take(it);
  for (const it of [...pool].sort((a, b) => rank(a) - rank(b))) take(it);
  return shuffle(out, r).map((it) => {
    const order = shuffle(it.choices.map((_, i) => i), r);
    return { ...it, choices: order.map((i) => it.choices[i]), answer: order.indexOf(it.answer) };
  });
}
