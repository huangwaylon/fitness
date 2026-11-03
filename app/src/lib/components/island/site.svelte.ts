// The island on its layout (docs/island-layout.md "What the 3D integration must change"): the one switch between
// world.ts's fixed island (the 2D island's) and the editable layout's, for the gameplay (the walk, the critters'
// waters, the fishing, the finds, the doors, the seats, the visitors, the tap areas over the 3D canvas) and the 3D
// scene alike. On, world.ts's geometry is the layout's (layoutWorld.ts worldOf, swapped in by world.ts setWorld) and
// follows every change of it (the editor's, a phone's もようがえ) as it lands.
//   site.on       the island reads the layout (reactive): the 3D island, with the layout switched on
//   site.layout   the layout it reads (null when off)
//   site.nav      the layout's walk grid (layout/nav.ts navOf), or null when off
//   site.rev      bumped by each change applied (a DOM overlay reading world.ts's values reads it to follow)
//   site.sync()   apply what's due now (IslandScene calls it as it opens and on a change of the switch)
// The switch: the 3D island (store/islandRender) and, until the cutover, `?layout` on the page's URL (kept for the
// page load, like `?island=3d`) or `island.layout` = `on` in localStorage (the e2e's E2E_LAYOUT=1). LAYOUT_3D flips it
// on for every 3D island at the cutover.
import { islandRender } from '#lib/store/islandRender.svelte.ts';
import { DEVICE, localKV } from '#lib/sync/storage.ts';
import { layout } from '#lib/store/layout.svelte.ts';
import { navOf, type LayoutNav } from '#lib/layout/nav.ts';
import type { Layout } from '#lib/layout/model.ts';
import { setWorld } from './world.ts';
import { worldOf } from './layoutWorld.ts';
import { layoutSpots, useSpots } from './beach.ts';

/** The 3D island reads the layout without `?layout` (the cutover). */
const LAYOUT_3D = true;
const kept = (): boolean => {
  try {
    return localKV()?.getItem(DEVICE.islandLayout) === 'on';
  } catch {
    return false;
  }
};
const fromUrl = (typeof location !== 'undefined' && new URLSearchParams(location.search).has('layout')) || kept();

class Site {
  rev = $state(0);
  #applied: Layout | null = null;
  #nav: LayoutNav | null = null;
  #heard = false;
  /** Forced on or off (tests, the editor's phone view); null: the switch's. */
  force = $state<boolean | null>(null);

  get on(): boolean {
    return this.force ?? (islandRender.mode === '3d' && (LAYOUT_3D || fromUrl));
  }
  get layout(): Layout | null {
    void this.rev;
    return this.#applied;
  }
  get nav(): LayoutNav | null {
    void this.rev;
    return this.#nav;
  }

  /** world.ts's geometry as it should be now: the layout's (when on), else world.ts's own. */
  sync(): void {
    if (!this.#heard) {
      this.#heard = true;
      layout.on(() => this.sync());
    }
    const want = this.on ? layout.current : null;
    if (want === this.#applied) return;
    this.#applied = want;
    this.#nav = want ? navOf(want) : null;
    setWorld(want && this.#nav ? worldOf(want, this.#nav) : null);
    // the day's weeds and fossils on the layout's open grass (beach.ts)
    useSpots(want ? layoutSpots(() => this.#applied ?? layout.current) : null);
    this.rev++;
  }
}

export const site = new Site();
