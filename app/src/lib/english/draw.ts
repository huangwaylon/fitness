// A play's questions, drawn from the clip's bank (docs/english.md "Content", question-framework §3.3), pure and seeded:
// the same draw comes back on a resume or the other phone. 6 items under 90 s, 7 under 180 s, else 8: a gist first (a
// set-up one, not one giving the ending away), then the best set of the rest (a bounded search): unseen items before
// any repeat, then the group quotas (form-heavy for an A2 learner; play 2 and later trade a form item for an
// interpretive one), then a context item (`ctx`), then spread over the clip (most of its parts, no two on much the
// same lines), new points first, a B1 opening; then clip order. One gist a play (a second only to fill a small bank).
// At most one C1 a play. The native tier (C2) only with `harder` (⚙ むずかしめ): then ≤ 1 a play, wanted while one
// is unseen. Never two items on one point, nor one that gives another away (`reveals`); ≤ 1 dictation, humor, predict.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf } from '#lib/contract/listen.ts';
import { seeded, shuffle } from '#lib/random.ts';
import { listensOf } from './listens.ts';
import type { Who } from '#lib/types.ts';
import type { Clip, Question, Skill } from './types.ts';

type Group = 'G' | 'L' | 'I' | 'F';
export const GROUP_OF: Record<Skill, Group> = {
  gist: 'G', detail: 'L', number: 'L', who: 'L', infer: 'I', attitude: 'I', pragma: 'I', humor: 'I', predict: 'I', marker: 'F', phrase: 'F', sound: 'F', dict: 'F'
};

/** An item's past: the play it was last seen in (1-based) and whether it was right first then. */
export type History = Record<string, { play: number; ok: boolean }>;

/** My past with a clip, from my own `listen` rows (record order): its plays so far (finished) and each item seen. A
 *  part-way row belongs to the play it was in. */
export function historyOf(rows: readonly EventRow[], me: Who, clip: string): { plays: number; seen: History } {
  let plays = 0;
  const seen: History = {};
  for (const row of listensOf(rows, me, listenOf)) {
    if (row.u !== clip) continue;
    for (const [id, ok] of row.r) seen[id] = { play: plays + 1, ok: ok === 1 };
    if (row.f === 1) plays++;
  }
  return { plays, seen };
}

/** How many items a play asks. */
export const drawSize = (dur: number): number => (dur < 90 ? 6 : dur < 180 ? 7 : 8);

/** L / I / F a play takes (after the gist). */
const QUOTAS: Record<number, [number, number, number][]> = { 6: [[2, 1, 2], [2, 2, 1]], 7: [[2, 1, 3], [2, 2, 2]], 8: [[3, 1, 3], [2, 2, 3]] };

/** The seed of `who`'s play of `clip`. */
export const seedOf = (who: Who, clip: string, play: number): string => `${who}:${clip}:${play}`;

/** Whether two items may be in one draw: not one point, neither reveals the other's, and a predict's continuation not
 *  heard in an earlier item's segment. */
function clash(a: Question, b: Question): boolean {
  if (a.point === b.point || a.reveals?.includes(b.point) || b.reveals?.includes(a.point)) return true;
  const covers = (p: Question, o: Question) => !!p.then && o.seg[0] <= p.seg[0] && o.seg[1] > p.then[0];
  return covers(a, b) || covers(b, a);
}

/**
 * The questions of play `play` (1-based) of `clip`, given what was seen before (`seen`), drawn with `seed`. Fewer
 * than the size only when the bank has fewer that fit together.
 */
export function draw(clip: Clip, seen: History, play: number, seed: string, opts: { harder?: boolean } = {}): Question[] {
  const all = clip.questions.filter((q) => !q.retired);
  const n = Math.min(drawSize(clip.dur), all.length);
  const rand = seeded(seed);
  const r = new Map(all.map((q) => [q.id, rand()]));
  const lastPoints = new Set(all.filter((q) => seen[q.id]?.play === play - 1).map((q) => q.point));
  // the spread: the speech span (live items' segments) cut in n − 1 bins (the non-gist slots), an item in the one
  // holding its segment's middle; the gist not counted (up to 45 s, much of a short clip). Two items overlapping by over
  // half the shorter: `near`.
  const lo = Math.min(...all.map((q) => q.seg[0])), span = Math.max(...all.map((q) => q.seg[1])) - lo || 1;
  const bins = Math.max(1, n - 1);
  const binOf = (q: Question) => Math.min(bins - 1, Math.max(0, Math.floor((((q.seg[0] + q.seg[1]) / 2 - lo) / span) * bins)));
  const near = (a: Question, b: Question) =>
    Math.min(a.seg[1], b.seg[1]) - Math.max(a.seg[0], b.seg[0]) > 0.5 * Math.min(a.seg[1] - a.seg[0], b.seg[1] - b.seg[0]);
  // the gist: unseen first, a set-up one (starting in the clip's first 40 %: an outcome one would give the ending
  // away), the fewest reveals; else the one seen longest ago
  const setup = (q: Question) => (q.seg[0] <= 0.4 * clip.dur ? 0 : 1);
  const gists = all.filter((q) => q.skill === 'gist').sort((a, b) =>
    (seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0) || (seen[a.id]?.play ?? 0) - (seen[b.id]?.play ?? 0) || setup(a) - setup(b) ||
    (a.reveals?.length ?? 0) - (b.reveals?.length ?? 0) || r.get(a.id)! - r.get(b.id)!);
  const head = gists[0];
  const quota = QUOTAS[drawSize(clip.dur)][play === 1 ? 0 : 1];
  const unseen = (q: Question) => !seen[q.id];
  const missed = (q: Question) => play >= 3 && !!seen[q.id] && !seen[q.id].ok;
  /** An item's cost (lower first): unseen on a new point, unseen, (from play 3) missed first time, then seen longest
   *  ago; on play 1 a C1 after the others; a B2+ in the first bin a little after (a B1 opening); then the seeded
   *  number. */
  const tier = (q: Question) => (unseen(q) ? (lastPoints.has(q.point) ? 1 : 0) : missed(q) ? 2 : 3 + seen[q.id].play / 1000);
  const cost = (q: Question) => tier(q) * 10 + (play === 1 && q.level === 'C1' ? 1 : 0) + (q.level !== 'B1' && binOf(q) === 0 ? 0.3 : 0) + r.get(q.id)!;
  const pool = all.filter((q) => q !== head && !(head && clash(head, q))).sort((a, b) => cost(a) - cost(b));
  const k = n - (head ? 1 : 0);
  // the native tier (native-level.md §5) only with `harder`: ≤ 1 a play, wanted while one is unseen
  const c2Max = opts.harder ? 1 : 0;
  const c2Counts = (q: Question) => q.level === 'C2' && unseen(q);
  const wantC2 = !!opts.harder && pool.some(c2Counts);
  // what's left from each place in the pool: unseen items, an unseen C2 item, a ctx item, and each group's items
  const after = pool.map((_, i) => {
    const left = pool.slice(i);
    return { fresh: left.filter(unseen).length, c2: left.some(c2Counts), ctx: left.some((q) => !!q.ctx), L: left.filter((q) => GROUP_OF[q.skill] === 'L').length, I: left.filter((q) => GROUP_OF[q.skill] === 'I').length, F: left.filter((q) => GROUP_OF[q.skill] === 'F').length };
  });

  // A draw's score, compared in order (the first seven the more the better, the last the less): as many items as fit;
  // the fewest past two of a skill (or past one gist); a wanted C2; the most unseen (a repeat only when too few unseen
  // fit); the quotas met (short, a group borrows); a context item (`ctx`) when one fits; the spread (bins hit less
  // `near` pairs: the whole clip, not one scene); the least cost. Always, never relaxed: one item a point, no reveals or
  // continuation clash, ≤ 1 dict, humor and predict, ≤ 1 C1, the C2 limit.
  type Score = [number, number, number, number, number, number, number, number];
  const better = (a: Score, b: Score) => {
    for (let i = 0; i < 8; i++) if (a[i] !== b[i]) return i < 7 ? a[i] > b[i] : a[i] < b[i];
    return false;
  };
  const chosen: Question[] = [];
  const skills = new Map<string, number>([['gist', head ? 1 : 0]]);
  const groups = { G: 0, L: 0, I: 0, F: 0 };
  const inBin = new Array<number>(bins).fill(0);
  let hit = 0, pairs = 0, ctx = 0;
  let over = 0, c1 = head?.level === 'C1' ? 1 : 0, c2 = 0, c2Got = 0, fresh = 0, total = 0, retries = 0;
  const short = (room = 0, i = pool.length) =>
    (['L', 'I', 'F'] as const).reduce((s, g, j) => s + Math.max(0, quota[j] - groups[g] - Math.min(room, after[i]?.[g] ?? 0)), 0);
  const score = (): Score => [chosen.length, -over, wantC2 && c2Got > 0 ? 1 : 0, fresh, -short(), ctx > 0 ? 1 : 0, hit - pairs, total];
  const fits = (q: Question, perSkill = false) =>
    !chosen.includes(q) && !chosen.some((c) => clash(c, q)) &&
    !((q.skill === 'dict' || q.skill === 'humor' || q.skill === 'predict') && (skills.get(q.skill) ?? 0) >= 1) &&
    !(perSkill && (skills.get(q.skill) ?? 0) >= 2) && !(q.level === 'C1' && c1 >= 1) && !(q.level === 'C2' && c2 >= c2Max);
  /** Adds an item; returns its undo. */
  const add = (q: Question) => {
    const sk = skills.get(q.skill) ?? 0, g = GROUP_OF[q.skill], ov = sk >= (q.skill === 'gist' ? 1 : 2) ? 1 : 0, b = binOf(q), np = chosen.filter((c) => near(c, q)).length;
    hit += inBin[b]++ ? 0 : 1;
    pairs += np;
    ctx += q.ctx ? 1 : 0;
    const c = cost(q) + (missed(q) && retries >= 2 ? 10 : 0); // past 2 retries, a miss is a plain repeat
    skills.set(q.skill, sk + 1);
    groups[g]++;
    chosen.push(q);
    over += ov;
    c1 += q.level === 'C1' ? 1 : 0;
    c2 += q.level === 'C2' ? 1 : 0;
    c2Got += c2Counts(q) ? 1 : 0;
    fresh += unseen(q) ? 1 : 0;
    retries += missed(q) ? 1 : 0;
    total += c;
    return () => {
      total -= c;
      hit -= --inBin[b] ? 0 : 1;
      pairs -= np;
      ctx -= q.ctx ? 1 : 0;
      retries -= missed(q) ? 1 : 0;
      fresh -= unseen(q) ? 1 : 0;
      c1 -= q.level === 'C1' ? 1 : 0;
      c2 -= q.level === 'C2' ? 1 : 0;
      c2Got -= c2Counts(q) ? 1 : 0;
      over -= ov;
      chosen.pop();
      groups[g]--;
      skills.set(q.skill, sk);
    };
  };

  // the greedy draw first: each group's quota, cheapest first; short, borrow I → L → F, then past two of a skill
  const undo: (() => void)[] = [];
  const next = (g: Group, perSkill: boolean) => pool.find((q) => GROUP_OF[q.skill] === g && fits(q, perSkill));
  (['L', 'I', 'F'] as const).forEach((g, j) => {
    for (let m = 0; m < quota[j] && chosen.length < k; m++) {
      const q = next(g, true);
      if (q) undo.push(add(q));
    }
  });
  for (const perSkill of [true, false])
    for (const g of ['I', 'L', 'F', 'G'] as const)
      for (let q = next(g, perSkill); q && chosen.length < k; q = next(g, perSkill)) undo.push(add(q));
  let best = [...chosen], bestScore = score();
  while (undo.length) undo.pop()!();

  // then a bounded search for a better one (an item in or out, cheapest first), cut where even the best case can't win
  let nodes = 0;
  const search = (i: number) => {
    if (++nodes > 20000) return;
    const s = score();
    if (better(s, bestScore)) [best, bestScore] = [[...chosen], s];
    if (chosen.length === k || i === pool.length) return;
    const room = Math.min(k - chosen.length, pool.length - i);
    const hope: Score = [chosen.length + room, -over, wantC2 && (c2Got > 0 || after[i].c2) ? 1 : 0, fresh + Math.min(room, after[i].fresh), -short(room, i), ctx > 0 || after[i].ctx ? 1 : 0, Math.min(bins, hit + room) - pairs, total];
    if (!better(hope, bestScore)) return;
    if (fits(pool[i])) {
      const back = add(pool[i]);
      search(i + 1);
      back();
    }
    search(i + 1);
  };
  search(0);
  const rest = best.sort((a, b) => a.seg[0] - b.seg[0]);
  return head ? [head, ...rest] : rest;
}

/** A choice item's choices as shown to this player: shuffled by the seed unless `keep` (numbers, a scale); each the
 *  authored index. */
export function choiceOrder(q: Question, seed: string): number[] {
  const idx = (q.choices ?? []).map((_, i) => i);
  return q.keep ? idx : shuffle(idx, seeded(`${seed}:${q.id}`));
}
