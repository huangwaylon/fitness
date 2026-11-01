// 島 ⇄ wallet transition: an eased zoom into the jar (in the island's HUD, beside the ribbon) to the wallet page
// (/jar), and back out of it on 「◀ 島へ」 (or the browser's back). Two live CSS steps, both about the jar
// (--vt-x / --vt-y; styles/theme.css): the page we leave plays its exit (`html[data-leave]`: the island pushes in
// toward the jar and fades, 160ms; the wallet shrinks back into it, 140ms), then the route changes and the arriving
// page plays its entrance (`html[data-enter]`: the wallet grows out of the jar, 320ms; the island pulls back in, 280ms).
// No View Transition: its snapshot of the island is a fresh paint of the ground's 40 matrix3d bands, which WebKit
// flattens (the user's "striped lines" over the ground on iPhone), while live layers are composited like the ribbon's
// sheets, which never showed them.
// The jar's own press squash is HudJar's; it calls `onjar` once the squash has played.
import { onNavigate } from '$app/navigation';
import { routeOf } from './paths.ts';

type Dir = 'in' | 'out';

/** The exit's length (ms) for each way: the route changes when it has played. */
const LEAVE_MS: Record<Dir, number> = { in: 160, out: 140 };
/** The entrance's length (ms), then `data-enter` is cleared. */
const ENTER_MS: Record<Dir, number> = { in: 320, out: 280 };

/** 島 → ごほうび is 'in', back is 'out'; any other route change has no zoom. */
function jarDir(from: string | null, to: string | null): Dir | null {
  return from === '/' && to?.startsWith('/jar') ? 'in' : from?.startsWith('/jar') && to === '/' ? 'out' : null;
}

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
  let enterTimer: ReturnType<typeof setTimeout> | undefined;
  onNavigate((nav) => {
    const dir = jarDir(nav.from ? routeOf(nav.from.url.pathname) : null, nav.to ? routeOf(nav.to.url.pathname) : null);
    if (!dir) return;
    const root = document.documentElement;
    if (dir === 'in') last = jarOrigin() ?? last;
    setOrigin(root, last);
    clearTimeout(enterTimer);
    delete root.dataset.enter;
    root.dataset.leave = dir;
    void nav.complete.then(
      () => {
        delete root.dataset.leave;
        // Back on 島: zoom out of wherever the jar is now (the layout may differ from the last visit).
        if (dir === 'out') setOrigin(root, (last = jarOrigin() ?? last));
        root.dataset.enter = dir;
        enterTimer = setTimeout(() => root.dataset.enter === dir && delete root.dataset.enter, ENTER_MS[dir] + 80);
      },
      () => delete root.dataset.leave // aborted: the page we were leaving comes back as it was
    );
    // The route changes once the exit has played.
    return new Promise<void>((done) => setTimeout(done, LEAVE_MS[dir]));
  });
}
