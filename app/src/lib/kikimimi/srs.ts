// ききみみ クイズ's spaced repetition and にがて れんしゅう (docs/kikimimi.md "Adaptivity", curriculum.md "Placement and spaced repetition"): Leitner cards
// for the items I missed (or got only after a replay) and for every feature I answered, folded from my answers in
// order (never stored), and a solo deck of my weak spots. The shared deck (deck.ts) stays deterministic for every
// multiplayer game; this is solo only. Pure over the index (pool.ts ENTRIES): only the picks' levels are loaded to deal
// them (report.ts practiceFor). よみきき サンド's まだ (docs/kikimimi-engine.md "よみきき サンド") is a mark on this phone only
// (DEVICE.kikiMada), folded in as a "hard" answer on its day: no row changes, nothing goes on the wire.
import { mulberry32, shuffle } from '#lib/random.ts';
import type { LocalDate, Who } from '../types.ts';
import type { KV } from '../sync/storage.ts';
import { DEVICE, readJson, writeJson } from '../sync/storage.ts';
import { firstListenRight } from '../contract/listen.ts';
import { HENSHIN_LV, type Accent, type Entry, type Feature, type Item, type Level } from './bank.ts';
import { rotateChoices, shuffleChoices } from './bank.ts';
import { ENTRIES, LONG_ENTRIES, entryOf, isLongId, itemOf } from './pool.ts';
import { agesOf, staleness, type Recent } from './recent.ts';
import { DECK_SIZE, MIX } from './deck.ts';
import { drawn } from './mix.ts';
import { dayNum } from '../contract/tokyo.ts';
import { chanceOf, offAim, type Answer, type Stats } from './progress.ts';
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
type Grade = 'good' | 'hard' | 'again';

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

/** A num template's items share their id up to the row number (`n1-price-2`), as deck.ts's families. */
const familyOf = (it: Pick<Entry, 'id' | 'type'>): string => (it.type === 'num' ? it.id.replace(/-\d+$/, '') : it.id);

/** Whether `y` reviews what `x` tests with another clip (docs/kikimimi.md "Adaptivity"): the same level and type, and
 *  the same num template or `x`'s first feature (its sound or skill: tags.ts). */
export function isSibling(x: Entry, y: Entry): boolean {
  if (x.id === y.id || x.lv !== y.lv || x.type !== y.type) return false;
  // a long piece's question or dictation line (never dealt itself): any item of its level and type that is dealt
  if (isLongId(x.id)) return !isLongId(y.id);
  if (x.type === 'num' && familyOf(x) === familyOf(y)) return true;
  const f = tagsOf(x).features[0];
  return !!f && tagsOf(y).features.includes(f);
}

/** The cards my answers (in order) leave: an item card from its first miss or replay on, a feature card for every
 *  feature answered. A practice answer on a never-carded sibling (isSibling) of a due item card steps that card too (the
 *  lowest box, most overdue): おさらい asks the sibling in its place (practicePicks); one with a card of its own steps only
 *  its own, and the due card's own answer that day replaces the stand-in's step (never two steps a day). */
export function cardsOf(answers: readonly Answer[], items: { get(id: string): Entry | undefined } = { get: entryOf }, mada: readonly Mada[] = []): Cards {
  const out: Cards = { items: new Map(), features: new Map() };
  // a card a sibling stood in for, as it was before (its own answer that day replaces the stand-in's step)
  const stood = new Map<string, { day: number; was: Card }>();
  for (const a of withMada(answers, mada)) {
    const it = items.get(a.id);
    if (!it) continue;
    const g = gradeOf(a), day = dayNum(a.d);
    const s = stood.get(a.id);
    const held = s?.day === day ? s.was : out.items.get(a.id);
    stood.delete(a.id);
    if (a.p && !held) {
      const stand = [...out.items].filter(([id, c]) => c.due <= day && c.last < day && isSiblingId(items, id, it)).sort(([, b], [, c]) => b.box - c.box || b.due - c.due)[0];
      if (stand) {
        stood.set(stand[0], { day, was: stand[1] });
        out.items.set(stand[0], step(stand[1], g, day));
      }
    }
    if (held || g !== 'good') out.items.set(a.id, step(held, g, day));
    for (const f of tagsOf(it).features) out.features.set(f, step(out.features.get(f), g, day));
  }
  return out;
}

const isSiblingId = (items: { get(id: string): Entry | undefined }, id: string, y: Entry): boolean => {
  const x = items.get(id);
  return !!x && isSibling(x, y);
};

// ---- よみきき サンド's まだ: this phone's marks ------------------------------------------------------------------------

/** A まだ (still not caught after reading it and hearing it again): the item and the day, on this phone only. */
export type Mada = { id: string; d: LocalDate };
/** The marks a phone keeps per player (the newest). */
const MADA_KEEP = 200;

/** The answers with each まだ as a "hard" one on its day, after that day's answers (the game came first). */
function withMada(answers: readonly Answer[], mada: readonly Mada[]): readonly Pick<Answer, 'id' | 'ok' | 'rp' | 'd' | 'p'>[] {
  if (!mada.length) return answers;
  const out: Pick<Answer, 'id' | 'ok' | 'rp' | 'd' | 'p'>[] = [...answers];
  for (const m of [...mada].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))) {
    let k = out.length;
    while (k > 0 && out[k - 1].d > m.d) k--;
    out.splice(k, 0, { id: m.id, ok: true, rp: 1, d: m.d, p: false });
  }
  return out;
}

/** `who`'s まだ marks on this phone (`kv`: its localStorage), oldest first. */
export function madaOf(kv: KV | null, who: Who): Mada[] {
  const v = readJson<Record<string, unknown>>(kv, DEVICE.kikiMada)?.[who];
  return Array.isArray(v) ? v.flatMap((m) => (Array.isArray(m) && typeof m[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m[1]) ? [{ id: m[0], d: m[1] as LocalDate }] : [])) : [];
}

/** A まだ kept on this phone for `who` (the newest MADA_KEEP; one an item a day). */
export function markMada(kv: KV | null, who: Who, id: string, d: LocalDate): void {
  const all = readJson<Record<string, unknown>>(kv, DEVICE.kikiMada) ?? {};
  const mine = madaOf(kv, who).filter((m) => m.id !== id || m.d !== d);
  writeJson(kv, DEVICE.kikiMada, { ...all, [who]: [...mine, { id, d }].slice(-MADA_KEEP).map((m) => [m.id, m.d]) });
}

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

function fits(it: Entry, focus: Focus): boolean {
  if (!focus) return true;
  if ('accent' in focus) return it.voice === focus.accent;
  const s = skillsOf(it);
  return s.primary === focus.skill || s.also.includes(focus.skill);
}

/** Due item cards drawn first, at most. */
const DUE_MAX = 4;

/**
 * にがて れんしゅう: DECK_SIZE items of the offered levels (the types their mix draws), never one twice: my due item cards
 * first (lowest box, most overdue; at most 4), each heard through a sibling when one is in the pool (isSibling: what it
 * tests, another clip, voice and choices; cardsOf steps the card from the sibling's answer), else itself with its choices
 * rotated (rotateChoices: the right one in another place each time it comes back); then items carrying my weakest features
 * (due ones first; another item than the one missed when there is one), then my weakest skills' items, then any; all
 * within `focus`. Among those, items not heard lately come first, then the least recently heard (`recent`, this phone's
 * last games: recent.ts; and answered in the last 2 days), then the nearest the 75-85 % I should get right (progress.ts
 * chanceOf, the learned difficulty). Choices shuffled by `seed`, as deck() does; deterministic. The picks are the
 * index's (`ids`); `deal` (once) makes the deck of them from their items as authored (their levels loaded: pool.ts loadIds).
 * 音の へんしん's phrases (level 8) join only as due cards, each through another phrase of its phenomenon; まるごと 聞く's
 * questions and dictation lines only as due cards heard through a sibling (its level and type: a ほし item, a drill phrase).
 */
export function practicePicks(o: PracticeOpts): { ids: string[]; deal: (item: (id: string) => Item | undefined) => Item[] } {
  const r = mulberry32(o.seed >>> 0);
  const t = dayNum(o.today);
  const focus = o.focus ?? null;
  const pool = shuffle(ENTRIES.filter((it) => o.levels.includes(it.lv) && drawn(it, MIX) && fits(it, focus)), r);
  // 音の へんしん's phrases (level 8: no level's mix) come back only as due cards, each through another phrase of its
  // phenomenon where there is one (isSibling: the same level, type and first feature; another voice and sentence)
  const drill = shuffle(ENTRIES.filter((it) => it.lv === HENSHIN_LV && fits(it, focus)), mulberry32((o.seed ^ 0x8e5) >>> 0));
  const cards = cardsOf(o.answers, undefined, o.mada);
  const lastSeen = new Map<string, number>();
  for (const a of o.answers) lastSeen.set(a.id, dayNum(a.d));
  const ages = agesOf(o.recent ?? []);
  /** Not heard lately first, then the least recently heard, then nearer the aim (the pool's seeded order breaks ties). */
  const rank = (it: Entry) => staleness(it.id, ages) * 100 + (t - (lastSeen.get(it.id) ?? -1e6) < 2 ? 50 : 0) + 20 * offAim(chanceOf(it, o.stats));
  const out: Entry[] = [], taken = new Set<string>();
  const take = (it: Entry | undefined) => {
    if (it && !taken.has(it.id) && out.length < DECK_SIZE) (out.push(it), taken.add(it.id));
  };
  // 1. due item cards, through a sibling where there is one (the same skill, the same template first, then the most
  //    features shared, then the rank), else again with the choices rotated
  // (a long piece's question or dictation line is due like any, and heard only through a sibling: its piece is minutes long)
  const dueItems = [...pool, ...drill, ...LONG_ENTRIES.filter((it) => fits(it, focus))].filter((it) => (cards.items.get(it.id)?.due ?? Infinity) <= t)
    .sort((a, b) => cards.items.get(a.id)!.box - cards.items.get(b.id)!.box || cards.items.get(a.id)!.due - cards.items.get(b.id)!.due);
  const again = new Map<string, number>();
  const shared = (x: Entry, y: Entry) => (familyOf(x) === familyOf(y) ? 10 : 0) + tagsOf(y).features.filter((f) => tagsOf(x).features.includes(f)).length;
  for (const it of dueItems.slice(0, DUE_MAX)) {
    const sib = (it.lv === HENSHIN_LV ? drill : isLongId(it.id) ? pool.filter((y) => y.lv === it.lv) : pool).filter((y) => !taken.has(y.id) && !cards.items.has(y.id) && isSibling(it, y)).sort((a, b) => shared(it, b) - shared(it, a) || rank(a) - rank(b))[0];
    if (sib) take(sib);
    else if (!isLongId(it.id)) {
      take(it);
      again.set(it.id, o.answers.filter((a) => a.id === it.id).length);
    }
  }
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
  return {
    ids: out.map((it) => it.id),
    deal: (item) => shuffle(out, r).map((e) => {
      const it = item(e.id);
      if (!it) throw new Error(`kikimimi: ${e.id} isn't loaded`);
      const k = again.get(e.id);
      return k === undefined ? shuffleChoices(it, r) : rotateChoices(it, k);
    })
  };
}

// ---- the phrase ずかん (docs/curriculum.md "A unit") ---------------------------------------------------------------------

/** A phrase is caught once right on the first listen in this many different clips (items), on at least this many days. */
export const CAUGHT_CLIPS = 3;
export const CAUGHT_DAYS = 2;
/** The phrase review's daily cap (§2; the UX's おさらい: 「しずえが 6もん えらびました」, never "14 overdue"). */
export const REVIEW_CAP = 8;

/** A unit's key phrase as its chunk holds it: its id and the items it's heard in (lesson.ts UnitPlay's `ph`). */
type PhraseIn = { id: string; in: readonly string[] };

export interface PhraseState {
  /** Heard at all (an answer on one of its items, any mode: quick play counts, §5). */
  heard: boolean;
  /** The different items it was right in on the first listen, and on how many days. */
  clips: number;
  days: number;
  caught: boolean;
}

/** Each phrase's state from my answers (in order, every mode's: a unit's lesson or quick play alike). */
export function phrasesOf(phrases: readonly PhraseIn[], answers: readonly Answer[]): Map<string, PhraseState> {
  const out = new Map<string, PhraseState>();
  for (const ph of phrases) {
    const ids = new Set(ph.in);
    const mine = answers.filter((a) => ids.has(a.id));
    const first = mine.filter(firstListenRight);
    const clips = new Set(first.map((a) => a.id)).size, days = new Set(first.map((a) => a.d)).size;
    out.set(ph.id, { heard: mine.length > 0, clips, days, caught: clips >= CAUGHT_CLIPS && days >= CAUGHT_DAYS });
  }
  return out;
}

/**
 * Today's phrase review: the phrases heard but not caught whose card is due (a Leitner card per phrase, stepped by
 * each answer on its items: srs's `step`), lowest box and most overdue first, at most REVIEW_CAP a day (those already
 * reviewed today count against it, and aren't asked again till tomorrow). Each with the item to hear it in, another clip
 * than last time where there is one: one of its items never answered, else one not yet right on the first listen (a new
 * clip toward caught), the least recently answered first; only items in `playable` when given (a loaded unit's).
 * Deterministic.
 */
export function phraseReview(phrases: readonly PhraseIn[], answers: readonly Answer[], today: LocalDate, playable?: ReadonlySet<string>): { phrase: string; item: string }[] {
  const t = dayNum(today);
  const states = phrasesOf(phrases, answers);
  const due: { phrase: string; item: string; card: Card }[] = [];
  let reviewed = 0;
  for (const ph of phrases) {
    const st = states.get(ph.id)!;
    if (!st.heard || st.caught) continue;
    const ids = new Set(ph.in);
    let card: Card | undefined;
    const last = new Map<string, number>(), right = new Set<string>();
    for (const a of answers) {
      if (!ids.has(a.id)) continue;
      card = step(card, gradeOf(a), dayNum(a.d));
      last.set(a.id, dayNum(a.d));
      if (firstListenRight(a)) right.add(a.id);
    }
    if (!card) continue;
    if (card.last === t) {
      reviewed++; // (once a day each)
      continue;
    }
    if (card.due > t) continue;
    // another clip than the one last heard: one never answered, else one not yet right, else the least recently answered
    const pool = ph.in.filter((id) => !playable || playable.has(id));
    const order = (id: string) => (last.has(id) ? (right.has(id) ? 2 : 1) : 0);
    const item = [...pool].sort((a, b) => order(a) - order(b) || (last.get(a) ?? -1) - (last.get(b) ?? -1))[0];
    if (item) due.push({ phrase: ph.id, item, card });
  }
  return due.sort((a, b) => a.card.box - b.card.box || a.card.due - b.card.due).slice(0, Math.max(0, REVIEW_CAP - reviewed)).map(({ phrase, item }) => ({ phrase, item }));
}

type PracticeOpts = { answers: readonly Answer[]; mada?: readonly Mada[]; stats: Stats; today: LocalDate; seed: number; levels: readonly Level[]; focus?: Focus; recent?: Recent };

/** にがて れんしゅう's deck (practicePicks), its levels already loaded. */
export const practiceDeck = (o: PracticeOpts): Item[] => practicePicks(o).deal(itemOf);
