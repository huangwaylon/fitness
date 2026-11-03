// The island on its layout (docs/island-layout.md "What the 3D integration must change"): world.ts's geometry is the
// editable layout's (layoutWorld.ts worldOf, swapped in by world.ts setWorld) for the gameplay (the walk, the critters'
// waters, the fishing, the finds, the doors, the seats, the visitors, the tap areas over the 3D canvas) and the 3D
// scene alike, and follows every change of it (the editor's, a phone's もようがえ) as it lands.
//   site.on       the island reads the layout (reactive): always, but where a test or the editor forces it off
//   site.layout   the layout it reads (null when off)
//   site.nav      the layout's walk grid (layout/nav.ts navOf), or null when off
//   site.rev      bumped by each change applied (a DOM overlay reading world.ts's values reads it to follow)
//   site.sync()   apply what's due now (IslandScene calls it as it opens)
import { layout } from '#lib/store/layout.svelte.ts';
import { navOf, type LayoutNav } from '#lib/layout/nav.ts';
import type { Layout } from '#lib/layout/model.ts';
import { setWorld } from './world.ts';
import { worldOf } from './layoutWorld.ts';
import { layoutSpots, useSpots } from './beach.ts';

class Site {
  rev = $state(0);
  #applied: Layout | null = null;
  #nav: LayoutNav | null = null;
  #heard = false;
  /** Forced on or off (tests, the editor's phone view); null: on. */
  force = $state<boolean | null>(null);

  get on(): boolean {
    return this.force ?? true;
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
