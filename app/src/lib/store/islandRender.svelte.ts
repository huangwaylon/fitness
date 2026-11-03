// How this phone draws the island (docs/design.md "World", docs/decisions.md "The island in 3D"): `2d`, the DOM
// rolling-log island, or `3d`, NH's models in three.js under the same island (world3d/). `?island=3d` / `?island=2d`
// picks for this page load; せってい's switch keeps the choice on this phone (DEVICE.islandRender). The 3D island is the
// default since the cutover (Nov 2026); the 2D one stays a せってい fallback for a release.
import { DEVICE, localKV } from '#lib/sync/storage.ts';

type IslandRender = '2d' | '3d';
const DEFAULT: IslandRender = '3d';

const parse = (v: string | null | undefined): IslandRender | null => (v === '3d' || v === '2d' ? v : null);
const fromUrl = (): IslandRender | null => (typeof location === 'undefined' ? null : parse(new URLSearchParams(location.search).get('island')));
const saved = (): IslandRender | null => {
  try {
    return parse(localKV()?.getItem(DEVICE.islandRender));
  } catch {
    return null;
  }
};

class Render {
  /** What the island draws now. */
  mode = $state<IslandRender>(fromUrl() ?? saved() ?? DEFAULT);
  /** The page's URL picked it (?island=): the switch still changes it, for this load and on. */
  readonly forced = fromUrl() !== null;
  /** せってい's switch: kept on this phone. */
  set(m: IslandRender): void {
    this.mode = m;
    try {
      localKV()?.setItem(DEVICE.islandRender, m);
    } catch {
      // (private mode: for this load only)
    }
  }
}

export const islandRender = new Render();
