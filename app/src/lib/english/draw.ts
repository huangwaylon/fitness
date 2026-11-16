// A play's questions, drawn from the clip's bank (docs/english.md "Content", question-framework §3.3), pure and seeded:
// the same draw comes back on a resume or the other phone. 6 items under 90 s, 7 under 180 s, else 8: a gist first,
// then by group quotas (play 2 and later lean to interpretation, with a C1), unseen items and new points first, then
// in clip order. Never two items on one point, nor one that gives another away (`reveals`); ≤ 1 dictation.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf, TV_GM } from '#lib/contract/listen.ts';
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
    if (!row || row.gm !== TV_GM || row.u !== clip) continue;
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
  const chosen: Question[] = [];
  let retries = 0;
  const count = (f: (q: Question) => boolean) => chosen.filter(f).length;
  const fits = (q: Question, perSkill: boolean) =>
    !chosen.includes(q) && !chosen.some((c) => clash(c, q)) && !(q.skill === 'dict' && count((c) => c.skill === 'dict') >= 1) &&
    !((q.skill === 'humor' || q.skill === 'predict') && count((c) => c.skill === q.skill) >= 1) &&
    !(perSkill && count((c) => c.skill === q.skill) >= 2) && !(play === 1 && q.level === 'C1' && count((c) => c.level === 'C1') >= 2);
  /** Priority (lower first): unseen on a new point, unseen, (from play 3) missed first time, then seen longest ago. */
  const tier = (q: Question): number => {
    const h = seen[q.id];
    if (!h) return lastPoints.has(q.point) ? 1 : 0;
    if (play >= 3 && !h.ok && retries < 2) return 2;
    return 3 + h.play / 1000;
  };
  const levelPref = (q: Question): number => (play === 1 ? (q.level === 'C1' ? 1 : 0) : count((c) => c.level === 'C1') === 0 && q.level !== 'C1' ? 1 : 0);
  const best = (pool: Question[], perSkill = true): Question | null => {
    const ok = pool.filter((q) => fits(q, perSkill));
    ok.sort((a, b) => tier(a) - tier(b) || levelPref(a) - levelPref(b) || r.get(a.id)! - r.get(b.id)!);
    return ok[0] ?? null;
  };
  const take = (q: Question) => {
    if (play >= 3 && seen[q.id] && !seen[q.id].ok) retries++;
    chosen.push(q);
  };
  // the gist: unseen first (the fewest reveals among them), else the one seen longest ago
  const gists = all.filter((q) => q.skill === 'gist').sort((a, b) =>
    (seen[a.id] ? 1 : 0) - (seen[b.id] ? 1 : 0) || (seen[a.id]?.play ?? 0) - (seen[b.id]?.play ?? 0) || (a.reveals?.length ?? 0) - (b.reveals?.length ?? 0) || r.get(a.id)! - r.get(b.id)!);
  if (gists[0]) take(gists[0]);
  const of = (g: Group) => all.filter((q) => GROUP_OF[q.skill] === g);
  const [l, i, f] = QUOTAS[drawSize(clip.dur)][play === 1 ? 0 : 1];
  for (const [g, k] of [['L', l], ['I', i], ['F', f]] as const)
    for (let j = 0; j < k && chosen.length < n; j++) {
      const q = best(of(g));
      if (q) take(q);
    }
  // short: borrow I → L → F, then let more than two of a skill in
  for (const perSkill of [true, false])
    for (const g of ['I', 'L', 'F', 'G'] as const)
      while (chosen.length < n) {
        const q = best(of(g), perSkill);
        if (!q) break;
        take(q);
      }
  const [head, ...rest] = chosen;
  return head?.skill === 'gist' ? [head, ...rest.sort((a, b) => a.seg[0] - b.seg[0])] : chosen.sort((a, b) => a.seg[0] - b.seg[0]);
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
