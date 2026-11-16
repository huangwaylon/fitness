// A play's questions, drawn from the clip's bank (docs/english.md "Content", question-framework §3.3), pure and seeded:
// the same draw comes back on a resume or the other phone. 6 items under 90 s, 7 under 180 s, else 8: a gist first,
// then the best set of the rest (a bounded search): on play 2 and later a C1 whenever one fits, unseen items before any
// repeat, then the group quotas (play 2 and later lean to interpretation), new points first; then clip order. Never two
// items on one point, nor one that gives another away (`reveals`); ≤ 1 dictation.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf } from '#lib/contract/listen.ts';
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
  for (const r of rows) {
    if (r[1] !== me || r[3] !== 'listen') continue;
    let row;
    try {
      row = listenOf(JSON.parse(r[4]));
    } catch {
      continue;
    }
    if (!row || row.u !== clip) continue;
    for (const [id, ok] of row.r) seen[id] = { play: plays + 1, ok: ok === 1 };
    if (row.f === 1) plays++;
  }
  return { plays, seen };
}

/** How many items a play asks. */
export const drawSize = (dur: number): number => (dur < 90 ? 6 : dur < 180 ? 7 : 8);

/** L / I / F a play takes (after the gist). */
const QUOTAS: Record<number, [number, number, number][]> = { 6: [[2, 2, 1], [1, 3, 1]], 7: [[2, 3, 1], [1, 4, 1]], 8: [[3, 3, 1], [1, 4, 2]] };

/** A string's 32-bit hash (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
/** mulberry32 over a seed string: a number in [0, 1) each call. */
function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
 * than the size only when the bank has fewer that fit together (a lesson before its bank: every item, in order).
 */
export function draw(clip: Clip, seen: History, play: number, seed: string): Question[] {
  const all = clip.questions.filter((q) => !q.retired);
  const n = Math.min(drawSize(clip.dur), all.length);
  const rand = rng(seed);
  const r = new Map(all.map((q) => [q.id, rand()]));
  const lastPoints = new Set(all.filter((q) => seen[q.id]?.play === play - 1).map((q) => q.point));
  // the gist: unseen first (the fewest reveals among them), else the one seen longest ago
  const gists = all.filter((q) => q.skill === 'gist').sort((a, b) =>
    (seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0) || (seen[a.id]?.play ?? 0) - (seen[b.id]?.play ?? 0) || (a.reveals?.length ?? 0) - (b.reveals?.length ?? 0) || r.get(a.id)! - r.get(b.id)!);
  const head = gists[0];
  const quota = QUOTAS[drawSize(clip.dur)][play === 1 ? 0 : 1];
  const unseen = (q: Question) => !seen[q.id];
  const missed = (q: Question) => play >= 3 && !!seen[q.id] && !seen[q.id].ok;
  /** An item's cost (lower first): unseen on a new point, unseen, (from play 3) missed first time, then seen longest
   *  ago; on play 1 a C1 after the others; then the seeded number. */
  const tier = (q: Question) => (unseen(q) ? (lastPoints.has(q.point) ? 1 : 0) : missed(q) ? 2 : 3 + seen[q.id].play / 1000);
  const cost = (q: Question) => tier(q) * 10 + (play === 1 && q.level === 'C1' ? 1 : 0) + r.get(q.id)!;
  const pool = all.filter((q) => q !== head && !(head && clash(head, q))).sort((a, b) => cost(a) - cost(b));
  const k = n - (head ? 1 : 0);
  const wantC1 = play >= 2 && pool.some((q) => q.level === 'C1');
  // what's left from each place in the pool: unseen items, C1 items, and each group's items
  const after = pool.map((_, i) => {
    const left = pool.slice(i);
    return { fresh: left.filter(unseen).length, c1: left.some((q) => q.level === 'C1'), L: left.filter((q) => GROUP_OF[q.skill] === 'L').length, I: left.filter((q) => GROUP_OF[q.skill] === 'I').length, F: left.filter((q) => GROUP_OF[q.skill] === 'F').length };
  });

  // A draw's score, compared in order (the first five the more the better, the last the less): as many items as fit;
  // the fewest past two of a skill; on play 2+ a C1 when the bank has one that fits; the most unseen (a repeat only
  // when too few unseen fit); the quotas met (short, a group borrows); the least cost. Always, never relaxed: one item
  // a point, no reveals or continuation clash, ≤ 1 dict, humor and predict, at most 2 C1 on play 1.
  type Score = [number, number, number, number, number, number];
  const better = (a: Score, b: Score) => {
    for (let i = 0; i < 6; i++) if (a[i] !== b[i]) return i < 5 ? a[i] > b[i] : a[i] < b[i];
    return false;
  };
  const chosen: Question[] = [];
  const skills = new Map<string, number>([['gist', head ? 1 : 0]]);
  const groups = { G: 0, L: 0, I: 0, F: 0 };
  let over = 0, c1 = head?.level === 'C1' ? 1 : 0, fresh = 0, total = 0, retries = 0;
  const short = (room = 0, i = pool.length) =>
    (['L', 'I', 'F'] as const).reduce((s, g, j) => s + Math.max(0, quota[j] - groups[g] - Math.min(room, after[i]?.[g] ?? 0)), 0);
  const score = (): Score => [chosen.length, -over, wantC1 && c1 > 0 ? 1 : 0, fresh, -short(), total];
  const fits = (q: Question, perSkill = false) =>
    !chosen.includes(q) && !chosen.some((c) => clash(c, q)) &&
    !((q.skill === 'dict' || q.skill === 'humor' || q.skill === 'predict') && (skills.get(q.skill) ?? 0) >= 1) &&
    !(perSkill && (skills.get(q.skill) ?? 0) >= 2) && !(play === 1 && q.level === 'C1' && c1 >= 2);
  /** Adds an item; returns its undo. */
  const add = (q: Question) => {
    const sk = skills.get(q.skill) ?? 0, g = GROUP_OF[q.skill];
    const c = cost(q) + (missed(q) && retries >= 2 ? 10 : 0); // past 2 retries, a miss is a plain repeat
    skills.set(q.skill, sk + 1);
    groups[g]++;
    chosen.push(q);
    over += sk >= 2 ? 1 : 0;
    c1 += q.level === 'C1' ? 1 : 0;
    fresh += unseen(q) ? 1 : 0;
    retries += missed(q) ? 1 : 0;
    total += c;
    return () => {
      total -= c;
      retries -= missed(q) ? 1 : 0;
      fresh -= unseen(q) ? 1 : 0;
      c1 -= q.level === 'C1' ? 1 : 0;
      over -= sk >= 2 ? 1 : 0;
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
    const hope: Score = [chosen.length + room, -over, wantC1 && (c1 > 0 || after[i].c1) ? 1 : 0, fresh + Math.min(room, after[i].fresh), -short(room, i), total];
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
  if (q.keep) return idx;
  const rand = rng(`${seed}:${q.id}`);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
