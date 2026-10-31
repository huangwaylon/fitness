// 島 ⇄ wallet transition: a ~360 ms eased zoom from the jar (in the island's HUD, beside the ribbon) into the wallet page (/jar), and back out into
// the jar on 「◀ 島へ」 (or the browser's back). The View Transitions API (Chrome, iOS Safari 18+) snapshots both
// pages and the CSS in styles/theme.css zooms them about the jar; without it the arriving page plays the same
// zoom as a plain CSS entrance (`html[data-enter]`). Reduced motion: a short crossfade (or nothing).
// The jar's own press squash is HudJar's; it calls `onjar` once the squash has played.
import { onNavigate } from '$app/navigation';
import { routeOf } from './paths.ts';
import { reducedMotion } from '#lib/time/clock.ts';

type Dir = 'in' | 'out';

/** The HUD's jar (the zoom's origin, the middle of the glass), or null when the island is not on screen. */
function jarOrigin(): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>('.hud-jar .jarart');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
      }, () => {}); // an aborted navigation rejects: no zoom
      return;
    }
    root.dataset.vt = reduced ? 'fade' : dir;
    return new Promise<void>((ready) => {
      const vt = document.startViewTransition(async () => {
        ready();
        await nav.complete.catch(() => {}); // aborted: nothing to zoom to
        // Back on 島: zoom out of wherever the jar is now (the layout may differ from the last visit).
        if (dir === 'out') setOrigin(root, (last = jarOrigin() ?? last));
      });
      void vt.finished.finally(() => delete root.dataset.vt);
    });
  });
}
