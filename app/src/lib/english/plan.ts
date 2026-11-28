// English Study's shared plan (docs/english.md "The plan"): the one order every phone offers the clips in, today's clip
// being the first in it I've neither finished nor skipped, so both members meet the same clip most days without either
// seeing the other's. A slow ramp (each clip's ease: its wpm and how little of its bank is B1, as ranks in the
// library; for the A1–A2 learner, slow and plain first), the openers before them (a short clip of a show they know,
// not fast: the owner 11-28 left after a week, "it wasn't fun and engaging enough") and the `late` clips (a bank's `// A2 LATE:` line) after the
// others, with variety (never three of a show or of a situation in a row where a near clip avoids it; the shows at about their
// share). plan-order.ts keeps the order once written (scripts/english-plan.ts), so a clip added later goes after the
// planned ones and nobody's today jumps back; the build orders the library's index by planOf (vite.config.ts
// english-data). Pure.
import { PLANNED } from './plan-order.ts';
import type { Clip } from './types.ts';

type PlanClip = Pick<Clip, 'id' | 'wpm' | 'dur' | 'band' | 'tags' | 'show' | 'questions'>;

/** How far ahead of the ramp a clip may come for variety (clips). */
const WINDOW = 5;

/** The shows a Japanese adult has most likely met (Friends a classic of English study in Japan). */
const WELL_KNOWN = new Set<Clip['show']>(['Friends', 'The Office']);
/** An opener: ≤ 90 s, a well-known show, not a fast speech band. First in a plan, by ease among them. */
export const opener = (c: Pick<Clip, 'dur' | 'band' | 'show'>): boolean => c.dur <= 90 && c.band !== 'fast' && WELL_KNOWN.has(c.show);

/** Each clip's ease, 0 (easiest) to 1: its wpm's rank (0.6), its length's (0.2: the review 11-24, an A2 learner's
 *  clip ≤ 2:30 when one can be; the plan written before it keeps its order) and the rank of its live non-C2 items'
 *  non-B1 share (0.2) in `clips` (one with no live non-C2 item counts as the others' mean). */
function easeOf(clips: readonly PlanClip[]): Map<string, number> {
  const share = (c: PlanClip) => {
    const core = c.questions.filter((q) => !q.retired && q.level !== 'C2');
    return core.length ? core.filter((q) => q.level !== 'B1').length / core.length : null;
  };
  const full = clips.map(share).filter((x) => x !== null);
  const mean = full.length ? full.reduce((a, b) => a + b, 0) / full.length : 0;
  const hard = (c: PlanClip) => share(c) ?? mean;
  const rank = (f: (c: PlanClip) => number) => {
    const vs = clips.map(f).sort((a, b) => a - b), n = Math.max(1, vs.length - 1);
    return (c: PlanClip) => vs.indexOf(f(c)) / n;
  };
  const w = rank((c) => c.wpm), h = rank(hard), d = rank((c) => c.dur);
  return new Map(clips.map((c) => [c.id, 0.6 * w(c) + 0.2 * d(c) + 0.2 * h(c)]));
}

/**
 * `clips` in the plan's order: the `planned` ids first as they are (those still in `clips`), then the rest by ease
 * (the openers before, the `late` ids after all the others), each next pick the one of the nearest WINDOW that keeps the most variety
 * after what came before.
 */
export function planOf<C extends PlanClip>(clips: readonly C[], planned: readonly string[] = PLANNED, late: ReadonlySet<string> = new Set()): C[] {
  const byId = new Map(clips.map((c) => [c.id, c]));
  const out = [...new Set(planned)].flatMap((id) => byId.get(id) ?? []);
  const ease = easeOf(clips);
  const rest = clips.filter((c) => !out.includes(c)).sort((a, b) => ease.get(a.id)! - ease.get(b.id)! || (a.id < b.id ? -1 : 1));
  const share = new Map<string, number>();
  for (const c of clips) share.set(c.show, (share.get(c.show) ?? 0) + 1 / clips.length);
  const count = new Map<string, number>();
  for (const c of out) count.set(c.show, (count.get(c.show) ?? 0) + 1);
  const early = rest.filter((c) => !late.has(c.id));
  for (const pool of [early.filter(opener), early.filter((c) => !opener(c)), rest.filter((c) => late.has(c.id))]) {
    while (pool.length) {
      const [a, b] = [out.at(-1), out.at(-2)];
      const cost = (c: C, i: number) => {
        const show = c.show;
        let k = i;
        if (a && b && a.show === show && b.show === show) k += 10;
        if (a && b && c.tags.some((t) => a.tags.includes(t) && b.tags.includes(t))) k += 10;
        if (a && a.show === show) k += 1;
        if (a && c.tags[0] && a.tags.includes(c.tags[0])) k += 0.5;
        return k + 3 * ((count.get(show) ?? 0) / Math.max(1, out.length) - share.get(show)!);
      };
      let best = 0;
      for (let i = 1; i < Math.min(WINDOW, pool.length); i++) if (cost(pool[i], i) < cost(pool[best], best)) best = i;
      const [c] = pool.splice(best, 1);
      out.push(c);
      count.set(c.show, (count.get(c.show) ?? 0) + 1);
    }
  }
  return out;
}
