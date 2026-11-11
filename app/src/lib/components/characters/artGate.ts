// The 3D island's hold on the DOM's art: over the canvas the island's
// DOM nodes stay as tap areas, but their art is hidden where the canvas draws the thing (IslandScene's [data-r3]
// rules, which also set `--art3d: off`). An <OfficialArt> under such a node waits with no image until its node shows
// it (no model for its key: m3off), so the 3D island never downloads the ~120 2D images it never shows.
//   IslandScene  setArtGate(gate(() => r3, () => sceneEl))   the island's nodes' art waits while it draws in 3D
//   OfficialArt  getArtGate()?.hold(img, open)                 open() once its img isn't `--art3d: off`
import { getContext, setContext } from 'svelte';

interface ArtGate {
  /** Holding now (the 3D island draws): else every art loads as it mounts. */
  readonly on: boolean;
  /** Calls `open` once `el` isn't hidden by the 3D island (checked each frame something's classes change); the
   *  returned function stops waiting. */
  hold(el: Element, open: () => void): () => void;
}

const KEY = Symbol('artGate');
export const setArtGate = (g: ArtGate): ArtGate => setContext(KEY, g);
export const getArtGate = (): ArtGate | undefined => getContext<ArtGate | undefined>(KEY);

/** Hidden by the 3D island: its own rule or a hidden ancestor's (the custom property inherits). */
const hidden = (el: Element) => getComputedStyle(el).getPropertyValue('--art3d').trim() === 'off';

/** The island's gate: holds while `on()`, rechecking what waits when a class under `root()` changes (Island3D's
 *  m3on / m3off, a node's data-m3). */
export function artGate(on: () => boolean, root: () => Element | undefined): ArtGate {
  const waiting = new Map<Element, () => void>();
  /** What changed since the last look (a mutation's target, a new art): only the art in or under one is looked at
   *  again. The art the 3D island draws waits for good, and the island's nodes change class many times a second
   *  while the camera moves: a computed style for every waiting art each time forced a style pass (and a layout)
   *  per frame of a pinch. */
  const changed = new Set<Node>();
  let mo: MutationObserver | null = null, frame = 0;
  const check = () => {
    frame = 0;
    const at = [...changed];
    changed.clear();
    for (const [el, open] of waiting) {
      if (!el.isConnected) waiting.delete(el);
      else if (at.some((n) => n === el || n.contains(el)) && !hidden(el)) (waiting.delete(el), open());
    }
    if (!waiting.size) (mo?.disconnect(), (mo = null));
  };
  // (after the next frame, not in it: the frame has styled the page by then, so the looks cost no forced style pass; in
  // the frame's own callbacks the island's first look styled every waiting art, ~32 ms at 4x CPU in the mount)
  const soon = () => {
    if (!frame) frame = requestAnimationFrame(() => setTimeout(check));
  };
  return {
    get on() {
      return on();
    },
    hold(el, open) {
      waiting.set(el, open);
      changed.add(el);
      const r = root();
      if (!mo && r && typeof MutationObserver !== 'undefined') {
        mo = new MutationObserver((rs) => {
          for (const m of rs) changed.add(m.target);
          soon();
        });
        mo.observe(r, { subtree: true, attributes: true, attributeFilter: ['class', 'data-m3', 'data-r3'] });
      }
      // (the first look a frame on: the node's data-m3 and Island3D's m3on land after the art mounts)
      soon();
      return () => void waiting.delete(el);
    }
  };
}
