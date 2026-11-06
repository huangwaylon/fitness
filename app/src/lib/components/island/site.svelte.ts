// The island on its layout (docs/island-layout.md "What the 3D integration must change"): world.ts's geometry is the
// editable layout's (layoutWorld.ts worldOf, swapped in by world.ts setWorld) for the gameplay (the walk, the critters'
// waters, the fishing, the finds, the doors, the seats, the visitors, the tap areas over the 3D canvas) and the 3D
// scene alike, and follows every change of it (the editor's, a phone's もようがえ) as it lands.
//   site.on       the island reads the layout: always (world.ts's own fixed island is only what it is before the
//                 first sync, and the unit tests')
//   site.layout   the layout it reads (null when off)
//   site.nav      the layout's walk grid (layout/nav.ts navOf), or null when off
//   site.extent   the layout's box (model.ts extentOf: its land's, its shore), site.midX its middle across (midXOf: 195
//                 on the default island, moved by a lopsided resize)
//   site.rev      bumped by each change applied (a DOM overlay reading world.ts's values reads it to follow)
//   site.sync()   apply what's due now (IslandScene calls it as it opens)
import { layout } from '#lib/store/layout.svelte.ts';
import { navOf, type LayoutNav } from '#lib/layout/nav.ts';
import { extentOf, midXOf, type Layout } from '#lib/layout/model.ts';
import { setWorld } from './world.ts';
import { worldOf } from './layoutWorld.ts';
import { layoutSpots, useSpots } from './beach.ts';

class Site {
  rev = $state(0);
  #applied: Layout | null = null;
  #nav: LayoutNav | null = null;
  #extent: ReturnType<typeof extentOf> | null = null;
  #heard = false;
  get on(): boolean {
    return true;
  }
  get layout(): Layout | null {
    void this.rev;
    return this.#applied;
  }
  get nav(): LayoutNav | null {
    void this.rev;
    return this.#nav;
  }
  /** The layout's box (extentOf: the applied layout's, else the store's). */
  get extent(): ReturnType<typeof extentOf> {
    void this.rev;
    if (!this.#applied) return extentOf(layout.current);
    return (this.#extent ??= extentOf(this.#applied));
  }
  /** The island's middle across (midXOf: its land box's), where a thing turns to face the other way. */
  get midX(): number {
    return midXOf(this.extent.land);
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
    this.#extent = null;
    setWorld(want && this.#nav ? worldOf(want, this.#nav) : null);
    // the day's weeds and fossils on the layout's open grass (beach.ts)
    useSpots(want ? layoutSpots(() => this.#applied ?? layout.current) : null);
    this.rev++;
  }
}

export const site = new Site();
