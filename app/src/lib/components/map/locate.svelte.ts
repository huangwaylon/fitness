// A map's location watch, the Svelte side (docs/travel.md "Maps"): LocWatch (geo.ts) asked on the locate disc's tap,
// paused while the map is off screen (`el` scrolled out: an IntersectionObserver) or the tab hidden, stopped with the
// component; a short note over the map (`tell`: the location refused, the trip's far-away) that clears after NOTE_MS.
// Made in a component's script (its effects). The position goes to the map and nowhere else.
import { LocWatch } from './geo.ts';
import type { Fix, LocState } from './types.ts';

export const NOTE_MS = 8000;

export interface Locate<K extends string> {
  readonly state: LocState;
  readonly fix: Fix | null;
  readonly stale: boolean;
  /** The note shown (null: none): 'denied' on a refusal, else what `tell` was given. */
  readonly note: K | 'denied' | null;
  tell(k: K | 'denied'): void;
  /** The locate disc: the watch started (the prompt the first time). */
  start(): void;
}

export function useLocate<K extends string = never>(o: {
  /** The map's root: the watch pauses while it is out of view (none: only the tab's visibility). */
  el?: () => Element | null | undefined;
  /** Each change (a fix, a state): `first` the first fix since asking. */
  onchange?: (w: LocWatch, first: boolean) => void;
  geo?: ConstructorParameters<typeof LocWatch>[1];
} = {}): Locate<K> {
  let state = $state<LocState>('off');
  let fix = $state.raw<Fix | null>(null);
  let stale = $state(false);
  let note = $state<K | 'denied' | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tell = (k: K | 'denied') => {
    note = k;
    clearTimeout(timer);
    timer = setTimeout(() => (note = null), NOTE_MS);
  };
  const watch = new LocWatch((w, first) => {
    ((state = w.state), (fix = w.fix), (stale = w.stale));
    if (w.state === 'denied') tell('denied');
    o.onchange?.(w, first);
  }, o.geo);

  $effect(() => {
    const el = o.el?.();
    let inView = true;
    const shown = () => watch.visible(inView && document.visibilityState === 'visible');
    const io = el ? new IntersectionObserver(([e]) => ((inView = e.isIntersecting), shown())) : null;
    if (el) io!.observe(el);
    document.addEventListener('visibilitychange', shown);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', shown);
    };
  });
  $effect(() => () => {
    watch.stop();
    clearTimeout(timer);
  });

  return {
    get state() { return state; },
    get fix() { return fix; },
    get stale() { return stale; },
    get note() { return note; },
    tell,
    start: () => watch.start()
  };
}
