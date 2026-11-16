// English Study's shared plan (docs/english.md "The plan"): the one order every phone offers the clips in, today's clip
// being the first in it I've neither finished nor skipped, so both members meet the same clip most days without either
// seeing the other's. A slow ramp (each clip's ease: its wpm and its share of C1+ items, as ranks in the library) with
// variety (never three of a show or of a situation in a row where a near clip avoids it; the shows at about their
// share). plan-order.ts keeps the order once written (scripts/english-plan.ts), so a clip added later goes after the
// planned ones and nobody's today jumps back; the build orders the library's index by planOf (vite.config.ts
// english-data). Pure.
import { PLANNED } from './plan-order.ts';
import type { Clip } from './types.ts';

type PlanClip = Pick<Clip, 'id' | 'wpm' | 'tags' | 'show' | 'questions'>;

/** How far ahead of the ramp a clip may come for variety (clips). */
const WINDOW = 5;

/** A bank this big or more says how hard its clip is (a lesson of 8 not yet). */
const FULL_BANK = 16;

/** Each clip's ease, 0 (easiest) to 1: its wpm's rank (0.7) and its C1+ share's rank (0.3) in `clips` (a bank not
 *  yet full counts as the full banks' mean). */
function easeOf(clips: readonly PlanClip[]): Map<string, number> {
  const share = (c: PlanClip) => {
    const live = c.questions.filter((q) => !q.retired);
    return live.length >= FULL_BANK ? live.filter((q) => q.level !== 'B1' && q.level !== 'B2').length / live.length : null;
  };
  const full = clips.map(share).filter((x) => x !== null);
  const mean = full.length ? full.reduce((a, b) => a + b, 0) / full.length : 0;
  const hard = (c: PlanClip) => share(c) ?? mean;
  const rank = (f: (c: PlanClip) => number) => {
    const vs = clips.map(f).sort((a, b) => a - b), n = Math.max(1, vs.length - 1);
    return (c: PlanClip) => vs.indexOf(f(c)) / n;
  };
  const w = rank((c) => c.wpm), h = rank(hard);
  return new Map(clips.map((c) => [c.id, 0.7 * w(c) + 0.3 * h(c)]));
}

/**
 * `clips` in the plan's order: the `planned` ids first as they are (those still in `clips`), then the rest by ease,
 * each next pick the one of the nearest WINDOW that keeps the most variety after what came before.
 */
export function planOf<C extends PlanClip>(clips: readonly C[], planned: readonly string[] = PLANNED): C[] {
  const byId = new Map(clips.map((c) => [c.id, c]));
  const out = [...new Set(planned)].flatMap((id) => byId.get(id) ?? []);
  const ease = easeOf(clips);
  const pool = clips.filter((c) => !out.includes(c)).sort((a, b) => ease.get(a.id)! - ease.get(b.id)! || (a.id < b.id ? -1 : 1));
  const share = new Map<string, number>();
  for (const c of clips) share.set(c.show, (share.get(c.show) ?? 0) + 1 / clips.length);
  const count = new Map<string, number>();
  for (const c of out) count.set(c.show, (count.get(c.show) ?? 0) + 1);
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
  return out;
}
