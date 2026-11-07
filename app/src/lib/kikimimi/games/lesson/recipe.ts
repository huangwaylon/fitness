// Recipe 2 (docs/curriculum-wave2.md §3.1, W2-9; docs/curriculum-units.md §16): a unit's おと, じっせん and チェック play
// the wave-2 listening games where the unit names that content (`lessons.tiles`, `tachi`, `call`: ids in content/listen/)
// and its files are `listened`: おと 6 ことば タイル, じっせん たちぎき (two conversations, or one and 3 of its quiz items),
// チェック one ようじ でんわ call (its 2 memo rounds) then 4 of its held-out quiz items. Anything short of that (recipe 1, a
// file still a draft or only voiced, not loaded, an id gone) plays the lesson's recipe-1 deck, exactly as before. The
// lesson's rounds are each its own kind's (the quiz's, or the game's rules at the player's tier), so one deck mixes them.
// Pure: the same deck on every phone for a seed, from the build's content alone (the index's statuses).
import type { ListenRow } from '../../../contract/listen.ts';
import type { Item } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import { itemDur } from '../../clips.ts';
import { lessonDeck, type Lesson, type Tier, type UnitChunk } from '../../lesson.ts';
import type { ListenEntry, ListenPart } from '../../listen.ts';
import { LESSON_QS, RECIPE2, type Recipe2Lesson } from '../../stages.ts';
import { TIMERS, type QuizTimer } from '../../seed.ts';
import { points } from '../../score.ts';
import type { AnswerValue, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { QUIZ_MAX_S, QUIZ_QS } from '../../../contract/live-protocol.ts';
import { PLAY_UNKNOWN, QUIZ_KINDS, roundOf } from '../quiz/kinds.ts';
import { rawOf, type ListenOpts, type ListenRules } from '../listened.ts';
import { TILE, tileDeal } from '../tile/def.ts';
import { CALL, callDeal } from '../call/def.ts';
import { TACHI, tachiDeal } from '../tachi/def.ts';

/** A card of a listening game in a lesson's deck (its own fields: TileCard's `tile`, CallCard's `call`, TachiCard's
 *  `tachi`), else null: a quiz item. */
export type CardKind = 'tile' | 'call' | 'tachi';
export const cardKind = (it: Item): CardKind | null => ('tile' in it ? 'tile' : 'call' in it ? 'call' : 'tachi' in it ? 'tachi' : null);

/** Each kind's rules (its rounds at an ear, timing, valid, right, the row's pick: games/listened.ts). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RULES: Readonly<Record<CardKind, ListenRules<any, any>>> = { tile: TILE, call: CALL, tachi: TACHI };

/** Where a recipe-2 lesson's content is: a listening file's index line (its game and status) and its part, loaded. */
export interface KindSource {
  entry(file: string): ListenEntry | undefined;
  part(file: string): ListenPart | undefined;
}

/** A lesson's recipe-2 cards, dealt by the seed from its kind's ids in `files` (the index's units[<id>].kinds), or
 *  null when the lesson plays recipe 1: a recipe-1 unit, a lesson with no kind, a file not `listened` (a draft, or only
 *  voiced) or not loaded, an id not found as its game's. */
export function kindCards(c: UnitChunk, lesson: Lesson, seed: number, files: readonly string[], src: KindSource): Item[] | null {
  const r = c.unit.lessons.v === 2 && Object.hasOwn(RECIPE2, lesson) ? RECIPE2[lesson as Recipe2Lesson] : null;
  const ids = r ? c.unit.lessons[r.key] : undefined;
  if (!r || !ids?.length || !files.length) return null;
  const want = new Set(ids), parts: ListenPart[] = [];
  for (const f of files) {
    const e = src.entry(f), p = src.part(f);
    if (!e || e[0] !== r.game || e[2] !== 'listened' || !p) return null;
    parts.push({ ...p, items: p.items.filter((it) => it.kind === r.game && want.has(it.id)) });
  }
  if (parts.reduce((n, p) => n + p.items.length, 0) !== want.size) return null;
  return r.game === 'tile' ? tileDeal(seed, parts) : r.game === 'call' ? callDeal(seed, parts) : tachiDeal(seed, parts);
}

/** A lesson's deck: recipe 2's cards first (the call that opens a チェック, the tiles, the conversations), topped up to 6
 *  with its recipe-1 deck's first items (チェック: 4); else (recipe 1, or its content not ready) the recipe-1 deck
 *  itself (lesson.ts lessonDeck). */
export function recipeDeck(c: UnitChunk, lesson: Lesson, seed: number, tier: Tier | undefined, files: readonly string[], src: KindSource): Item[] {
  const quiz = lessonDeck(c, lesson, seed, tier), kind = kindCards(c, lesson, seed, files, src);
  return kind ? [...kind, ...quiz.slice(0, Math.max(0, LESSON_QS - kind.length))] : quiz;
}

/** A card's game options at a tier (the listening games' tiers are an ear against a place: games/listened.ts tierAt):
 *  its place's level, and that place's ear a step down for easy, up for hard (within the places' ears, 0-3: はまべ has
 *  no easier, やま no harder). */
export function listenAt(lv: number, tier: Tier | undefined, timer: QuizTimer): ListenOpts {
  const at = Math.max(0, PLACES.findIndex((p) => p.lvs.includes(lv)));
  return { lv: PLACES[at].lvs[0] as ListenOpts['lv'], timer, ear: Math.max(0, Math.min(3, at + (tier === 'easy' ? -1 : tier === 'hard' ? 1 : 0))) };
}

/** An item's clip length as played (ms; unknown: undefined): the quiz's (games/quiz/lane.ts). */
const playMs = (it: Item): number | undefined => {
  const s = itemDur(it);
  return s === undefined ? undefined : Math.round(s * 1000);
};

/** A deck's rounds at a tier: a quiz item's the quiz's (games/quiz/kinds.ts roundOf), a card's its game's at that tier. */
export function lessonRounds(items: readonly Item[], seed: number, tier: Tier | undefined, timer: QuizTimer, ms: (it: Item) => number | undefined = playMs): Round[] {
  return items.map((it) => {
    const k = cardKind(it);
    return k ? RULES[k].rounds([it], seed, listenAt(it.lv, tier, timer), ms)[0] : roundOf(it, ms(it));
  });
}

const kindOf = (r: Round): CardKind | null => (Object.hasOwn(RULES, r.kind) ? (r.kind as CardKind) : null);

/** A lesson's deck over its rounds (games/quiz/def.ts quizDeck's, each round by its kind): a quiz round as the quiz's,
 *  a card's by its game's rules (its timing from こたえる じかん's window, one point-worth right). */
export function lessonRoundDeck(rounds: () => readonly Round[], o: { timer: QuizTimer }, w: RoundWindows): RoundDeck {
  const answer = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  const at = (i: number) => rounds()[i];
  return {
    get count() {
      return Math.min(QUIZ_QS, rounds().length);
    },
    round: at,
    timing: (i) => {
      const r = at(i), k = r && kindOf(r);
      if (r && k) return RULES[k].timing(r, answer, w);
      const q = r && QUIZ_KINDS[r.kind];
      return { lead: w.lead, play: r ? (q?.play(r as never) ?? (r as { play?: number }).play ?? PLAY_UNKNOWN) : PLAY_UNKNOWN, answer, ...(q?.auto?.(r as never) && { auto: true }) };
    },
    valid: (i, a) => {
      const r = at(i), k = r && kindOf(r);
      if (!r) return false;
      return k ? RULES[k].valid(r, a) : !!QUIZ_KINDS[r.kind]?.valid(r as never, a);
    },
    grade: (i, a, rp) => {
      const r = at(i), k = r && kindOf(r);
      if (!r) return none;
      if (!k) return QUIZ_KINDS[r.kind]?.grade(r as never, a, rp) ?? none;
      if (!RULES[k].valid(r, a)) return none;
      const ok = RULES[k].ok(r, a);
      return { ok, pts: points(ok) };
    },
    maxScore: QUIZ_MAX_S
  };
}

/** Whether my answer to round i was right (the results' ○ / ×): a choice, the right one; a card's, by its game. */
export function rightAt(items: readonly Item[], rounds: readonly Round[], i: number, a: { k: number; a?: AnswerValue } | null | undefined): boolean {
  const it = items[i], r = rounds[i], k = r && kindOf(r);
  if (!a || !it) return false;
  if (!k) return a.k === it.answer;
  const raw = rawOf(a);
  return raw !== null && RULES[k].valid(r, raw) && RULES[k].ok(r, raw);
}

/** A card's round as my `listen` row's answer (contract/listen.ts): its round's id, right or not, its game's pick (-1:
 *  none, or not valid), my replays. */
export function cardAnswer(r: Round, a: AnswerValue | null, rp: number): ListenRow['r'][number] {
  const k = kindOf(r)!, valid = a !== null && RULES[k].valid(r, a);
  return [r.id, valid && RULES[k].ok(r, a) ? 1 : 0, valid ? RULES[k].pick(r, a) : -1, Math.min(99, rp)];
}
