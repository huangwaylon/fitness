// 島 ⇄ テント: NH's door. Tapping the tent closes a black iris on its door (the tent's own, on the island), the route
// changes behind the black, and the room opens out of its door once its first frame is drawn (the tent's 3D comes in
// its own chunk, so the black covers the load); leaving, the same the other way, opening on the tent's door on the
// island. One fixed layer (html[data-door]::after, styles/theme.css): a radial cut-out whose radius (--door-r, a
// registered property) transitions, centred on --door-x / --door-y. Nothing runs between the two steps.
import { onNavigate } from '$app/navigation';
import { routeOf } from './paths.ts';

/** The iris closing (ms) before the route changes, and opening. */
const CLOSE_MS = 260;
const OPEN_MS = 420;
/** The longest the black waits for the arriving screen (a failed load must not leave it black). */
const WAIT_MS = 2500;

type Way = 'in' | 'out';
const wayOf = (from: string | null, to: string | null): Way | null =>
  from === '/' && to?.startsWith('/tent') ? 'in' : from?.startsWith('/tent') && to === '/' ? 'out' : null;

/** Where each screen's door is (client px), asked when the iris closes on it or opens from it. */
let doorOf: () => { x: number; y: number } | null = () => null;
/** The arriving screen says it's drawn: the iris opens. */
let opened: (() => void) | null = null;

/** The island's tent door, or the room's: the screen showing it says where it is. */
export function provideDoor(fn: () => { x: number; y: number } | null): () => void {
  doorOf = fn;
  return () => {
    if (doorOf === fn) doorOf = () => null;
  };
}

/** The arriving screen is ready (its first frame): open the iris (a no-op when no door transition is under way). */
export function doorReady(): void {
  opened?.();
}

function at(root: HTMLElement, p: { x: number; y: number } | null) {
  root.style.setProperty('--door-x', `${Math.round(p?.x ?? innerWidth / 2)}px`);
  root.style.setProperty('--door-y', `${Math.round(p?.y ?? innerHeight * 0.75)}px`);
}

/** Call once from the root layout. A navigation started while a door's is held for its close (a back swipe, a second
 *  tap) waits for that one to land first: SvelteKit applies a navigation once its onNavigate callbacks resolve, without
 *  asking whether a newer one has started, so the held one, landing last, left `/` showing the tent. */
export function doorTransition(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The door navigation held for its close, until it has landed (or been aborted). */
  let held: Promise<void> | null = null;
  onNavigate((nav) => {
    const before = held;
    const way = wayOf(nav.from ? routeOf(nav.from.url.pathname) : null, nav.to ? routeOf(nav.to.url.pathname) : null);
    if (!way) return before ?? undefined;
    const mine = nav.complete.catch(() => {});
    held = mine;
    void mine.then(() => {
      if (held === mine) held = null;
    });
    const root = document.documentElement;
    clearTimeout(timer);
    opened = null;
    at(root, doorOf());
    root.dataset.door = 'close';
    void nav.complete.then(
      () => {
        root.dataset.door = 'black';
        let done = false;
        const open = () => {
          if (done) return;
          done = true;
          opened = null;
          clearTimeout(timer);
          // the arriving screen's door, once it has laid out
          requestAnimationFrame(() => {
            at(root, doorOf());
            root.dataset.door = 'open';
            timer = setTimeout(() => root.dataset.door === 'open' && delete root.dataset.door, OPEN_MS + 60);
          });
        };
        opened = open;
        // the island is DOM: it's there on the next frame; the room says so itself
        if (way === 'out') requestAnimationFrame(() => requestAnimationFrame(open));
        timer = setTimeout(open, WAIT_MS);
      },
      () => delete root.dataset.door
    );
    const close = new Promise<void>((done) => setTimeout(done, CLOSE_MS));
    return before ? Promise.all([before, close]).then(() => {}) : close;
  });
}
