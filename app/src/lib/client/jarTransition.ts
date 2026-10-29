// 島 ⇄ 旅の壺 transition: a ~360 ms eased zoom from the island's jar into the Jar page, and back out into the
// jar on 「◀ 島へ」 (or the browser's back). The View Transitions API (Chrome, iOS Safari 18+) snapshots both
// pages and the CSS in styles/theme.css zooms them about the jar; without it the arriving page plays the same
// zoom as a plain CSS entrance (`html[data-enter]`). Reduced motion: a short crossfade (or nothing).
// The jar's own press squash (R18) is the scene's (Builder A); it calls `onjar` once the squash has played.
import { onNavigate } from '$app/navigation';
import { routeOf } from './paths.ts';
import { reducedMotion } from '#lib/components/motion/clock.ts';

type Dir = 'in' | 'out';

/** The island's jar (the zoom's origin), or null when the island is not on screen. */
function jarOrigin(): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>('.if-scene .jar');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.6 };
}

function setOrigin(root: HTMLElement, o: { x: number; y: number } | null): void {
  if (!o) return;
  root.style.setProperty('--vt-x', `${Math.round(o.x)}px`);
  root.style.setProperty('--vt-y', `${Math.round(o.y)}px`);
}

/** Call once from the root layout. */
export function jarTransition(): void {
  let last: { x: number; y: number } | null = null;
  onNavigate((nav) => {
    const from = nav.from ? routeOf(nav.from.url.pathname) : null;
    const to = nav.to ? routeOf(nav.to.url.pathname) : null;
    const dir: Dir | null = from === '/' && to?.startsWith('/jar') ? 'in' : from?.startsWith('/jar') && to === '/' ? 'out' : null;
    if (!dir) return;
    const root = document.documentElement;
    const reduced = reducedMotion();
    if (dir === 'in') last = jarOrigin() ?? last;
    setOrigin(root, last);

    if (!document.startViewTransition) {
      if (reduced) return;
      // CSS fallback: the arriving page zooms in (from the jar, or out of it) once it has rendered.
      void nav.complete.then(() => {
        if (dir === 'out') setOrigin(root, (last = jarOrigin() ?? last));
        root.dataset.enter = dir;
        setTimeout(() => root.dataset.enter === dir && delete root.dataset.enter, 450);
      });
      return;
    }
    root.dataset.vt = reduced ? 'fade' : dir;
    return new Promise<void>((ready) => {
      const vt = document.startViewTransition(async () => {
        ready();
        await nav.complete;
        // Back on 島: zoom out of wherever the jar is now (the layout may differ from the last visit).
        if (dir === 'out') setOrigin(root, (last = jarOrigin() ?? last));
      });
      void vt.finished.finally(() => delete root.dataset.vt);
    });
  });
}
