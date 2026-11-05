// ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback"): a person's games folded into what they measure:
// mastery per sub-skill and feature, accuracy per type, accent and level, the comfortable level (an Elo-style
// ability), the first-listen trend, the days played this week and the couple summary. Folded from the record's
// `listen` rows (contract/listen.ts: mine whole, the partner's as summaries) on the phone, never stored. Pure.
import { listenOf, listenSummaryOf, type ListenRow } from '../contract/listen.ts';
import type { EventRow } from '../contract/api.ts';
import type { LocalDate, Who } from '../types.ts';
import { BANK, levelRank, type Accent, type Feature, type Item, type ItemType } from './bank.ts';
import { SKILLS, skillsOf, tagsOf, type Skill } from './tags.ts';
import { SPEEDS, climb, isRungId, rungOf } from './ladder.ts';

/** One of my answers, with its game's context. */
export interface Answer {
  id: string;
  ok: boolean;
  /** The authored choice picked (−1: timed out). */
  pick: number;
  /** Replays before answering (0: the first listen). */
  rp: number;
  d: LocalDate;
  g: string;
  lv: number;
  /** In にがて れんしゅう. */
  p: boolean;
}

/** One of my games. */
export interface Game extends Omit<ListenRow, 'r' | 'p'> {
  p: boolean;
  r: Answer[];
  /** When the record kept it (ms; a queued one: when it was sent). */
  at: number;
}

/** A game of another member's, as its summary (contract/listen.ts): never its level or answers. */
export interface OtherGame {
  who: Who;
  d: LocalDate;
  g: string;
  n: number;
  ms: number;
}

const BY_ID: ReadonlyMap<string, Item> = new Map(BANK.map((it) => [it.id, it]));
export const itemOf = (id: string): Item | undefined => BY_ID.get(id);

/** My games (in the order played) and the others' summaries, from the `listen` rows this phone holds; of mine, only
 *  the answers whose items this build knows (none: not a game here). A game id
 *  written twice (left mid-way and joined again: the record keeps both rows, append-only) is one game: its answers once
 *  each (the first kept), its minutes summed, the most players, when it was first kept. */
export function gamesOf(rows: readonly EventRow[], me: Who): { mine: Game[]; others: OtherGame[] } {
  const mine = new Map<string, Game>(), others = new Map<string, OtherGame>();
  for (const row of rows) {
    let data: unknown;
    try {
      data = JSON.parse(row[4]);
    } catch {
      continue;
    }
    const at = Date.parse(row[0]) || 0;
    if (row[1] === me) {
      const x = listenOf(data);
      if (!x) continue;
      const p = x.p === 1;
      // only the items this build knows: a newer game's row (docs/kikimimi-framework.md §4.4) leaves the stats as they were
      const r = x.r.filter(([id]) => BY_ID.has(id)).map(([id, ok, pick, rp]): Answer => ({ id, ok: ok === 1, pick, rp, d: x.d, g: x.g, lv: x.lv, p }));
      if (!r.length) continue;
      const was = mine.get(x.g);
      if (!was) mine.set(x.g, { d: x.d, g: x.g, lv: x.lv, n: x.n, ms: x.ms, p, at, r });
      else {
        const sooner = at < was.at, [early, late] = sooner ? [r, was.r] : [was.r, r];
        const have = new Set(early.map((y) => y.id));
        mine.set(x.g, { ...was, ...(sooner && { d: x.d, at }), n: Math.max(was.n, x.n), ms: was.ms + x.ms, p: was.p || p, r: [...early, ...late.filter((y) => !have.has(y.id))] });
      }
    } else {
      const s = listenSummaryOf(data);
      if (!s) continue;
      const key = `${row[1]}:${s.g}`, was = others.get(key);
      others.set(key, was ? { ...was, n: Math.max(was.n, s.n), ms: was.ms + s.ms } : { who: row[1], ...s });
    }
  }
  const games = [...mine.values()].sort((a, b) => a.at - b.at || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return { mine: games, others: [...others.values()] };
}

/** My answers of a game as its `listen` row's `r` (contract/listen.ts): the questions I had (the session's view
 *  `had`: a question sat out, before a mid-game join or slept through, isn't a miss), in order, at most 12. Each with
 *  its authored choice index (the deck shuffles them); unanswered, timed out (−1) at the results (`done`), else left
 *  out (a game left mid-way: only those answered). */
export function listenAnswers(
  items: readonly Item[], answers: readonly ({ k: number } | null)[], had: readonly boolean[], rp: readonly number[], done: boolean
): ListenRow['r'] {
  const r: ListenRow['r'] = [];
  items.forEach((it, i) => {
    const a = answers[i];
    if (!had[i] || r.length >= 12 || (!a && !done)) return;
    const pick = a ? ((BY_ID.get(it.id) ?? rungOf(it.id))?.choices.indexOf(it.choices[a.k]) ?? -1) : -1;
    r.push([it.id, a && a.k === it.answer ? 1 : 0, pick, Math.min(99, rp[i] ?? 0)]);
  });
  return r;
}

/** An answer's score: right on the first listen 1, right after a replay 0.6, wrong 0 (curriculum §10). */
export const scoreOf = (a: Pick<Answer, 'ok' | 'rp'>): number => (a.ok ? (a.rp === 0 ? 1 : 0.6) : 0);

/** A day as a number (days since 1970-01-01), for ages and weeks. */
export function dayNum(d: LocalDate): number {
  return Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000);
}
const dayOf = (n: number): LocalDate => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** Mastery's recency half-life (days), its prior and the prior's weight (answers). */
const HALF_LIFE = 21;
const PRIOR = 0.7;
const PRIOR_W = 2;
/** A mastery is shown from this many answers on. */
export const MIN_SHOWN = 3;

interface Mastery {
  /** Answers that touched it (primary or not). */
  n: number;
  /** 0-1, smoothed and recency-weighted; null below MIN_SHOWN answers. */
  m: number | null;
  /** The same with no minimum (the advice's and the practice deck's ordering). */
  raw: number;
}
interface Acc {
  n: number;
  /** Right / answered. */
  right: number;
  /** Right on the first listen / answered. */
  first: number;
}

export interface Stats {
  answers: number;
  games: number;
  skills: Record<Skill, Mastery>;
  features: Partial<Record<Feature, Mastery>>;
  byType: Partial<Record<ItemType, Acc>>;
  byAccent: Partial<Record<Accent, Acc>>;
  byLevel: Partial<Record<number, Acc>>;
  /** The Elo-style ability and the comfortable level (where it predicts 80 %), null until any answer. */
  theta: number;
  level: number | null;
  /** Fewer than ESTIMATE_MIN answers: still measuring. */
  measuring: boolean;
}

/** An item's difficulty on the ability scale: its level (L1 −1 … L4 2; the アナウンス pack as L4) and its type. */
const TYPE_OFFSET: Readonly<Record<ItemType, number>> = { pic: -0.3, word: 0, num: 0, reply: 0.2, mean: 0.4, gist: 0.3, next: 0.3 };
const difficulty = (it: Pick<Item, 'lv' | 'type'>): number => levelRank(it.lv) - 2 + TYPE_OFFSET[it.type];
const ESTIMATE_MIN = 16;
/** θ − ln 4: where the predicted score is 80 %. */
const COMFORT = Math.log(4);

const acc = (): Acc & { _r: number; _f: number } => ({ n: 0, right: 0, first: 0, _r: 0, _f: 0 });

/**
 * The stats of `answers` (in the order answered) as of `today`: each skill's and feature's mastery (an answer counts
 * fully for its item's primary skill, half for the others, and less as it ages: HALF_LIFE), accuracy per type, accent
 * and level, and the ability: θ += K (score − expected) over the items' difficulty, K 0.3 for the first 24 answers then
 * 0.15; the comfortable level is θ − ln 4 on the levels' scale, capped at the hardest level played + 0.5.
 */
export function statsOf(answers: readonly Answer[], today: LocalDate): Stats {
  const t = dayNum(today);
  const sk = new Map<Skill, { n: number; w: number; s: number }>(SKILLS.map((s) => [s, { n: 0, w: 0, s: 0 }]));
  const ft = new Map<Feature, { n: number; w: number; s: number }>();
  const byType = new Map<ItemType, ReturnType<typeof acc>>(), byAccent = new Map<Accent, ReturnType<typeof acc>>(), byLevel = new Map<number, ReturnType<typeof acc>>();
  let theta = 0, k = 0, maxLv = 0;
  const games = new Set<string>();
  for (const a of answers) {
    const it = BY_ID.get(a.id);
    if (!it) continue; // an item no longer in the bank
    games.add(a.g);
    const sc = scoreOf(a);
    const age = Math.max(0, t - dayNum(a.d));
    const w = 0.5 ** (age / HALF_LIFE);
    const { primary, also } = skillsOf(it);
    for (const [s, f] of [[primary, 1], ...also.map((x) => [x, 0.5] as const)] as const) {
      const m = sk.get(s)!;
      m.n++;
      m.w += w * f;
      m.s += w * f * sc;
    }
    for (const f of tagsOf(it).features) {
      const m = ft.get(f) ?? { n: 0, w: 0, s: 0 };
      m.n++;
      m.w += w;
      m.s += w * sc;
      ft.set(f, m);
    }
    for (const [map, key] of [[byType, it.type], [byAccent, it.voice], [byLevel, it.lv]] as const) {
      const x = (map as Map<unknown, ReturnType<typeof acc>>).get(key) ?? acc();
      x.n++;
      if (a.ok) x._r++;
      if (a.ok && a.rp === 0) x._f++;
      (map as Map<unknown, ReturnType<typeof acc>>).set(key, x);
    }
    const b = difficulty(it);
    const expected = 1 / (1 + Math.exp(-(theta - b)));
    theta += (k < 24 ? 0.3 : 0.15) * (sc - expected);
    k++;
    maxLv = Math.max(maxLv, levelRank(it.lv));
  }
  const mastery = (x: { n: number; w: number; s: number }): Mastery => {
    const raw = (PRIOR * PRIOR_W + x.s) / (PRIOR_W + x.w);
    return { n: x.n, m: x.n >= MIN_SHOWN ? raw : null, raw };
  };
  const accOut = <K extends string | number>(m: Map<K, ReturnType<typeof acc>>) =>
    Object.fromEntries([...m].map(([key, x]) => [key, { n: x.n, right: x._r / x.n, first: x._f / x.n }])) as Partial<Record<K, Acc>>;
  return {
    answers: k,
    games: games.size,
    skills: Object.fromEntries(SKILLS.map((s) => [s, mastery(sk.get(s)!)])) as Record<Skill, Mastery>,
    features: Object.fromEntries([...ft].map(([f, x]) => [f, mastery(x)])),
    byType: accOut(byType),
    byAccent: accOut(byAccent),
    byLevel: accOut(byLevel),
    theta,
    level: k ? Math.max(1, Math.min(maxLv + 0.5, theta - COMFORT + 2)) : null,
    measuring: k < ESTIMATE_MIN
  };
}

/** The curriculum's stages (§3) a comfortable level falls in, with each one's range on the levels' scale. */
const STAGES = [
  { id: 's0', stars: 1, cefr: 'A2–B1', from: 1, to: 2.5 },
  { id: 's1', stars: 2, cefr: 'B1+', from: 2.5, to: 3.5 },
  { id: 's2', stars: 3, cefr: 'B2', from: 3.5, to: 4.5 },
  { id: 's3', stars: 4, cefr: 'B2+', from: 4.5, to: 5.5 }
] as const;
export type Stage = (typeof STAGES)[number];

/** The stage of a comfortable level and how far into it (0-1). */
export function stageOf(level: number): { stage: Stage; into: number } {
  const stage = STAGES.find((s) => level < s.to) ?? STAGES[STAGES.length - 1];
  return { stage, into: Math.max(0, Math.min(1, (level - stage.from) / (stage.to - stage.from))) };
}

/** A スピード はしご game (its answers are rungs': ladder.ts). Its first listens fail by design at the top, so the
 *  trend and the level nudge leave it out; it has its own measure (speedOf). */
export const isLadderGame = (g: Pick<Game, 'r'>): boolean => g.r.some((a) => isRungId(a.id));

/** First-listen accuracy per quiz game, the last `n` games (oldest first). */
export function trendOf(games: readonly Game[], n = 12): number[] {
  return games.filter((g) => g.r.length && !isLadderGame(g)).slice(-n).map((g) => g.r.filter((a) => a.ok && a.rp === 0).length / g.r.length);
}

/** The ladders a speed reading takes (the last this many climbed) and the fewest it's read from. */
const SPEED_RECENT = 8;
export const SPEED_MIN = 4;
/** A speed is comfortable when at least this share of the recent ladders climbed past it (curriculum §10's 75-85 %). */
const SPEED_COMFORT = 0.75;

/** The fastest comfortable speed (docs/kikimimi.md "スピード はしご"): over my last SPEED_RECENT ladders, the share
 *  that climbed each rung (right on the first listen, in order: ladder.ts climb), and the fastest rung at least
 *  SPEED_COMFORT of them climbed (null: not even 0.8×); measuring below SPEED_MIN ladders. A ladder whose first rung I
 *  didn't have (a mid-game join) isn't counted. `best` is the highest climb ever. */
export interface Speed {
  ladders: number;
  /** Per rung (SPEEDS' order): the share of the recent ladders that climbed it. */
  reach: number[];
  /** The ladders `reach` is over. */
  recent: number;
  comfort: number | null;
  best: number | null;
  measuring: boolean;
}
export function speedOf(games: readonly Game[]): Speed {
  const climbs: number[] = [];
  for (const g of games) {
    const by = new Map<string, (Answer | undefined)[]>();
    for (const a of g.r) {
      const rung = rungOf(a.id)?.rung;
      if (!rung) continue;
      const tries = by.get(rung.ladder) ?? [];
      tries[rung.n - 1] = a;
      by.set(rung.ladder, tries);
    }
    for (const tries of by.values())
      if (tries[0]) climbs.push(climb(Array.from({ length: SPEEDS.length }, (_, k) => (tries[k] ? { ok: tries[k]!.ok, first: tries[k]!.rp === 0 } : null))));
  }
  const recent = climbs.slice(-SPEED_RECENT);
  const reach = SPEEDS.map((_, k) => (recent.length ? recent.filter((c) => c > k).length / recent.length : 0));
  const top = reach.reduce((n, r, k) => (r >= SPEED_COMFORT && n === k ? k + 1 : n), 0);
  const best = climbs.length ? Math.max(...climbs) : 0;
  return {
    ladders: climbs.length, reach, recent: recent.length, comfort: top ? SPEEDS[top - 1] : null, best: best ? SPEEDS[best - 1] : null,
    measuring: climbs.length < SPEED_MIN
  };
}

/** The last 5 games' mean first-listen accuracy and its change from the 5 before (null with fewer than 10 games). */
export function recentOf(games: readonly Game[]): { now: number | null; delta: number | null } {
  const t = trendOf(games, 10);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  if (!t.length) return { now: null, delta: null };
  const last = t.slice(-5);
  return { now: mean(last), delta: t.length >= 10 ? mean(last) - mean(t.slice(0, 5)) : null };
}

/** The Tokyo week of `today` (Monday first) as its 7 days. */
export function weekDays(today: LocalDate): LocalDate[] {
  const t = dayNum(today);
  const monday = t - ((t + 3) % 7); // 1970-01-01 was a Thursday
  return Array.from({ length: 7 }, (_, i) => dayOf(monday + i));
}

/** Which days of this week I played (7 flags, Monday first): consistency, never a streak. */
export function daysPlayed(games: readonly Game[], today: LocalDate): boolean[] {
  const played = new Set(games.map((g) => g.d));
  return weekDays(today).map((d) => played.has(d));
}

/**
 * This week together (the couple summary, never a level): the games both members played (the same game id), and
 * both people's minutes (mine and the other member's, every game). The guest's phone has no summary (its rows reach no one).
 */
export function together(mine: readonly Game[], others: readonly OtherGame[], today: LocalDate): { games: number; minutes: number; partner: boolean } {
  const week = new Set(weekDays(today));
  const myWeek = mine.filter((g) => week.has(g.d));
  const theirs = others.filter((o) => o.who !== 'G' && week.has(o.d));
  const ids = new Set(theirs.map((o) => o.g));
  const ms = myWeek.reduce((s, g) => s + g.ms, 0) + theirs.reduce((s, o) => s + o.ms, 0);
  return { games: myWeek.filter((g) => ids.has(g.g)).length, minutes: Math.round(ms / 60_000), partner: theirs.length > 0 };
}

/** Every answer of these games, in order. */
export const answersOf = (games: readonly Game[]): Answer[] => games.flatMap((g) => g.r);
