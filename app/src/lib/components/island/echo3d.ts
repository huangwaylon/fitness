// The 3D island's echo of a DOM reaction (world3d/Island3D.svelte): a tap's jiggle, a tree's rustle or shake, a rock
// struck, played on the DOM's art (invisible in 3D) is played on the model too. The DOM island calls it where it
// animates its art; nothing listens on the 2D island.
let sink: ((id: string, strength: number) => void) | null = null;

/** The 3D island listens (null: it's gone). */
export function listen3d(fn: ((id: string, strength: number) => void) | null): void {
  sink = fn;
}

/** What the 3D island calls a DOM thing: its scenery id, a flower's, a goal tree's, a decoration's. */
function thingOf(el: Element): string | null {
  const s = el.closest<HTMLElement>('[data-scenery-id]')?.dataset.sceneryId;
  if (s) return s;
  const f = el.closest<HTMLElement>('[data-flower]')?.dataset.flower;
  if (f) return f;
  const d = el.closest<HTMLElement>('[data-decor]')?.dataset.decor;
  if (d) return `d:${d}`;
  return null;
}

/** A thing (its id, or its DOM element) moved as a reaction: the model moves with it. */
export function echo3d(what: string | Element | null | undefined, strength = 1): void {
  if (!sink || !what) return;
  const id = typeof what === 'string' ? what : thingOf(what);
  if (id) sink(id, strength);
}

let poser: ((id: string, key: string | null) => void) | null = null;
/** The 3D island listens for poses (null: it's gone). */
export function listenPose3d(fn: typeof poser): void {
  poser = fn;
}
/** A thing takes another look for a moment (the shishi-odoshi tipped: its `-tip` model), or its own again (null). */
export function pose3d(id: string, key: string | null): void {
  poser?.(id, key);
}
